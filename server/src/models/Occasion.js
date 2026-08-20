import mongoose from 'mongoose';

const occasionSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, index: true },
    /** Stable glyph key the client maps to an icon (e.g. 'birthday'). */
    icon: String,
    image: String,
    tagline: String,
    /** Optional calendar hook — drives "Valentine's Day is in 12 days" banners. */
    month: Number,
    day: Number,
    displayOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model('Occasion', occasionSchema);
