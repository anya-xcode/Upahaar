/**
 * Delhi NCT serviceability map — the launch market.
 *
 * Columns: [code, area, district, lat, lng, express60, priority3h]
 *
 * Coverage is graded by how dense and reachable an area actually is, not by
 * postal geography:
 *
 *   express60   inner Delhi — dense, short rider hops, where the 60-minute
 *               promise can genuinely be kept
 *   priority3h  the rest of urban Delhi, including Dwarka, Rohini and the
 *               trans-Yamuna colonies
 *   next-day    everywhere serviceable, including the outer rural belt
 *               (Narela, Bawana, Alipur, Najafgarh) where same-day is not
 *               realistic until there are sellers out there
 *
 * Coordinates are area centroids, accurate to roughly a kilometre — enough for
 * the delivery engine's distance maths. Tighten any that matter as you add
 * sellers nearby.
 */

const D = {
  NEW: 'New Delhi',
  CENTRAL: 'Central Delhi',
  SOUTH: 'South Delhi',
  SOUTH_EAST: 'South East Delhi',
  SOUTH_WEST: 'South West Delhi',
  WEST: 'West Delhi',
  NORTH: 'North Delhi',
  NORTH_WEST: 'North West Delhi',
  NORTH_EAST: 'North East Delhi',
  EAST: 'East Delhi',
  SHAHDARA: 'Shahdara',
};

/** [code, area, district, lat, lng, express60, priority3h] */
const ROWS = [
  // ---------------------------- New Delhi / NDMC ----------------------------
  ['110001', 'Connaught Place', D.NEW, 28.6315, 77.2167, true, true],
  ['110003', 'Lodhi Road', D.NEW, 28.5892, 77.2273, true, true],
  ['110004', 'Rashtrapati Bhawan', D.NEW, 28.6143, 77.1994, true, true],
  ['110011', 'Central Secretariat', D.NEW, 28.6127, 77.2129, true, true],
  ['110021', 'Chanakyapuri', D.NEW, 28.5921, 77.1875, true, true],
  ['110023', 'Sarojini Nagar', D.NEW, 28.5766, 77.1974, true, true],
  ['110057', 'Vasant Vihar', D.NEW, 28.5610, 77.1600, true, true],
  ['110066', 'Netaji Nagar', D.NEW, 28.5790, 77.1830, true, true],

  // ------------------------------ Central Delhi -----------------------------
  ['110002', 'Darya Ganj', D.CENTRAL, 28.6438, 77.2410, true, true],
  ['110005', 'Karol Bagh', D.CENTRAL, 28.6519, 77.1900, true, true],
  ['110006', 'Chandni Chowk', D.CENTRAL, 28.6562, 77.2301, true, true],
  ['110008', 'Patel Nagar', D.CENTRAL, 28.6516, 77.1668, true, true],
  ['110012', 'Pusa', D.CENTRAL, 28.6386, 77.1553, false, true],
  ['110014', 'Jangpura', D.CENTRAL, 28.5836, 77.2465, true, true],
  ['110054', 'Civil Lines', D.CENTRAL, 28.6800, 77.2230, true, true],
  ['110055', 'Paharganj', D.CENTRAL, 28.6450, 77.2140, true, true],
  ['110060', 'Rajendra Place', D.CENTRAL, 28.6420, 77.1780, true, true],

  // ------------------------------- South Delhi ------------------------------
  ['110016', 'Hauz Khas', D.SOUTH, 28.5494, 77.2001, true, true],
  ['110017', 'Malviya Nagar', D.SOUTH, 28.5355, 77.2065, true, true],
  ['110022', 'R K Puram', D.SOUTH, 28.5645, 77.1755, true, true],
  ['110024', 'Lajpat Nagar', D.SOUTH, 28.5677, 77.2433, true, true],
  ['110029', 'AIIMS / Safdarjung', D.SOUTH, 28.5672, 77.2100, true, true],
  ['110030', 'Mehrauli', D.SOUTH, 28.5150, 77.1855, false, true],
  ['110047', 'Chattarpur', D.SOUTH, 28.5060, 77.1800, false, true],
  ['110048', 'Greater Kailash I', D.SOUTH, 28.5494, 77.2425, true, true],
  ['110049', 'Gulmohar Park', D.SOUTH, 28.5560, 77.2130, true, true],
  ['110062', 'Khanpur', D.SOUTH, 28.5140, 77.2320, true, true],
  ['110067', 'Munirka / JNU', D.SOUTH, 28.5400, 77.1700, true, true],
  ['110068', 'Maidan Garhi', D.SOUTH, 28.5000, 77.1900, false, true],
  ['110070', 'Vasant Kunj', D.SOUTH, 28.5200, 77.1591, false, true],
  ['110074', 'Fatehpur Beri', D.SOUTH, 28.4800, 77.1650, false, false],

  // ---------------------------- South East Delhi ----------------------------
  ['110013', 'Nizamuddin', D.SOUTH_EAST, 28.5915, 77.2430, true, true],
  ['110019', 'Kalkaji', D.SOUTH_EAST, 28.5355, 77.2588, true, true],
  ['110020', 'Okhla Industrial Area', D.SOUTH_EAST, 28.5355, 77.2730, false, true],
  ['110025', 'Jamia Nagar', D.SOUTH_EAST, 28.5620, 77.2800, true, true],
  ['110044', 'Badarpur', D.SOUTH_EAST, 28.4930, 77.3020, false, true],
  ['110065', 'East of Kailash', D.SOUTH_EAST, 28.5560, 77.2440, true, true],
  ['110076', 'Sarita Vihar / Jasola', D.SOUTH_EAST, 28.5300, 77.2900, false, true],

  // ---------------------------- South West Delhi ----------------------------
  ['110010', 'Delhi Cantt', D.SOUTH_WEST, 28.5953, 77.1341, false, true],
  ['110037', 'Mahipalpur', D.SOUTH_WEST, 28.5450, 77.1230, false, true],
  ['110043', 'Najafgarh', D.SOUTH_WEST, 28.6090, 76.9800, false, false],
  ['110045', 'Sagarpur / Palam', D.SOUTH_WEST, 28.5900, 77.0900, false, true],
  ['110061', 'Chhawla', D.SOUTH_WEST, 28.5600, 76.9700, false, false],
  ['110071', 'Kakrola', D.SOUTH_WEST, 28.6180, 77.0350, false, true],
  ['110075', 'Dwarka', D.SOUTH_WEST, 28.5920, 77.0460, false, true],
  ['110077', 'Dwarka Sector 22', D.SOUTH_WEST, 28.5560, 77.0580, false, true],
  ['110078', 'Dwarka Sector 12', D.SOUTH_WEST, 28.5920, 77.0400, false, true],

  // -------------------------------- West Delhi ------------------------------
  ['110015', 'Kirti Nagar', D.WEST, 28.6553, 77.1436, true, true],
  ['110018', 'Janakpuri', D.WEST, 28.6219, 77.0878, false, true],
  ['110026', 'Punjabi Bagh', D.WEST, 28.6683, 77.1325, true, true],
  ['110027', 'Rajouri Garden', D.WEST, 28.6469, 77.1200, true, true],
  ['110028', 'Naraina', D.WEST, 28.6330, 77.1400, true, true],
  ['110041', 'Nangloi', D.WEST, 28.6820, 77.0650, false, true],
  ['110046', 'Uttam Nagar', D.WEST, 28.6210, 77.0570, false, true],
  ['110056', 'Multan Nagar', D.WEST, 28.6690, 77.1350, false, true],
  ['110058', 'Janakpuri A Block', D.WEST, 28.6260, 77.0810, false, true],
  ['110059', 'Vikas Puri', D.WEST, 28.6390, 77.0680, false, true],
  ['110063', 'Paschim Vihar', D.WEST, 28.6680, 77.1020, false, true],
  ['110064', 'Hari Nagar', D.WEST, 28.6280, 77.1080, true, true],
  ['110087', 'Peera Garhi', D.WEST, 28.6800, 77.0900, false, true],

  // ------------------------------- North Delhi ------------------------------
  ['110007', 'Kamla Nagar', D.NORTH, 28.6812, 77.2064, true, true],
  ['110009', 'Model Town', D.NORTH, 28.7047, 77.1925, true, true],
  ['110033', 'Adarsh Nagar', D.NORTH, 28.7160, 77.1690, false, true],
  ['110036', 'Alipur', D.NORTH, 28.7980, 77.1330, false, false],
  ['110040', 'Narela', D.NORTH, 28.8530, 77.0920, false, false],
  ['110084', 'Burari', D.NORTH, 28.7480, 77.1990, false, true],

  // ---------------------------- North West Delhi ----------------------------
  ['110034', 'Ashok Vihar', D.NORTH_WEST, 28.6900, 77.1760, true, true],
  ['110035', 'Shakur Basti', D.NORTH_WEST, 28.6790, 77.1470, false, true],
  ['110039', 'Bawana', D.NORTH_WEST, 28.7990, 77.0350, false, false],
  ['110042', 'Jahangirpuri', D.NORTH_WEST, 28.7290, 77.1650, false, true],
  ['110052', 'Shalimar Bagh', D.NORTH_WEST, 28.7050, 77.1580, true, true],
  ['110083', 'Sultanpuri', D.NORTH_WEST, 28.6950, 77.0650, false, true],
  ['110085', 'Rohini Sector 3', D.NORTH_WEST, 28.7040, 77.1160, false, true],
  ['110086', 'Rithala', D.NORTH_WEST, 28.7200, 77.1030, false, true],
  ['110088', 'Rohini Sector 11', D.NORTH_WEST, 28.7370, 77.1050, false, true],
  ['110089', 'Rohini Sector 22', D.NORTH_WEST, 28.7280, 77.0850, false, true],

  // ---------------------------- North East Delhi ----------------------------
  ['110053', 'Seelampur', D.NORTH_EAST, 28.6700, 77.2680, false, true],
  ['110093', 'Nand Nagri', D.NORTH_EAST, 28.6900, 77.3110, false, true],
  ['110094', 'Karawal Nagar', D.NORTH_EAST, 28.7250, 77.2760, false, false],

  // -------------------------------- East Delhi ------------------------------
  ['110031', 'Krishna Nagar', D.EAST, 28.6560, 77.2870, false, true],
  ['110051', 'Geeta Colony', D.EAST, 28.6540, 77.2740, true, true],
  ['110091', 'Mayur Vihar Phase 1', D.EAST, 28.6070, 77.2950, true, true],
  ['110092', 'Laxmi Nagar', D.EAST, 28.6350, 77.2770, true, true],
  ['110096', 'Mayur Vihar Phase 3', D.EAST, 28.6110, 77.3230, false, true],

  // --------------------------------- Shahdara ------------------------------
  ['110032', 'Shahdara', D.SHAHDARA, 28.6730, 77.2890, false, true],
  ['110095', 'Dilshad Garden', D.SHAHDARA, 28.6810, 77.3210, false, true],
];

const PARTNERS = ['Upahaar Express', 'Dunzo', 'Shadowfax', 'Porter'];

/** Pincode documents for the Delhi launch market. */
export const DELHI_PINCODES = ROWS.map(([code, area, district, lat, lng, express, priority]) => ({
  code,
  city: 'Delhi',
  state: 'Delhi',
  area,
  district,
  location: { lat, lng },
  isServiceable: true,
  express60Available: express,
  priority3hAvailable: priority,
  nextDayAvailable: true,
  standardAvailable: true,
  codAvailable: true,
  deliveryPartners: express ? PARTNERS : PARTNERS.slice(0, 2),
}));

/**
 * One delivery zone per Delhi district. Zones are how ops reasons about rider
 * capacity — switching a district's riders to zero suppresses express across
 * every PIN code inside it.
 */
export const DELHI_ZONES = Object.values(D).map((district) => {
  const inDistrict = ROWS.filter((r) => r[2] === district);
  const hasExpress = inDistrict.some((r) => r[5]);
  return {
    name: district,
    city: 'Delhi',
    state: 'Delhi',
    pincodes: inDistrict.map((r) => r[0]),
    hubLocation: { lat: inDistrict[0][3], lng: inDistrict[0][4] },
    deliveryPartners: hasExpress ? PARTNERS : PARTNERS.slice(0, 2),
    activeRiders: hasExpress ? 10 + inDistrict.length * 2 : 0,
    express60Enabled: hasExpress,
    isActive: true,
  };
});

export const DELHI_DISTRICTS = D;
export default DELHI_PINCODES;
