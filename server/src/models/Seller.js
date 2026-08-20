import mongoose from 'mongoose';
import { SELLER_STATUS, KYC_STATUS } from '../utils/constants.js';

/**
 * A seller's delivery capability is what makes a product visible to a customer.
 * `servedPincodes` is the hard gate; `deliveryRadiusKm` + `location` refine the
 * ETA once we know the customer's pincode sits inside the coverage.
 */
const sellerSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },

    businessName: { type: String, required: true, trim: true },
    ownerName: { type: String, required: true, trim: true },
    mobile: { type: String, required: true },
    email: { type: String, required: true, lowercase: true },
    slug: { type: String, unique: true, index: true },
    tagline: String,
    description: String,
    storeImages: [String],
    logo: String,

    address: {
      line1: String,
      street: String,
      landmark: String,
      city: String,
      state: String,
      pincode: { type: String, index: true },
    },
    location: {
      lat: Number,
      lng: Number,
    },

    // --- Delivery capability ---
    servedPincodes: { type: [String], index: true, default: [] },
    deliveryRadiusKm: { type: Number, default: 10 },
    /** Local clock, 24h. Orders placed outside this window roll to the next day. */
    workingHours: {
      open: { type: String, default: '09:00' },
      close: { type: String, default: '21:00' },
    },
    workingDays: { type: [Number], default: [0, 1, 2, 3, 4, 5, 6] }, // 0 = Sunday
    /** Baseline dispatch overhead added on top of each product's prep time. */
    dispatchBufferMinutes: { type: Number, default: 10 },
    acceptsExpress: { type: Boolean, default: true },

    // --- Compliance ---
    gstNumber: String,
    panNumber: String,
    bankDetails: {
      accountHolder: String,
      accountNumber: String,
      ifsc: String,
      bankName: String,
    },
    kycDocuments: [
      {
        type: { type: String }, // GST | PAN | AADHAAR | SHOP_LICENSE | CANCELLED_CHEQUE
        url: String,
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    kycStatus: { type: String, enum: Object.values(KYC_STATUS), default: KYC_STATUS.NOT_SUBMITTED },

    // --- Platform controls ---
    status: { type: String, enum: Object.values(SELLER_STATUS), default: SELLER_STATUS.PENDING, index: true },
    statusReason: String,
    commissionRate: { type: Number, default: 12 }, // percent
    isFeatured: { type: Boolean, default: false },

    rating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
    deliveryRating: { type: Number, default: 0 },
    totalOrders: { type: Number, default: 0 },
    totalSales: { type: Number, default: 0 },
    joinedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

sellerSchema.index({ servedPincodes: 1, status: 1 });

export default mongoose.model('Seller', sellerSchema);
