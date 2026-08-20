import mongoose from 'mongoose';

/**
 * "Mom's Birthday — 14 September". Stored as month/day rather than a full date
 * so the occasion repeats every year without the customer re-entering it.
 */
const giftReminderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true }, // "Mom's Birthday"
    relation: String, // Mother | Spouse | Friend
    occasion: { type: mongoose.Schema.Types.ObjectId, ref: 'Occasion' },
    occasionName: String,
    month: { type: Number, required: true, min: 1, max: 12 },
    day: { type: Number, required: true, min: 1, max: 31 },
    /** How many days ahead we nudge them. */
    remindDaysBefore: { type: Number, default: 7 },
    notes: String,
    isActive: { type: Boolean, default: true },
    lastNotifiedYear: Number,
  },
  { timestamps: true }
);

export default mongoose.model('GiftReminder', giftReminderSchema);
