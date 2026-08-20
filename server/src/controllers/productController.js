import Product from '../models/Product.js';
import Review from '../models/Review.js';
import Seller from '../models/Seller.js';
import asyncHandler from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { paginate } from '../utils/helpers.js';
import { queryProducts, groupByTier, resolveLocation } from '../services/catalogService.js';
import { attachAvailability } from '../services/deliveryEngine.js';
import { PRICE_BUCKETS, SORT_OPTIONS, TIER_META, TIER_ORDER } from '../utils/constants.js';

/** GET /api/products — the search + filter endpoint behind the listing page. */
export const listProducts = asyncHandler(async (req, res) => {
  const { page, limit } = paginate(req.query);
  const pincode = req.query.pincode || req.user?.defaultPincode;
  const result = await queryProducts({ pincode, query: req.query, page, limit });
  res.json({ success: true, ...result });
});

/**
 * GET /api/products/feed — the homepage.
 * Products bucketed into the four delivery tiers for this pincode.
 */
export const productFeed = asyncHandler(async (req, res) => {
  const pincode = req.query.pincode || req.user?.defaultPincode;
  const groups = await groupByTier({ pincode, perTier: Number(req.query.perTier) || 8 });

  const [featured, bestSellers, personalized] = await Promise.all([
    queryProducts({ pincode, query: { featured: 'true', sort: 'popular' }, page: 1, limit: 8 }),
    queryProducts({ pincode, query: { bestSeller: 'true', sort: 'popular' }, page: 1, limit: 8 }),
    queryProducts({ pincode, query: { personalizable: 'true', sort: 'rating' }, page: 1, limit: 8 }),
  ]);

  res.json({
    success: true,
    pincode: pincode || null,
    location: featured.location,
    servesPincode: featured.servesPincode,
    groups,
    featured: featured.products,
    bestSellers: bestSellers.products,
    personalized: personalized.products,
  });
});

/** GET /api/products/filters — everything the filter rail needs to render. */
export const filterOptions = asyncHandler(async (_req, res) => {
  const sellers = await Seller.find({ status: 'ACTIVE' }).select('businessName slug rating').sort('businessName').limit(50);
  res.json({
    success: true,
    tiers: TIER_ORDER.map((t) => TIER_META[t]),
    priceBuckets: PRICE_BUCKETS.map(({ key, label }) => ({ key, label })),
    sortOptions: SORT_OPTIONS,
    sellers,
  });
});

/** GET /api/products/:slug — product detail, resolved for the customer's pincode. */
export const getProduct = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ slug: req.params.slug, isActive: true })
    .populate('seller')
    .populate('category', 'name slug icon')
    .populate('occasions', 'name slug icon');

  if (!product) throw new ApiError(404, 'That gift is no longer available');

  const pincode = req.query.pincode || req.user?.defaultPincode;
  const { pincodeDoc, zone } = await resolveLocation(pincode);
  const decorated = attachAvailability(product, { seller: product.seller, pincodeDoc, zone });

  const [reviews, related] = await Promise.all([
    Review.find({ product: product._id, status: 'APPROVED' }).sort('-createdAt').limit(10),
    queryProducts({
      pincode,
      query: { category: String(product.category._id), sort: 'popular' },
      page: 1,
      limit: 8,
    }),
  ]);

  // Fire-and-forget: a view counter should never slow the page down.
  Product.updateOne({ _id: product._id }, { $inc: { viewCount: 1 } }).catch(() => {});

  res.json({
    success: true,
    product: decorated,
    reviews,
    related: related.products.filter((p) => String(p._id) !== String(product._id)).slice(0, 4),
    location: pincodeDoc ? { code: pincodeDoc.code, city: pincodeDoc.city, state: pincodeDoc.state } : null,
  });
});

/** GET /api/products/search/suggest?q= — typeahead for the header search. */
export const suggest = asyncHandler(async (req, res) => {
  const q = String(req.query.q || '').trim();
  if (q.length < 2) return res.json({ success: true, suggestions: [] });

  const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
  const products = await Product.find({ isActive: true, $or: [{ name: rx }, { tags: rx }] })
    .select('name slug images price')
    .limit(8)
    .lean();

  res.json({ success: true, suggestions: products });
});
