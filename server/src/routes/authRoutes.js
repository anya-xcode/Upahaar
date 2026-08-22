import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import * as auth from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import validate from '../middleware/validate.js';
import {
  registerSchema,
  loginSchema,
  sellerRegisterSchema,
  changePasswordSchema,
} from '../utils/schemas.js';

const router = Router();

/** Credential endpoints get a tighter budget than the rest of the API. */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many attempts. Please try again in a few minutes.' },
});

router.post('/register', loginLimiter, validate({ body: registerSchema }), auth.register);
router.post('/login', loginLimiter, validate({ body: loginSchema }), auth.login);
// The admin door validates nothing beyond "two strings arrived" on purpose —
// a shape error here would tell a prober which half of the pair was wrong.
router.post('/admin/login', loginLimiter, auth.adminLogin);
router.post('/seller/register', loginLimiter, validate({ body: sellerRegisterSchema }), auth.registerSeller);

router.get('/me', protect, auth.me);
router.patch('/me', protect, auth.updateMe);
router.patch('/password', protect, validate({ body: changePasswordSchema }), auth.changePassword);

export default router;
