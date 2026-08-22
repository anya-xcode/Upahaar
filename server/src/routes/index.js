import { Router } from 'express';
import mongoose from 'mongoose';
import authRoutes from './authRoutes.js';
import publicRoutes from './publicRoutes.js';
import customerRoutes from './customerRoutes.js';
import sellerRoutes from './sellerRoutes.js';
import adminRoutes from './adminRoutes.js';
import { TIER_META, TIER_ORDER, PRICE_BUCKETS, SORT_OPTIONS, ORDER_FLOW, ORDER_STATUS_META } from '../utils/constants.js';

const router = Router();

/** Flipped by the shutdown handler so this instance stops taking new traffic. */
let draining = false;
export function beginDraining() {
  draining = true;
}

/**
 * Liveness: is the process up? Answers without touching anything, so a
 * restarter never kills a healthy process because the database is slow.
 */
router.get('/health', (_req, res) =>
  res.json({ success: true, service: 'upahaar-api', uptime: Math.round(process.uptime()), time: new Date() })
);

/**
 * Readiness: should this instance be sent traffic? It should not, if it cannot
 * reach MongoDB — a load balancer needs to know that before a customer does.
 * Draining sets `ready` false so in-flight work finishes while new requests go
 * elsewhere.
 */
router.get('/ready', async (_req, res) => {
  const state = mongoose.connection.readyState; // 0 disconnected · 1 connected · 2 connecting · 3 disconnecting
  let database = state === 1 ? 'up' : 'down';

  if (state === 1) {
    try {
      await mongoose.connection.db.admin().command({ ping: 1 });
    } catch {
      // Connected in name only — the socket is open but the server isn't answering.
      database = 'down';
    }
  }

  const ready = database === 'up' && !draining;
  res.status(ready ? 200 : 503).json({
    success: ready,
    service: 'upahaar-api',
    ready,
    draining,
    database,
    uptime: Math.round(process.uptime()),
  });
});

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
