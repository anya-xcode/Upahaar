import Cart from '../models/Cart.js';
import { resolveLocation } from './catalogService.js';
import { attachAvailability, availableCheckoutOptions, resolveFee, TIER_META, TIER_ORDER } from './deliveryEngine.js';
import { applyCoupon } from './couponService.js';
import { money } from '../utils/helpers.js';

export const GIFT_WRAP_FEE = 49;
export const GREETING_CARD_FEE = 29;

/**
 * Builds the priced, availability-checked view of a customer's cart.
 *
 * Everything the cart page and the checkout show comes from here, so the price
 * a customer sees is always recomputed from live products — never from numbers
 * stored on the cart when the item was added.
 */
export async function buildCart(userId, { pincode, couponCode, tier, giftOptions = {}, user } = {}) {
  const cart = await Cart.findOne({ user: userId }).populate({
    path: 'items.product',
    populate: [
      { path: 'seller' },
      { path: 'category', select: 'name slug icon' },
    ],
  });

  if (!cart) {
    return emptySummary(pincode);
  }

  const effectivePincode = pincode || cart.pincode;
  const { pincodeDoc, zone } = await resolveLocation(effectivePincode);

  // Drop lines whose product was deleted by its seller.
  const liveItems = cart.items.filter((item) => item.product);

  const items = liveItems.map((item) => {
    const product = item.product;
    const decorated = attachAvailability(product, { seller: product.seller, pincodeDoc, zone });
    const personalizationFee = item.personalization?.message || item.personalization?.photoUrl
      ? product.personalizationFee || 0
      : 0;

    return {
      _id: item._id,
      product: decorated,
      quantity: item.quantity,
      variant: item.variant,
      personalization: item.personalization,
      personalizationFee: money(personalizationFee * item.quantity),
      deliveryDate: item.deliveryDate,
      deliveryWindow: item.deliveryWindow,
      specialInstructions: item.specialInstructions,
      lineTotal: money(product.price * item.quantity),
      /** Set when the item can't reach the chosen pincode — blocks checkout. */
      issue: pincodeDoc && !decorated.availability.deliverable ? decorated.availability.reason : null,
      outOfStock: product.stock < item.quantity,
    };
  });

  const deliverable = items.filter((i) => !i.issue && !i.outOfStock);
  const blocked = items.filter((i) => i.issue || i.outOfStock);

  const subtotal = money(deliverable.reduce((sum, i) => sum + i.lineTotal, 0));
  const personalizationTotal = money(deliverable.reduce((sum, i) => sum + i.personalizationFee, 0));

  // The whole order can only move as fast as its slowest item.
  const slowestTier = deliverable.reduce((worst, i) => {
    const rank = TIER_META[i.product.tier]?.rank ?? 3;
    return rank > (TIER_META[worst]?.rank ?? -1) ? i.product.tier : worst;
  }, TIER_ORDER[0]);

  const deliveryOptions = pincodeDoc
    ? availableCheckoutOptions({ pincodeDoc, zone, slowestItemTier: deliverable.length ? slowestTier : TIER_ORDER[3] })
    : [];

  const chosenTier = deliveryOptions.find((o) => o.tier === tier)?.tier || deliveryOptions[0]?.tier || null;
  const deliveryFee = chosenTier && deliverable.length ? resolveFee(chosenTier, pincodeDoc) : 0;

  const giftWrapFee = giftOptions.giftWrap ? GIFT_WRAP_FEE : 0;
  const greetingCardFee = giftOptions.greetingCard ? GREETING_CARD_FEE : 0;
  const giftOptionsTotal = money(giftWrapFee + greetingCardFee);

  let coupon = null;
  let discount = 0;
  const codeToTry = couponCode || cart.appliedCoupon;
  if (codeToTry && deliverable.length) {
    try {
      const applied = await applyCoupon({
        code: codeToTry,
        user,
        items: deliverable.map((i) => ({ product: i.product, quantity: i.quantity })),
        subtotal,
        pincode: effectivePincode,
      });
      coupon = { code: applied.coupon.code, title: applied.coupon.title, discount: applied.discount };
      discount = applied.discount;
    } catch (err) {
      // A coupon that has since expired shouldn't break the cart — surface it.
      coupon = { code: String(codeToTry).toUpperCase(), error: err.message, discount: 0 };
    }
  }

  const total = money(Math.max(0, subtotal + personalizationTotal + giftOptionsTotal + deliveryFee - discount));

  return {
    items,
    blocked,
    itemCount: items.reduce((n, i) => n + i.quantity, 0),
    pincode: effectivePincode || null,
    location: pincodeDoc ? { code: pincodeDoc.code, city: pincodeDoc.city, state: pincodeDoc.state } : null,
    serviceable: Boolean(pincodeDoc?.isServiceable),
    deliveryOptions,
    selectedTier: chosenTier,
    slowestTier: deliverable.length ? slowestTier : null,
    giftOptionFees: { giftWrap: GIFT_WRAP_FEE, greetingCard: GREETING_CARD_FEE },
    coupon,
    totals: {
      subtotal,
      personalizationTotal,
      giftOptionsTotal,
      deliveryFee,
      discount,
      total,
      savings: money(
        deliverable.reduce((sum, i) => sum + Math.max(0, (i.product.mrp || 0) - i.product.price) * i.quantity, 0) +
          discount
      ),
    },
    canCheckout: deliverable.length > 0 && blocked.length === 0 && Boolean(pincodeDoc?.isServiceable),
  };
}

function emptySummary(pincode) {
  return {
    items: [],
    blocked: [],
    itemCount: 0,
    pincode: pincode || null,
    location: null,
    serviceable: false,
    deliveryOptions: [],
    selectedTier: null,
    slowestTier: null,
    giftOptionFees: { giftWrap: GIFT_WRAP_FEE, greetingCard: GREETING_CARD_FEE },
    coupon: null,
    totals: {
      subtotal: 0,
      personalizationTotal: 0,
      giftOptionsTotal: 0,
      deliveryFee: 0,
      discount: 0,
      total: 0,
      savings: 0,
    },
    canCheckout: false,
  };
}
