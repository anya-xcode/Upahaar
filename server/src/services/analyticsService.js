import User from '../models/User.js';
import Seller from '../models/Seller.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import Review from '../models/Review.js';
import Commission from '../models/Commission.js';
import Payment from '../models/Payment.js';
import cache from '../utils/cache.js';
import { startOfToday, daysAgo, money } from '../utils/helpers.js';
import { ORDER_STATUS, SELLER_STATUS, KYC_STATUS, TIER_META, TIER_ORDER, ROLES } from '../utils/constants.js';

/**
 * The admin's numbers.
 *
 * Every figure here is a full-collection scan — fifteen counts for the
 * dashboard, six aggregations for the charts — and the admin panel refetches
 * them on every visit. None of them need to be current to the second, so both
 * sets are read through a short-lived cache and the payload says how fresh it
 * is. An admin acting on something (approving a store, refunding an order)
 * drops the cache so their own click is reflected immediately.
 *
 * TTLs are deliberately different: the dashboard is a live pulse, the charts
 * are a thirty-day trend that barely moves within an hour.
 */

const DASHBOARD_KEY = 'admin:dashboard';
const ANALYTICS_KEY = 'admin:analytics';

const DASHBOARD_TTL = 30 * 1000;
const ANALYTICS_TTL = 5 * 60 * 1000;

/** Called after an admin write, so the panel never argues with itself. */
export function invalidateAnalytics() {
  cache.invalidate('admin:');
}

async function loadDashboard() {
  const today = startOfToday();

  const [
    totalUsers,
    totalSellers,
    activeSellers,
    pendingSellers,
    pendingKyc,
    totalOrders,
    todaysOrders,
    cancelledOrders,
    activeProducts,
    pendingProducts,
    pendingReviews,
    revenueAgg,
    todayRevenueAgg,
    commissionAgg,
    refundAgg,
  ] = await Promise.all([
    User.countDocuments({ role: ROLES.CUSTOMER }),
    Seller.countDocuments(),
    Seller.countDocuments({ status: SELLER_STATUS.ACTIVE }),
    Seller.countDocuments({ status: SELLER_STATUS.PENDING }),
    Seller.countDocuments({ kycStatus: KYC_STATUS.PENDING }),
    Order.countDocuments(),
    Order.countDocuments({ createdAt: { $gte: today } }),
    Order.countDocuments({ status: ORDER_STATUS.CANCELLED }),
    Product.countDocuments({ isActive: true, approvalStatus: 'APPROVED' }),
    Product.countDocuments({ approvalStatus: 'PENDING' }),
    Review.countDocuments({ status: 'PENDING' }),
    Order.aggregate([
      { $match: { status: { $ne: ORDER_STATUS.CANCELLED } } },
      { $group: { _id: null, total: { $sum: '$total' } } },
    ]),
    Order.aggregate([
      { $match: { status: { $ne: ORDER_STATUS.CANCELLED }, createdAt: { $gte: today } } },
      { $group: { _id: null, total: { $sum: '$total' } } },
    ]),
    Commission.aggregate([{ $group: { _id: null, total: { $sum: '$amount' } } }]),
    Payment.aggregate([
      { $match: { status: 'REFUNDED' } },
      { $group: { _id: null, total: { $sum: '$refundAmount' }, count: { $sum: 1 } } },
    ]),
  ]);

  return {
    generatedAt: new Date().toISOString(),
    stats: {
      totalUsers,
      totalSellers,
      activeSellers,
      pendingSellers,
      pendingKyc,
      totalOrders,
      todaysOrders,
      cancelledOrders,
      activeProducts,
      pendingProducts,
      pendingReviews,
      revenue: money(revenueAgg[0]?.total || 0),
      todayRevenue: money(todayRevenueAgg[0]?.total || 0),
      commission: money(commissionAgg[0]?.total || 0),
      refunds: money(refundAgg[0]?.total || 0),
      refundCount: refundAgg[0]?.count || 0,
    },
  };
}

async function loadAnalytics() {
  const [dailyRaw, monthlyRaw, byCategory, byLocation, byTier, topSellers] = await Promise.all([
    Order.aggregate([
      { $match: { createdAt: { $gte: daysAgo(29) }, status: { $ne: ORDER_STATUS.CANCELLED } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          revenue: { $sum: '$total' },
          orders: { $sum: 1 },
        },
      },
    ]),
    Order.aggregate([
      { $match: { status: { $ne: ORDER_STATUS.CANCELLED } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
          revenue: { $sum: '$total' },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      { $limit: 12 },
    ]),
    Order.aggregate([
      { $unwind: '$items' },
      { $lookup: { from: 'products', localField: 'items.product', foreignField: '_id', as: 'p' } },
      { $unwind: '$p' },
      { $lookup: { from: 'categories', localField: 'p.category', foreignField: '_id', as: 'c' } },
      { $unwind: '$c' },
      {
        $group: {
          _id: { name: '$c.name', icon: '$c.icon' },
          orders: { $sum: '$items.quantity' },
          revenue: { $sum: '$items.lineTotal' },
        },
      },
      { $sort: { revenue: -1 } },
      { $limit: 10 },
    ]),
    Order.aggregate([
      {
        $group: {
          _id: { pincode: '$shippingAddress.pincode', city: '$shippingAddress.city' },
          orders: { $sum: 1 },
          revenue: { $sum: '$total' },
        },
      },
      { $sort: { orders: -1 } },
      { $limit: 12 },
    ]),
    Order.aggregate([{ $group: { _id: '$deliveryTier', orders: { $sum: 1 }, revenue: { $sum: '$total' } } }]),
    Order.aggregate([
      { $match: { status: { $ne: ORDER_STATUS.CANCELLED } } },
      { $unwind: '$sellers' },
      { $group: { _id: '$sellers', orders: { $sum: 1 }, revenue: { $sum: '$total' } } },
      { $sort: { revenue: -1 } },
      { $limit: 8 },
      { $lookup: { from: 'sellers', localField: '_id', foreignField: '_id', as: 's' } },
      { $unwind: '$s' },
      { $project: { businessName: '$s.businessName', slug: '$s.slug', rating: '$s.rating', orders: 1, revenue: 1 } },
    ]),
  ]);

  // The daily series is filled out to a full 30 days so the chart never draws a
  // gap where a quiet day was.
  const dailyMap = Object.fromEntries(dailyRaw.map((d) => [d._id, d]));
  const dailySales = Array.from({ length: 30 }, (_, i) => {
    const key = daysAgo(29 - i).toISOString().slice(0, 10);
    return { date: key, revenue: dailyMap[key]?.revenue || 0, orders: dailyMap[key]?.orders || 0 };
  });

  const tierMap = Object.fromEntries(byTier.map((t) => [t._id, t]));

  return {
    generatedAt: new Date().toISOString(),
    dailySales,
    monthlyRevenue: monthlyRaw.map((m) => ({ month: m._id, revenue: m.revenue, orders: m.orders })),
    ordersByCategory: byCategory.map((c) => ({
      name: c._id.name,
      icon: c._id.icon,
      orders: c.orders,
      revenue: c.revenue,
    })),
    ordersByLocation: byLocation.map((l) => ({
      pincode: l._id.pincode,
      city: l._id.city,
      orders: l.orders,
      revenue: l.revenue,
    })),
    ordersByTier: TIER_ORDER.map((tier) => ({
      tier,
      label: TIER_META[tier].shortLabel,
      badge: TIER_META[tier].badge,
      orders: tierMap[tier]?.orders || 0,
      revenue: tierMap[tier]?.revenue || 0,
    })),
    topSellers,
  };
}

export function adminDashboard() {
  return cache.wrap(DASHBOARD_KEY, DASHBOARD_TTL, loadDashboard);
}

export function adminAnalytics() {
  return cache.wrap(ANALYTICS_KEY, ANALYTICS_TTL, loadAnalytics);
}

export default { adminDashboard, adminAnalytics, invalidateAnalytics };
