import { describe, it, expect } from 'vitest';
import {
  computeAvailability,
  minutesUntilSellerCanStart,
  haversineKm,
  availableCheckoutOptions,
  estimateDeliveryAt,
} from '../src/services/deliveryEngine.js';
import { DELIVERY_TIERS } from '../src/utils/constants.js';

/**
 * The delivery engine decides what every customer is allowed to see, so it is
 * the one part of the platform that must never regress silently. These are
 * pure-function tests — no database, no clock dependency (every case pins its
 * own `now`).
 */

const CONNAUGHT = { lat: 28.6315, lng: 77.2167 };
const HAUZ_KHAS = { lat: 28.5494, lng: 77.2001 };

/** A Tuesday at 11:00 — every seller in these fixtures is open. */
const OPEN_HOURS = new Date('2026-08-25T11:00:00');
/** Same Tuesday at 23:30 — everyone is shut. */
const CLOSED_HOURS = new Date('2026-08-25T23:30:00');

const seller = (over = {}) => ({
  status: 'ACTIVE',
  location: HAUZ_KHAS,
  servedPincodes: ['110016'],
  deliveryRadiusKm: 13,
  workingHours: { open: '09:00', close: '21:00' },
  workingDays: [0, 1, 2, 3, 4, 5, 6],
  dispatchBufferMinutes: 10,
  acceptsExpress: true,
  ...over,
});

const product = (over = {}) => ({
  isActive: true,
  stock: 10,
  prepTimeMinutes: 20,
  isPerishable: false,
  baseTier: DELIVERY_TIERS.EXPRESS_60,
  ...over,
});

const pincode = (over = {}) => ({
  code: '110016',
  location: HAUZ_KHAS,
  isServiceable: true,
  express60Available: true,
  priority3hAvailable: true,
  nextDayAvailable: true,
  standardAvailable: true,
  ...over,
});

const zone = (over = {}) => ({ activeRiders: 12, express60Enabled: true, ...over });

const run = (over = {}) =>
  computeAvailability({
    product: product(over.product),
    seller: seller(over.seller),
    pincodeDoc: over.pincodeDoc === null ? null : pincode(over.pincodeDoc),
    zone: zone(over.zone),
    now: over.now ?? OPEN_HOURS,
  });

describe('haversineKm', () => {
  it('measures a known Delhi distance', () => {
    // Connaught Place to Hauz Khas is roughly 9-10 km.
    const d = haversineKm(CONNAUGHT, HAUZ_KHAS);
    expect(d).toBeGreaterThan(8);
    expect(d).toBeLessThan(11);
  });

  it('returns null when either point lacks coordinates', () => {
    expect(haversineKm(CONNAUGHT, {})).toBeNull();
    expect(haversineKm(null, HAUZ_KHAS)).toBeNull();
  });
});

describe('minutesUntilSellerCanStart', () => {
  it('is zero while the store is open', () => {
    expect(minutesUntilSellerCanStart(seller(), OPEN_HOURS)).toBe(0);
  });

  it('waits until opening when the store is shut', () => {
    const wait = minutesUntilSellerCanStart(seller(), CLOSED_HOURS);
    expect(wait).toBeGreaterThan(0);
    // 23:30 → 09:00 next day is 9.5 hours.
    expect(wait).toBe(570);
  });

  it('skips days the store does not trade', () => {
    // Closed Tuesday (2); next open day is Wednesday.
    const wait = minutesUntilSellerCanStart(seller({ workingDays: [3] }), OPEN_HOURS);
    expect(wait).toBeGreaterThan(20 * 60);
  });

  it('is Infinity when hours are nonsense', () => {
    expect(minutesUntilSellerCanStart(seller({ workingHours: { open: '21:00', close: '09:00' } }))).toBe(Infinity);
  });
});

describe('computeAvailability — gates', () => {
  it('refuses an unserviceable pincode', () => {
    const r = run({ pincodeDoc: { isServiceable: false } });
    expect(r.deliverable).toBe(false);
    expect(r.reason).toMatch(/do not deliver/i);
  });

  it('refuses when there is no pincode at all', () => {
    expect(run({ pincodeDoc: null }).deliverable).toBe(false);
  });

  it('refuses an out-of-stock product', () => {
    const r = run({ product: { stock: 0 } });
    expect(r.deliverable).toBe(false);
    expect(r.reason).toMatch(/out of stock/i);
  });

  it('refuses an inactive product', () => {
    expect(run({ product: { isActive: false } }).deliverable).toBe(false);
  });

  it('refuses a seller who is not ACTIVE', () => {
    expect(run({ seller: { status: 'PENDING' } }).deliverable).toBe(false);
  });
});

describe('computeAvailability — tiers', () => {
  it('gives express to a close, open, fast seller', () => {
    const r = run();
    expect(r.deliverable).toBe(true);
    expect(r.tier).toBe(DELIVERY_TIERS.EXPRESS_60);
    expect(r.isLocal).toBe(true);
  });

  it('never beats the tier the seller promised for that product', () => {
    const r = run({ product: { baseTier: DELIVERY_TIERS.NEXT_DAY } });
    expect(r.tier).toBe(DELIVERY_TIERS.NEXT_DAY);
  });

  it('degrades when ops disables express for the area', () => {
    const r = run({ pincodeDoc: { express60Available: false } });
    expect(r.tier).toBe(DELIVERY_TIERS.PRIORITY_3H);
  });

  it('degrades when no riders are on shift', () => {
    const r = run({ zone: { activeRiders: 0 } });
    expect(r.tier).toBe(DELIVERY_TIERS.PRIORITY_3H);
  });

  it('degrades when the seller has switched express off', () => {
    const r = run({ seller: { acceptsExpress: false } });
    expect(r.tier).toBe(DELIVERY_TIERS.PRIORITY_3H);
  });

  it('degrades to next-day once the store has closed for the night', () => {
    const r = run({ now: CLOSED_HOURS });
    expect(r.deliverable).toBe(true);
    expect(r.tier).toBe(DELIVERY_TIERS.NEXT_DAY);
  });

  it('degrades when preparation time alone blows the hour', () => {
    const r = run({ product: { prepTimeMinutes: 180 } });
    expect(r.tier).not.toBe(DELIVERY_TIERS.EXPRESS_60);
  });

  it('takes the worst of every constraint, not the best', () => {
    const r = run({
      product: { baseTier: DELIVERY_TIERS.PRIORITY_3H },
      pincodeDoc: { express60Available: false, priority3hAvailable: false },
    });
    expect(r.tier).toBe(DELIVERY_TIERS.NEXT_DAY);
  });
});

describe('computeAvailability — out of area', () => {
  const faraway = { seller: { servedPincodes: ['999999'] } };

  it('ships a non-perishable product that no local seller covers', () => {
    const r = run({ ...faraway, product: { isPerishable: false } });
    expect(r.deliverable).toBe(true);
    expect(r.tier).toBe(DELIVERY_TIERS.STANDARD_2_3D);
    expect(r.isLocal).toBe(false);
  });

  it('hides a perishable product rather than promising a stale one', () => {
    const r = run({ ...faraway, product: { isPerishable: true } });
    expect(r.deliverable).toBe(false);
    expect(r.reason).toMatch(/fresh/i);
  });

  it('refuses to ship where standard delivery is switched off', () => {
    const r = run({ ...faraway, pincodeDoc: { standardAvailable: false } });
    expect(r.deliverable).toBe(false);
  });

  it('treats a covered pincode outside the radius as out of area', () => {
    // Seller lists the pincode but is only willing to travel 1 km.
    const r = run({
      seller: { location: CONNAUGHT, deliveryRadiusKm: 1 },
      product: { isPerishable: true },
    });
    expect(r.deliverable).toBe(false);
  });
});

describe('availableCheckoutOptions', () => {
  it('offers nothing faster than the slowest item in the basket', () => {
    const opts = availableCheckoutOptions({
      pincodeDoc: pincode(),
      zone: zone(),
      slowestItemTier: DELIVERY_TIERS.NEXT_DAY,
    });
    expect(opts.map((o) => o.tier)).toEqual([DELIVERY_TIERS.NEXT_DAY, DELIVERY_TIERS.STANDARD_2_3D]);
  });

  it('respects the pincode ceiling', () => {
    const opts = availableCheckoutOptions({
      pincodeDoc: pincode({ express60Available: false }),
      zone: zone(),
      slowestItemTier: DELIVERY_TIERS.EXPRESS_60,
    });
    expect(opts.some((o) => o.tier === DELIVERY_TIERS.EXPRESS_60)).toBe(false);
  });

  it('prices each option', () => {
    const opts = availableCheckoutOptions({
      pincodeDoc: pincode(),
      zone: zone(),
      slowestItemTier: DELIVERY_TIERS.EXPRESS_60,
    });
    expect(opts[0].fee).toBe(99);
    expect(opts.at(-1).fee).toBe(0);
  });

  it('honours a pincode fee override', () => {
    const opts = availableCheckoutOptions({
      pincodeDoc: pincode({ expressFee: 149 }),
      zone: zone(),
      slowestItemTier: DELIVERY_TIERS.EXPRESS_60,
    });
    expect(opts[0].fee).toBe(149);
  });
});

describe('estimateDeliveryAt', () => {
  it('promises a time inside the tier window', () => {
    const eta = estimateDeliveryAt(DELIVERY_TIERS.EXPRESS_60, OPEN_HOURS);
    const mins = (eta - OPEN_HOURS) / 60000;
    expect(mins).toBeLessThanOrEqual(60);
    expect(mins).toBeGreaterThan(0);
  });
});
