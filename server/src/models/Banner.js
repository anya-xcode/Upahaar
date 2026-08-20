import mongoose from 'mongoose';

const bannerSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    subtitle: String,
    icon: String,
    image: String,
    ctaLabel: String,
    ctaLink: String,
    /** Where it renders: HERO | STRIP | CATEGORY | OCCASION */
    placement: { type: String, default: 'HERO', index: true },
    theme: { from: String, to: String, text: String },
    /** Empty = show everywhere; otherwise only for these pincodes. */
    pincodes: { type: [String], default: [] },
    displayOrder: { type: Number, default: 0 },
    startsAt: Date,
    endsAt: Date,
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

export default mongoose.model('Banner', bannerSchema);
