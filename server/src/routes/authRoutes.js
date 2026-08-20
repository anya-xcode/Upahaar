import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import * as auth from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';

const router = Router();

/** Credential endpoints get a tighter budget than the rest of the API. */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many attempts. Please try again in a few minutes.' },
});

router.post('/register', loginLimiter, auth.register);
router.post('/login', loginLimiter, auth.login);
router.post('/admin/login', loginLimiter, auth.adminLogin);
router.post('/seller/register', loginLimiter, auth.registerSeller);

router.get('/me', protect, auth.me);
router.patch('/me', protect, auth.updateMe);
router.patch('/password', protect, auth.changePassword);

export default router;
