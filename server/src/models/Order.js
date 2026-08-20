import mongoose from 'mongoose';
import { ORDER_STATUS, DELIVERY_TIERS, PAYMENT_METHODS, PAYMENT_STATUS } from '../utils/constants.js';

/** Line items snapshot price/name so a later seller edit never rewrites history. */
const orderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    seller: { type: mongoose.Schema.Types.ObjectId, ref: 'Seller', required: true, index: true },
    name: { type: String, required: true },
    image: String,
    variant: String,
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true },
    mrp: Number,
    personalization: {
      message: String,
      photoUrl: String,
      fee: { type: Number, default: 0 },
    },
    tier: { type: String, enum: Object.values(DELIVERY_TIERS) },
    lineTotal: { type: Number, required: true },
  },
  { _id: true }
);

const timelineEntrySchema = new mongoose.Schema(
  {
    status: { type: String, enum: Object.values(ORDER_STATUS), required: true },
    label: String,
    note: String,
    at: { type: Date, default: Date.now },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderId: { type: String, required: true, unique: true, index: true }, // GFT1024
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    /** Denormalised for the seller dashboard, which lists many orders at once. */
    customerName: String,
    items: [orderItemSchema],
    sellers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Seller', index: true }],

    shippingAddress: {
      name: String,
      mobile: String,
      pincode: { type: String, index: true },
      house: String,
      street: String,
      landmark: String,
      city: String,
      state: String,
      location: { lat: Number, lng: Number, formatted: String },
    },

    deliveryTier: { type: String, enum: Object.values(DELIVERY_TIERS), required: true },
    deliverySlot: {
      date: Date,
      /** Human window the customer chose, e.g. "4:00 PM – 7:00 PM". */
      window: String,
    },
    estimatedDeliveryAt: Date,
    deliveredAt: Date,
    specialInstructions: String,

    giftOptions: {
      giftWrap: { type: Boolean, default: false },
      giftWrapFee: { type: Number, default: 0 },
      greetingCard: { type: Boolean, default: false },
      greetingCardFee: { type: Number, default: 0 },
      giftMessage: String,
      hidePrice: { type: Boolean, default: false },
    },

    // --- Money ---
    subtotal: { type: Number, required: true },
    personalizationTotal: { type: Number, default: 0 },
    giftOptionsTotal: { type: Number, default: 0 },
    deliveryFee: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    coupon: {
      code: String,
      discount: Number,
    },
    total: { type: Number, required: true },
    commissionAmount: { type: Number, default: 0 },

    paymentMethod: { type: String, enum: Object.values(PAYMENT_METHODS), required: true },
    paymentStatus: { type: String, enum: Object.values(PAYMENT_STATUS), default: PAYMENT_STATUS.PENDING },

    status: { type: String, enum: Object.values(ORDER_STATUS), default: ORDER_STATUS.PLACED, index: true },
    timeline: [timelineEntrySchema],
    cancellationReason: String,
    refundAmount: { type: Number, default: 0 },

    deliveryPartner: {
      name: String,
      mobile: String,
      vehicle: String,
    },

    isReviewed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

orderSchema.index({ createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });

export default mongoose.model('Order', orderSchema);
