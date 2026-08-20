import mongoose from 'mongoose';

/** One row per delivered order — the platform's cut, ready to net off a payout. */
const commissionSchema = new mongoose.Schema(
  {
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
    seller: { type: mongoose.Schema.Types.ObjectId, ref: 'Seller', required: true, index: true },
    orderAmount: { type: Number, required: true },
    rate: { type: Number, required: true }, // percent applied at the time
    amount: { type: Number, required: true },
    sellerEarning: { type: Number, required: true },
    status: { type: String, enum: ['PENDING', 'SETTLED'], default: 'PENDING', index: true },
    payout: { type: mongoose.Schema.Types.ObjectId, ref: 'SellerPayout' },
  },
  { timestamps: true }
);

export default mongoose.model('Commission', commissionSchema);
