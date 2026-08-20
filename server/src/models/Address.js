import mongoose from 'mongoose';

const addressSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    label: { type: String, default: 'Home' }, // Home | Work | Other
    name: { type: String, required: true },
    mobile: { type: String, required: true },
    pincode: { type: String, required: true, index: true },
    house: { type: String, required: true },
    street: String,
    landmark: String,
    city: { type: String, required: true },
    state: { type: String, required: true },
    /** Captured from the Google Maps picker at checkout. */
    location: {
      lat: Number,
      lng: Number,
      formatted: String,
    },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model('Address', addressSchema);
