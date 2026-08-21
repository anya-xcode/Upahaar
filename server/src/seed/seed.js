/* eslint-disable no-console, no-await-in-loop */
import 'dotenv/config';
import mongoose from 'mongoose';
import connectDB from '../config/db.js';

import User from '../models/User.js';
import Seller from '../models/Seller.js';
import Product from '../models/Product.js';
import Category from '../models/Category.js';
import Occasion from '../models/Occasion.js';
import Pincode from '../models/Pincode.js';
import DeliveryZone from '../models/DeliveryZone.js';
import Address from '../models/Address.js';
import Cart from '../models/Cart.js';
import Wishlist from '../models/Wishlist.js';
import Order from '../models/Order.js';
import Payment from '../models/Payment.js';
import Coupon from '../models/Coupon.js';
import Review from '../models/Review.js';
import Notification from '../models/Notification.js';
import GiftReminder from '../models/GiftReminder.js';
import Commission from '../models/Commission.js';
import SellerPayout from '../models/SellerPayout.js';
import InventoryLog from '../models/InventoryLog.js';
import Banner from '../models/Banner.js';
import Faq from '../models/Faq.js';
import BlogPost from '../models/BlogPost.js';

import { PINCODES, ZONES } from './data/locations.js';
import { CATEGORIES, OCCASIONS, FAQS, POSTS } from './data/catalog.js';
import { SELLERS } from './data/sellers.js';
import { PRODUCTS } from './data/products.js';
import { ROLES, SELLER_STATUS, KYC_STATUS, ORDER_STATUS, ORDER_STATUS_META, ORDER_FLOW, PAYMENT_METHODS, PAYMENT_STATUS, TIER_META } from '../utils/constants.js';
import { slugify, makeOrderId, money, randomReferralCode } from '../utils/helpers.js';
import { estimateDeliveryAt } from '../services/deliveryEngine.js';

/* ------------------------------ tiny helpers ------------------------------ */

/** Seeded PRNG so `npm run seed` produces the same demo store every time. */
let seedState = 20260820;
function rnd() {
  seedState = (seedState * 1664525 + 1013904223) % 4294967296;
  return seedState / 4294967296;
}
const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
const pickN = (arr, n) => [...arr].sort(() => rnd() - 0.5).slice(0, n);
const intBetween = (a, b) => a + Math.floor(rnd() * (b - a + 1));
const daysBack = (n) => new Date(Date.now() - n * 86400000);

/** Storefront photography, one per seller — verified stable Unsplash assets. */
const STORE_PHOTOS = [
  '1486427944299-d1955d23e34d', '1549465220-1a8b9238cd48', '1519225421980-715cb0215aed',
  '1513885535751-8b9238bd345a', '1535254973040-607b474cb50d', '1513151233558-d860c5398176',
  '1596461404969-9ae70f2830c1', '1490481651871-ab68de25d43d', '1607344645866-009c320b63e0',
  '1563729784474-d77dbb933a9e', '1548544149-4835e62ee5b3', '1578985545062-69928b1d9587',
  '1608303588026-884930af2559', '1558618666-fcd25c85cd64', '1502920917128-1aa500764cbd',
  '1600334089648-b0d9d3028eb2', '1512909006721-3d6018887383',
].map((id) => `https://images.unsplash.com/photo-${id}?w=1400&q=80&auto=format&fit=crop`);

const DEMO_PASSWORD = 'Test@123';
const ADMIN_PASSWORD = 'Admin@123';

const CUSTOMERS = [
  { name: 'Ananya Gupta', email: 'ananya@upahaar.test', mobile: '+91 98200 55001', pincode: '400001', city: 'Mumbai', state: 'Maharashtra', house: '12B, Sea Breeze Apartments', street: 'Marine Drive', landmark: 'Opposite Wankhede Stadium' },
  { name: 'Rohan Verma', email: 'rohan@upahaar.test', mobile: '+91 98200 55002', pincode: '400050', city: 'Mumbai', state: 'Maharashtra', house: '404, Hill Road Residency', street: 'Hill Road', landmark: 'Near Mount Mary Church' },
  { name: 'Sanya Kapoor', email: 'sanya@upahaar.test', mobile: '+91 98110 55003', pincode: '110001', city: 'Delhi', state: 'Delhi', house: 'B-22, Connaught Circus', street: 'Barakhamba Road', landmark: 'Above Cafe Coffee Day' },
  { name: 'Arjun Reddy', email: 'arjun@upahaar.test', mobile: '+91 98450 55004', pincode: '560038', city: 'Bengaluru', state: 'Karnataka', house: '7, Ranka Colony', street: '100 Feet Road', landmark: 'Near Indiranagar Metro' },
  { name: 'Meher Bhatia', email: 'meher@upahaar.test', mobile: '+91 98220 55005', pincode: '411004', city: 'Pune', state: 'Maharashtra', house: '3rd Floor, Deccan Heights', street: 'FC Road', landmark: 'Beside Goodluck Cafe' },
  { name: 'Kabir Singh', email: 'kabir@upahaar.test', mobile: '+91 98300 55006', pincode: '700016', city: 'Kolkata', state: 'West Bengal', house: '9A, Park Mansions', street: 'Park Street', landmark: 'Near Flurys' },
];

const REVIEW_LINES = [
  ['Arrived in 40 minutes flat', 'Ordered at 6pm for a birthday at 7. It was at the door before the cake stand was set up. Genuinely astonishing.'],
  ['Beautiful, exactly as photographed', 'The packaging alone made it feel expensive. Everything was fresh and the note was handwritten.'],
  ['My mother cried', 'Not much more to say than that. The personalisation was perfect and it arrived on the morning we asked for.'],
  ['Great quality, slightly late', 'The gift itself was lovely. Delivery ran about twenty minutes past the estimate, but the seller called ahead.'],
  ['Repeat customer now', 'Third order from this seller. Consistent every single time, which is rare.'],
  ['Perfect for a last-minute save', 'Completely forgot an anniversary. This got me out of it. Fresh, well presented, on time.'],
  ['Good but the box was dented', 'Contents were fine and tasted great. The outer box had taken a knock in transit.'],
  ['Worth every rupee', 'Better than the high street shop I usually use, and it came to my door in under three hours.'],
  ['Lovely flowers, lasted a week', 'Still going strong on day seven. Clearly fresh when they were tied.'],
  ['Sent to a colleague, great feedback', 'Used this for a work gift. Got a photo back within the hour — it looked excellent.'],
];

/* --------------------------------- seed ---------------------------------- */

async function wipe() {
  const models = [User, Seller, Product, Category, Occasion, Pincode, DeliveryZone, Address, Cart, Wishlist, Order, Payment, Coupon, Review, Notification, GiftReminder, Commission, SellerPayout, InventoryLog, Banner, Faq, BlogPost];
  await Promise.all(models.map((m) => m.deleteMany({})));
}

async function seed() {
  const conn = await connectDB(process.env.MONGO_URI);
  console.log(`\n  Upahaar — seeding database → ${conn.name}\n`);

  console.log('   clearing existing data…');
  await wipe();

  /* --- Locations --- */
  await Pincode.insertMany(PINCODES);
  await DeliveryZone.insertMany(ZONES);
  console.log(`   ${PINCODES.length} PIN codes across ${ZONES.length} delivery zones`);

  /* --- Taxonomy & CMS --- */
  const categories = await Category.insertMany(CATEGORIES);
  const occasions = await Occasion.insertMany(OCCASIONS);
  await Faq.insertMany(FAQS);
  await BlogPost.insertMany(POSTS);
  const categoryBySlug = Object.fromEntries(categories.map((c) => [c.slug, c]));
  const occasionBySlug = Object.fromEntries(occasions.map((o) => [o.slug, o]));
  console.log(`   ${categories.length} categories, ${occasions.length} occasions, ${FAQS.length} FAQs, ${POSTS.length} stories`);

  /* --- Admin --- */
  const admin = await User.create({
    name: 'Upahaar Admin',
    email: 'admin@upahaar.test',
    password: ADMIN_PASSWORD,
    mobile: '+91 98000 00001',
    role: ROLES.ADMIN,
    referralCode: 'ADMIN001',
  });

  /* --- Customers --- */
  const customers = [];
  for (const c of CUSTOMERS) {
    const user = await User.create({
      name: c.name,
      email: c.email,
      password: DEMO_PASSWORD,
      mobile: c.mobile,
      role: ROLES.CUSTOMER,
      defaultPincode: c.pincode,
      referralCode: randomReferralCode(c.name),
      savedPayments: [
        { label: 'HDFC Credit Card', method: 'CARD', maskedValue: '•••• 4242', isDefault: true },
        { label: 'UPI', method: 'UPI', maskedValue: `${c.name.split(' ')[0].toLowerCase()}@okhdfc`, isDefault: false },
      ],
    });

    const address = await Address.create({
      user: user._id,
      label: 'Home',
      name: c.name,
      mobile: c.mobile,
      pincode: c.pincode,
      house: c.house,
      street: c.street,
      landmark: c.landmark,
      city: c.city,
      state: c.state,
      isDefault: true,
      location: { lat: null, lng: null, formatted: `${c.house}, ${c.street}, ${c.city} ${c.pincode}` },
    });

    await Cart.create({ user: user._id, items: [], pincode: c.pincode });
    await Wishlist.create({ user: user._id, products: [] });
    customers.push({ user, address, meta: c });
  }
  console.log(`   ${customers.length} customers + 1 admin`);

  /* --- Sellers --- */
  const sellers = [];
  for (const [sellerIndex, s] of SELLERS.entries()) {
    const user = await User.create({
      name: s.ownerName,
      email: s.email,
      password: DEMO_PASSWORD,
      mobile: s.mobile,
      role: ROLES.SELLER,
      referralCode: randomReferralCode(s.businessName),
    });

    const seller = await Seller.create({
      user: user._id,
      businessName: s.businessName,
      ownerName: s.ownerName,
      mobile: s.mobile,
      email: s.email,
      slug: slugify(s.businessName),
      tagline: s.tagline,
      description: s.description,
      storeImages: [STORE_PHOTOS[sellerIndex % STORE_PHOTOS.length]],
      address: {
        line1: `${s.businessName} Store`,
        street: s.tagline.split('·')[0].trim(),
        city: s.city,
        state: PINCODES.find((p) => p.code === s.pincode)?.state,
        pincode: s.pincode,
      },
      location: { lat: s.lat, lng: s.lng },
      servedPincodes: s.serves,
      deliveryRadiusKm: s.radius,
      workingHours: s.hours,
      workingDays: [0, 1, 2, 3, 4, 5, 6],
      dispatchBufferMinutes: s.dispatchBuffer,
      acceptsExpress: true,
      gstNumber: `27${String(intBetween(10000, 99999))}AB${intBetween(1, 9)}Z${intBetween(1, 9)}`,
      panNumber: `ABCDE${intBetween(1000, 9999)}F`,
      bankDetails: {
        accountHolder: s.ownerName,
        accountNumber: `50100${intBetween(100000000, 999999999)}`,
        ifsc: `HDFC000${intBetween(1000, 9999)}`,
        bankName: 'HDFC Bank',
      },
      kycDocuments: [
        { type: 'GST', url: 'https://example.com/kyc/gst.pdf' },
        { type: 'PAN', url: 'https://example.com/kyc/pan.pdf' },
        { type: 'SHOP_LICENSE', url: 'https://example.com/kyc/shop.pdf' },
      ],
      kycStatus: KYC_STATUS.VERIFIED,
      status: SELLER_STATUS.ACTIVE,
      commissionRate: s.commission,
      isFeatured: Boolean(s.featured),
      rating: s.rating,
      reviewCount: s.reviews,
      deliveryRating: Math.round((s.rating - 0.1) * 10) / 10,
      joinedAt: daysBack(intBetween(120, 900)),
    });

    sellers.push({ seller, user, meta: s });
  }

  // Two applications sitting in the admin's approval queue, so the workflow
  // has something real to act on straight after seeding.
  const pendingSpecs = [
    { businessName: 'Sweet Nothings Bakehouse', ownerName: 'Tanvi Shah', email: 'tanvi@upahaar.test', city: 'Mumbai', pincode: '400058', lat: 19.1273, lng: 72.834, kyc: KYC_STATUS.PENDING },
    { businessName: 'Bloom Room Gurgaon', ownerName: 'Aman Khurana', email: 'aman@upahaar.test', city: 'Gurugram', pincode: '122002', lat: 28.475, lng: 77.09, kyc: KYC_STATUS.NOT_SUBMITTED },
  ];
  for (const p of pendingSpecs) {
    const user = await User.create({
      name: p.ownerName, email: p.email, password: DEMO_PASSWORD, mobile: '+91 98999 00000', role: ROLES.SELLER, referralCode: randomReferralCode(p.businessName),
    });
    await Seller.create({
      user: user._id,
      businessName: p.businessName,
      ownerName: p.ownerName,
      mobile: '+91 98999 00000',
      email: p.email,
      slug: slugify(p.businessName),
      tagline: `${p.city} · Awaiting approval`,
      address: { city: p.city, pincode: p.pincode, state: PINCODES.find((x) => x.code === p.pincode)?.state },
      location: { lat: p.lat, lng: p.lng },
      servedPincodes: [p.pincode],
      deliveryRadiusKm: 8,
      kycStatus: p.kyc,
      status: SELLER_STATUS.PENDING,
      kycDocuments: p.kyc === KYC_STATUS.PENDING ? [{ type: 'GST', url: 'https://example.com/kyc/gst.pdf' }] : [],
    });
    await Notification.create({
      recipient: admin._id,
      audience: 'ADMIN',
      title: 'New seller application',
      body: `${p.businessName} applied to sell on Upahaar.`,
      icon: 'store',
      type: 'KYC',
      link: '/admin/sellers',
    });
  }
  console.log(`   ${sellers.length} active sellers + ${pendingSpecs.length} pending approval`);

  /* --- Products --- */
  const products = [];
  for (const { seller, meta } of sellers) {
    const specs = PRODUCTS[meta.email] || [];
    for (const spec of specs) {
      const category = categoryBySlug[spec.c];
      if (!category) throw new Error(`Unknown category slug in seed data: ${spec.c}`);

      const product = await Product.create({
        name: spec.n,
        slug: `${slugify(spec.n)}-${slugify(meta.businessName).slice(0, 8)}`,
        description: spec.d,
        highlights: spec.hi || [],
        images: spec.images,
        seller: seller._id,
        category: category._id,
        occasions: (spec.o || []).map((s) => occasionBySlug[s]?._id).filter(Boolean),
        price: spec.price,
        mrp: spec.mrp,
        stock: spec.stock ?? intBetween(15, 60),
        lowStockThreshold: 6,
        variants: spec.variants || [],
        baseTier: spec.t,
        prepTimeMinutes: spec.prep,
        isPerishable: Boolean(spec.per),
        personalizable: Boolean(spec.pz),
        allowsPhotoUpload: Boolean(spec.photo),
        personalizationFee: spec.pzFee ?? 0,
        personalizationNote: spec.pz ? 'Add a name, a date or a short message. Photo uploads print in full colour.' : undefined,
        tags: spec.tags || [],
        isFeatured: Boolean(spec.feat),
        isBestSeller: Boolean(spec.best),
        soldCount: intBetween(8, 320),
        viewCount: intBetween(120, 4200),
        createdAt: daysBack(intBetween(5, 400)),
      });

      await InventoryLog.create({
        product: product._id,
        seller: seller._id,
        change: product.stock,
        stockAfter: product.stock,
        reason: 'RESTOCK',
        note: 'Initial stock',
      });

      products.push(product);
    }
  }

  // Keep the category tiles honest.
  for (const category of categories) {
    const count = await Product.countDocuments({ category: category._id });
    await Category.updateOne({ _id: category._id }, { $set: { productCount: count } });
  }
  console.log(`   ${products.length} products`);

  /* --- Coupons --- */
  const coupons = await Coupon.insertMany([
    { code: 'WELCOME10', title: '10% off your first gift', description: 'New to Upahaar? Take 10% off, up to ₹200.', type: 'PERCENT', value: 10, maxDiscount: 200, minOrderValue: 499, firstOrderOnly: true, perUserLimit: 1, expiresAt: daysBack(-90), isActive: true, isVisible: true },
    { code: 'FLAT100', title: '₹100 off orders over ₹999', description: 'Flat ₹100 off — no fuss.', type: 'FLAT', value: 100, minOrderValue: 999, perUserLimit: 3, expiresAt: daysBack(-60), isActive: true, isVisible: true },
    { code: 'FIRSTGIFT', title: '₹150 off your first order', description: 'A little something to get you started.', type: 'FLAT', value: 150, minOrderValue: 799, firstOrderOnly: true, perUserLimit: 1, expiresAt: daysBack(-120), isActive: true, isVisible: true },
    { code: 'BIRTHDAY20', title: '20% off birthday gifts', description: '20% off everything in Birthday Gifts, up to ₹400.', type: 'PERCENT', value: 20, maxDiscount: 400, minOrderValue: 699, categories: [categoryBySlug['birthday-gifts']._id, categoryBySlug.cakes._id], perUserLimit: 2, expiresAt: daysBack(-45), isActive: true, isVisible: true },
    { code: 'MUMBAI50', title: '₹50 off in Mumbai', description: 'For our South Mumbai regulars.', type: 'FLAT', value: 50, minOrderValue: 499, pincodes: PINCODES.filter((p) => p.city === 'Mumbai').map((p) => p.code), perUserLimit: 5, expiresAt: daysBack(-30), isActive: true, isVisible: true },
    { code: 'CORPORATE15', title: '15% off corporate gifting', description: 'For bulk and corporate orders.', type: 'PERCENT', value: 15, maxDiscount: 2500, minOrderValue: 4999, categories: [categoryBySlug['corporate-gifts']._id], perUserLimit: 10, expiresAt: daysBack(-180), isActive: true, isVisible: true },
    { code: 'EXPRESSFREE', title: 'Free express delivery', description: '₹99 off when you pick 60-minute delivery.', type: 'FLAT', value: 99, minOrderValue: 899, perUserLimit: 2, expiresAt: daysBack(-20), isActive: true, isVisible: true },
  ]);
  console.log(`   ${coupons.length} coupons`);

  /* --- Banners --- */
  await Banner.insertMany([
    { title: 'Make Every Moment Special', subtitle: 'Beautiful gifts, delivered exactly when you need them.', placement: 'HERO', icon: 'welcome', ctaLabel: 'Find Gifts Near Me', ctaLink: '#find-gifts', theme: { from: '#FFF1F4', to: '#FFF8F0', text: '#3F1D2E' }, displayOrder: 0, isActive: true },
    { title: 'Forgot? We have got an hour.', subtitle: 'Cakes, flowers and hampers at your door in 60 minutes.', placement: 'STRIP', icon: 'bolt', ctaLabel: 'Shop express gifts', ctaLink: '/gifts?tier=EXPRESS_60', theme: { from: '#FFE9EF', to: '#FFF4E8', text: '#3F1D2E' }, displayOrder: 1, isActive: true },
    { title: 'Diwali gifting, sorted', subtitle: 'Hampers, sweets and brass for the whole list.', placement: 'STRIP', icon: 'diwali', ctaLabel: 'Browse festive gifts', ctaLink: '/gifts?category=festival-gifts', theme: { from: '#FFF3DC', to: '#FFFBF3', text: '#4A2E10' }, displayOrder: 2, isActive: true },
  ]);

  /* --- Historical orders --- */
  const deliverable = products.filter((p) => p.stock > 0);
  let orderSeq = 0;
  const orders = [];

  for (let i = 0; i < 140; i += 1) {
    const buyer = pick(customers);
    const placedAt = daysBack(intBetween(0, 44));

    // Pick 1–3 products from sellers that actually cover the buyer's pincode,
    // so the seeded history is consistent with the availability engine.
    const sellersHere = sellers.filter((s) => s.meta.serves.includes(buyer.meta.pincode));
    const candidateSellerIds = new Set(sellersHere.map((s) => String(s.seller._id)));
    const localProducts = deliverable.filter((p) => candidateSellerIds.has(String(p.seller)));
    const shippable = deliverable.filter((p) => !p.isPerishable && !candidateSellerIds.has(String(p.seller)));
    const pool = localProducts.length ? localProducts : shippable;
    if (!pool.length) continue;

    const chosen = pickN(pool, intBetween(1, 3));
    const items = chosen.map((p) => {
      const quantity = intBetween(1, 2);
      const personalised = p.personalizable && rnd() > 0.6;
      const fee = personalised ? p.personalizationFee * quantity : 0;
      return {
        product: p._id,
        seller: p.seller,
        name: p.name,
        image: p.images[0],
        quantity,
        price: p.price,
        mrp: p.mrp,
        personalization: personalised ? { message: `Happy birthday, ${buyer.meta.name.split(' ')[0]}!`, fee } : { fee: 0 },
        tier: p.baseTier,
        lineTotal: money(p.price * quantity + fee),
      };
    });

    const subtotal = money(items.reduce((s, it) => s + it.price * it.quantity, 0));
    const personalizationTotal = money(items.reduce((s, it) => s + (it.personalization.fee || 0), 0));
    const tier = items.reduce((worst, it) => (TIER_META[it.tier].rank > TIER_META[worst].rank ? it.tier : worst), items[0].tier);
    const deliveryFee = TIER_META[tier].shippingFee;
    const giftWrap = rnd() > 0.6;
    const greetingCard = rnd() > 0.5;
    const giftOptionsTotal = (giftWrap ? 49 : 0) + (greetingCard ? 29 : 0);
    const usedCoupon = rnd() > 0.72 ? pick(coupons.filter((c) => !c.categories.length && !c.pincodes.length)) : null;
    const discount = usedCoupon
      ? money(usedCoupon.type === 'PERCENT' ? Math.min((subtotal * usedCoupon.value) / 100, usedCoupon.maxDiscount || Infinity) : Math.min(usedCoupon.value, subtotal))
      : 0;
    const total = money(Math.max(0, subtotal + personalizationTotal + giftOptionsTotal + deliveryFee - discount));

    // Older orders are settled; the newest few are still moving so the seller
    // and customer dashboards have live work in them.
    const ageDays = Math.round((Date.now() - placedAt) / 86400000);
    let status;
    if (ageDays > 2) status = rnd() > 0.08 ? ORDER_STATUS.DELIVERED : ORDER_STATUS.CANCELLED;
    else if (ageDays > 0) status = pick([ORDER_STATUS.DELIVERED, ORDER_STATUS.DELIVERED, ORDER_STATUS.OUT_FOR_DELIVERY, ORDER_STATUS.CANCELLED]);
    else status = pick([ORDER_STATUS.PLACED, ORDER_STATUS.ACCEPTED, ORDER_STATUS.PREPARING, ORDER_STATUS.READY_FOR_PICKUP, ORDER_STATUS.OUT_FOR_DELIVERY, ORDER_STATUS.DELIVERED]);

    const timeline = [];
    const stopAt = status === ORDER_STATUS.CANCELLED ? 1 : ORDER_FLOW.indexOf(status) + 1;
    let cursor = placedAt.getTime();
    for (let sIdx = 0; sIdx < stopAt; sIdx += 1) {
      const st = ORDER_FLOW[sIdx];
      timeline.push({ status: st, label: ORDER_STATUS_META[st].label, at: new Date(cursor) });
      cursor += intBetween(3, 18) * 60000;
    }
    if (status === ORDER_STATUS.CANCELLED) {
      timeline.push({ status: ORDER_STATUS.CANCELLED, label: 'Cancelled', note: 'Cancelled by customer', at: new Date(cursor) });
    }

    orderSeq += 1;
    const paymentMethod = pick([PAYMENT_METHODS.UPI, PAYMENT_METHODS.UPI, PAYMENT_METHODS.CARD, PAYMENT_METHODS.NETBANKING, PAYMENT_METHODS.WALLET, PAYMENT_METHODS.COD]);

    const order = await Order.create({
      orderId: makeOrderId(orderSeq),
      customer: buyer.user._id,
      customerName: buyer.user.name,
      items,
      sellers: [...new Set(items.map((it) => String(it.seller)))],
      shippingAddress: {
        name: buyer.meta.name,
        mobile: buyer.meta.mobile,
        pincode: buyer.meta.pincode,
        house: buyer.meta.house,
        street: buyer.meta.street,
        landmark: buyer.meta.landmark,
        city: buyer.meta.city,
        state: buyer.meta.state,
      },
      deliveryTier: tier,
      deliverySlot: { date: placedAt, window: TIER_META[tier].eta },
      estimatedDeliveryAt: estimateDeliveryAt(tier, placedAt),
      deliveredAt: status === ORDER_STATUS.DELIVERED ? new Date(cursor) : undefined,
      giftOptions: {
        giftWrap, giftWrapFee: giftWrap ? 49 : 0,
        greetingCard, greetingCardFee: greetingCard ? 29 : 0,
        giftMessage: greetingCard ? 'Thinking of you today. Have the loveliest one.' : undefined,
        hidePrice: rnd() > 0.5,
      },
      subtotal,
      personalizationTotal,
      giftOptionsTotal,
      deliveryFee,
      discount,
      coupon: usedCoupon ? { code: usedCoupon.code, discount } : undefined,
      total,
      paymentMethod,
      paymentStatus: status === ORDER_STATUS.CANCELLED ? PAYMENT_STATUS.REFUNDED : paymentMethod === PAYMENT_METHODS.COD && status !== ORDER_STATUS.DELIVERED ? PAYMENT_STATUS.PENDING : PAYMENT_STATUS.PAID,
      status,
      timeline,
      cancellationReason: status === ORDER_STATUS.CANCELLED ? 'Cancelled by customer' : undefined,
      refundAmount: status === ORDER_STATUS.CANCELLED ? total : 0,
      deliveryPartner: ORDER_FLOW.indexOf(status) >= ORDER_FLOW.indexOf(ORDER_STATUS.PICKED_UP) ? { name: pick(['Ravi K.', 'Sunil M.', 'Imran S.', 'Deepak T.']), mobile: '+91 98200 11223', vehicle: `Bike · MH01 ${pick(['AB', 'CD', 'EF'])} ${intBetween(1000, 9999)}` } : undefined,
      createdAt: placedAt,
      updatedAt: new Date(cursor),
    });

    await Payment.create({
      order: order._id,
      user: buyer.user._id,
      amount: total,
      method: paymentMethod,
      status: order.paymentStatus,
      reference: `SIM-${order.orderId}`,
      refundAmount: status === ORDER_STATUS.CANCELLED ? total : 0,
      refundedAt: status === ORDER_STATUS.CANCELLED ? new Date(cursor) : undefined,
      createdAt: placedAt,
    });

    if (status !== ORDER_STATUS.CANCELLED) {
      const bySeller = items.reduce((acc, it) => {
        acc[String(it.seller)] = (acc[String(it.seller)] || 0) + it.lineTotal;
        return acc;
      }, {});
      let commissionTotal = 0;
      for (const [sellerId, amount] of Object.entries(bySeller)) {
        const sellerDoc = sellers.find((s) => String(s.seller._id) === sellerId)?.seller;
        const rate = sellerDoc?.commissionRate ?? 12;
        const commission = money((amount * rate) / 100);
        commissionTotal += commission;
        await Commission.create({
          order: order._id,
          seller: sellerId,
          orderAmount: money(amount),
          rate,
          amount: commission,
          sellerEarning: money(amount - commission),
          // Anything older than a fortnight has already been paid out.
          status: ageDays > 14 ? 'SETTLED' : 'PENDING',
          createdAt: placedAt,
        });
      }
      await Order.updateOne({ _id: order._id }, { $set: { commissionAmount: money(commissionTotal) } });
    }

    orders.push(order);
  }
  console.log(`   ${orders.length} orders with payments and commissions`);

  /* --- Payouts for the settled commissions --- */
  let payoutCount = 0;
  for (const { seller } of sellers) {
    const settled = await Commission.find({ seller: seller._id, status: 'SETTLED' });
    if (!settled.length) continue;
    const payout = await SellerPayout.create({
      seller: seller._id,
      periodStart: daysBack(44),
      periodEnd: daysBack(14),
      orderCount: settled.length,
      grossSales: money(settled.reduce((s, c) => s + c.orderAmount, 0)),
      commissionDeducted: money(settled.reduce((s, c) => s + c.amount, 0)),
      netPayable: money(settled.reduce((s, c) => s + c.sellerEarning, 0)),
      status: 'PAID',
      utr: `UTR${intBetween(1000000000, 9999999999)}`,
      paidAt: daysBack(13),
    });
    await Commission.updateMany({ _id: { $in: settled.map((c) => c._id) } }, { $set: { payout: payout._id } });
    payoutCount += 1;
  }
  console.log(`   ${payoutCount} seller payouts settled`);

  /* --- Reviews --- */
  const delivered = orders.filter((o) => o.status === ORDER_STATUS.DELIVERED);
  let reviewCount = 0;
  for (const order of delivered) {
    if (rnd() > 0.55) continue;
    const item = pick(order.items);
    const [title, comment] = pick(REVIEW_LINES);
    const productRating = rnd() > 0.15 ? intBetween(4, 5) : intBetween(2, 3);

    await Review.create({
      product: item.product,
      seller: item.seller,
      order: order._id,
      user: order.customer,
      userName: order.customerName,
      productRating,
      sellerRating: Math.min(5, Math.max(1, productRating + (rnd() > 0.7 ? -1 : 0))),
      deliveryRating: Math.min(5, Math.max(1, productRating + (rnd() > 0.8 ? -1 : 0))),
      title,
      comment,
      isVerifiedPurchase: true,
      status: 'APPROVED',
      helpfulCount: intBetween(0, 34),
      createdAt: order.deliveredAt || order.createdAt,
    });
    await Order.updateOne({ _id: order._id }, { $set: { isReviewed: true } });
    reviewCount += 1;
  }

  // A couple held back for the admin moderation queue.
  for (let i = 0; i < 3 && i < delivered.length; i += 1) {
    const order = delivered[i];
    const item = order.items[0];
    await Review.create({
      product: item.product,
      seller: item.seller,
      order: order._id,
      user: order.customer,
      userName: order.customerName,
      productRating: 2,
      sellerRating: 2,
      deliveryRating: 3,
      title: 'Not quite what I expected',
      comment: 'The photo looked different from what turned up. Flagged for the team to take a look.',
      isVerifiedPurchase: true,
      status: 'PENDING',
      createdAt: order.deliveredAt || order.createdAt,
    });
  }

  // Roll the seeded reviews into product and seller averages.
  const productAgg = await Review.aggregate([
    { $match: { status: 'APPROVED' } },
    { $group: { _id: '$product', avg: { $avg: '$productRating' }, count: { $sum: 1 } } },
  ]);
  for (const row of productAgg) {
    await Product.updateOne({ _id: row._id }, { $set: { rating: Math.round(row.avg * 10) / 10, reviewCount: row.count } });
  }
  // Products nobody reviewed still need a believable rating on the card.
  await Product.updateMany({ reviewCount: 0 }, [
    { $set: { rating: { $add: [4.2, { $divide: [{ $mod: [{ $toLong: '$createdAt' }, 7] }, 10] }] }, reviewCount: { $mod: [{ $toLong: '$createdAt' }, 40] } } },
  ]);
  console.log(`   ${reviewCount} reviews (+3 awaiting moderation)`);

  /* --- Gift reminders --- */
  const now = new Date();
  const soon = new Date(now.getTime() + 5 * 86400000);
  const reminders = [
    { user: customers[0].user._id, title: "Mom's Birthday", relation: 'Mother', month: 9, day: 14, remindDaysBefore: 7, notes: 'She loves tulips, not roses.' },
    { user: customers[0].user._id, title: 'Wedding Anniversary', relation: 'Spouse', month: 10, day: 20, remindDaysBefore: 10 },
    { user: customers[0].user._id, title: "Rohan's Birthday", relation: 'Friend', month: soon.getMonth() + 1, day: soon.getDate(), remindDaysBefore: 7, notes: 'Chocolate, always chocolate.' },
    { user: customers[1].user._id, title: "Dad's Birthday", relation: 'Father', month: 3, day: 2, remindDaysBefore: 5 },
    { user: customers[2].user._id, title: 'Anniversary', relation: 'Spouse', month: 12, day: 8, remindDaysBefore: 14 },
  ];
  await GiftReminder.insertMany(reminders.map((r) => ({ ...r, isActive: true })));

  /* --- Wishlists --- */
  for (const c of customers) {
    await Wishlist.updateOne({ user: c.user._id }, { $set: { products: pickN(products, intBetween(3, 7)).map((p) => p._id) } });
  }

  /* --- Notifications --- */
  const notifications = [];
  for (const c of customers) {
    notifications.push(
      { recipient: c.user._id, audience: 'CUSTOMER', title: 'Welcome to Upahaar', body: 'Use WELCOME10 for 10% off your first gift.', icon: 'welcome', type: 'PROMO', link: '/account/coupons', isRead: true, createdAt: daysBack(30) },
      { recipient: c.user._id, audience: 'CUSTOMER', title: 'Your gift has been delivered', body: 'We hope it made their day. Leave a review?', icon: 'delivered', type: 'ORDER', link: '/account/orders', isRead: false, createdAt: daysBack(2) }
    );
  }
  notifications.push({ recipient: customers[0].user._id, audience: 'CUSTOMER', title: "Rohan's Birthday is in 5 days", body: 'Want to send a gift? Chocolate, always chocolate.', icon: 'reminder', type: 'REMINDER', link: '/account/reminders', isRead: false, createdAt: daysBack(0) });

  for (const { seller, user } of sellers.slice(0, 6)) {
    notifications.push(
      { recipient: user._id, audience: 'SELLER', title: 'New order received.', body: `A new order is waiting for you to accept.`, icon: 'order', type: 'ORDER', link: '/seller/orders', isRead: false, createdAt: daysBack(0) },
      { recipient: user._id, audience: 'SELLER', title: 'Low inventory', body: `Some items in ${seller.businessName} are running low.`, icon: 'inventory', type: 'INVENTORY', link: '/seller/products', isRead: false, createdAt: daysBack(1) }
    );
  }
  notifications.push(
    { recipient: admin._id, audience: 'ADMIN', title: 'Seller KYC pending.', body: 'Sweet Nothings Bakehouse submitted KYC documents.', icon: 'kyc', type: 'KYC', link: '/admin/sellers', isRead: false, createdAt: daysBack(1) },
    { recipient: admin._id, audience: 'ADMIN', title: '3 reviews awaiting moderation', body: 'Customers have flagged reviews for your attention.', icon: 'promo', type: 'GENERAL', link: '/admin/reviews', isRead: false, createdAt: daysBack(0) }
  );
  await Notification.insertMany(notifications);

  /* --- Deliberate low-stock rows so the seller dashboard has something to do --- */
  const lowStockPicks = pickN(products, 6);
  for (const p of lowStockPicks) {
    await Product.updateOne({ _id: p._id }, { $set: { stock: intBetween(1, 4) } });
  }
  await Product.updateOne({ _id: pickN(products, 1)[0]._id }, { $set: { stock: 0 } });

  console.log(`   ${notifications.length} notifications, ${reminders.length} gift reminders\n`);

  console.log('   ─────────────────────────────────────────────');
  console.log('   Seed complete.\n');
  console.log('   Demo accounts');
  console.log(`   Customer   ananya@upahaar.test    ${DEMO_PASSWORD}   (PIN 400001)`);
  console.log(`   Seller     seller@upahaar.test    ${DEMO_PASSWORD}   (Blooms & Bakes, Fort)`);
  console.log(`   Admin      admin@upahaar.test     ${ADMIN_PASSWORD}   (via /admin/login)`);
  console.log('\n   Other customers: rohan@ · sanya@ · arjun@ · meher@ · kabir@upahaar.test');
  console.log('   Other sellers:   cocoa@ · petal@ · hamper@ · cakecraft@ · priya@ · teddy@upahaar.test …');
  console.log('   ─────────────────────────────────────────────\n');

  await mongoose.disconnect();
}

seed().catch(async (err) => {
  console.error('\n  Seeding failed:', err);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
