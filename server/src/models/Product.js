import mongoose from 'mongoose';
import { DELIVERY_TIERS } from '../utils/constants.js';

const variantSchema = new mongoose.Schema(
  {
    name: String, // "500g" / "Red Roses"
    priceDelta: { type: Number, default: 0 },
    stock: { type: Number, default: 0 },
  },
  { _id: true }
);

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, index: 'text' },
    slug: { type: String, unique: true, index: true },
    description: String,
    highlights: [String],
    images: { type: [String], default: [] },

    seller: { type: mongoose.Schema.Types.ObjectId, ref: 'Seller', required: true, index: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true, index: true },
    occasions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Occasion', index: true }],

    price: { type: Number, required: true, min: 0 },
    /** Struck-through reference price. Discount % is derived from the pair. */
    mrp: { type: Number, min: 0 },

    stock: { type: Number, default: 0 },
    lowStockThreshold: { type: Number, default: 5 },
    variants: [variantSchema],

    // --- Delivery capability, declared per product by the seller ---
    /** The best tier this product can ever hit, before location is considered. */
    baseTier: {
      type: String,
      enum: Object.values(DELIVERY_TIERS),
      default: DELIVERY_TIERS.NEXT_DAY,
      index: true,
    },
    /** Minutes of making/packing before a rider can collect it. */
    prepTimeMinutes: { type: Number, default: 45 },
    /** Perishables (cakes, flowers) never ship long distance. */
    isPerishable: { type: Boolean, default: false },

    // --- Personalisation ---
    personalizable: { type: Boolean, default: false },
    allowsPhotoUpload: { type: Boolean, default: false },
    personalizationNote: String,
    personalizationFee: { type: Number, default: 0 },

    tags: [String],
    rating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
    soldCount: { type: Number, default: 0 },
    viewCount: { type: Number, default: 0 },

    /** The seller's own visibility switch. */
    isActive: { type: Boolean, default: true, index: true },
    isFeatured: { type: Boolean, default: false },
    isBestSeller: { type: Boolean, default: false },

    /**
     * The admin gate. A seller can create and edit freely, but nothing reaches
     * a customer until it has been reviewed — the storefront requires
     * APPROVED, so PENDING and REJECTED products are invisible to shoppers
     * while staying fully visible to their seller.
     */
    approvalStatus: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED'],
      default: 'PENDING',
      index: true,
    },
    approvalNote: String,
    submittedAt: { type: Date, default: Date.now },
    reviewedAt: Date,
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

productSchema.virtual('discountPercent').get(function discountPercent() {
  if (!this.mrp || this.mrp <= this.price) return 0;
  return Math.round(((this.mrp - this.price) / this.mrp) * 100);
});

productSchema.virtual('inStock').get(function inStock() {
  return this.stock > 0;
});

productSchema.virtual('isLowStock').get(function isLowStock() {
  return this.stock > 0 && this.stock <= this.lowStockThreshold;
});

productSchema.index({ name: 'text', description: 'text', tags: 'text' });

export default mongoose.model('Product', productSchema);
