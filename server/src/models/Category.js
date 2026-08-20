import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, index: true },
    /** Stable glyph key the client maps to an icon (e.g. 'cakes'). */
    icon: String,
    image: String,
    description: String,
    /** Warm gradient pair used by the category tile in the UI. */
    accent: { from: String, to: String },
    displayOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
    productCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model('Category', categorySchema);
