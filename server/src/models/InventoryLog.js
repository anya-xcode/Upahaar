import mongoose from 'mongoose';

/** Append-only stock ledger so a mismatch can always be traced to a cause. */
const inventoryLogSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    seller: { type: mongoose.Schema.Types.ObjectId, ref: 'Seller', required: true, index: true },
    change: { type: Number, required: true }, // negative on sale, positive on restock
    stockAfter: { type: Number, required: true },
    reason: { type: String, enum: ['SALE', 'RESTOCK', 'ADJUSTMENT', 'CANCELLATION'], required: true },
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
    note: String,
  },
  { timestamps: true }
);

export default mongoose.model('InventoryLog', inventoryLogSchema);
