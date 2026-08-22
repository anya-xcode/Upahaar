import Product from '../models/Product.js';
import Seller from '../models/Seller.js';
import Pincode from '../models/Pincode.js';
import DeliveryZone from '../models/DeliveryZone.js';
import { attachAvailability, haversineKm } from './deliveryEngine.js';
import { TIER_META, TIER_ORDER, PRICE_BUCKETS, DELIVERY_TIERS } from '../utils/constants.js';
import cache from '../utils/cache.js';

/**
 * The catalogue.
 *
 * A delivery tier depends on (product, seller, pincode, clock), which no Mongo
 * filter can express — but *deliverability* almost entirely can, and that is
 * what makes this scale.
 *
 * For any pincode the catalogue splits cleanly in two:
 *
 *   LOCAL    products from sellers who cover the pincode and are inside their
 *            own delivery radius. Bounded by that seller set, so we can afford
 *            to load them and compute a real tier for each.
 *
 *   SHIPPED  everything else that is non-perishable. These are *always*
 *            STANDARD_2_3D, so no per-product computation is needed and they
 *            can be counted, sorted and paginated entirely inside Mongo.
 *
 * The two halves are merged as sorted streams, taking only the page asked for.
 * Nothing loads the whole catalogue, and nothing is silently truncated.
 */

/* ------------------------------- location ------------------------------- */

/**
 * Serviceability context for a pincode. Cached briefly — a listing of 40
 * products used to re-read the same two documents on every request, and ops
 * changes still take effect within seconds.
 */
export async function resolveLocation(pincode) {
  if (!pincode) return { pincodeDoc: null, zone: null };
  const code = String(pincode).trim();

  return cache.wrap(`loc:${code}`, 30_000, async () => {
    const pincodeDoc = await Pincode.findOne({ code }).lean();
    if (!pincodeDoc) return { pincodeDoc: null, zone: null };
    const zone = await DeliveryZone.findOne({ pincodes: code, isActive: true }).lean();
    return { pincodeDoc, zone };
  });
}

/**
 * Sellers who both list this pincode and are close enough to actually serve
 * it. This is the pivot the whole query turns on; the seller collection is
 * small and slow-changing, so it is cached.
 */
export async function localSellersFor(pincodeDoc) {
  if (!pincodeDoc) return [];

  return cache.wrap(`sellers:${pincodeDoc.code}`, 30_000, async () => {
    const candidates = await Seller.find({ servedPincodes: pincodeDoc.code, status: 'ACTIVE' })
      .select('_id location deliveryRadiusKm')
      .lean();

    return candidates
      .filter((s) => {
        const d = haversineKm(s.location, pincodeDoc.location);
        return d === null ? true : d <= (s.deliveryRadiusKm ?? 10);
      })
      .map((s) => s._id);
  });
}

/* -------------------------------- filters ------------------------------- */

/** User-supplied filters, shared by both halves of the query. */
function buildBaseFilter(query) {
  const filter = { isActive: true, approvalStatus: 'APPROVED' };

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

/**
  * Classifying a product needs its seller and nothing else. Category and
  * occasion are only needed for the handful we actually render, so they are
  * populated after the page is chosen — not across every candidate.
  */
const SELLER_POPULATE = [
  {
    path: 'seller',
    select: 'businessName slug status location deliveryRadiusKm servedPincodes workingHours workingDays dispatchBufferMinutes acceptsExpress rating reviewCount address',
  },
];

const DISPLAY_POPULATE = [
  { path: 'category', select: 'name slug icon' },
  { path: 'occasions', select: 'name slug icon' },
];

/** Hydrate display-only refs for the products actually being returned. */
async function hydrate(products) {
  if (!products.length) return products;
  await Product.populate(products, DISPLAY_POPULATE);
  return products;
}

/** Mongo sort specs — `_id` breaks ties so pagination is stable. */
const MONGO_SORT = {
  'price-asc': { price: 1, _id: 1 },
  'price-desc': { price: -1, _id: 1 },
  rating: { rating: -1, reviewCount: -1, _id: 1 },
  newest: { createdAt: -1, _id: 1 },
  popular: { soldCount: -1, rating: -1, _id: 1 },
  fastest: { soldCount: -1, _id: 1 }, // tier ordering is applied during the merge
};

const cmpId = (a, b) => String(a._id).localeCompare(String(b._id));

/** The same orderings as comparators, for merging the two streams. */
const COMPARATORS = {
  'price-asc': (a, b) => a.price - b.price || cmpId(a, b),
  'price-desc': (a, b) => b.price - a.price || cmpId(a, b),
  rating: (a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount || cmpId(a, b),
  newest: (a, b) => new Date(b.createdAt) - new Date(a.createdAt) || cmpId(a, b),
  popular: (a, b) => b.soldCount - a.soldCount || b.rating - a.rating || cmpId(a, b),
  fastest: (a, b) =>
    (TIER_META[a.tier]?.rank ?? 9) - (TIER_META[b.tier]?.rank ?? 9) ||
    (a.availability?.etaMinutes ?? 1e9) - (b.availability?.etaMinutes ?? 1e9) ||
    cmpId(a, b),
};

/**
 * Guard rail on the local half. A single pincode's sellers could in principle
 * hold an enormous catalogue; hitting this is logged rather than silently
 * truncated, because a silent cap is how a catalogue goes missing.
 */
const LOCAL_SCAN_CAP = 5000;

async function loadLocal({ base, localIds, pincodeDoc, zone, now, populate = SELLER_POPULATE }) {
  if (!localIds.length) return [];

  const docs = await Product.find({ ...base, stock: { $gt: 0 }, seller: { $in: localIds } })
    .populate(populate)
    .limit(LOCAL_SCAN_CAP)
    .lean();

  if (docs.length === LOCAL_SCAN_CAP) {
    console.warn(
      `[catalogue] local scan cap reached for ${pincodeDoc.code} — time for a precomputed coverage collection`
    );
  }

  return docs
    .map((p) => attachAvailability(p, { seller: p.seller, pincodeDoc, zone, now }))
    .filter((p) => p.availability.deliverable);
}

function shippedFilterFor(base, localIds) {
  return {
    ...base,
    stock: { $gt: 0 },
    isPerishable: false,
    ...(localIds.length ? { seller: { $nin: localIds } } : {}),
  };
}

/* --------------------------------- query -------------------------------- */

export async function queryProducts({ pincode, query = {}, page = 1, limit = 12 }) {
  const { pincodeDoc, zone } = await resolveLocation(pincode);
  const base = buildBaseFilter(query);
  const sortKey = MONGO_SORT[query.sort] ? query.sort : 'popular';
  const skip = (page - 1) * limit;

  // Without a location we cannot promise anything — just page the catalogue.
  if (!pincodeDoc) {
    const [docs, total] = await Promise.all([
      Product.find(base).populate(SELLER_POPULATE).sort(MONGO_SORT[sortKey]).skip(skip).limit(limit).lean(),
      Product.countDocuments(base),
    ]);
    return {
      products: await hydrate(docs.map((p) => attachAvailability(p, { seller: p.seller, pincodeDoc: null, zone: null }))),
      total,
      page,
      limit,
      pages: Math.max(1, Math.ceil(total / limit)),
      servesPincode: false,
      location: null,
    };
  }

  const localIds = await localSellersFor(pincodeDoc);
  const now = new Date();

  let local = await loadLocal({ base, localIds, pincodeDoc, zone, now });

  const wantedTiers = query.tier ? String(query.tier).split(',') : null;
  if (wantedTiers) local = local.filter((p) => wantedTiers.includes(p.tier));

  const shippedWanted =
    pincodeDoc.standardAvailable !== false &&
    (!wantedTiers || wantedTiers.includes(DELIVERY_TIERS.STANDARD_2_3D));

  const shippedFilter = shippedFilterFor(base, localIds);
  const [shippedTotal, shippedDocs] = shippedWanted
    ? await Promise.all([
        Product.countDocuments(shippedFilter),
        // Only ever read as deep as the requested page needs.
        Product.find(shippedFilter).populate(SELLER_POPULATE).sort(MONGO_SORT[sortKey]).limit(skip + limit).lean(),
      ])
    : [0, []];

  const shipped = shippedDocs.map((p) => attachAvailability(p, { seller: p.seller, pincodeDoc, zone, now }));

  const compare = COMPARATORS[sortKey] || COMPARATORS.popular;
  local.sort(compare);
  const merged = mergeSorted(local, shipped, compare, skip + limit);
  const total = local.length + shippedTotal;

  return {
    products: await hydrate(merged.slice(skip, skip + limit)),
    total,
    page,
    limit,
    pages: Math.max(1, Math.ceil(total / limit)),
    servesPincode: Boolean(pincodeDoc.isServiceable),
    location: {
      code: pincodeDoc.code,
      city: pincodeDoc.city,
      state: pincodeDoc.state,
      area: pincodeDoc.area,
    },
  };
}

/** Two-way merge of sorted streams, stopping as soon as we have enough. */
function mergeSorted(a, b, compare, need) {
  const out = [];
  let i = 0;
  let j = 0;
  while (out.length < need && (i < a.length || j < b.length)) {
    if (i >= a.length) out.push(b[j++]);
    else if (j >= b.length) out.push(a[i++]);
    else out.push(compare(a[i], b[j]) <= 0 ? a[i++] : b[j++]);
  }
  return out;
}

/**
 * The homepage: the best few gifts in each tier.
 *
 * Fast tiers can only come from local sellers, so this never reads the shipped
 * half beyond topping up the standard group.
 */
export async function groupByTier({ pincode, perTier = 8, query = {} }) {
  const { pincodeDoc, zone } = await resolveLocation(pincode);
  if (!pincodeDoc) return [];

  const base = buildBaseFilter(query);
  const localIds = await localSellersFor(pincodeDoc);
  const now = new Date();

  const local = await loadLocal({ base, localIds, pincodeDoc, zone, now });

  const byTier = Object.fromEntries(TIER_ORDER.map((t) => [t, []]));
  for (const p of local) byTier[p.tier].push(p);

  let shippedTotal = 0;
  if (pincodeDoc.standardAvailable !== false) {
    const filter = shippedFilterFor(base, localIds);
    const [count, docs] = await Promise.all([
      Product.countDocuments(filter),
      Product.find(filter).populate(SELLER_POPULATE).sort(MONGO_SORT.popular).limit(perTier).lean(),
    ]);
    shippedTotal = count;
    byTier[DELIVERY_TIERS.STANDARD_2_3D].push(
      ...docs.map((p) => attachAvailability(p, { seller: p.seller, pincodeDoc, zone, now }))
    );
  }

  const groups = TIER_ORDER.map((tier) => {
    const inTier = byTier[tier].sort(COMPARATORS.popular);
    const localCount = tier === DELIVERY_TIERS.STANDARD_2_3D ? inTier.length - Math.min(perTier, shippedTotal) : inTier.length;
    return {
      ...TIER_META[tier],
      tier,
      count: tier === DELIVERY_TIERS.STANDARD_2_3D ? Math.max(localCount, 0) + shippedTotal : localCount,
      products: inTier.slice(0, perTier),
    };
  }).filter((g) => g.products.length > 0);

  await hydrate(groups.flatMap((g) => g.products));
  return groups;
}

/**
 * How many gifts land in each tier for a pincode — the number behind
 * "Great! We deliver to 110016". Counts rather than loads: only the local half
 * is classified, and the shipped half is a single countDocuments.
 */
export async function tierCountsFor(pincodeDoc, zone) {
  const base = { isActive: true, approvalStatus: 'APPROVED' };
  const localIds = await localSellersFor(pincodeDoc);
  const now = new Date();

  const local = await loadLocal({
    base,
    localIds,
    pincodeDoc,
    zone,
    now,
    populate: [{ path: 'seller' }],
  });

  const counts = Object.fromEntries(TIER_ORDER.map((t) => [t, 0]));
  for (const p of local) counts[p.tier] += 1;

  if (pincodeDoc.standardAvailable !== false) {
    counts[DELIVERY_TIERS.STANDARD_2_3D] += await Product.countDocuments(
      shippedFilterFor(base, localIds)
    );
  }

  return counts;
}

/**
 * Everything the homepage needs, from a single pass over the local catalogue.
 *
 * The feed previously ran four independent queries — the tier groups plus
 * featured, best-seller and personalised rails — and each one rescanned and
 * reclassified the same local products. They are all views over one set, so
 * this loads it once and derives the rest.
 */
export async function buildFeed({ pincode, perTier = 8, railSize = 8 }) {
  const { pincodeDoc, zone } = await resolveLocation(pincode);

  if (!pincodeDoc) {
    return { groups: [], featured: [], bestSellers: [], personalized: [], location: null, servesPincode: false };
  }

  const base = buildBaseFilter({});
  const localIds = await localSellersFor(pincodeDoc);
  const now = new Date();

  const local = await loadLocal({ base, localIds, pincodeDoc, zone, now });

  // Shipped half: one count and one small page, reused by every rail below.
  const shippedFilter = shippedFilterFor(base, localIds);
  let shippedTotal = 0;
  let shipped = [];
  if (pincodeDoc.standardAvailable !== false) {
    const [count, docs] = await Promise.all([
      Product.countDocuments(shippedFilter),
      Product.find(shippedFilter)
        .populate(SELLER_POPULATE)
        .sort(MONGO_SORT.popular)
        .limit(Math.max(perTier, railSize) * 3)
        .lean(),
    ]);
    shippedTotal = count;
    shipped = docs.map((p) => attachAvailability(p, { seller: p.seller, pincodeDoc, zone, now }));
  }

  const everything = [...local, ...shipped];

  const byTier = Object.fromEntries(TIER_ORDER.map((t) => [t, []]));
  for (const p of local) byTier[p.tier].push(p);
  byTier[DELIVERY_TIERS.STANDARD_2_3D].push(...shipped);

  const groups = TIER_ORDER.map((tier) => {
    const inTier = byTier[tier].sort(COMPARATORS.popular);
    const localOnly = tier === DELIVERY_TIERS.STANDARD_2_3D ? inTier.length - shipped.length : inTier.length;
    return {
      ...TIER_META[tier],
      tier,
      count: tier === DELIVERY_TIERS.STANDARD_2_3D ? Math.max(localOnly, 0) + shippedTotal : localOnly,
      products: inTier.slice(0, perTier),
    };
  }).filter((g) => g.products.length > 0);

  const rail = (predicate, compare) =>
    everything.filter(predicate).sort(compare).slice(0, railSize);

  const featured = rail((p) => p.isFeatured, COMPARATORS.popular);
  const bestSellers = rail((p) => p.isBestSeller, COMPARATORS.popular);
  const personalized = rail((p) => p.personalizable, COMPARATORS.rating);

  await hydrate([
    ...groups.flatMap((g) => g.products),
    ...featured,
    ...bestSellers,
    ...personalized,
  ]);

  return {
    groups,
    featured,
    bestSellers,
    personalized,
    servesPincode: Boolean(pincodeDoc.isServiceable),
    location: {
      code: pincodeDoc.code,
      city: pincodeDoc.city,
      state: pincodeDoc.state,
      area: pincodeDoc.area,
    },
  };
}
