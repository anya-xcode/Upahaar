import Pincode from '../models/Pincode.js';
import Seller from '../models/Seller.js';
import asyncHandler from '../utils/asyncHandler.js';
import { resolveLocation, tierCountsFor } from '../services/catalogService.js';
import { resolveFee } from '../services/deliveryEngine.js';
import { TIER_META, TIER_ORDER } from '../utils/constants.js';

/**
 * GET /api/location/check?pincode=400001
 *
 * The moment that defines the product: the customer tells us where they are,
 * and we answer with exactly how fast we can get a gift to them.
 */
export const checkPincode = asyncHandler(async (req, res) => {
  const code = String(req.query.pincode || '').trim();

  if (!/^\d{6}$/.test(code)) {
    return res.status(400).json({ success: false, message: 'Please enter a valid 6-digit PIN code' });
  }

  const { pincodeDoc, zone } = await resolveLocation(code);

  if (!pincodeDoc || !pincodeDoc.isServiceable) {
    return res.json({
      success: true,
      serviceable: false,
      pincode: code,
      message: `We don't deliver to ${code} yet — we're expanding fast.`,
      tiers: [],
    });
  }

  const sellers = await Seller.find({ servedPincodes: code, status: 'ACTIVE' }).select('_id').lean();

  // Counted, not loaded: the local half is classified and the shipped half is
  // a single countDocuments, so this stays flat as the catalogue grows.
  const counts = await tierCountsFor(pincodeDoc, zone);

  const tiers = TIER_ORDER.filter((t) => counts[t] > 0).map((tier) => ({
    ...TIER_META[tier],
    tier,
    productCount: counts[tier],
    fee: resolveFee(tier, pincodeDoc),
  }));

  res.json({
    success: true,
    serviceable: true,
    pincode: code,
    city: pincodeDoc.city,
    state: pincodeDoc.state,
    area: pincodeDoc.area,
    message: `Great! We deliver to ${code}`,
    sellerCount: sellers.length,
    codAvailable: pincodeDoc.codAvailable,
    deliveryPartners: pincodeDoc.deliveryPartners,
    tiers,
  });
});

/** GET /api/location/suggest?q=4000 — autocomplete for the pincode input. */
export const suggestPincodes = asyncHandler(async (req, res) => {
  const q = String(req.query.q || '').trim();
  const filter = { isServiceable: true };
  if (q) {
    const rx = new RegExp(`^${q.replace(/[^\w\s]/g, '')}`, 'i');
    filter.$or = [{ code: rx }, { city: rx }, { area: rx }];
  }
  const pincodes = await Pincode.find(filter).select('code city state area express60Available').sort('code').limit(12).lean();
  res.json({ success: true, pincodes });
});

/** GET /api/location/cities — grouped serviceability map for the footer/coverage page. */
export const serviceableCities = asyncHandler(async (_req, res) => {
  const cities = await Pincode.aggregate([
    { $match: { isServiceable: true } },
    {
      $group: {
        _id: { city: '$city', state: '$state' },
        pincodeCount: { $sum: 1 },
        express: { $sum: { $cond: ['$express60Available', 1, 0] } },
      },
    },
    { $sort: { pincodeCount: -1 } },
  ]);

  res.json({
    success: true,
    cities: cities.map((c) => ({
      city: c._id.city,
      state: c._id.state,
      pincodeCount: c.pincodeCount,
      expressPincodes: c.express,
    })),
  });
});
