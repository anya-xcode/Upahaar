import Pincode from '../models/Pincode.js';
import DeliveryZone from '../models/DeliveryZone.js';
import Banner from '../models/Banner.js';
import Category from '../models/Category.js';
import Occasion from '../models/Occasion.js';
import Coupon from '../models/Coupon.js';
import Faq from '../models/Faq.js';
import BlogPost from '../models/BlogPost.js';
import Seller from '../models/Seller.js';
import Product from '../models/Product.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import asyncHandler from '../utils/asyncHandler.js';
import { notifySeller } from '../services/notificationService.js';
import { invalidateAnalytics } from '../services/analyticsService.js';
import { ApiError } from '../utils/ApiError.js';
import { uniqueSlug, paginate } from '../utils/helpers.js';

/**
 * Most CMS collections are plain list/create/update/delete. Building them from
 * one factory keeps the admin API consistent and leaves the interesting code
 * (pincodes, coupons) readable below.
 */
function crud(Model, { label, slugFrom = null, searchFields = [], sort = '-createdAt', populate = null } = {}) {
  return {
    list: asyncHandler(async (req, res) => {
      const { page, limit, skip } = paginate({ ...req.query, limit: req.query.limit || 50 });
      const filter = {};

      if (req.query.q && searchFields.length) {
        const rx = new RegExp(String(req.query.q).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
        filter.$or = searchFields.map((f) => ({ [f]: rx }));
      }
      if (req.query.isActive !== undefined) filter.isActive = req.query.isActive === 'true';

      let query = Model.find(filter).sort(sort).skip(skip).limit(limit);
      if (populate) query = query.populate(populate);

      const [items, total] = await Promise.all([query.lean(), Model.countDocuments(filter)]);
      res.json({ success: true, items, total, page, pages: Math.ceil(total / limit) });
    }),

    create: asyncHandler(async (req, res) => {
      const payload = { ...req.body };
      if (slugFrom && payload[slugFrom]) payload.slug = await uniqueSlug(Model, payload[slugFrom]);
      const item = await Model.create(payload);
      res.status(201).json({ success: true, item });
    }),

    update: asyncHandler(async (req, res) => {
      const payload = { ...req.body };
      delete payload._id;
      if (slugFrom && payload[slugFrom]) payload.slug = await uniqueSlug(Model, payload[slugFrom], req.params.id);

      const item = await Model.findByIdAndUpdate(req.params.id, { $set: payload }, { new: true, runValidators: true });
      if (!item) throw new ApiError(404, `${label} not found`);
      res.json({ success: true, item });
    }),

    remove: asyncHandler(async (req, res) => {
      const item = await Model.findByIdAndDelete(req.params.id);
      if (!item) throw new ApiError(404, `${label} not found`);
      res.json({ success: true, message: `${label} deleted` });
    }),
  };
}

export const categories = crud(Category, { label: 'Category', slugFrom: 'name', searchFields: ['name'], sort: 'displayOrder name' });
export const occasions = crud(Occasion, { label: 'Occasion', slugFrom: 'name', searchFields: ['name'], sort: 'displayOrder name' });
export const banners = crud(Banner, { label: 'Banner', searchFields: ['title'], sort: 'displayOrder' });
export const faqs = crud(Faq, { label: 'FAQ', searchFields: ['question'], sort: 'displayOrder' });
export const posts = crud(BlogPost, { label: 'Post', slugFrom: 'title', searchFields: ['title'], sort: '-publishedAt' });
export const zones = crud(DeliveryZone, { label: 'Zone', searchFields: ['name', 'city'], sort: 'city name' });

/* ----------------------------- Pincode manager ---------------------------- */

/**
 * GET /api/admin/pincodes
 * Returned grouped by city, because that's how ops thinks about coverage —
 * "is South Mumbai express-enabled", not "is 400001 express-enabled".
 */
export const listPincodes = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.city) filter.city = req.query.city;
  if (req.query.q) {
    const rx = new RegExp(String(req.query.q).replace(/[^\w\s]/g, ''), 'i');
    filter.$or = [{ code: rx }, { city: rx }, { area: rx }];
  }
  if (req.query.serviceable !== undefined) filter.isServiceable = req.query.serviceable === 'true';

  const pincodes = await Pincode.find(filter).sort('city code').limit(500).lean();

  // Attach the seller count per pincode in one query rather than N.
  const sellerCounts = await Seller.aggregate([
    { $match: { status: 'ACTIVE' } },
    { $unwind: '$servedPincodes' },
    { $group: { _id: '$servedPincodes', count: { $sum: 1 } } },
  ]);
  const countMap = Object.fromEntries(sellerCounts.map((s) => [s._id, s.count]));

  const withCounts = pincodes.map((p) => ({ ...p, sellerCount: countMap[p.code] || 0 }));

  const grouped = withCounts.reduce((acc, p) => {
    (acc[p.city] ||= []).push(p);
    return acc;
  }, {});

  res.json({
    success: true,
    pincodes: withCounts,
    grouped: Object.entries(grouped).map(([city, list]) => ({
      city,
      state: list[0].state,
      total: list.length,
      express: list.filter((p) => p.express60Available).length,
      pincodes: list,
    })),
  });
});

export const createPincode = asyncHandler(async (req, res) => {
  if (await Pincode.exists({ code: req.body.code })) throw new ApiError(409, 'That PIN code already exists');

  const pincode = await Pincode.create(req.body);
  res.status(201).json({ success: true, pincode });
});

export const updatePincode = asyncHandler(async (req, res) => {
  // `code` is the identity — changing it would orphan sellers, so the patch
  // schema omits it rather than the controller deleting it after the fact.
  const pincode = await Pincode.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true, runValidators: true });
  if (!pincode) throw new ApiError(404, 'PIN code not found');
  res.json({ success: true, pincode });
});

export const deletePincode = asyncHandler(async (req, res) => {
  const pincode = await Pincode.findById(req.params.id);
  if (!pincode) throw new ApiError(404, 'PIN code not found');

  const sellersServing = await Seller.countDocuments({ servedPincodes: pincode.code });
  if (sellersServing > 0) {
    throw new ApiError(
      400,
      `${sellersServing} seller(s) still serve ${pincode.code}. Mark it unserviceable instead of deleting it.`
    );
  }

  await pincode.deleteOne();
  res.json({ success: true, message: 'PIN code removed' });
});

/** GET /api/admin/pincodes/:code/detail — who serves it and how fast. */
export const pincodeDetail = asyncHandler(async (req, res) => {
  const pincode = await Pincode.findOne({ code: req.params.code }).lean();
  if (!pincode) throw new ApiError(404, 'PIN code not found');

  const sellers = await Seller.find({ servedPincodes: pincode.code })
    .select('businessName slug status rating deliveryRadiusKm acceptsExpress address workingHours')
    .lean();

  const zone = await DeliveryZone.findOne({ pincodes: pincode.code }).lean();
  const productCount = await Product.countDocuments({
    seller: { $in: sellers.map((s) => s._id) },
    isActive: true,
  });

  res.json({ success: true, pincode, sellers, zone, productCount });
});

/* --------------------------------- Coupons -------------------------------- */

export const listCoupons = asyncHandler(async (req, res) => {
  const { page, limit, skip } = paginate({ ...req.query, limit: req.query.limit || 30 });
  const filter = {};
  if (req.query.q) filter.code = new RegExp(String(req.query.q).toUpperCase(), 'i');
  if (req.query.isActive !== undefined) filter.isActive = req.query.isActive === 'true';

  const [coupons, total] = await Promise.all([
    Coupon.find(filter)
      .populate('categories', 'name icon')
      .populate('sellers', 'businessName')
      .sort('-createdAt')
      .skip(skip)
      .limit(limit)
      .lean(),
    Coupon.countDocuments(filter),
  ]);

  res.json({ success: true, coupons, total, page, pages: Math.ceil(total / limit) });
});

export const createCoupon = asyncHandler(async (req, res) => {
  const { code } = req.body;
  if (await Coupon.exists({ code })) throw new ApiError(409, 'That coupon code already exists');

  const coupon = await Coupon.create(req.body);
  res.status(201).json({ success: true, coupon });
});

export const updateCoupon = asyncHandler(async (req, res) => {
  // The schema is an allow-list, so `usageCount` and `usedBy` cannot be edited
  // from here — a redemption tally is ours to keep, not an admin's to reset.
  const coupon = await Coupon.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true, runValidators: true });
  if (!coupon) throw new ApiError(404, 'Coupon not found');
  res.json({ success: true, coupon });
});

export const deleteCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findByIdAndDelete(req.params.id);
  if (!coupon) throw new ApiError(404, 'Coupon not found');
  res.json({ success: true, message: 'Coupon deleted' });
});

/* ------------------------------ Notifications ----------------------------- */

/** GET /api/admin/notifications — the admin's own inbox. */
export const adminNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.find({ recipient: req.user._id }).sort('-createdAt').limit(50).lean();
  res.json({ success: true, notifications, unread: notifications.filter((n) => !n.isRead).length });
});

/** POST /api/admin/notifications/broadcast — announce to a whole role. */
export const broadcast = asyncHandler(async (req, res) => {
  const { audience, title, body, icon, link } = req.body;

  const recipients = await User.find({ role: audience, isActive: true }).select('_id').lean();
  if (!recipients.length) throw new ApiError(400, 'No recipients for that audience');

  await Notification.insertMany(
    recipients.map((r) => ({
      recipient: r._id,
      audience,
      title,
      body,
      icon: icon || 'broadcast',
      type: 'PROMO',
      link,
    }))
  );

  res.status(201).json({ success: true, sent: recipients.length });
});

/** GET /api/admin/products — platform-wide product moderation. */
export const listAllProducts = asyncHandler(async (req, res) => {
  const { page, limit, skip } = paginate({ ...req.query, limit: req.query.limit || 20 });
  const filter = {};
  if (req.query.q) filter.name = new RegExp(String(req.query.q).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
  if (req.query.seller) filter.seller = req.query.seller;
  if (req.query.category) filter.category = req.query.category;
  if (req.query.isActive !== undefined) filter.isActive = req.query.isActive === 'true';
  if (req.query.approval) filter.approvalStatus = req.query.approval;

  const [products, total] = await Promise.all([
    Product.find(filter)
      .populate('seller', 'businessName slug status')
      .populate('category', 'name icon')
      .sort('-createdAt')
      .skip(skip)
      .limit(limit)
      .lean(),
    Product.countDocuments(filter),
  ]);

  const counts = await Product.aggregate([{ $group: { _id: '$approvalStatus', count: { $sum: 1 } } }]);

  res.json({
    success: true,
    products,
    total,
    page,
    pages: Math.ceil(total / limit),
    counts: Object.fromEntries(counts.map((c) => [c._id, c.count])),
  });
});

/**
 * PATCH /api/admin/products/:id/approval
 *
 * The review gate. Approving publishes the product to the storefront;
 * rejecting keeps it invisible to shoppers but leaves it editable by its
 * seller, who is told why.
 */
export const reviewProduct = asyncHandler(async (req, res) => {
  const { approvalStatus, note } = req.body;

  const product = await Product.findById(req.params.id).populate('seller', 'user businessName');
  if (!product) throw new ApiError(404, 'Product not found');

  product.approvalStatus = approvalStatus;
  product.approvalNote = note;
  product.reviewedAt = new Date();
  await product.save();

  if (product.seller?.user) {
    const copy = {
      APPROVED: { title: 'Product approved', body: `"${product.name}" is now live on the store.`, icon: 'check' },
      REJECTED: { title: 'Product needs changes', body: note || `"${product.name}" was not approved.`, icon: 'warning' },
      PENDING: { title: 'Product back under review', body: `"${product.name}" is being reviewed again.`, icon: 'box' },
    }[approvalStatus];

    await notifySeller(product.seller.user, {
      ...copy,
      type: 'GENERAL',
      link: '/seller/products',
      meta: { productId: product._id },
    });
  }

  invalidateAnalytics();
  res.json({ success: true, product });
});

/** PATCH /api/admin/products/:id — admin can only flag/unflag, not edit content. */
export const toggleProductActive = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw new ApiError(404, 'Product not found');

  if (req.body.isFeatured !== undefined) product.isFeatured = req.body.isFeatured;
  if (req.body.isBestSeller !== undefined) product.isBestSeller = req.body.isBestSeller;
  if (req.body.isActive !== undefined) product.isActive = req.body.isActive;

  await product.save();

  invalidateAnalytics();
  res.json({ success: true, product });
});
