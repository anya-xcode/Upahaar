import { Router } from 'express';
import * as cart from '../controllers/cartController.js';
import * as orders from '../controllers/orderController.js';
import * as account from '../controllers/accountController.js';
import * as reviews from '../controllers/reviewController.js';
import { protect, restrictTo } from '../middleware/auth.js';
import { ROLES } from '../utils/constants.js';

/**
 * Shopping is a customer activity — a seller or admin token must not reach it.
 *
 * Each group is a router of its own, mounted under its own prefix. Guarding a
 * single router mounted at '/' would run this check against every request that
 * merely passes through on its way to /seller or /admin.
 */
const customerOnly = [protect, restrictTo(ROLES.CUSTOMER)];

/* -------------------------------- Cart -------------------------------- */
const cartRouter = Router();
cartRouter.use(customerOnly);
cartRouter.get('/', cart.getCart);
cartRouter.post('/items', cart.addItem);
cartRouter.patch('/items/:itemId', cart.updateItem);
cartRouter.delete('/items/:itemId', cart.removeItem);
cartRouter.delete('/', cart.clearCart);
cartRouter.patch('/pincode', cart.setPincode);
cartRouter.post('/coupon', cart.applyCartCoupon);
cartRouter.delete('/coupon', cart.removeCartCoupon);

/* ------------------------------- Orders ------------------------------- */
const orderRouter = Router();
orderRouter.use(customerOnly);
orderRouter.post('/', orders.placeOrder);
orderRouter.get('/', orders.myOrders);
orderRouter.get('/:orderId', orders.getOrder);
orderRouter.get('/:orderId/track', orders.trackOrder);
orderRouter.post('/:orderId/cancel', orders.cancelOrder);
orderRouter.post('/:orderId/simulate', orders.simulateAdvance);

/* ------------------------------- Account ------------------------------ */
const accountRouter = Router();
accountRouter.use(customerOnly);
accountRouter.get('/summary', account.accountSummary);

accountRouter.get('/addresses', account.listAddresses);
accountRouter.post('/addresses', account.createAddress);
accountRouter.patch('/addresses/:id', account.updateAddress);
accountRouter.delete('/addresses/:id', account.deleteAddress);

accountRouter.get('/wishlist', account.getWishlist);
accountRouter.get('/wishlist/ids', account.wishlistIds);
accountRouter.post('/wishlist/:productId', account.addToWishlist);
accountRouter.delete('/wishlist/:productId', account.removeFromWishlist);

accountRouter.get('/reminders', account.listReminders);
accountRouter.post('/reminders', account.createReminder);
accountRouter.patch('/reminders/:id', account.updateReminder);
accountRouter.delete('/reminders/:id', account.deleteReminder);

accountRouter.get('/notifications', account.listNotifications);
accountRouter.patch('/notifications/read-all', account.markAllNotificationsRead);
accountRouter.patch('/notifications/:id/read', account.markNotificationRead);

accountRouter.get('/payments', account.listSavedPayments);
accountRouter.post('/payments', account.addSavedPayment);
accountRouter.delete('/payments/:id', account.deleteSavedPayment);

accountRouter.get('/coupons', account.myCoupons);

/* ------------------------------- Reviews ------------------------------ */
const reviewRouter = Router();
reviewRouter.use(customerOnly);
reviewRouter.post('/', reviews.createReview);
reviewRouter.get('/mine', reviews.myReviews);
reviewRouter.get('/pending', reviews.pendingReviews);
reviewRouter.delete('/:id', reviews.deleteReview);

const router = Router();
router.use('/cart', cartRouter);
router.use('/orders', orderRouter);
router.use('/account', accountRouter);
router.use('/reviews', reviewRouter);

export default router;
