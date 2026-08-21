import Address from '../models/Address.js';
import Wishlist from '../models/Wishlist.js';
import GiftReminder from '../models/GiftReminder.js';
import Notification from '../models/Notification.js';
import Order from '../models/Order.js';
import Review from '../models/Review.js';
import Coupon from '../models/Coupon.js';
import asyncHandler from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { resolveLocation } from '../services/catalogService.js';
import { attachAvailability } from '../services/deliveryEngine.js';

/* ------------------------------- Addresses ------------------------------- */

export const listAddresses = asyncHandler(async (req, res) => {
  const addresses = await Address.find({ user: req.user._id }).sort('-isDefault -updatedAt').lean();
  res.json({ success: true, addresses });
});

export const createAddress = asyncHandler(async (req, res) => {
  const count = await Address.countDocuments({ user: req.user._id });
  const isDefault = req.body.isDefault || count === 0; // first address wins by default

  if (isDefault) await Address.updateMany({ user: req.user._id }, { $set: { isDefault: false } });

  const address = await Address.create({ ...req.body, user: req.user._id, isDefault });
  res.status(201).json({ success: true, address });
});

export const updateAddress = asyncHandler(async (req, res) => {
  if (req.body.isDefault) await Address.updateMany({ user: req.user._id }, { $set: { isDefault: false } });

  const address = await Address.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    req.body,
    { new: true, runValidators: true }
  );
  if (!address) throw new ApiError(404, 'Address not found');
  res.json({ success: true, address });
});

export const deleteAddress = asyncHandler(async (req, res) => {
  const address = await Address.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!address) throw new ApiError(404, 'Address not found');

  // Never leave the customer without a default.
  if (address.isDefault) {
    const next = await Address.findOne({ user: req.user._id });
    if (next) {
      next.isDefault = true;
      await next.save();
    }
  }
  res.json({ success: true, message: 'Address removed' });
});

/* -------------------------------- Wishlist -------------------------------- */

export const getWishlist = asyncHandler(async (req, res) => {
  const wishlist = await Wishlist.findOne({ user: req.user._id }).populate({
    path: 'products',
    populate: [{ path: 'seller' }, { path: 'category', select: 'name slug icon' }],
  });

  const { pincodeDoc, zone } = await resolveLocation(req.query.pincode || req.user.defaultPincode);
  // A product pulled from a wishlist still has to pass the same gates.
  const products = (wishlist?.products || [])
    .filter((p) => p.isActive && p.approvalStatus === 'APPROVED')
    .map((p) => attachAvailability(p, { seller: p.seller, pincodeDoc, zone }));

  res.json({ success: true, products });
});

/** POST /api/account/wishlist/:productId — idempotent toggle-on. */
export const addToWishlist = asyncHandler(async (req, res) => {
  const wishlist = await Wishlist.findOneAndUpdate(
    { user: req.user._id },
    { $addToSet: { products: req.params.productId } },
    { new: true, upsert: true }
  );
  res.json({ success: true, message: 'Saved to wishlist', count: wishlist.products.length });
});

export const removeFromWishlist = asyncHandler(async (req, res) => {
  const wishlist = await Wishlist.findOneAndUpdate(
    { user: req.user._id },
    { $pull: { products: req.params.productId } },
    { new: true }
  );
  res.json({ success: true, message: 'Removed from wishlist', count: wishlist?.products.length || 0 });
});

/** GET /api/account/wishlist/ids — lets the UI fill in every heart in one call. */
export const wishlistIds = asyncHandler(async (req, res) => {
  const wishlist = await Wishlist.findOne({ user: req.user._id }).select('products').lean();
  res.json({ success: true, ids: (wishlist?.products || []).map(String) });
});

/* ----------------------------- Gift reminders ----------------------------- */

function daysUntil(month, day, from = new Date()) {
  const year = from.getFullYear();
  let next = new Date(year, month - 1, day);
  next.setHours(0, 0, 0, 0);
  const today = new Date(from);
  today.setHours(0, 0, 0, 0);
  if (next < today) next = new Date(year + 1, month - 1, day);
  return Math.round((next - today) / 86400000);
}

export const listReminders = asyncHandler(async (req, res) => {
  const reminders = await GiftReminder.find({ user: req.user._id, isActive: true }).lean();

  const withCountdown = reminders
    .map((r) => {
      const days = daysUntil(r.month, r.day);
      return {
        ...r,
        daysUntil: days,
        /** True once we're inside the customer's chosen reminder window. */
        isDue: days <= (r.remindDaysBefore ?? 7),
        message:
          days === 0
            ? `${r.title} is today`
            : `${r.title} is in ${days} day${days === 1 ? '' : 's'}. Want to send a gift?`,
      };
    })
    .sort((a, b) => a.daysUntil - b.daysUntil);

  res.json({ success: true, reminders: withCountdown, due: withCountdown.filter((r) => r.isDue) });
});

export const createReminder = asyncHandler(async (req, res) => {
  const { title, month, day } = req.body;
  if (!title || !month || !day) throw new ApiError(400, 'Title, month and day are required');
  const reminder = await GiftReminder.create({ ...req.body, user: req.user._id });
  res.status(201).json({ success: true, reminder });
});

export const updateReminder = asyncHandler(async (req, res) => {
  const reminder = await GiftReminder.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    req.body,
    { new: true, runValidators: true }
  );
  if (!reminder) throw new ApiError(404, 'Reminder not found');
  res.json({ success: true, reminder });
});

export const deleteReminder = asyncHandler(async (req, res) => {
  const reminder = await GiftReminder.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!reminder) throw new ApiError(404, 'Reminder not found');
  res.json({ success: true, message: 'Reminder removed' });
});

/* ------------------------------ Notifications ----------------------------- */

export const listNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.find({ recipient: req.user._id }).sort('-createdAt').limit(50).lean();
  const unread = notifications.filter((n) => !n.isRead).length;
  res.json({ success: true, notifications, unread });
});

export const markNotificationRead = asyncHandler(async (req, res) => {
  await Notification.updateOne(
    { _id: req.params.id, recipient: req.user._id },
    { $set: { isRead: true, readAt: new Date() } }
  );
  res.json({ success: true });
});

export const markAllNotificationsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany(
    { recipient: req.user._id, isRead: false },
    { $set: { isRead: true, readAt: new Date() } }
  );
  res.json({ success: true });
});

/* ---------------------------- Payments & coupons --------------------------- */

export const listSavedPayments = asyncHandler(async (req, res) => {
  res.json({ success: true, methods: req.user.savedPayments });
});

export const addSavedPayment = asyncHandler(async (req, res) => {
  const { label, method, maskedValue, isDefault } = req.body;
  if (!method || !maskedValue) throw new ApiError(400, 'Payment details are incomplete');

  if (isDefault) req.user.savedPayments.forEach((m) => { m.isDefault = false; });
  req.user.savedPayments.push({ label, method, maskedValue, isDefault: Boolean(isDefault) });
  await req.user.save();

  res.status(201).json({ success: true, methods: req.user.savedPayments });
});

export const deleteSavedPayment = asyncHandler(async (req, res) => {
  req.user.savedPayments.pull({ _id: req.params.id });
  await req.user.save();
  res.json({ success: true, methods: req.user.savedPayments });
});

/** GET /api/account/coupons — offers this customer can still use. */
export const myCoupons = asyncHandler(async (req, res) => {
  const now = new Date();
  const coupons = await Coupon.find({
    isActive: true,
    isVisible: true,
    $and: [
      { $or: [{ startsAt: null }, { startsAt: { $lte: now } }] },
      { $or: [{ expiresAt: null }, { expiresAt: { $gte: now } }] },
    ],
  }).lean();

  const orderCount = await Order.countDocuments({ customer: req.user._id });

  const usable = coupons
    .map((c) => {
      const used = c.usedBy?.find((u) => String(u.user) === String(req.user._id));
      const exhausted = c.perUserLimit > 0 && (used?.count || 0) >= c.perUserLimit;
      const notFirstOrder = c.firstOrderOnly && orderCount > 0;
      return { ...c, usedBy: undefined, isUsable: !exhausted && !notFirstOrder };
    })
    .sort((a, b) => Number(b.isUsable) - Number(a.isUsable));

  res.json({ success: true, coupons: usable });
});

/** GET /api/account/summary — the numbers on the dashboard landing card. */
export const accountSummary = asyncHandler(async (req, res) => {
  const [orderCount, activeOrders, wishlist, reminders, reviewCount, unread] = await Promise.all([
    Order.countDocuments({ customer: req.user._id }),
    Order.countDocuments({ customer: req.user._id, status: { $nin: ['DELIVERED', 'CANCELLED'] } }),
    Wishlist.findOne({ user: req.user._id }).select('products').lean(),
    GiftReminder.countDocuments({ user: req.user._id, isActive: true }),
    Review.countDocuments({ user: req.user._id }),
    Notification.countDocuments({ recipient: req.user._id, isRead: false }),
  ]);

  const spent = await Order.aggregate([
    { $match: { customer: req.user._id, status: 'DELIVERED' } },
    { $group: { _id: null, total: { $sum: '$total' } } },
  ]);

  res.json({
    success: true,
    summary: {
      orders: orderCount,
      activeOrders,
      wishlist: wishlist?.products?.length || 0,
      reminders,
      reviews: reviewCount,
      unreadNotifications: unread,
      totalSpent: spent[0]?.total || 0,
      referralCode: req.user.referralCode,
      referralRewards: req.user.referralRewards,
      walletBalance: req.user.walletBalance,
    },
  });
});
