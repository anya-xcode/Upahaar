import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import mongoose from 'mongoose';
import Seller from '../src/models/Seller.js';
import Product from '../src/models/Product.js';
import Category from '../src/models/Category.js';
import Occasion from '../src/models/Occasion.js';
import Pincode from '../src/models/Pincode.js';
import DeliveryZone from '../src/models/DeliveryZone.js';
import User from '../src/models/User.js';
import { queryProducts, groupByTier } from '../src/services/catalogService.js';
import { DELIVERY_TIERS } from '../src/utils/constants.js';

/**
 * Integration tests for the one query the whole storefront runs through.
 *
 * Uses a dedicated `upahaar_test` database that is created and dropped around
 * the suite, so it never touches development data.
 */

const TEST_URI = 'mongodb://127.0.0.1:27017/upahaar_test';

const PIN_LOCAL = '110016';
const PIN_REMOTE = '110040';
let category;
let localSeller;
let remoteSeller;

/** Deterministic product factory. */
async function makeProduct(over = {}) {
  return Product.create({
    name: over.name || `Product ${Math.random().toString(36).slice(2, 9)}`,
    slug: over.slug || `p-${Math.random().toString(36).slice(2, 12)}`,
    seller: over.seller || localSeller._id,
    category: category._id,
    price: over.price ?? 500,
    stock: over.stock ?? 10,
    prepTimeMinutes: over.prepTimeMinutes ?? 20,
    isPerishable: over.isPerishable ?? false,
    baseTier: over.baseTier ?? DELIVERY_TIERS.EXPRESS_60,
    isActive: over.isActive ?? true,
    approvalStatus: over.approvalStatus ?? 'APPROVED',
    soldCount: over.soldCount ?? 0,
  });
}

beforeAll(async () => {
  await mongoose.connect(TEST_URI);
  await Promise.all(
    [Seller, Product, Category, Occasion, Pincode, DeliveryZone, User].map((m) => m.deleteMany({}))
  );

  category = await Category.create({ name: 'Cakes', slug: 'cakes', icon: 'cakes' });

  await Pincode.create({
    code: PIN_LOCAL,
    city: 'Delhi',
    state: 'Delhi',
    area: 'Hauz Khas',
    location: { lat: 28.5494, lng: 77.2001 },
    isServiceable: true,
    express60Available: true,
    priority3hAvailable: true,
    nextDayAvailable: true,
    standardAvailable: true,
  });
  await Pincode.create({
    code: PIN_REMOTE,
    city: 'Delhi',
    state: 'Delhi',
    area: 'Narela',
    location: { lat: 28.853, lng: 77.092 },
    isServiceable: true,
    express60Available: false,
    priority3hAvailable: false,
    nextDayAvailable: true,
    standardAvailable: true,
  });
  await DeliveryZone.create({
    name: 'Test Zone',
    city: 'Delhi',
    state: 'Delhi',
    pincodes: [PIN_LOCAL, PIN_REMOTE],
    activeRiders: 10,
    express60Enabled: true,
    isActive: true,
  });

  const u1 = await User.create({ name: 'L', email: 'l@t.test', password: 'secret1', role: 'SELLER' });
  const u2 = await User.create({ name: 'R', email: 'r@t.test', password: 'secret1', role: 'SELLER' });

  localSeller = await Seller.create({
    user: u1._id, businessName: 'Local Store', ownerName: 'L', mobile: '1', email: 'l@t.test',
    slug: 'local-store', status: 'ACTIVE', location: { lat: 28.5494, lng: 77.2001 },
    servedPincodes: [PIN_LOCAL, PIN_REMOTE], deliveryRadiusKm: 40,
    workingHours: { open: '00:00', close: '23:59' }, workingDays: [0, 1, 2, 3, 4, 5, 6],
    acceptsExpress: true, dispatchBufferMinutes: 5,
  });
  remoteSeller = await Seller.create({
    user: u2._id, businessName: 'Remote Store', ownerName: 'R', mobile: '2', email: 'r@t.test',
    slug: 'remote-store', status: 'ACTIVE', location: { lat: 19.076, lng: 72.877 },
    servedPincodes: ['400001'], deliveryRadiusKm: 10,
    workingHours: { open: '00:00', close: '23:59' }, workingDays: [0, 1, 2, 3, 4, 5, 6],
    acceptsExpress: true, dispatchBufferMinutes: 5,
  });
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});

describe('queryProducts — visibility gates', () => {
  it('hides products awaiting approval', async () => {
    const p = await makeProduct({ name: 'Pending One', approvalStatus: 'PENDING' });
    const { products } = await queryProducts({ pincode: PIN_LOCAL, query: {}, limit: 100 });
    expect(products.some((x) => String(x._id) === String(p._id))).toBe(false);
    await Product.deleteOne({ _id: p._id });
  });

  it('hides products the seller switched off', async () => {
    const p = await makeProduct({ name: 'Hidden One', isActive: false });
    const { products } = await queryProducts({ pincode: PIN_LOCAL, query: {}, limit: 100 });
    expect(products.some((x) => String(x._id) === String(p._id))).toBe(false);
    await Product.deleteOne({ _id: p._id });
  });

  it('hides a perishable product from an out-of-area seller', async () => {
    const p = await makeProduct({ name: 'Remote Cake', seller: remoteSeller._id, isPerishable: true });
    const { products } = await queryProducts({ pincode: PIN_LOCAL, query: {}, limit: 100 });
    expect(products.some((x) => String(x._id) === String(p._id))).toBe(false);
    await Product.deleteOne({ _id: p._id });
  });

  it('ships a non-perishable product from an out-of-area seller', async () => {
    const p = await makeProduct({ name: 'Remote Mug', seller: remoteSeller._id, isPerishable: false });
    const { products } = await queryProducts({ pincode: PIN_LOCAL, query: {}, limit: 100 });
    const found = products.find((x) => String(x._id) === String(p._id));
    expect(found).toBeTruthy();
    expect(found.tier).toBe(DELIVERY_TIERS.STANDARD_2_3D);
    await Product.deleteOne({ _id: p._id });
  });
});

describe('queryProducts — tiers and filters', () => {
  it('gives a nearby product the express tier', async () => {
    const p = await makeProduct({ name: 'Local Express' });
    const { products } = await queryProducts({ pincode: PIN_LOCAL, query: {}, limit: 100 });
    const found = products.find((x) => String(x._id) === String(p._id));
    expect(found.tier).toBe(DELIVERY_TIERS.EXPRESS_60);
    await Product.deleteOne({ _id: p._id });
  });

  it('respects a tier filter', async () => {
    const a = await makeProduct({ name: 'Fast', baseTier: DELIVERY_TIERS.EXPRESS_60 });
    const b = await makeProduct({ name: 'Slow', baseTier: DELIVERY_TIERS.NEXT_DAY });
    const { products } = await queryProducts({
      pincode: PIN_LOCAL,
      query: { tier: DELIVERY_TIERS.EXPRESS_60 },
      limit: 100,
    });
    const ids = products.map((x) => String(x._id));
    expect(ids).toContain(String(a._id));
    expect(ids).not.toContain(String(b._id));
    await Product.deleteMany({ _id: { $in: [a._id, b._id] } });
  });

  it('degrades everything to next-day in an area with no fast tiers', async () => {
    const p = await makeProduct({ name: 'Narela Item' });
    const { products } = await queryProducts({ pincode: PIN_REMOTE, query: {}, limit: 100 });
    const found = products.find((x) => String(x._id) === String(p._id));
    expect(found?.tier).toBe(DELIVERY_TIERS.NEXT_DAY);
    await Product.deleteOne({ _id: p._id });
  });

  it('applies a price filter', async () => {
    const cheap = await makeProduct({ name: 'Cheap', price: 200 });
    const dear = await makeProduct({ name: 'Dear', price: 5000 });
    const { products } = await queryProducts({
      pincode: PIN_LOCAL,
      query: { priceBucket: 'under-500' },
      limit: 100,
    });
    const ids = products.map((x) => String(x._id));
    expect(ids).toContain(String(cheap._id));
    expect(ids).not.toContain(String(dear._id));
    await Product.deleteMany({ _id: { $in: [cheap._id, dear._id] } });
  });
});

describe('queryProducts — scale', () => {
  const BULK = 900;

  beforeAll(async () => {
    const docs = Array.from({ length: BULK }, (_, i) => ({
      name: `Bulk ${i}`,
      slug: `bulk-${i}`,
      seller: localSeller._id,
      category: category._id,
      price: 100 + i,
      stock: 5,
      prepTimeMinutes: 20,
      isPerishable: false,
      baseTier: DELIVERY_TIERS.EXPRESS_60,
      isActive: true,
      approvalStatus: 'APPROVED',
      soldCount: i,
    }));
    await Product.insertMany(docs);
  });

  afterAll(async () => {
    await Product.deleteMany({ name: /^Bulk / });
  });

  it('counts every deliverable product, not just the first page of candidates', async () => {
    // Regression guard: an internal fetch cap used to silently truncate the
    // catalogue, so `total` under-reported once the catalogue grew.
    const { total } = await queryProducts({ pincode: PIN_LOCAL, query: {}, limit: 24 });
    expect(total).toBeGreaterThanOrEqual(BULK);
  });

  it('paginates deterministically without gaps or repeats', async () => {
    const q = { sort: 'price-asc' };
    const p1 = await queryProducts({ pincode: PIN_LOCAL, query: q, page: 1, limit: 50 });
    const p2 = await queryProducts({ pincode: PIN_LOCAL, query: q, page: 2, limit: 50 });

    expect(p1.products).toHaveLength(50);
    expect(p2.products).toHaveLength(50);

    const ids1 = p1.products.map((x) => String(x._id));
    const ids2 = p2.products.map((x) => String(x._id));
    expect(new Set([...ids1, ...ids2]).size).toBe(100); // no overlap

    const prices = [...p1.products, ...p2.products].map((x) => x.price);
    expect(prices).toEqual([...prices].sort((a, b) => a - b)); // globally ordered
  });

  it('reaches the deep pages of a large catalogue', async () => {
    const deep = await queryProducts({ pincode: PIN_LOCAL, query: { sort: 'price-asc' }, page: 15, limit: 50 });
    expect(deep.products.length).toBeGreaterThan(0);
  });
});

describe('groupByTier', () => {
  it('buckets products and caps each group', async () => {
    const made = [];
    for (let i = 0; i < 12; i++) made.push(await makeProduct({ name: `Group ${i}`, soldCount: i }));
    const groups = await groupByTier({ pincode: PIN_LOCAL, perTier: 4 });
    expect(groups.length).toBeGreaterThan(0);
    for (const g of groups) {
      expect(g.products.length).toBeLessThanOrEqual(4);
      expect(g.count).toBeGreaterThanOrEqual(g.products.length);
      expect(g.products.every((p) => p.tier === g.tier)).toBe(true);
    }
    await Product.deleteMany({ _id: { $in: made.map((m) => m._id) } });
  });
});
