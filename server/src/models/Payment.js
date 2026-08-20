import mongoose from 'mongoose';
import { PAYMENT_METHODS, PAYMENT_STATUS } from '../utils/constants.js';

const paymentSchema = new mongoose.Schema(
  {
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    amount: { type: Number, required: true },
    method: { type: String, enum: Object.values(PAYMENT_METHODS), required: true },
    status: { type: String, enum: Object.values(PAYMENT_STATUS), default: PAYMENT_STATUS.PENDING },

    // Razorpay handles fill these in once real keys are configured; until then
    // the checkout runs in simulated mode and only `reference` is set.
    gateway: { type: String, default: 'simulated' },
    razorpayOrderId: String,
    razorpayPaymentId: String,
    razorpaySignature: String,
    reference: String,

    refundedAt: Date,
    refundAmount: { type: Number, default: 0 },
    failureReason: String,
  },
  { timestamps: true }
);

export default mongoose.model('Payment', paymentSchema);
