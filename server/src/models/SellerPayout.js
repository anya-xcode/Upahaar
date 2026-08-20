import mongoose from 'mongoose';

const sellerPayoutSchema = new mongoose.Schema(
  {
    seller: { type: mongoose.Schema.Types.ObjectId, ref: 'Seller', required: true, index: true },
    periodStart: Date,
    periodEnd: Date,
    orderCount: { type: Number, default: 0 },
    grossSales: { type: Number, default: 0 },
    commissionDeducted: { type: Number, default: 0 },
    netPayable: { type: Number, default: 0 },
    status: { type: String, enum: ['PENDING', 'PROCESSING', 'PAID', 'FAILED'], default: 'PENDING', index: true },
    utr: String,
    paidAt: Date,
    notes: String,
  },
  { timestamps: true }
);

export default mongoose.model('SellerPayout', sellerPayoutSchema);
