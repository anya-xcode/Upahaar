import { Router } from 'express';
import authRoutes from './authRoutes.js';
import publicRoutes from './publicRoutes.js';
import customerRoutes from './customerRoutes.js';
import sellerRoutes from './sellerRoutes.js';
import adminRoutes from './adminRoutes.js';
import { TIER_META, TIER_ORDER, PRICE_BUCKETS, SORT_OPTIONS, ORDER_FLOW, ORDER_STATUS_META } from '../utils/constants.js';

const router = Router();

router.get('/health', (_req, res) => res.json({ success: true, service: 'upahaar-api', time: new Date() }));

/**
 * One place for the client to learn the platform's vocabulary, so tier labels,
 * badges and order steps are never hard-coded twice.
 */
router.get('/meta', (_req, res) =>
  res.json({
    success: true,
    tiers: TIER_ORDER.map((t) => TIER_META[t]),
    priceBuckets: PRICE_BUCKETS.map(({ key, label }) => ({ key, label })),
    sortOptions: SORT_OPTIONS,
    orderFlow: ORDER_FLOW,
    orderStatusMeta: ORDER_STATUS_META,
  })
);

router.use('/auth', authRoutes);

// Panels are mounted before the storefront so a seller/admin request is handled
// by its own router rather than falling through the public catalogue routes.
router.use('/seller', sellerRoutes);
router.use('/admin', adminRoutes);

// Public routes come before the customer ones: GET /reviews is browsable by
// anyone, while POST /reviews falls through to the authenticated router.
router.use('/', publicRoutes);
router.use('/', customerRoutes);

export default router;
