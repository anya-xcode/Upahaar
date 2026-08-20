import Seller from '../models/Seller.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import Review from '../models/Review.js';
import Commission from '../models/Commission.js';
import SellerPayout from '../models/SellerPayout.js';
import InventoryLog from '../models/InventoryLog.js';
import Category from '../models/Category.js';
import Occasion from '../models/Occasion.js';
import Pincode from '../models/Pincode.js';
import asyncHandler from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { uniqueSlug, paginate, startOfToday, daysAgo, money } from '../utils/helpers.js';
import { ORDER_STATUS, ORDER_STATUS_META, ORDER_FLOW, TIER_META, DELIVERY_TIERS } from '../utils/constants.js';
import { notifyOrderStatus, notifyAdmins } from '../services/notificationService.js';

/* -------------------------------- Dashboard ------------------------------- */

/** GET /api/seller/dashboard */
export const dashboard = asyncHandler(async (req, res) => {
  const sellerId = req.seller._id;
  const today = startOfToday();

  const [
    totalSales,
    todaysOrders,
    pendingOrders,
    completedOrders,
    cancelledOrders,
    productCount,
    activeProducts,
    lowStock,
    outOfStock,
    pendingCommission,
  ] = await Promise.all([
    Order.aggregate([
      { $match: { sellers: sellerId, status: { $ne: ORDER_STATUS.CANCELLED } } },
      { $group: { _id: null, total: { $sum: '$total' }, count: { $sum: 1 } } },
    ]),
    Order.countDocuments({ sellers: sellerId, createdAt: { $gte: today } }),
    Order.countDocuments({ sellers: sellerId, status: { $in: [ORDER_STATUS.PLACED, ORDER_STATUS.ACCEPTED, ORDER_STATUS.PREPARING] } }),
    Order.countDocuments({ sellers: sellerId, status: ORDER_STATUS.DELIVERED }),
    Order.countDocuments({ sellers: sellerId, status: ORDER_STATUS.CANCELLED }),
    Product.countDocuments({ seller: sellerId }),
    Product.countDocuments({ seller: sellerId, isActive: true }),
    Product.countDocuments({ seller: sellerId, $expr: { $and: [{ $gt: ['$stock', 0] }, { $lte: ['$stock', '$lowStockThreshold'] }] } }),
    Product.countDocuments({ seller: sellerId, stock: 0 }),
    Commission.aggregate([
      { $match: { seller: sellerId, status: 'PENDING' } },
      { $group: { _id: null, commission: { $sum: '$amount' }, earning: { $sum: '$sellerEarning' } } },
    ]),
  ]);

  // Last 14 days of revenue, zero-filled so the chart never has gaps.
  const salesRaw = await Order.aggregate([
    { $match: { sellers: sellerId, status: { $ne: ORDER_STATUS.CANCELLED }, createdAt: { $gte: daysAgo(13) } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        revenue: { $sum: '$total' },
        orders: { $sum: 1 },
      },
    },
  ]);
  const salesMap = Object.fromEntries(salesRaw.map((r) => [r._id, r]));
  const dailySales = Array.from({ length: 14 }, (_, i) => {
    const d = daysAgo(13 - i);
    const key = d.toISOString().slice(0, 10);
    return { date: key, revenue: salesMap[key]?.revenue || 0, orders: salesMap[key]?.orders || 0 };
  });

  const byTier = await Order.aggregate([
    { $match: { sellers: sellerId } },
    { $group: { _id: '$deliveryTier', count: { $sum: 1 } } },
  ]);

  const recentOrders = await Order.find({ sellers: sellerId }).sort('-createdAt').limit(6).lean();

  res.json({
    success: true,
    seller: {
      businessName: req.seller.businessName,
      status: req.seller.status,
      kycStatus: req.seller.kycStatus,
      rating: req.seller.rating,
      deliveryRating: req.seller.deliveryRating,
      reviewCount: req.seller.reviewCount,
      commissionRate: req.seller.commissionRate,
    },
    stats: {
      totalSales: money(totalSales[0]?.total || 0),
      totalOrders: totalSales[0]?.count || 0,
      todaysOrders,
      pendingOrders,
      completedOrders,
      cancelledOrders,
      productCount,
      activeProducts,
      lowStock,
      outOfStock,
      pendingEarnings: money(pendingCommission[0]?.earning || 0),
      commissionOwed: money(pendingCommission[0]?.commission || 0),
    },
    charts: {
      dailySales,
      byTier: byTier.map((t) => ({ tier: t._id, label: TIER_META[t._id]?.shortLabel || t._id, count: t.count })),
    },
    recentOrders,
  });
});

/* --------------------------------- Profile -------------------------------- */

export const getProfile = asyncHandler(async (req, res) => {
  res.json({ success: true, seller: req.seller });
});

/** PATCH /api/seller/profile — includes the delivery capability settings. */
export const updateProfile = asyncHandler(async (req, res) => {
  const allowed = [
    'businessName', 'ownerName', 'mobile', 'tagline', 'description', 'logo', 'storeImages',
    'address', 'location', 'servedPincodes', 'deliveryRadiusKm', 'workingHours', 'workingDays',
    'dispatchBufferMinutes', 'acceptsExpress', 'gstNumber', 'panNumber', 'bankDetails',
  ];
  const previousName = req.seller.businessName;
  allowed.forEach((field) => {
    if (req.body[field] !== undefined) req.seller[field] = req.body[field];
  });

  if (req.body.businessName && req.body.businessName !== previousName) {
    req.seller.slug = await uniqueSlug(Seller, req.body.businessName, req.seller._id);
  }

  await req.seller.save();
  res.json({ success: true, seller: req.seller });
});

/** POST /api/seller/kyc — submitting documents puts the store back in review. */
export const submitKyc = asyncHandler(async (req, res) => {
  const { documents = [], gstNumber, panNumber, bankDetails } = req.body;
  if (gstNumber) req.seller.gstNumber = gstNumber;
  if (panNumber) req.seller.panNumber = panNumber;
  if (bankDetails) req.seller.bankDetails = bankDetails;
  if (documents.length) req.seller.kycDocuments.push(...documents);

  req.seller.kycStatus = 'PENDING';
  await req.seller.save();

  await notifyAdmins({
    title: 'Seller KYC pending.',
    body: `${req.seller.businessName} submitted KYC documents for review.`,
    icon: 'kyc',
    type: 'KYC',
    link: '/admin/sellers',
    meta: { sellerId: req.seller._id },
  });

  res.json({ success: true, seller: req.seller });
});

/** GET /api/seller/coverage — the pincodes this store can serve. */
export const coverage = asyncHandler(async (req, res) => {
  const served = await Pincode.find({ code: { $in: req.seller.servedPincodes } }).lean();
  const nearby = await Pincode.find({
    city: req.seller.address?.city,
    code: { $nin: req.seller.servedPincodes },
    isServiceable: true,
  })
    .limit(40)
    .lean();

  res.json({
    success: true,
    radiusKm: req.seller.deliveryRadiusKm,
    served,
    nearby,
    workingHours: req.seller.workingHours,
    workingDays: req.seller.workingDays,
    acceptsExpress: req.seller.acceptsExpress,
  });
});

/* ----------------------------- Product CRUD ------------------------------ */

export const listProducts = asyncHandler(async (req, res) => {
  const { page, limit, skip } = paginate({ ...req.query, limit: req.query.limit || 20 });
  const filter = { seller: req.seller._id };

  if (req.query.q) filter.name = new RegExp(String(req.query.q).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
  if (req.query.category) filter.category = req.query.category;
  if (req.query.tier) filter.baseTier = req.query.tier;
  if (req.query.status === 'active') filter.isActive = true;
  if (req.query.status === 'inactive') filter.isActive = false;
  if (req.query.stock === 'low') filter.$expr = { $and: [{ $gt: ['$stock', 0] }, { $lte: ['$stock', '$lowStockThreshold'] }] };
  if (req.query.stock === 'out') filter.stock = 0;

  const [products, total] = await Promise.all([
    Product.find(filter).populate('category', 'name icon').sort('-createdAt').skip(skip).limit(limit).lean(),
    Product.countDocuments(filter),
  ]);

  res.json({ success: true, products, total, page, pages: Math.ceil(total / limit) });
});

export const getProduct = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ _id: req.params.id, seller: req.seller._id }).lean();
  if (!product) throw new ApiError(404, 'Product not found');
  res.json({ success: true, product });
});

/** POST /api/seller/products */
export const createProduct = asyncHandler(async (req, res) => {
  const { name, price, category } = req.body;
  if (!name || price == null || !category) throw new ApiError(400, 'Name, price and category are required');
  if (!(await Category.exists({ _id: category }))) throw new ApiError(400, 'Choose a valid category');

  const product = await Product.create({
    ...req.body,
    seller: req.seller._id,
    slug: await uniqueSlug(Product, name),
    baseTier: req.body.baseTier || DELIVERY_TIERS.NEXT_DAY,
  });

  await InventoryLog.create({
    product: product._id,
    seller: req.seller._id,
    change: product.stock,
    stockAfter: product.stock,
    reason: 'RESTOCK',
    note: 'Initial stock',
  });

  await Category.updateOne({ _id: category }, { $inc: { productCount: 1 } });
  res.status(201).json({ success: true, product });
});

/** PATCH /api/seller/products/:id */
export const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ _id: req.params.id, seller: req.seller._id });
  if (!product) throw new ApiError(404, 'Product not found');

  const previousStock = product.stock;
  const blocked = ['seller', 'slug', 'rating', 'reviewCount', 'soldCount'];
  Object.keys(req.body).forEach((key) => {
    if (!blocked.includes(key)) product[key] = req.body[key];
  });

  if (req.body.name && req.body.name !== product.name) {
    product.slug = await uniqueSlug(Product, req.body.name, product._id);
  }

  await product.save();

  if (req.body.stock !== undefined && product.stock !== previousStock) {
    await InventoryLog.create({
      product: product._id,
      seller: req.seller._id,
      change: product.stock - previousStock,
      stockAfter: product.stock,
      reason: 'ADJUSTMENT',
      note: req.body.stockNote || 'Manual update',
    });
  }

  res.json({ success: true, product });
});

/** DELETE /api/seller/products/:id */
export const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ _id: req.params.id, seller: req.seller._id });
  if (!product) throw new ApiError(404, 'Product not found');

  // Products attached to live orders are retired, not deleted, so order
  // history keeps resolving.
  const inLiveOrder = await Order.exists({
    'items.product': product._id,
    status: { $nin: [ORDER_STATUS.DELIVERED, ORDER_STATUS.CANCELLED] },
  });

  if (inLiveOrder) {
    product.isActive = false;
    await product.save();
    return res.json({ success: true, message: 'Product has live orders — hidden from the store instead of deleted' });
  }

  await product.deleteOne();
  await Category.updateOne({ _id: product.category }, { $inc: { productCount: -1 } });
  res.json({ success: true, message: 'Product deleted' });
});

/** PATCH /api/seller/products/:id/stock — quick restock from the inventory table. */
export const adjustStock = asyncHandler(async (req, res) => {
  const { change, absolute, note } = req.body;
  const product = await Product.findOne({ _id: req.params.id, seller: req.seller._id });
  if (!product) throw new ApiError(404, 'Product not found');

  const next = absolute != null ? Number(absolute) : product.stock + Number(change || 0);
  if (next < 0) throw new ApiError(400, 'Stock cannot go below zero');

  const delta = next - product.stock;
  product.stock = next;
  await product.save();

  await InventoryLog.create({
    product: product._id,
    seller: req.seller._id,
    change: delta,
    stockAfter: next,
    reason: delta >= 0 ? 'RESTOCK' : 'ADJUSTMENT',
    note,
  });

  res.json({ success: true, product });
});

export const inventoryLog = asyncHandler(async (req, res) => {
  const logs = await InventoryLog.find({ seller: req.seller._id })
    .populate('product', 'name images')
    .sort('-createdAt')
    .limit(60)
    .lean();
  res.json({ success: true, logs });
});

/** GET /api/seller/meta — categories/occasions/tiers for the product form. */
export const productFormMeta = asyncHandler(async (_req, res) => {
  const [categories, occasions] = await Promise.all([
    Category.find({ isActive: true }).select('name slug icon').sort('displayOrder').lean(),
    Occasion.find({ isActive: true }).select('name slug icon').sort('displayOrder').lean(),
  ]);
  res.json({ success: true, categories, occasions, tiers: Object.values(TIER_META) });
});

/* ---------------------------- Order management ---------------------------- */

/** GET /api/seller/orders — grouped by the seller's working columns. */
export const listOrders = asyncHandler(async (req, res) => {
  const { page, limit, skip } = paginate({ ...req.query, limit: req.query.limit || 20 });
  const filter = { sellers: req.seller._id };
  if (req.query.status) filter.status = req.query.status;
  if (req.query.tier) filter.deliveryTier = req.query.tier;
  if (req.query.q) filter.orderId = new RegExp(String(req.query.q), 'i');

  const [orders, total, counts] = await Promise.all([
    Order.find(filter).sort('-createdAt').skip(skip).limit(limit).lean(),
    Order.countDocuments(filter),
    Order.aggregate([{ $match: { sellers: req.seller._id } }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
  ]);

  // Only show this seller's lines — a multi-seller order isn't their business.
  const scoped = orders.map((o) => ({
    ...o,
    items: o.items.filter((i) => String(i.seller) === String(req.seller._id)),
  }));

  res.json({
    success: true,
    orders: scoped,
    total,
    page,
    pages: Math.ceil(total / limit),
    counts: Object.fromEntries(counts.map((c) => [c._id, c.count])),
    statusMeta: ORDER_STATUS_META,
  });
});

export const getOrder = asyncHandler(async (req, res) => {
  const order = await Order.findOne({ orderId: req.params.orderId, sellers: req.seller._id }).lean();
  if (!order) throw new ApiError(404, 'Order not found');
  res.json({
    success: true,
    order: { ...order, items: order.items.filter((i) => String(i.seller) === String(req.seller._id)) },
    statusMeta: ORDER_STATUS_META,
    flow: ORDER_FLOW,
  });
});

/**
 * PATCH /api/seller/orders/:orderId/status
 * Sellers may only move an order forward, one step at a time.
 */
export const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status, note } = req.body;
  const order = await Order.findOne({ orderId: req.params.orderId, sellers: req.seller._id });
  if (!order) throw new ApiError(404, 'Order not found');
  if (order.status === ORDER_STATUS.CANCELLED) throw new ApiError(400, 'This order was cancelled');

  const currentIndex = ORDER_FLOW.indexOf(order.status);
  const nextIndex = ORDER_FLOW.indexOf(status);

  if (nextIndex === -1) throw new ApiError(400, 'Unknown order status');
  if (nextIndex !== currentIndex + 1) {
    const expected = ORDER_FLOW[currentIndex + 1];
    throw new ApiError(400, expected ? `The next step for this order is "${ORDER_STATUS_META[expected].label}"` : 'This order is already complete');
  }

  order.status = status;
  order.timeline.push({ status, label: ORDER_STATUS_META[status].label, note });

  if (status === ORDER_STATUS.DELIVERED) {
    order.deliveredAt = new Date();
    await Commission.updateMany({ order: order._id, seller: req.seller._id }, { $set: { status: 'PENDING' } });
    req.seller.totalOrders += 1;
    req.seller.totalSales = money(req.seller.totalSales + order.total);
    await req.seller.save();
  }

  if (status === ORDER_STATUS.PICKED_UP && !order.deliveryPartner?.name) {
    order.deliveryPartner = { name: 'Ravi K.', mobile: '+91 98200 11223', vehicle: 'Bike · MH01 AB 1234' };
  }

  await order.save();
  await notifyOrderStatus(order, status);

  res.json({ success: true, order });
});

/** POST /api/seller/orders/:orderId/cancel */
export const cancelOrder = asyncHandler(async (req, res) => {
  const order = await Order.findOne({ orderId: req.params.orderId, sellers: req.seller._id });
  if (!order) throw new ApiError(404, 'Order not found');
  if ([ORDER_STATUS.DELIVERED, ORDER_STATUS.CANCELLED].includes(order.status)) {
    throw new ApiError(400, 'This order can no longer be cancelled');
  }

  order.status = ORDER_STATUS.CANCELLED;
  order.cancellationReason = req.body.reason || 'Cancelled by seller';
  order.timeline.push({ status: ORDER_STATUS.CANCELLED, label: 'Cancelled', note: order.cancellationReason });
  await order.save();

  await Promise.all(
    order.items
      .filter((i) => String(i.seller) === String(req.seller._id))
      .map((item) => Product.updateOne({ _id: item.product }, { $inc: { stock: item.quantity } }))
  );

  await notifyOrderStatus(order, ORDER_STATUS.CANCELLED);
  res.json({ success: true, order });
});

/* ---------------------------- Reviews & payouts --------------------------- */

export const listReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ seller: req.seller._id, status: 'APPROVED' })
    .populate('product', 'name images slug')
    .sort('-createdAt')
    .limit(50)
    .lean();

  res.json({
    success: true,
    reviews,
    summary: {
      rating: req.seller.rating,
      deliveryRating: req.seller.deliveryRating,
      count: req.seller.reviewCount,
    },
  });
});

export const listPayouts = asyncHandler(async (req, res) => {
  const [payouts, pending] = await Promise.all([
    SellerPayout.find({ seller: req.seller._id }).sort('-createdAt').limit(24).lean(),
    Commission.aggregate([
      { $match: { seller: req.seller._id, status: 'PENDING' } },
      { $group: { _id: null, gross: { $sum: '$orderAmount' }, commission: { $sum: '$amount' }, net: { $sum: '$sellerEarning' }, orders: { $sum: 1 } } },
    ]),
  ]);

  res.json({
    success: true,
    payouts,
    pending: {
      orders: pending[0]?.orders || 0,
      gross: money(pending[0]?.gross || 0),
      commission: money(pending[0]?.commission || 0),
      net: money(pending[0]?.net || 0),
    },
  });
});
