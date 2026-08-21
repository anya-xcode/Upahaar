import mongoose from 'mongoose';

/**
 * The admin-controlled serviceability map. Even if a seller claims to cover a
 * pincode, the platform still has the final say here — this is what lets ops
 * switch off 60-minute delivery for an area during a storm or a festival rush.
 */
const pincodeSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, index: true },
    city: { type: String, required: true, index: true },
    state: { type: String, required: true },
    area: String,
    /** Administrative district — how ops groups a large market like Delhi. */
    district: { type: String, index: true },
    location: { lat: Number, lng: Number },

    isServiceable: { type: Boolean, default: true, index: true },
    express60Available: { type: Boolean, default: false },
    priority3hAvailable: { type: Boolean, default: false },
    nextDayAvailable: { type: Boolean, default: true },
    standardAvailable: { type: Boolean, default: true },

    /** Overrides the tier's default fee when set (null = use tier default). */
    expressFee: { type: Number, default: null },
    priorityFee: { type: Number, default: null },
    standardFee: { type: Number, default: null },

    codAvailable: { type: Boolean, default: true },
    deliveryPartners: { type: [String], default: [] },
    notes: String,
  },
  { timestamps: true }
);

export default mongoose.model('Pincode', pincodeSchema);
