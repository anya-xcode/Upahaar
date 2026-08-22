import User from '../models/User.js';
import Seller from '../models/Seller.js';
import Cart from '../models/Cart.js';
import Wishlist from '../models/Wishlist.js';
import asyncHandler from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { signToken, randomReferralCode, uniqueSlug } from '../utils/helpers.js';
import { ROLES, SELLER_STATUS, KYC_STATUS } from '../utils/constants.js';
import { notifyAdmins, notifyCustomer } from '../services/notificationService.js';

function publicUser(user, seller = null) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    mobile: user.mobile,
    role: user.role,
    avatar: user.avatar,
    defaultPincode: user.defaultPincode,
    referralCode: user.referralCode,
    referralRewards: user.referralRewards,
    walletBalance: user.walletBalance,
    seller: seller
      ? {
          id: seller._id,
          businessName: seller.businessName,
          slug: seller.slug,
          status: seller.status,
          kycStatus: seller.kycStatus,
        }
      : null,
  };
}

async function respondWithSession(res, user, statusCode = 200) {
  const seller = user.role === ROLES.SELLER ? await Seller.findOne({ user: user._id }) : null;
  user.lastLoginAt = new Date();
  await user.save({ validateBeforeSave: false });
  res.status(statusCode).json({
    success: true,
    token: signToken(user),
    user: publicUser(user, seller),
  });
}

/** POST /api/auth/register — customer signup. */
export const register = asyncHandler(async (req, res) => {
  const { name, email, password, mobile, pincode, referredBy } = req.body;

  const exists = await User.findOne({ email });
  if (exists) throw new ApiError(409, 'An account with that email already exists');

  const user = await User.create({
    name,
    email,
    password,
    mobile,
    defaultPincode: pincode,
    role: ROLES.CUSTOMER,
    referralCode: randomReferralCode(name),
    referredBy,
  });

  // A customer always has exactly one cart and one wishlist.
  await Promise.all([Cart.create({ user: user._id, items: [] }), Wishlist.create({ user: user._id, products: [] })]);

  await notifyCustomer(user._id, {
    title: 'Welcome to Upahaar',
    body: "Use WELCOME10 for 10% off your first gift. Let's make someone's day.",
    icon: 'welcome',
    type: 'PROMO',
    link: '/account/coupons',
  });

  await respondWithSession(res, user, 201);
});

/** POST /api/auth/login — customers and sellers. */
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    throw new ApiError(401, 'Incorrect email or password');
  }
  if (!user.isActive) throw new ApiError(403, 'This account has been deactivated');
  if (user.role === ROLES.ADMIN) {
    throw new ApiError(403, 'Admins must sign in through the admin portal');
  }

  await respondWithSession(res, user);
});

/**
 * POST /api/auth/admin/login — deliberately a separate door from the
 * storefront login so an admin credential can never be tried against it.
 */
export const adminLogin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email: String(email || '').toLowerCase() }).select('+password');

  if (!user || user.role !== ROLES.ADMIN || !(await user.comparePassword(password || ''))) {
    throw new ApiError(401, 'Invalid admin credentials');
  }
  await respondWithSession(res, user);
});

/** POST /api/auth/seller/register — creates the user *and* the pending store. */
export const registerSeller = asyncHandler(async (req, res) => {
  const {
    name,
    email,
    password,
    mobile,
    businessName,
    ownerName,
    address = {},
    servedPincodes = [],
    deliveryRadiusKm,
    gstNumber,
    panNumber,
    bankDetails,
    description,
  } = req.body;

  if (await User.findOne({ email })) {
    throw new ApiError(409, 'An account with that email already exists');
  }

  const user = await User.create({
    name: name || ownerName || businessName,
    email,
    password,
    mobile,
    role: ROLES.SELLER,
    referralCode: randomReferralCode(businessName),
  });

  const seller = await Seller.create({
    user: user._id,
    businessName,
    ownerName: ownerName || name,
    mobile,
    email,
    slug: await uniqueSlug(Seller, businessName),
    description,
    address,
    servedPincodes,
    deliveryRadiusKm: deliveryRadiusKm ?? 10,
    gstNumber,
    panNumber,
    bankDetails,
    status: SELLER_STATUS.PENDING,
    kycStatus: gstNumber || panNumber ? KYC_STATUS.PENDING : KYC_STATUS.NOT_SUBMITTED,
  });

  await notifyAdmins({
    title: 'New seller application',
    body: `${seller.businessName} applied to sell on Upahaar.`,
    icon: 'store',
    type: 'KYC',
    link: '/admin/sellers',
    meta: { sellerId: seller._id },
  });

  await respondWithSession(res, user, 201);
});

/** GET /api/auth/me */
export const me = asyncHandler(async (req, res) => {
  const seller = req.user.role === ROLES.SELLER ? await Seller.findOne({ user: req.user._id }) : null;
  res.json({ success: true, user: publicUser(req.user, seller) });
});

/** PATCH /api/auth/me */
export const updateMe = asyncHandler(async (req, res) => {
  const allowed = ['name', 'mobile', 'avatar', 'defaultPincode'];
  allowed.forEach((field) => {
    if (req.body[field] !== undefined) req.user[field] = req.body[field];
  });
  await req.user.save();
  const seller = req.user.role === ROLES.SELLER ? await Seller.findOne({ user: req.user._id }) : null;
  res.json({ success: true, user: publicUser(req.user, seller) });
});

/** PATCH /api/auth/password */
export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id).select('+password');
  if (!(await user.comparePassword(currentPassword))) throw new ApiError(401, 'Current password is incorrect');

  user.password = newPassword;
  await user.save();
  res.json({ success: true, message: 'Password updated' });
});
