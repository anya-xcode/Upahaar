import { DELHI_PINCODES, DELHI_ZONES } from './delhi.js';

/**
 * Serviceability map for the demo dataset.
 *
 * Columns: [code, area, lat, lng, express60, priority3h]
 * Next-day and standard are on everywhere that is serviceable at all.
 * 400001 is deliberately a fully-enabled express pincode — it's the code used
 * throughout the product spec and the one the demo walkthrough uses.
 */
const CITIES = [
  {
    city: 'Mumbai',
    state: 'Maharashtra',
    partners: ['Upahaar Express', 'Dunzo', 'Shadowfax'],
    pincodes: [
      ['400001', 'Fort', 18.9338, 72.8356, true, true],
      ['400002', 'Kalbadevi', 18.9483, 72.8267, true, true],
      ['400003', 'Mandvi', 18.9556, 72.8378, true, true],
      ['400004', 'Girgaon', 18.9553, 72.8175, true, true],
      ['400005', 'Colaba', 18.9067, 72.8147, true, true],
      ['400006', 'Malabar Hill', 18.9553, 72.7956, true, true],
      ['400007', 'Grant Road', 18.9629, 72.8156, true, true],
      ['400008', 'Mumbai Central', 18.9712, 72.8203, true, true],
      ['400011', 'Jacob Circle', 18.9861, 72.8281, true, true],
      ['400012', 'Parel', 18.9975, 72.8375, true, true],
      ['400013', 'Lower Parel', 18.9960, 72.8258, true, true],
      ['400014', 'Dadar East', 19.0176, 72.8439, true, true],
      ['400016', 'Mahim', 19.0330, 72.8397, true, true],
      ['400018', 'Worli', 19.0075, 72.8177, true, true],
      ['400020', 'Churchgate', 18.9322, 72.8264, true, true],
      ['400021', 'Nariman Point', 18.9256, 72.8242, true, true],
      ['400025', 'Prabhadevi', 19.0176, 72.8296, true, true],
      ['400026', 'Cumballa Hill', 18.9694, 72.8069, true, true],
      ['400028', 'Dadar West', 19.0233, 72.8397, true, true],
      ['400050', 'Bandra West', 19.0596, 72.8295, true, true],
      ['400051', 'Bandra East', 19.0607, 72.8524, true, true],
      ['400053', 'Andheri West', 19.1197, 72.8464, true, true],
      ['400057', 'Vile Parle East', 19.1005, 72.8478, false, true],
      ['400058', 'Andheri', 19.1273, 72.8340, false, true],
      ['400069', 'Andheri East', 19.1136, 72.8697, false, true],
      ['400076', 'Powai', 19.1176, 72.9060, false, true],
      ['400093', 'Marol', 19.1136, 72.8697, false, true],
      ['400601', 'Thane West', 19.1943, 72.9615, false, false],
    ],
  },
  {
    city: 'Bengaluru',
    state: 'Karnataka',
    partners: ['Upahaar Express', 'Dunzo', 'Porter'],
    pincodes: [
      ['560001', 'MG Road', 12.9758, 77.6045, true, true],
      ['560002', 'Chickpet', 12.9666, 77.5763, true, true],
      ['560004', 'Basavanagudi', 12.9420, 77.5730, true, true],
      ['560008', 'Ulsoor', 12.9821, 77.6270, true, true],
      ['560025', 'Richmond Town', 12.9600, 77.5990, true, true],
      ['560034', 'Koramangala', 12.9352, 77.6245, true, true],
      ['560038', 'Indiranagar', 12.9784, 77.6408, true, true],
      ['560066', 'Whitefield', 12.9698, 77.7500, false, false],
      ['560076', 'BTM Layout', 12.9166, 77.6101, false, true],
      ['560095', 'Koramangala 8th', 12.9345, 77.6100, true, true],
    ],
  },
  {
    city: 'Pune',
    state: 'Maharashtra',
    partners: ['Upahaar Express', 'Porter'],
    pincodes: [
      ['411001', 'Pune Camp', 18.5089, 73.8797, true, true],
      ['411004', 'Deccan Gymkhana', 18.5158, 73.8449, true, true],
      ['411005', 'Shivajinagar', 18.5308, 73.8478, true, true],
      ['411007', 'Aundh', 18.5590, 73.8077, false, true],
      ['411014', 'Viman Nagar', 18.5679, 73.9143, false, true],
      ['411028', 'Hadapsar', 18.5089, 73.9260, false, false],
      ['411045', 'Baner', 18.5590, 73.7868, false, true],
    ],
  },
  {
    city: 'Hyderabad',
    state: 'Telangana',
    partners: ['Upahaar Express', 'Dunzo'],
    pincodes: [
      ['500001', 'Afzalgunj', 17.3730, 78.4780, true, true],
      ['500003', 'Secunderabad', 17.4399, 78.4983, true, true],
      ['500016', 'Begumpet', 17.4435, 78.4645, true, true],
      ['500033', 'Jubilee Hills', 17.4326, 78.4071, true, true],
      ['500034', 'Banjara Hills', 17.4126, 78.4380, true, true],
      ['500081', 'Gachibowli', 17.4400, 78.3489, false, true],
    ],
  },
  {
    city: 'Kolkata',
    state: 'West Bengal',
    partners: ['Upahaar Express'],
    pincodes: [
      ['700001', 'BBD Bagh', 22.5697, 88.3500, true, true],
      ['700016', 'Park Street', 22.5535, 88.3520, true, true],
      ['700019', 'Ballygunge', 22.5290, 88.3660, true, true],
      ['700029', 'Rashbehari', 22.5150, 88.3480, false, true],
      ['700064', 'Salt Lake', 22.5800, 88.4200, false, true],
    ],
  },
  {
    city: 'Chennai',
    state: 'Tamil Nadu',
    partners: ['Upahaar Express', 'Porter'],
    pincodes: [
      ['600001', 'Parrys', 13.0937, 80.2870, true, true],
      ['600004', 'Mylapore', 13.0339, 80.2699, true, true],
      ['600017', 'T Nagar', 13.0418, 80.2341, true, true],
      ['600020', 'Adyar', 13.0067, 80.2570, true, true],
      ['600034', 'Nungambakkam', 13.0604, 80.2420, true, true],
      ['600096', 'Perungudi', 12.9698, 80.2420, false, false],
    ],
  },
  {
    city: 'Jaipur',
    state: 'Rajasthan',
    partners: ['Upahaar Express'],
    pincodes: [
      ['302001', 'Jaipur City', 26.9124, 75.7873, false, true],
      ['302015', 'Malviya Nagar', 26.8500, 75.8100, false, false],
    ],
  },
  {
    city: 'Gurugram',
    state: 'Haryana',
    partners: ['Upahaar Express', 'Dunzo'],
    pincodes: [
      ['122001', 'Gurugram Sector 14', 28.4595, 77.0266, true, true],
      ['122002', 'DLF Phase 1', 28.4750, 77.0900, false, true],
      ['122018', 'Sohna Road', 28.4200, 77.0400, false, true],
    ],
  },
];

/**
 * The markets we are live in.
 *
 * Delhi is the launch market and carries full coverage from `delhi.js`; the
 * rest are kept as expansion markets so the platform can be demonstrated
 * nationally. To run Delhi-only, set this to `['Delhi']` and reseed.
 */
export const LAUNCH_MARKETS = ['Delhi', 'Mumbai', 'Bengaluru', 'Pune', 'Hyderabad', 'Kolkata', 'Chennai', 'Jaipur', 'Gurugram'];

/** Flattened Pincode documents for every market except Delhi. */
const OTHER_PINCODES = CITIES.flatMap((c) =>
  c.pincodes.map(([code, area, lat, lng, express, priority]) => ({
    code,
    city: c.city,
    state: c.state,
    area,
    location: { lat, lng },
    isServiceable: true,
    express60Available: express,
    priority3hAvailable: priority,
    nextDayAvailable: true,
    standardAvailable: true,
    codAvailable: true,
    deliveryPartners: c.partners,
  }))
);

/** One delivery zone per non-Delhi city. */
const OTHER_ZONES = CITIES.map((c) => ({
  name: `${c.city} Metro`,
  city: c.city,
  state: c.state,
  pincodes: c.pincodes.map(([code]) => code),
  hubLocation: { lat: c.pincodes[0][2], lng: c.pincodes[0][3] },
  deliveryPartners: c.partners,
  activeRiders: c.pincodes.some(([, , , , express]) => express) ? 12 + c.pincodes.length : 0,
  express60Enabled: c.pincodes.some(([, , , , express]) => express),
  isActive: true,
}));

/**
 * Delhi first, then the expansion markets — filtered to whatever
 * LAUNCH_MARKETS allows, so switching to a single-city launch is one edit.
 */
export const PINCODES = [...DELHI_PINCODES, ...OTHER_PINCODES].filter((p) =>
  LAUNCH_MARKETS.includes(p.city)
);

export const ZONES = [...DELHI_ZONES, ...OTHER_ZONES].filter((z) => LAUNCH_MARKETS.includes(z.city));

export const CITY_CENTERS = Object.fromEntries(
  CITIES.map((c) => [c.city, { lat: c.pincodes[0][2], lng: c.pincodes[0][3], state: c.state }])
);

export default CITIES;
