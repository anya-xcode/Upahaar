import Category from '../models/Category.js';
import Occasion from '../models/Occasion.js';
import Banner from '../models/Banner.js';
import Faq from '../models/Faq.js';
import BlogPost from '../models/BlogPost.js';
import Seller from '../models/Seller.js';
import Review from '../models/Review.js';
import Coupon from '../models/Coupon.js';
import asyncHandler from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { queryProducts } from '../services/catalogService.js';

export const listCategories = asyncHandler(async (_req, res) => {
  const categories = await Category.find({ isActive: true }).sort('displayOrder name').lean();
  res.json({ success: true, categories });
});

export const listOccasions = asyncHandler(async (_req, res) => {
  const occasions = await Occasion.find({ isActive: true }).sort('displayOrder name').lean();
  res.json({ success: true, occasions });
});

/** GET /api/catalog/banners — hero + strip banners, narrowed to the pincode. */
export const listBanners = asyncHandler(async (req, res) => {
  const now = new Date();
  const pincode = req.query.pincode;

  const banners = await Banner.find({
    isActive: true,
    $and: [
      { $or: [{ startsAt: null }, { startsAt: { $lte: now } }] },
      { $or: [{ endsAt: null }, { endsAt: { $gte: now } }] },
    ],
  })
    .sort('displayOrder')
    .lean();

  res.json({
    success: true,
    banners: banners.filter((b) => !b.pincodes?.length || !pincode || b.pincodes.includes(String(pincode))),
  });
});

export const listFaqs = asyncHandler(async (_req, res) => {
  const faqs = await Faq.find({ isActive: true }).sort('displayOrder').lean();
  res.json({ success: true, faqs });
});

export const listPosts = asyncHandler(async (req, res) => {
  const filter = { isPublished: true };
  if (req.query.kind) filter.kind = req.query.kind;
  const posts = await BlogPost.find(filter).sort('-publishedAt').limit(20).lean();
  res.json({ success: true, posts });
});

export const getPost = asyncHandler(async (req, res) => {
  const post = await BlogPost.findOne({ slug: req.params.slug, isPublished: true })
    .populate('products', 'name slug price mrp images rating')
    .lean();
  if (!post) throw new ApiError(404, 'Story not found');
  res.json({ success: true, post });
});

/** GET /api/catalog/sellers — the "local sellers near you" rail. */
export const listSellers = asyncHandler(async (req, res) => {
  const filter = { status: 'ACTIVE' };
  if (req.query.pincode) filter.servedPincodes = String(req.query.pincode);
  if (req.query.featured === 'true') filter.isFeatured = true;

  const sellers = await Seller.find(filter)
    .select('businessName slug tagline description logo storeImages address rating reviewCount totalOrders isFeatured servedPincodes deliveryRadiusKm workingHours')
    .sort('-isFeatured -rating')
    .limit(Number(req.query.limit) || 12)
    .lean();

  res.json({ success: true, sellers });
});

/** GET /api/catalog/sellers/:slug — a seller's storefront. */
export const getSeller = asyncHandler(async (req, res) => {
  const seller = await Seller.findOne({ slug: req.params.slug, status: 'ACTIVE' }).lean();
  if (!seller) throw new ApiError(404, 'Store not found');

  const pincode = req.query.pincode || req.user?.defaultPincode;
  const [{ products }, reviews] = await Promise.all([
    queryProducts({ pincode, query: { seller: String(seller._id), sort: 'popular' }, page: 1, limit: 24 }),
    Review.find({ seller: seller._id, status: 'APPROVED' }).sort('-createdAt').limit(8).lean(),
  ]);

  res.json({ success: true, seller, products, reviews });
});

/** GET /api/catalog/coupons — publicly advertised offers. */
export const listPublicCoupons = asyncHandler(async (req, res) => {
  const now = new Date();
  const coupons = await Coupon.find({
    isActive: true,
    isVisible: true,
    $and: [
      { $or: [{ startsAt: null }, { startsAt: { $lte: now } }] },
      { $or: [{ expiresAt: null }, { expiresAt: { $gte: now } }] },
    ],
  })
    .select('code title description type value maxDiscount minOrderValue expiresAt pincodes')
    .sort('-createdAt')
    .lean();

  const pincode = req.query.pincode;
  res.json({
    success: true,
    coupons: coupons.filter((c) => !c.pincodes?.length || !pincode || c.pincodes.includes(String(pincode))),
  });
});
