import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Seller from '../models/Seller.js';
import { ROLES, SELLER_STATUS } from '../utils/constants.js';
import { ApiError } from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';

function readToken(req) {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) return header.slice(7);
  return null;
}

/** Requires a valid token. Populates req.user. */
export const protect = asyncHandler(async (req, _res, next) => {
  const token = readToken(req);
  if (!token) throw new ApiError(401, 'Please sign in to continue');

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    throw new ApiError(401, 'Your session has expired. Please sign in again.');
  }

  const user = await User.findById(payload.id);
  if (!user || !user.isActive) throw new ApiError(401, 'Account not found or deactivated');

  req.user = user;
  next();
});

/** Attaches req.user when a token is present, but never blocks the request. */
export const optionalAuth = asyncHandler(async (req, _res, next) => {
  const token = readToken(req);
  if (!token) return next();
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(payload.id);
  } catch {
    // An expired token on a public route is not an error — just browse as a guest.
  }
  next();
});

/** Role gate. `restrictTo(ROLES.ADMIN)` etc. */
export const restrictTo =
  (...roles) =>
  (req, _res, next) => {
    if (!req.user) return next(new ApiError(401, 'Please sign in to continue'));
    if (!roles.includes(req.user.role)) {
      return next(new ApiError(403, 'You do not have permission to perform this action'));
    }
    next();
  };

/**
 * Resolves the seller profile behind the signed-in user and puts it on
 * req.seller, so seller controllers never have to trust a body-supplied id.
 */
export const requireSeller = asyncHandler(async (req, _res, next) => {
  if (req.user.role !== ROLES.SELLER) throw new ApiError(403, 'Seller access only');
  const seller = await Seller.findOne({ user: req.user._id });
  if (!seller) throw new ApiError(404, 'Seller profile not found');
  req.seller = seller;
  next();
});

/** Blocks suspended/pending sellers from the money-moving parts of the panel. */
export const requireActiveSeller = asyncHandler(async (req, _res, next) => {
  if (req.seller.status !== SELLER_STATUS.ACTIVE) {
    throw new ApiError(
      403,
      req.seller.status === SELLER_STATUS.PENDING
        ? 'Your store is awaiting admin approval'
        : 'Your store is currently suspended. Please contact support.'
    );
  }
  next();
});

export const adminOnly = [protect, restrictTo(ROLES.ADMIN)];
