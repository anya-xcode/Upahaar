import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { ROLES } from '../utils/constants.js';

const savedPaymentSchema = new mongoose.Schema(
  {
    label: String, // "HDFC Credit Card"
    method: String, // UPI | CARD | NETBANKING | WALLET
    maskedValue: String, // "•••• 4242" or "ananya@okhdfc"
    isDefault: { type: Boolean, default: false },
  },
  { _id: true, timestamps: false }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6, select: false },
    mobile: { type: String, trim: true },
    role: { type: String, enum: Object.values(ROLES), default: ROLES.CUSTOMER, index: true },
    avatar: String,

    // Set once the customer tells us where they are — powers the whole
    // location-first experience on every subsequent visit.
    defaultPincode: { type: String, index: true },

    savedPayments: [savedPaymentSchema],
    referralCode: { type: String, unique: true, sparse: true },
    referredBy: String,
    referralRewards: { type: Number, default: 0 },
    walletBalance: { type: Number, default: 0 },

    isActive: { type: Boolean, default: true },
    lastLoginAt: Date,
  },
  { timestamps: true }
);

userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

export default mongoose.model('User', userSchema);
