import Coupon from '../models/Coupon.js';
import Order from '../models/Order.js';
import { ApiError } from '../utils/ApiError.js';
import { COUPON_TYPES } from '../utils/constants.js';
import { money } from '../utils/helpers.js';

/**
 * Validates a coupon against the actual cart and returns the rupee discount.
 * Throws an ApiError with a message the customer can act on.
 */
export async function applyCoupon({ code, user, items, subtotal, pincode }) {
  const coupon = await Coupon.findOne({ code: String(code).toUpperCase().trim(), isActive: true });
  if (!coupon) throw new ApiError(404, 'That coupon code is not valid');

  const now = new Date();
  if (coupon.startsAt && now < coupon.startsAt) throw new ApiError(400, 'This offer has not started yet');
  if (coupon.expiresAt && now > coupon.expiresAt) throw new ApiError(400, 'This offer has expired');
  if (coupon.usageLimit > 0 && coupon.usageCount >= coupon.usageLimit) {
    throw new ApiError(400, 'This offer has been fully claimed');
  }
  if (subtotal < coupon.minOrderValue) {
    throw new ApiError(400, `Add ₹${money(coupon.minOrderValue - subtotal)} more to use ${coupon.code}`);
  }
  if (coupon.pincodes.length && pincode && !coupon.pincodes.includes(String(pincode))) {
    throw new ApiError(400, 'This offer is not available in your area');
  }

  if (user) {
    const used = coupon.usedBy.find((u) => String(u.user) === String(user._id));
    if (used && coupon.perUserLimit > 0 && used.count >= coupon.perUserLimit) {
      throw new ApiError(400, 'You have already used this offer');
    }
    if (coupon.firstOrderOnly) {
      const previous = await Order.countDocuments({ customer: user._id });
      if (previous > 0) throw new ApiError(400, 'This offer is only for your first order');
    }
  }

  // Percent/flat coupons scoped to a category or seller only discount the
  // matching lines, not the whole basket.
  const eligible = items.filter((item) => {
    const categoryOk =
      !coupon.categories.length ||
      coupon.categories.some((c) => String(c) === String(item.product.category?._id || item.product.category));
    const sellerOk =
      !coupon.sellers.length ||
      coupon.sellers.some((s) => String(s) === String(item.product.seller?._id || item.product.seller));
    return categoryOk && sellerOk;
  });

  if (!eligible.length) throw new ApiError(400, 'This offer does not apply to the items in your cart');

  const eligibleTotal = eligible.reduce((sum, i) => sum + i.product.price * i.quantity, 0);

  let discount =
    coupon.type === COUPON_TYPES.PERCENT ? (eligibleTotal * coupon.value) / 100 : Math.min(coupon.value, eligibleTotal);

  if (coupon.type === COUPON_TYPES.PERCENT && coupon.maxDiscount) {
    discount = Math.min(discount, coupon.maxDiscount);
  }
  discount = money(Math.min(discount, subtotal));

  return { coupon, discount };
}

/** Records the redemption once the order is actually placed. */
export async function consumeCoupon(coupon, userId) {
  const entry = coupon.usedBy.find((u) => String(u.user) === String(userId));
  if (entry) entry.count += 1;
  else coupon.usedBy.push({ user: userId, count: 1 });
  coupon.usageCount += 1;
  await coupon.save();
}
