import User from '../models/User.js';
import Seller from '../models/Seller.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import Review from '../models/Review.js';
import Commission from '../models/Commission.js';
import SellerPayout from '../models/SellerPayout.js';
import Payment from '../models/Payment.js';
import asyncHandler from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { paginate, money } from '../utils/helpers.js';
import { SELLER_STATUS, KYC_STATUS, ROLES } from '../utils/constants.js';
import { notifySeller } from '../services/notificationService.js';
import { adminDashboard, adminAnalytics, invalidateAnalytics } from '../services/analyticsService.js';
import { recalcAggregates } from './reviewController.js';

/* -------------------------------- Dashboard ------------------------------- */

/** GET /api/admin/dashboard */
export const dashboard = asyncHandler(async (_req, res) => {
  res.json({ success: true, ...(await adminDashboard()) });
});

/** GET /api/admin/analytics — everything the charts render from. */
export const analytics = asyncHandler(async (_req, res) => {
  res.json({ success: true, ...(await adminAnalytics()) });
});

/* ---------------------------- Seller management --------------------------- */

export const listSellers = asyncHandler(async (req, res) => {
  const { page, limit, skip } = paginate({ ...req.query, limit: req.query.limit || 20 });
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.kyc) filter.kycStatus = req.query.kyc;
  if (req.query.q) filter.businessName = new RegExp(String(req.query.q).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');

  const [sellers, total, counts] = await Promise.all([
    Seller.find(filter).sort('-createdAt').skip(skip).limit(limit).lean(),
    Seller.countDocuments(filter),
    Seller.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
  ]);

  res.json({
    success: true,
    sellers,
    total,
    page,
    pages: Math.ceil(total / limit),
    counts: Object.fromEntries(counts.map((c) => [c._id, c.count])),
  });
});

export const getSeller = asyncHandler(async (req, res) => {
  const seller = await Seller.findById(req.params.id).populate('user', 'name email mobile lastLoginAt').lean();
  if (!seller) throw new ApiError(404, 'Seller not found');

  const [productCount, orderStats, reviews, payouts] = await Promise.all([
    Product.countDocuments({ seller: seller._id }),
    Order.aggregate([
      { $match: { sellers: seller._id } },
      { $group: { _id: '$status', count: { $sum: 1 }, revenue: { $sum: '$total' } } },
    ]),
    Review.find({ seller: seller._id }).sort('-createdAt').limit(10).lean(),
    SellerPayout.find({ seller: seller._id }).sort('-createdAt').limit(10).lean(),
  ]);

  res.json({ success: true, seller, productCount, orderStats, reviews, payouts });
});

/**
 * PATCH /api/admin/sellers/:id/status
 * Approve / reject / suspend. Suspending also pulls the store's products from
 * the storefront, so nothing stays purchasable behind a closed shop.
 */
export const updateSellerStatus = asyncHandler(async (req, res) => {
  const { status, reason } = req.body;

  const seller = await Seller.findById(req.params.id);
  if (!seller) throw new ApiError(404, 'Seller not found');

  seller.status = status;
  seller.statusReason = reason;
  if (status === SELLER_STATUS.ACTIVE && seller.kycStatus === KYC_STATUS.PENDING) {
    seller.kycStatus = KYC_STATUS.VERIFIED;
  }
  await seller.save();

  if (status !== SELLER_STATUS.ACTIVE) {
    await Product.updateMany({ seller: seller._id }, { $set: { isActive: false } });
  }

  const messages = {
    [SELLER_STATUS.ACTIVE]: { title: 'Your store is live', body: 'Customers near you can now order your gifts.' },
    [SELLER_STATUS.REJECTED]: { title: 'Application not approved', body: reason || 'Please review your details and re-apply.' },
    [SELLER_STATUS.SUSPENDED]: { title: 'Store suspended', body: reason || 'Please contact Upahaar support.' },
    [SELLER_STATUS.PENDING]: { title: 'Store under review', body: 'We are reviewing your store details.' },
  };
  if (messages[status]) {
    await notifySeller(seller.user, { ...messages[status], icon: 'store', type: 'KYC', link: '/seller/profile' });
  }

  invalidateAnalytics();
  res.json({ success: true, seller });
});

export const updateSellerKyc = asyncHandler(async (req, res) => {
  const { kycStatus, note } = req.body;

  const seller = await Seller.findByIdAndUpdate(
    req.params.id,
    { $set: { kycStatus, statusReason: note } },
    { new: true }
  );
  if (!seller) throw new ApiError(404, 'Seller not found');

  await notifySeller(seller.user, {
    title: kycStatus === KYC_STATUS.VERIFIED ? 'KYC verified' : 'KYC update',
    body: note || `Your KYC status is now ${kycStatus}.`,
    icon: 'kyc',
    type: 'KYC',
    link: '/seller/profile',
  });

  invalidateAnalytics();
  res.json({ success: true, seller });
});

/** PATCH /api/admin/sellers/:id — commission, coverage, featured flag. */
export const updateSeller = asyncHandler(async (req, res) => {
  const allowed = ['commissionRate', 'servedPincodes', 'deliveryRadiusKm', 'isFeatured', 'acceptsExpress', 'workingHours'];
  const update = {};
  allowed.forEach((f) => {
    if (req.body[f] !== undefined) update[f] = req.body[f];
  });

  const seller = await Seller.findByIdAndUpdate(req.params.id, { $set: update }, { new: true, runValidators: true });
  if (!seller) throw new ApiError(404, 'Seller not found');
  res.json({ success: true, seller });
});

/* ----------------------------- User management ---------------------------- */

export const listUsers = asyncHandler(async (req, res) => {
  const { page, limit, skip } = paginate({ ...req.query, limit: req.query.limit || 20 });
  const filter = {};
  if (req.query.role) filter.role = req.query.role;
  if (req.query.q) {
    const rx = new RegExp(String(req.query.q).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = [{ name: rx }, { email: rx }, { mobile: rx }];
  }

  const [users, total] = await Promise.all([
    User.find(filter).sort('-createdAt').skip(skip).limit(limit).lean(),
    User.countDocuments(filter),
  ]);

  res.json({ success: true, users, total, page, pages: Math.ceil(total / limit) });
});

export const toggleUserActive = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, 'User not found');
  if (user.role === ROLES.ADMIN) throw new ApiError(400, 'Admin accounts cannot be deactivated here');

  user.isActive = !user.isActive;
  await user.save();

  invalidateAnalytics();
  res.json({ success: true, user: { id: user._id, isActive: user.isActive } });
});

/* ---------------------------- Order management ---------------------------- */

export const listOrders = asyncHandler(async (req, res) => {
  const { page, limit, skip } = paginate({ ...req.query, limit: req.query.limit || 20 });
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.tier) filter.deliveryTier = req.query.tier;
  if (req.query.pincode) filter['shippingAddress.pincode'] = req.query.pincode;
  if (req.query.q) filter.orderId = new RegExp(String(req.query.q), 'i');

  const [orders, total, counts] = await Promise.all([
    Order.find(filter).sort('-createdAt').skip(skip).limit(limit).populate('sellers', 'businessName').lean(),
    Order.countDocuments(filter),
    Order.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
  ]);

  res.json({
    success: true,
    orders,
    total,
    page,
    pages: Math.ceil(total / limit),
    counts: Object.fromEntries(counts.map((c) => [c._id, c.count])),
  });
});

export const getOrder = asyncHandler(async (req, res) => {
  const order = await Order.findOne({ orderId: req.params.orderId })
    .populate('sellers', 'businessName slug mobile')
    .populate('customer', 'name email mobile')
    .lean();
  if (!order) throw new ApiError(404, 'Order not found');

  const payment = await Payment.findOne({ order: order._id }).lean();
  res.json({ success: true, order, payment });
});

/** POST /api/admin/orders/:orderId/refund */
export const refundOrder = asyncHandler(async (req, res) => {
  const order = await Order.findOne({ orderId: req.params.orderId });
  if (!order) throw new ApiError(404, 'Order not found');

  const amount = Number(req.body.amount ?? order.total);
  if (amount <= 0 || amount > order.total) throw new ApiError(400, 'Refund amount is not valid');

  order.refundAmount = money(amount);
  order.paymentStatus = 'REFUNDED';
  await order.save();

  await Payment.updateOne(
    { order: order._id },
    { $set: { status: 'REFUNDED', refundedAt: new Date(), refundAmount: money(amount) } }
  );

  invalidateAnalytics();
  res.json({ success: true, order });
});

/* --------------------------- Review moderation ---------------------------- */

export const listAllReviews = asyncHandler(async (req, res) => {
  const { page, limit, skip } = paginate({ ...req.query, limit: req.query.limit || 20 });
  const filter = {};
  if (req.query.status) filter.status = req.query.status;

  const [reviews, total] = await Promise.all([
    Review.find(filter)
      .populate('product', 'name slug images')
      .populate('seller', 'businessName')
      .sort('-createdAt')
      .skip(skip)
      .limit(limit)
      .lean(),
    Review.countDocuments(filter),
  ]);

  res.json({ success: true, reviews, total, page, pages: Math.ceil(total / limit) });
});

export const moderateReview = asyncHandler(async (req, res) => {
  const { status, note } = req.body;

  const review = await Review.findByIdAndUpdate(
    req.params.id,
    { $set: { status, moderationNote: note } },
    { new: true }
  );
  if (!review) throw new ApiError(404, 'Review not found');

  await recalcAggregates(review.product, review.seller);

  invalidateAnalytics();
  res.json({ success: true, review });
});

/* --------------------------------- Payouts -------------------------------- */

export const listPayouts = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.status) filter.status = req.query.status;

  const [payouts, pendingBySeller] = await Promise.all([
    SellerPayout.find(filter).populate('seller', 'businessName slug').sort('-createdAt').limit(40).lean(),
    Commission.aggregate([
      { $match: { status: 'PENDING' } },
      { $group: { _id: '$seller', orders: { $sum: 1 }, gross: { $sum: '$orderAmount' }, commission: { $sum: '$amount' }, net: { $sum: '$sellerEarning' } } },
      { $lookup: { from: 'sellers', localField: '_id', foreignField: '_id', as: 's' } },
      { $unwind: '$s' },
      { $project: { businessName: '$s.businessName', orders: 1, gross: 1, commission: 1, net: 1 } },
      { $sort: { net: -1 } },
    ]),
  ]);

  res.json({ success: true, payouts, pendingBySeller });
});

/** POST /api/admin/payouts/:sellerId — settle everything pending for a seller. */
export const createPayout = asyncHandler(async (req, res) => {
  const commissions = await Commission.find({ seller: req.params.sellerId, status: 'PENDING' });
  if (!commissions.length) throw new ApiError(400, 'Nothing pending for this seller');

  const gross = money(commissions.reduce((s, c) => s + c.orderAmount, 0));
  const commission = money(commissions.reduce((s, c) => s + c.amount, 0));
  const net = money(commissions.reduce((s, c) => s + c.sellerEarning, 0));

  const payout = await SellerPayout.create({
    seller: req.params.sellerId,
    periodStart: commissions[commissions.length - 1].createdAt,
    periodEnd: new Date(),
    orderCount: commissions.length,
    grossSales: gross,
    commissionDeducted: commission,
    netPayable: net,
    status: 'PAID',
    utr: `UTR${Date.now().toString().slice(-10)}`,
    paidAt: new Date(),
  });

  await Commission.updateMany(
    { _id: { $in: commissions.map((c) => c._id) } },
    { $set: { status: 'SETTLED', payout: payout._id } }
  );

  const seller = await Seller.findById(req.params.sellerId).select('user businessName');
  if (seller) {
    await notifySeller(seller.user, {
      title: 'Payout processed',
      body: `₹${net.toLocaleString('en-IN')} has been sent to your registered bank account.`,
      icon: 'payout',
      type: 'GENERAL',
      link: '/seller/payouts',
    });
  }

  invalidateAnalytics();
  res.status(201).json({ success: true, payout });
});
