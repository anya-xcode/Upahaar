import mongoose from 'mongoose';

/** Backs both the blog and the curated "gift guides" surface. */
const blogPostSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true, index: true },
    excerpt: String,
    body: String,
    coverImage: String,
    author: { type: String, default: 'Team Upahaar' },
    kind: { type: String, enum: ['BLOG', 'GIFT_GUIDE'], default: 'BLOG', index: true },
    tags: [String],
    /** Gift guides can point at a curated product set. */
    products: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
    readMinutes: { type: Number, default: 4 },
    isPublished: { type: Boolean, default: true, index: true },
    publishedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.model('BlogPost', blogPostSchema);
