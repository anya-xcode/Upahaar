import mongoose from 'mongoose';
import { NOTIFICATION_AUDIENCE } from '../utils/constants.js';

const notificationSchema = new mongoose.Schema(
  {
    /** Null recipient + an audience means "broadcast to every user of that role". */
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    audience: { type: String, enum: Object.values(NOTIFICATION_AUDIENCE), required: true, index: true },
    title: { type: String, required: true },
    body: String,
    /** Stable glyph key the client maps to an icon. */
    icon: String,
    type: { type: String, default: 'GENERAL' }, // ORDER | INVENTORY | KYC | PROMO | REMINDER
    link: String, // in-app route to open on tap
    meta: mongoose.Schema.Types.Mixed,
    isRead: { type: Boolean, default: false, index: true },
    readAt: Date,
  },
  { timestamps: true }
);

notificationSchema.index({ createdAt: -1 });

export default mongoose.model('Notification', notificationSchema);
