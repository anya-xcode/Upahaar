import { Router } from 'express';
import * as seller from '../controllers/sellerController.js';
import { protect, restrictTo, requireSeller, requireActiveSeller } from '../middleware/auth.js';
import { ROLES } from '../utils/constants.js';

const router = Router();

// Every route below resolves req.seller from the token — a seller can never
// read or write another store by passing an id.
router.use(protect, restrictTo(ROLES.SELLER), requireSeller);

/* ---- Available while the store is still pending approval ---- */
router.get('/profile', seller.getProfile);
router.patch('/profile', seller.updateProfile);
router.post('/kyc', seller.submitKyc);
router.get('/dashboard', seller.dashboard);
router.get('/coverage', seller.coverage);
router.get('/meta', seller.productFormMeta);

/* ---- Trading requires an approved store ---- */
router.use(requireActiveSeller);

router.get('/products', seller.listProducts);
router.post('/products', seller.createProduct);
router.get('/products/:id', seller.getProduct);
router.patch('/products/:id', seller.updateProduct);
router.delete('/products/:id', seller.deleteProduct);
router.patch('/products/:id/stock', seller.adjustStock);
router.get('/inventory/log', seller.inventoryLog);

router.get('/orders', seller.listOrders);
router.get('/orders/:orderId', seller.getOrder);
router.patch('/orders/:orderId/status', seller.updateOrderStatus);
router.post('/orders/:orderId/cancel', seller.cancelOrder);

router.get('/reviews', seller.listReviews);
router.get('/payouts', seller.listPayouts);

export default router;
