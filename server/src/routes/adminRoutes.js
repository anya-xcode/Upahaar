import { Router } from 'express';
import * as admin from '../controllers/adminController.js';
import * as cms from '../controllers/adminCmsController.js';
import { protect, restrictTo } from '../middleware/auth.js';
import { ROLES } from '../utils/constants.js';

const router = Router();

router.use(protect, restrictTo(ROLES.ADMIN));

/* ------------------------------- Dashboard ------------------------------- */
router.get('/dashboard', admin.dashboard);
router.get('/analytics', admin.analytics);

/* ---------------------------- Seller management -------------------------- */
router.get('/sellers', admin.listSellers);
router.get('/sellers/:id', admin.getSeller);
router.patch('/sellers/:id', admin.updateSeller);
router.patch('/sellers/:id/status', admin.updateSellerStatus);
router.patch('/sellers/:id/kyc', admin.updateSellerKyc);

/* ------------------------------ Users & orders --------------------------- */
router.get('/users', admin.listUsers);
router.patch('/users/:id/toggle', admin.toggleUserActive);

router.get('/orders', admin.listOrders);
router.get('/orders/:orderId', admin.getOrder);
router.post('/orders/:orderId/refund', admin.refundOrder);

/* -------------------------------- Products ------------------------------- */
router.get('/products', cms.listAllProducts);
router.patch('/products/:id', cms.toggleProductActive);

/* ------------------------------ Moderation ------------------------------- */
router.get('/reviews', admin.listAllReviews);
router.patch('/reviews/:id', admin.moderateReview);

/* -------------------------------- Payouts -------------------------------- */
router.get('/payouts', admin.listPayouts);
router.post('/payouts/:sellerId', admin.createPayout);

/* ---------------------------- PIN code manager --------------------------- */
router.get('/pincodes', cms.listPincodes);
router.post('/pincodes', cms.createPincode);
router.get('/pincodes/:code/detail', cms.pincodeDetail);
router.patch('/pincodes/:id', cms.updatePincode);
router.delete('/pincodes/:id', cms.deletePincode);

router.get('/zones', cms.zones.list);
router.post('/zones', cms.zones.create);
router.patch('/zones/:id', cms.zones.update);
router.delete('/zones/:id', cms.zones.remove);

/* -------------------------------- Coupons -------------------------------- */
router.get('/coupons', cms.listCoupons);
router.post('/coupons', cms.createCoupon);
router.patch('/coupons/:id', cms.updateCoupon);
router.delete('/coupons/:id', cms.deleteCoupon);

/* ---------------------------------- CMS ---------------------------------- */
router.get('/categories', cms.categories.list);
router.post('/categories', cms.categories.create);
router.patch('/categories/:id', cms.categories.update);
router.delete('/categories/:id', cms.categories.remove);

router.get('/occasions', cms.occasions.list);
router.post('/occasions', cms.occasions.create);
router.patch('/occasions/:id', cms.occasions.update);
router.delete('/occasions/:id', cms.occasions.remove);

router.get('/banners', cms.banners.list);
router.post('/banners', cms.banners.create);
router.patch('/banners/:id', cms.banners.update);
router.delete('/banners/:id', cms.banners.remove);

router.get('/faqs', cms.faqs.list);
router.post('/faqs', cms.faqs.create);
router.patch('/faqs/:id', cms.faqs.update);
router.delete('/faqs/:id', cms.faqs.remove);

router.get('/posts', cms.posts.list);
router.post('/posts', cms.posts.create);
router.patch('/posts/:id', cms.posts.update);
router.delete('/posts/:id', cms.posts.remove);

/* ------------------------------ Notifications ---------------------------- */
router.get('/notifications', cms.adminNotifications);
router.post('/notifications/broadcast', cms.broadcast);

export default router;
