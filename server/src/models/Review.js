import mongoose from 'mongoose';

/**
 * One review row captures all three ratings a gifting order can earn — the
 * product itself, the seller who made it, and the delivery experience.
 */
const reviewSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', index: true },
    seller: { type: mongoose.Schema.Types.ObjectId, ref: 'Seller', index: true },
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    userName: String,

    productRating: { type: Number, min: 1, max: 5, required: true },
    sellerRating: { type: Number, min: 1, max: 5 },
    deliveryRating: { type: Number, min: 1, max: 5 },

    title: String,
    comment: String,
    images: [String],

    isVerifiedPurchase: { type: Boolean, default: false },
    /** Admin moderation gate — only APPROVED reviews reach the storefront. */
    status: { type: String, enum: ['PENDING', 'APPROVED', 'REJECTED'], default: 'APPROVED', index: true },
    moderationNote: String,
    helpfulCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model('Review', reviewSchema);
