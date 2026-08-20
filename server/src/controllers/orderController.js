import Order from '../models/Order.js';
import Product from '../models/Product.js';
import Payment from '../models/Payment.js';
import Address from '../models/Address.js';
import Cart from '../models/Cart.js';
import Coupon from '../models/Coupon.js';
import Commission from '../models/Commission.js';
import Seller from '../models/Seller.js';
import InventoryLog from '../models/InventoryLog.js';
import asyncHandler from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { buildCart } from '../services/cartService.js';
import { consumeCoupon } from '../services/couponService.js';
import { estimateDeliveryAt } from '../services/deliveryEngine.js';
import { notifyCustomer, notifySeller, notifyOrderStatus } from '../services/notificationService.js';
import { makeOrderId, money, paginate } from '../utils/helpers.js';
import {
  ORDER_STATUS,
  ORDER_STATUS_META,
  ORDER_FLOW,
  PAYMENT_METHODS,
  PAYMENT_STATUS,
  TIER_META,
} from '../utils/constants.js';

/** Sequential, human-friendly order ids (GFT1024, GFT1025 …). */
async function nextOrderId() {
  const count = await Order.estimatedDocumentCount();
  let candidate = makeOrderId(count + 1);
  let bump = 1;
  // eslint-disable-next-line no-await-in-loop
  while (await Order.exists({ orderId: candidate })) {
    candidate = makeOrderId(count + 1 + bump);
    bump += 1;
  }
  return candidate;
}

/**
 * POST /api/orders — place the order.
 *
 * Prices, availability and the coupon are all recomputed here from live data;
 * nothing the client sends about money is trusted.
 */
export const placeOrder = asyncHandler(async (req, res) => {
  const {
    addressId,
    address: addressInput,
    saveAddress,
    deliveryTier,
    deliverySlot,
    giftOptions = {},
    paymentMethod,
    specialInstructions,
  } = req.body;

  if (!paymentMethod || !Object.values(PAYMENT_METHODS).includes(paymentMethod)) {
    throw new ApiError(400, 'Please choose a payment method');
  }

  // --- Resolve the delivery address ---
  let address;
  if (addressId) {
    address = await Address.findOne({ _id: addressId, user: req.user._id });
    if (!address) throw new ApiError(404, 'Delivery address not found');
  } else if (addressInput) {
    const required = ['name', 'mobile', 'pincode', 'house', 'city', 'state'];
    const missing = required.filter((f) => !addressInput[f]);
    if (missing.length) throw new ApiError(400, `Please fill in: ${missing.join(', ')}`);
    address = saveAddress === false ? addressInput : await Address.create({ ...addressInput, user: req.user._id });
  } else {
    throw new ApiError(400, 'A delivery address is required');
  }

  // --- Recompute the cart against this address ---
  const summary = await buildCart(req.user._id, {
    pincode: address.pincode,
    tier: deliveryTier,
    giftOptions,
    user: req.user,
  });

  if (!summary.items.length) throw new ApiError(400, 'Your cart is empty');
  if (!summary.serviceable) throw new ApiError(400, `We don't deliver to ${address.pincode} yet`);
  if (summary.blocked.length) {
    throw new ApiError(400, `Some items can't be delivered to ${address.pincode}. Please remove them to continue.`);
  }
  if (summary.coupon?.error) throw new ApiError(400, summary.coupon.error);

  const tier = summary.selectedTier;
  if (!tier) throw new ApiError(400, 'No delivery option is available for this address');

  const orderId = await nextOrderId();
  const now = new Date();

  const items = summary.items.map((i) => ({
    product: i.product._id,
    seller: i.product.seller._id || i.product.seller,
    name: i.product.name,
    image: i.product.images?.[0],
    variant: i.variant,
    quantity: i.quantity,
    price: i.product.price,
    mrp: i.product.mrp,
    personalization: {
      message: i.personalization?.message,
      photoUrl: i.personalization?.photoUrl,
      fee: i.personalizationFee,
    },
    tier: i.product.tier,
    lineTotal: money(i.lineTotal + i.personalizationFee),
  }));

  const sellerIds = [...new Set(items.map((i) => String(i.seller)))];

  const order = await Order.create({
    orderId,
    customer: req.user._id,
    customerName: req.user.name,
    items,
    sellers: sellerIds,
    shippingAddress: {
      name: address.name,
      mobile: address.mobile,
      pincode: address.pincode,
      house: address.house,
      street: address.street,
      landmark: address.landmark,
      city: address.city,
      state: address.state,
      location: address.location,
    },
    deliveryTier: tier,
    deliverySlot: {
      date: deliverySlot?.date || now,
      window: deliverySlot?.window || TIER_META[tier].eta,
    },
    estimatedDeliveryAt: estimateDeliveryAt(tier, now),
    specialInstructions,
    giftOptions: {
      giftWrap: Boolean(giftOptions.giftWrap),
      giftWrapFee: giftOptions.giftWrap ? summary.giftOptionFees.giftWrap : 0,
      greetingCard: Boolean(giftOptions.greetingCard),
      greetingCardFee: giftOptions.greetingCard ? summary.giftOptionFees.greetingCard : 0,
      giftMessage: giftOptions.giftMessage,
      hidePrice: Boolean(giftOptions.hidePrice),
    },
    subtotal: summary.totals.subtotal,
    personalizationTotal: summary.totals.personalizationTotal,
    giftOptionsTotal: summary.totals.giftOptionsTotal,
    deliveryFee: summary.totals.deliveryFee,
    discount: summary.totals.discount,
    coupon: summary.coupon?.code ? { code: summary.coupon.code, discount: summary.totals.discount } : undefined,
    total: summary.totals.total,
    paymentMethod,
    paymentStatus: paymentMethod === PAYMENT_METHODS.COD ? PAYMENT_STATUS.PENDING : PAYMENT_STATUS.PAID,
    status: ORDER_STATUS.PLACED,
    timeline: [{ status: ORDER_STATUS.PLACED, label: ORDER_STATUS_META.PLACED.label, at: now }],
  });

  // --- Stock, commission, payment ---
  await Promise.all(
    items.map(async (item) => {
      const updated = await Product.findByIdAndUpdate(
        item.product,
        { $inc: { stock: -item.quantity, soldCount: item.quantity } },
        { new: true }
      );
      await InventoryLog.create({
        product: item.product,
        seller: item.seller,
        change: -item.quantity,
        stockAfter: updated?.stock ?? 0,
        reason: 'SALE',
        order: order._id,
      });
      if (updated && updated.stock <= updated.lowStockThreshold) {
        const seller = await Seller.findById(item.seller).select('user businessName');
        if (seller) {
          await notifySeller(seller.user, {
            title: 'Low inventory',
            body: `${updated.name} is down to ${updated.stock} in stock.`,
            icon: 'inventory',
            type: 'INVENTORY',
            link: '/seller/products',
          });
        }
      }
    })
  );

  let commissionTotal = 0;
  await Promise.all(
    sellerIds.map(async (sellerId) => {
      const seller = await Seller.findById(sellerId);
      if (!seller) return;
      const sellerAmount = items
        .filter((i) => String(i.seller) === sellerId)
        .reduce((sum, i) => sum + i.lineTotal, 0);
      const amount = money((sellerAmount * seller.commissionRate) / 100);
      commissionTotal += amount;

      await Commission.create({
        order: order._id,
        seller: seller._id,
        orderAmount: money(sellerAmount),
        rate: seller.commissionRate,
        amount,
        sellerEarning: money(sellerAmount - amount),
      });

      await notifySeller(seller.user, {
        title: 'New order received.',
        body: `${order.orderId} · ${TIER_META[tier].badge} · ${items.filter((i) => String(i.seller) === sellerId).length} item(s)`,
        icon: 'order',
        type: 'ORDER',
        link: '/seller/orders',
        meta: { orderId: order.orderId },
      });
    })
  );

  order.commissionAmount = money(commissionTotal);
  await order.save();

  await Payment.create({
    order: order._id,
    user: req.user._id,
    amount: order.total,
    method: paymentMethod,
    status: order.paymentStatus,
    reference: `SIM-${order.orderId}`,
  });

  if (summary.coupon?.code) {
    const coupon = await Coupon.findOne({ code: summary.coupon.code });
    if (coupon) await consumeCoupon(coupon, req.user._id);
  }

  await Cart.updateOne({ user: req.user._id }, { $set: { items: [], appliedCoupon: null } });

  await notifyCustomer(req.user._id, {
    title: 'Your gift is on the way',
    body: `Order ${order.orderId} · ${TIER_META[tier].eta}`,
    icon: 'order',
    type: 'ORDER',
    link: `/account/orders/${order.orderId}`,
  });

  res.status(201).json({ success: true, order });
});

/** GET /api/orders — the customer's own order history. */
export const myOrders = asyncHandler(async (req, res) => {
  const { page, limit, skip } = paginate(req.query);
  const filter = { customer: req.user._id };
  if (req.query.status) filter.status = req.query.status;

  const [orders, total] = await Promise.all([
    Order.find(filter).sort('-createdAt').skip(skip).limit(limit).lean(),
    Order.countDocuments(filter),
  ]);

  res.json({ success: true, orders, total, page, pages: Math.ceil(total / limit) });
});

/** GET /api/orders/:orderId */
export const getOrder = asyncHandler(async (req, res) => {
  const order = await Order.findOne({ orderId: req.params.orderId, customer: req.user._id })
    .populate('sellers', 'businessName slug mobile rating')
    .lean();
  if (!order) throw new ApiError(404, 'Order not found');
  res.json({ success: true, order, statusMeta: ORDER_STATUS_META, flow: ORDER_FLOW });
});

/**
 * GET /api/orders/:orderId/track — the tracking timeline.
 * Returns the steps already done plus the ones still to come, so the UI can
 * render the full journey greyed out ahead of the current status.
 */
export const trackOrder = asyncHandler(async (req, res) => {
  const order = await Order.findOne({ orderId: req.params.orderId, customer: req.user._id }).lean();
  if (!order) throw new ApiError(404, 'Order not found');

  const done = new Map(order.timeline.map((t) => [t.status, t]));
  const cancelled = order.status === ORDER_STATUS.CANCELLED;

  const steps = (cancelled ? [ORDER_STATUS.PLACED, ORDER_STATUS.CANCELLED] : ORDER_FLOW).map((status) => ({
    status,
    label: ORDER_STATUS_META[status].label,
    at: done.get(status)?.at || null,
    complete: done.has(status),
    current: order.status === status,
  }));

  res.json({
    success: true,
    orderId: order.orderId,
    status: order.status,
    tier: order.deliveryTier,
    tierMeta: TIER_META[order.deliveryTier],
    estimatedDeliveryAt: order.estimatedDeliveryAt,
    deliveredAt: order.deliveredAt,
    deliveryPartner: order.deliveryPartner,
    address: order.shippingAddress,
    steps,
  });
});

/** POST /api/orders/:orderId/cancel */
export const cancelOrder = asyncHandler(async (req, res) => {
  const order = await Order.findOne({ orderId: req.params.orderId, customer: req.user._id });
  if (!order) throw new ApiError(404, 'Order not found');

  // Once a rider has it, cancellation is a support conversation, not a button.
  const cancellable = [ORDER_STATUS.PLACED, ORDER_STATUS.ACCEPTED, ORDER_STATUS.PREPARING];
  if (!cancellable.includes(order.status)) {
    throw new ApiError(400, 'This order can no longer be cancelled. Please contact support.');
  }

  order.status = ORDER_STATUS.CANCELLED;
  order.cancellationReason = req.body.reason || 'Cancelled by customer';
  order.timeline.push({ status: ORDER_STATUS.CANCELLED, label: 'Cancelled', note: order.cancellationReason });
  if (order.paymentStatus === PAYMENT_STATUS.PAID) {
    order.paymentStatus = PAYMENT_STATUS.REFUNDED;
    order.refundAmount = order.total;
  }
  await order.save();

  // Put the stock back.
  await Promise.all(
    order.items.map(async (item) => {
      const updated = await Product.findByIdAndUpdate(
        item.product,
        { $inc: { stock: item.quantity, soldCount: -item.quantity } },
        { new: true }
      );
      await InventoryLog.create({
        product: item.product,
        seller: item.seller,
        change: item.quantity,
        stockAfter: updated?.stock ?? 0,
        reason: 'CANCELLATION',
        order: order._id,
      });
    })
  );

  await Commission.updateMany({ order: order._id }, { $set: { amount: 0, sellerEarning: 0, status: 'SETTLED' } });
  await Payment.updateOne(
    { order: order._id },
    { $set: { status: PAYMENT_STATUS.REFUNDED, refundedAt: new Date(), refundAmount: order.total } }
  );

  await notifyOrderStatus(order, ORDER_STATUS.CANCELLED);

  res.json({ success: true, message: 'Order cancelled', order });
});

/**
 * POST /api/orders/:orderId/simulate — dev-only helper.
 * Advances the order one step so the tracking timeline can be demoed without
 * a real seller and rider on the other end.
 */
export const simulateAdvance = asyncHandler(async (req, res) => {
  if (process.env.NODE_ENV === 'production') throw new ApiError(403, 'Not available');

  const order = await Order.findOne({ orderId: req.params.orderId, customer: req.user._id });
  if (!order) throw new ApiError(404, 'Order not found');

  const index = ORDER_FLOW.indexOf(order.status);
  if (index === -1 || index === ORDER_FLOW.length - 1) {
    throw new ApiError(400, 'This order is already complete');
  }

  const next = ORDER_FLOW[index + 1];
  order.status = next;
  order.timeline.push({ status: next, label: ORDER_STATUS_META[next].label });
  if (next === ORDER_STATUS.DELIVERED) order.deliveredAt = new Date();
  if (next === ORDER_STATUS.PICKED_UP && !order.deliveryPartner?.name) {
    order.deliveryPartner = { name: 'Ravi K.', mobile: '+91 98200 11223', vehicle: 'Bike · MH01 AB 1234' };
  }
  await order.save();
  await notifyOrderStatus(order, next);

  res.json({ success: true, order });
});
