import mongoose from 'mongoose';

/** A named cluster of pincodes — how ops reason about a city rather than 40 codes. */
const deliveryZoneSchema = new mongoose.Schema(
  {
    name: { type: String, required: true }, // "South Mumbai"
    city: { type: String, required: true, index: true },
    state: { type: String, required: true },
    pincodes: { type: [String], default: [], index: true },
    hubLocation: { lat: Number, lng: Number },
    deliveryPartners: { type: [String], default: [] },
    /** Riders on shift right now; zero means express degrades to priority. */
    activeRiders: { type: Number, default: 0 },
    express60Enabled: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model('DeliveryZone', deliveryZoneSchema);
