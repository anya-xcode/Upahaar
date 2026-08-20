import { DELIVERY_TIERS, TIER_META, TIER_ORDER } from '../utils/constants.js';

/**
 * The availability engine.
 *
 * Given a customer's pincode, this decides two things for every product:
 *   1. can it physically reach them at all, and
 *   2. how fast.
 *
 * The answer is a tier (60 min / 3 hours / tomorrow / 2–3 days) computed from
 * seller coverage, distance, stock, working hours, preparation time and rider
 * availability — never from a field somebody typed in by hand.
 */

const AVG_CITY_SPEED_KMPH = 20; // realistic door-to-door speed through Indian city traffic
const MINUTES_PER_DAY = 24 * 60;

/** Great-circle distance in km. */
export function haversineKm(a, b) {
  if (!a?.lat || !a?.lng || !b?.lat || !b?.lng) return null;
  const R = 6371;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function parseClock(hhmm, fallback) {
  const [h, m] = String(hhmm ?? fallback).split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return h * 60 + m;
}

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * How long until this seller can actually start working on an order.
 * Zero if they're open right now; otherwise the wait until they next open.
 * Returns Infinity if they never open (misconfigured seller).
 */
export function minutesUntilSellerCanStart(seller, now = new Date()) {
  const openMin = parseClock(seller?.workingHours?.open, '09:00');
  const closeMin = parseClock(seller?.workingHours?.close, '21:00');
  const workingDays = seller?.workingDays?.length ? seller.workingDays : [0, 1, 2, 3, 4, 5, 6];

  if (openMin === null || closeMin === null || closeMin <= openMin) return Infinity;

  for (let offset = 0; offset <= 7; offset += 1) {
    const day = new Date(now.getTime() + offset * MINUTES_PER_DAY * 60000);
    if (!workingDays.includes(day.getDay())) continue;

    const base = startOfDay(day).getTime();
    const opensAt = base + openMin * 60000;
    const closesAt = base + closeMin * 60000;

    if (now.getTime() >= opensAt && now.getTime() < closesAt) return 0; // open right now
    if (opensAt > now.getTime()) return Math.round((opensAt - now.getTime()) / 60000);
  }
  return Infinity;
}

function rankOf(tier) {
  return TIER_META[tier]?.rank ?? TIER_ORDER.length - 1;
}

function tierFromRank(rank) {
  return TIER_ORDER[Math.min(rank, TIER_ORDER.length - 1)];
}

/** Turn a raw minutes-from-now estimate into the tier it naturally falls into. */
function rankFromEta(etaMinutes, now) {
  if (etaMinutes <= 60) return 0;
  if (etaMinutes <= 180) return 1;

  // "Tomorrow" means it lands before the end of the next calendar day — a
  // 20-hour ETA at 8am today is still today, not tomorrow.
  const arrival = new Date(now.getTime() + etaMinutes * 60000);
  const endOfTomorrow = startOfDay(now);
  endOfTomorrow.setDate(endOfTomorrow.getDate() + 2);
  if (arrival < endOfTomorrow) return 2;
  return 3;
}

/**
 * Ceilings imposed by the admin's pincode configuration. If ops has switched
 * off 60-minute delivery for an area, nothing in it can rank better than 3h.
 */
function pincodeFloorRank(pincodeDoc, zone) {
  let floor = 0;
  const ridersOnShift = zone ? zone.activeRiders > 0 && zone.express60Enabled !== false : true;
  if (!pincodeDoc?.express60Available || !ridersOnShift) floor = Math.max(floor, 1);
  if (!pincodeDoc?.priority3hAvailable) floor = Math.max(floor, 2);
  if (pincodeDoc && pincodeDoc.nextDayAvailable === false) floor = Math.max(floor, 3);
  return floor;
}

/**
 * The single source of truth for "can this product reach this pincode, and when".
 *
 * @returns {{deliverable: boolean, tier: string|null, etaMinutes: number|null,
 *            etaText: string, distanceKm: number|null, reason: string|null,
 *            isLocal: boolean, deliveryFee: number}}
 */
export function computeAvailability({ product, seller, pincodeDoc, zone, now = new Date() }) {
  const miss = (reason) => ({
    deliverable: false,
    tier: null,
    etaMinutes: null,
    etaText: '',
    distanceKm: null,
    reason,
    isLocal: false,
    deliveryFee: 0,
  });

  if (!product?.isActive) return miss('Product unavailable');
  if (!seller) return miss('Seller unavailable');
  if (seller.status !== 'ACTIVE') return miss('Seller not accepting orders');
  if (!pincodeDoc || !pincodeDoc.isServiceable) return miss('We do not deliver to this pincode yet');
  if (product.stock <= 0) return miss('Out of stock');

  const servesPincode = (seller.servedPincodes || []).includes(pincodeDoc.code);
  const distanceKm = haversineKm(seller.location, pincodeDoc.location);
  const withinRadius = distanceKm === null ? servesPincode : distanceKm <= (seller.deliveryRadiusKm ?? 10);
  const isLocal = servesPincode && withinRadius;

  // --- Out-of-area: courier it, unless it can't survive the trip ---
  if (!isLocal) {
    if (product.isPerishable) {
      return miss('Too far for a fresh delivery — this one is made near the customer');
    }
    if (!pincodeDoc.standardAvailable) return miss('Shipping unavailable to this pincode');
    const tier = DELIVERY_TIERS.STANDARD_2_3D;
    return {
      deliverable: true,
      tier,
      etaMinutes: TIER_META[tier].maxMinutes,
      etaText: TIER_META[tier].eta,
      distanceKm: distanceKm === null ? null : Math.round(distanceKm * 10) / 10,
      reason: null,
      isLocal: false,
      deliveryFee: resolveFee(tier, pincodeDoc),
    };
  }

  // --- Local: work out when a rider could actually be at the door ---
  const waitForOpen = minutesUntilSellerCanStart(seller, now);
  if (!Number.isFinite(waitForOpen)) return miss('Seller store hours not configured');

  const prep = product.prepTimeMinutes ?? 45;
  const dispatch = seller.dispatchBufferMinutes ?? 10;
  const travel = distanceKm === null ? 20 : Math.max(8, Math.round((distanceKm / AVG_CITY_SPEED_KMPH) * 60));

  const etaMinutes = waitForOpen + prep + dispatch + travel;

  // Take the *worst* of what the clock allows, what the seller promised for
  // this product, and what ops permits in this area.
  let rank = rankFromEta(etaMinutes, now);
  rank = Math.max(rank, rankOf(product.baseTier));
  rank = Math.max(rank, pincodeFloorRank(pincodeDoc, zone));
  if (!seller.acceptsExpress) rank = Math.max(rank, 1);

  const tier = tierFromRank(rank);

  return {
    deliverable: true,
    tier,
    etaMinutes: rank === 0 ? etaMinutes : TIER_META[tier].maxMinutes,
    etaText: rank === 0 ? `Delivery in ~${Math.max(30, Math.round(etaMinutes / 5) * 5)} min` : TIER_META[tier].eta,
    distanceKm: distanceKm === null ? null : Math.round(distanceKm * 10) / 10,
    reason: null,
    isLocal: true,
    deliveryFee: resolveFee(tier, pincodeDoc),
  };
}

/** Pincode-level fee override wins over the tier default when ops has set one. */
export function resolveFee(tier, pincodeDoc) {
  if (!pincodeDoc) return TIER_META[tier]?.shippingFee ?? 0;
  if (tier === DELIVERY_TIERS.EXPRESS_60 && pincodeDoc.expressFee != null) return pincodeDoc.expressFee;
  if (tier === DELIVERY_TIERS.PRIORITY_3H && pincodeDoc.priorityFee != null) return pincodeDoc.priorityFee;
  if (
    (tier === DELIVERY_TIERS.NEXT_DAY || tier === DELIVERY_TIERS.STANDARD_2_3D) &&
    pincodeDoc.standardFee != null
  ) {
    return pincodeDoc.standardFee;
  }
  return TIER_META[tier]?.shippingFee ?? 0;
}

/** Concrete timestamp a customer can be promised, used on the order record. */
export function estimateDeliveryAt(tier, now = new Date()) {
  const map = {
    [DELIVERY_TIERS.EXPRESS_60]: 55,
    [DELIVERY_TIERS.PRIORITY_3H]: 170,
    [DELIVERY_TIERS.NEXT_DAY]: MINUTES_PER_DAY,
    [DELIVERY_TIERS.STANDARD_2_3D]: MINUTES_PER_DAY * 3,
  };
  return new Date(now.getTime() + (map[tier] ?? MINUTES_PER_DAY) * 60000);
}

/**
 * Which delivery options a checkout may offer for a pincode, given the fastest
 * tier every item in the cart can actually support.
 */
export function availableCheckoutOptions({ pincodeDoc, zone, slowestItemTier }) {
  const floor = Math.max(pincodeFloorRank(pincodeDoc, zone), rankOf(slowestItemTier));
  return TIER_ORDER.filter((tier) => rankOf(tier) >= floor).map((tier) => ({
    tier,
    ...TIER_META[tier],
    fee: resolveFee(tier, pincodeDoc),
  }));
}

/**
 * Decorate a product with its availability for a pincode.
 * Also fills in the price/stock derivations, which `.lean()` queries drop
 * because they are schema virtuals.
 */
export function attachAvailability(product, { seller, pincodeDoc, zone, now = new Date() }) {
  const availability = computeAvailability({ product, seller, pincodeDoc, zone, now });
  const plain = typeof product.toObject === 'function' ? product.toObject({ virtuals: true }) : { ...product };

  return {
    ...plain,
    discountPercent:
      plain.mrp && plain.mrp > plain.price ? Math.round(((plain.mrp - plain.price) / plain.mrp) * 100) : 0,
    inStock: plain.stock > 0,
    isLowStock: plain.stock > 0 && plain.stock <= (plain.lowStockThreshold ?? 5),
    availability,
    tier: availability.tier,
    tierMeta: availability.tier ? TIER_META[availability.tier] : null,
  };
}

export { TIER_META, TIER_ORDER, DELIVERY_TIERS };
