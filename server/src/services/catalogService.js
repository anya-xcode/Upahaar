import Product from '../models/Product.js';
import Pincode from '../models/Pincode.js';
import DeliveryZone from '../models/DeliveryZone.js';
import { attachAvailability } from './deliveryEngine.js';
import { TIER_META, TIER_ORDER, PRICE_BUCKETS } from '../utils/constants.js';

/**
 * Loads the serviceability context for a pincode once, so a listing of 40
 * products doesn't hit the database 40 times for the same two documents.
 */
export async function resolveLocation(pincode) {
  if (!pincode) return { pincodeDoc: null, zone: null };
  const code = String(pincode).trim();
  const pincodeDoc = await Pincode.findOne({ code });
  if (!pincodeDoc) return { pincodeDoc: null, zone: null };
  const zone = await DeliveryZone.findOne({ pincodes: code, isActive: true });
  return { pincodeDoc, zone };
}

/** Translates the query string filters into a Mongo query. */
function buildMongoQuery(query) {
  const filter = { isActive: true };

  if (query.category) filter.category = query.category;
  if (query.occasion) filter.occasions = query.occasion;
  if (query.seller) filter.seller = query.seller;
  if (query.personalizable === 'true') filter.personalizable = true;
  if (query.featured === 'true') filter.isFeatured = true;
  if (query.bestSeller === 'true') filter.isBestSeller = true;
  if (query.rating) filter.rating = { $gte: Number(query.rating) };

  const min = query.minPrice ? Number(query.minPrice) : null;
  const max = query.maxPrice ? Number(query.maxPrice) : null;
  const bucket = query.priceBucket ? PRICE_BUCKETS.find((b) => b.key === query.priceBucket) : null;
  const lo = bucket ? bucket.min : min;
  const hi = bucket ? bucket.max : max;
  if (lo != null || hi != null) {
    filter.price = {};
    if (lo != null) filter.price.$gte = lo;
    if (hi != null && hi !== Number.MAX_SAFE_INTEGER) filter.price.$lte = hi;
  }

  if (query.q) {
    const rx = new RegExp(String(query.q).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = [{ name: rx }, { description: rx }, { tags: rx }];
  }

  return filter;
}

const SORTERS = {
  'price-asc': (a, b) => a.price - b.price,
  'price-desc': (a, b) => b.price - a.price,
  rating: (a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount,
  newest: (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
  fastest: (a, b) => (a.availability?.etaMinutes ?? 1e9) - (b.availability?.etaMinutes ?? 1e9),
  popular: (a, b) => b.soldCount - a.soldCount || b.rating - a.rating,
};

/**
 * The one query the storefront uses everywhere.
 *
 * Availability depends on the customer's pincode, live stock, seller hours and
 * distance — none of which can be expressed as a Mongo filter — so we narrow
 * hard in the database first, then classify the survivors in memory. At
 * catalogue sizes beyond a few thousand active products this is the place to
 * introduce a precomputed seller×pincode coverage collection.
 */
export async function queryProducts({ pincode, query = {}, page = 1, limit = 12 }) {
  const { pincodeDoc, zone } = await resolveLocation(pincode);
  const mongoQuery = buildMongoQuery(query);

  const raw = await Product.find(mongoQuery)
    .populate('seller')
    .populate('category', 'name slug icon')
    .populate('occasions', 'name slug icon')
    .limit(600)
    .lean();

  let items = raw.map((product) =>
    attachAvailability(product, { seller: product.seller, pincodeDoc, zone })
  );

  // Without a pincode we still show the catalogue, just without promises.
  if (pincodeDoc) {
    items = items.filter((p) => p.availability.deliverable);
    if (query.tier) {
      const tiers = String(query.tier).split(',');
      items = items.filter((p) => tiers.includes(p.tier));
    }
  }

  const sortKey = query.sort || 'popular';
  items.sort(SORTERS[sortKey] || SORTERS.popular);

  const total = items.length;
  const start = (page - 1) * limit;

  return {
    products: items.slice(start, start + limit),
    total,
    page,
    limit,
    pages: Math.max(1, Math.ceil(total / limit)),
    servesPincode: Boolean(pincodeDoc?.isServiceable),
    location: pincodeDoc
      ? { code: pincodeDoc.code, city: pincodeDoc.city, state: pincodeDoc.state, area: pincodeDoc.area }
      : null,
  };
}

/**
 * The homepage payload: everything deliverable to this pincode, bucketed by
 * how fast it can get there.
 */
export async function groupByTier({ pincode, perTier = 8, query = {} }) {
  const { products } = await queryProducts({ pincode, query, page: 1, limit: 600 });

  const groups = TIER_ORDER.map((tier) => {
    const inTier = products.filter((p) => p.tier === tier);
    return {
      ...TIER_META[tier],
      tier,
      count: inTier.length,
      products: inTier
        .slice()
        .sort((a, b) => b.soldCount - a.soldCount || b.rating - a.rating)
        .slice(0, perTier),
    };
  });

  return groups.filter((g) => g.count > 0);
}
