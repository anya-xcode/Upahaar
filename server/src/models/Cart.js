import mongoose from 'mongoose';

const cartItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, default: 1, min: 1 },
    variant: String,
    personalization: {
      message: String,
      photoUrl: String,
    },
    deliveryDate: Date,
    deliveryWindow: String,
    specialInstructions: String,
    addedAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const cartSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    items: [cartItemSchema],
    /** Where the cart is being shipped — re-validated against seller coverage at checkout. */
    pincode: String,
    appliedCoupon: String,
  },
  { timestamps: true }
);

export default mongoose.model('Cart', cartSchema);
