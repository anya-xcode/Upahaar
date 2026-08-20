import mongoose from 'mongoose';
import { COUPON_TYPES } from '../utils/constants.js';

const couponSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
    title: String,
    description: String,
    type: { type: String, enum: Object.values(COUPON_TYPES), default: COUPON_TYPES.PERCENT },
    value: { type: Number, required: true }, // 10 (percent) or 100 (rupees)
    maxDiscount: Number, // caps a percent coupon
    minOrderValue: { type: Number, default: 0 },

    // --- Targeting. An empty array means "applies everywhere". ---
    categories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }],
    sellers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Seller' }],
    pincodes: { type: [String], default: [] },
    /** Restricts the coupon to a customer's very first order. */
    firstOrderOnly: { type: Boolean, default: false },

    usageLimit: { type: Number, default: 0 }, // 0 = unlimited
    usageCount: { type: Number, default: 0 },
    perUserLimit: { type: Number, default: 1 },
    usedBy: [{ user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, count: Number }],

    startsAt: Date,
    expiresAt: Date,
    isActive: { type: Boolean, default: true, index: true },
    isVisible: { type: Boolean, default: true }, // shown in the coupons drawer
  },
  { timestamps: true }
);

export default mongoose.model('Coupon', couponSchema);
