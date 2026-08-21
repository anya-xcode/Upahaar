import { P } from './products.js';
import { DELIVERY_TIERS } from '../../utils/constants.js';

const { EXPRESS_60, PRIORITY_3H, NEXT_DAY } = DELIVERY_TIERS;

/**
 * The Delhi launch roster.
 *
 * Delhi is the market we are actually opening in, so it needs real depth: a
 * seller in each district, with coverage that overlaps at the edges. The
 * availability engine only shows a gift where a seller genuinely reaches, so
 * without this most of the 86 Delhi PIN codes would fall through to 2–3 day
 * shipping and the whole proposition would collapse.
 */
export const DELHI_SELLERS = [
  {
    businessName: 'Chandni Chowk Mithai Co.',
    ownerName: 'Rakesh Gupta',
    email: 'chandnichowk@upahaar.test',
    mobile: '+91 98110 42001',
    tagline: 'Old Delhi · Sweets and festive gifting since 1952',
    description:
      'Three generations behind the same counter in Kinari Bazaar. Ghee mithai, dry fruit trays and Diwali boxes made in-house.',
    city: 'Delhi',
    pincode: '110006',
    lat: 28.6562,
    lng: 77.2301,
    radius: 12,
    serves: ['110006', '110002', '110001', '110007', '110054', '110055', '110005', '110032', '110051'],
    hours: { open: '08:00', close: '21:30' },
    dispatchBuffer: 10,
    commission: 11,
    featured: true,
    rating: 4.7,
    reviews: 486,
  },
  {
    businessName: 'Hauz Khas Bloom Studio',
    ownerName: 'Ira Sethi',
    email: 'hauzkhas@upahaar.test',
    mobile: '+91 98110 42002',
    tagline: 'Hauz Khas · Seasonal flowers, quietly arranged',
    description:
      'A small studio off the Deer Park side. Everything is cut and tied the same morning from the Ghazipur market.',
    city: 'Delhi',
    pincode: '110016',
    lat: 28.5494,
    lng: 77.2001,
    radius: 13,
    serves: [
      '110016', '110017', '110029', '110049', '110067', '110022', '110024', '110048', '110066',
      '110003', '110004', '110011', '110021', '110023', '110057', '110070', '110030', '110047',
      '110062', '110068', '110074',
    ],
    hours: { open: '07:30', close: '21:00' },
    dispatchBuffer: 10,
    commission: 11,
    featured: true,
    rating: 4.8,
    reviews: 341,
  },
  {
    businessName: 'Punjabi Bagh Bakehouse',
    ownerName: 'Simran Kohli',
    email: 'punjabibagh@upahaar.test',
    mobile: '+91 98110 42003',
    tagline: 'Punjabi Bagh · Cakes baked to order, all day',
    description: 'Photo cakes, tier cakes and eggless everything, out of a West Delhi kitchen that never really closes.',
    city: 'Delhi',
    pincode: '110026',
    lat: 28.6683,
    lng: 77.1325,
    radius: 14,
    serves: [
      '110026', '110027', '110015', '110028', '110064', '110063', '110034', '110035', '110008',
      '110060', '110056', '110012', '110010', '110041', '110087',
    ],
    hours: { open: '08:30', close: '22:00' },
    dispatchBuffer: 12,
    commission: 12,
    rating: 4.6,
    reviews: 298,
  },
  {
    businessName: 'Dwarka Gift Loft',
    ownerName: 'Neha Malhotra',
    email: 'dwarka@upahaar.test',
    mobile: '+91 98110 42004',
    tagline: 'Dwarka · Curated hampers for every occasion',
    description: 'Hampers assembled to order in Sector 12 — festive, corporate and new-baby boxes with a handwritten note.',
    city: 'Delhi',
    pincode: '110075',
    lat: 28.5920,
    lng: 77.0460,
    radius: 16,
    serves: [
      '110075', '110077', '110078', '110071', '110045', '110059', '110058', '110018', '110046',
      '110037', '110043', '110061', '110010',
    ],
    hours: { open: '09:30', close: '20:30' },
    dispatchBuffer: 18,
    commission: 13,
    rating: 4.5,
    reviews: 164,
  },
  {
    businessName: 'Rohini Craft House',
    ownerName: 'Vikas Ahuja',
    email: 'rohini@upahaar.test',
    mobile: '+91 98110 42005',
    tagline: 'Rohini · Engraved, printed and personalised',
    description: 'Photo frames, printed mugs, custom cushions and LED photo lamps. Upload an image and we do the rest.',
    city: 'Delhi',
    pincode: '110085',
    lat: 28.7040,
    lng: 77.1160,
    radius: 20,
    serves: [
      '110085', '110086', '110088', '110089', '110083', '110052', '110034', '110042', '110033',
      '110009', '110039', '110036', '110040', '110041', '110087',
    ],
    hours: { open: '10:00', close: '19:30' },
    dispatchBuffer: 25,
    commission: 13,
    rating: 4.6,
    reviews: 212,
  },
  {
    businessName: 'Mayur Vihar Chocolatier',
    ownerName: 'Anand Bose',
    email: 'mayurvihar@upahaar.test',
    mobile: '+91 98110 42006',
    tagline: 'Mayur Vihar · Small-batch chocolate, made east',
    description: 'Bean-to-bar chocolate, brownie boxes and dessert jars from a one-room workshop in Phase 1.',
    city: 'Delhi',
    pincode: '110091',
    lat: 28.6070,
    lng: 77.2950,
    radius: 14,
    serves: [
      '110091', '110092', '110096', '110051', '110031', '110032', '110095', '110093', '110053',
      '110094',
    ],
    hours: { open: '09:00', close: '21:30' },
    dispatchBuffer: 12,
    commission: 12,
    featured: true,
    rating: 4.7,
    reviews: 189,
  },
  {
    businessName: 'Model Town Florals',
    ownerName: 'Preeti Bajaj',
    email: 'modeltown@upahaar.test',
    mobile: '+91 98110 42007',
    tagline: 'Model Town · North Delhi florist and gifting',
    description: 'Bouquets, plants and celebration boxes across North Delhi and the university belt.',
    city: 'Delhi',
    pincode: '110009',
    lat: 28.7047,
    lng: 77.1925,
    radius: 14,
    serves: [
      '110009', '110007', '110054', '110033', '110052', '110034', '110042', '110084', '110006',
      '110036',
    ],
    hours: { open: '08:00', close: '21:00' },
    dispatchBuffer: 12,
    commission: 11,
    rating: 4.5,
    reviews: 176,
  },
  {
    businessName: 'Lajpat Nagar Hampers',
    ownerName: 'Zoya Khan',
    email: 'lajpatnagar@upahaar.test',
    mobile: '+91 98110 42008',
    tagline: 'Lajpat Nagar · Dry fruit, sweets and keepsakes',
    description: 'Central Market gifting — dry fruit trays, attar sets and wedding boxes, wrapped while you wait.',
    city: 'Delhi',
    pincode: '110024',
    lat: 28.5677,
    lng: 77.2433,
    radius: 13,
    serves: [
      '110024', '110014', '110065', '110019', '110048', '110025', '110076', '110003', '110013',
      '110020', '110044', '110062',
    ],
    hours: { open: '10:00', close: '21:00' },
    dispatchBuffer: 15,
    commission: 12,
    rating: 4.6,
    reviews: 227,
  },
];

/** Products for the Delhi roster, keyed by seller email. */
export const DELHI_PRODUCTS = {
  'chandnichowk@upahaar.test': [
    P('Ghee Mithai Assortment (1kg)', 'festival-gifts', 'hampers', ['diwali', 'raksha-bandhan', 'congratulations'], 1249, 1549, EXPRESS_60, 20, {
      per: true, best: true, feat: true, stock: 60,
      hi: ['Kaju katli, besan laddoo, pista roll', 'Pure desi ghee', 'Traditional gift box'],
      d: 'A kilo of the counter classics, boxed the way Kinari Bazaar has done it for seventy years.',
      tags: ['mithai', 'festive', 'express'],
    }),
    P('Premium Dry Fruit Tray', 'festival-gifts', 'hampers', ['diwali', 'corporate', 'wedding'], 2299, 2799, EXPRESS_60, 25, {
      stock: 45,
      hi: ['Almond, pista, cashew, anjeer', 'Brass-finish partitioned tray', 'Festive sleeve'],
      d: 'Four premium dry fruits in a brass-finish tray that gets reused every single year.',
      tags: ['dry-fruits', 'diwali', 'premium'],
    }),
    P('Diwali Sweets & Diya Hamper', 'festival-gifts', 'hampers', ['diwali'], 1699, 2099, EXPRESS_60, 30, {
      stock: 70,
      hi: ['500g mithai and four hand-painted diyas', 'Marigold-wrapped box', 'Greeting card included'],
      d: 'Sweets, diyas and marigold — the whole festival in a single box.',
      tags: ['diwali', 'sweets', 'express'],
    }),
    P('Rakhi & Mithai Combo', 'festival-gifts', 'hampers', ['raksha-bandhan'], 899, 1099, EXPRESS_60, 20, {
      per: true, stock: 80,
      hi: ['Two handcrafted rakhis', '500g assorted mithai', 'Roli chawal included'],
      d: 'Two rakhis and half a kilo of mithai, packed to travel across the city in an hour.',
      tags: ['rakhi', 'festive', 'express'],
    }),
  ],

  'hauzkhas@upahaar.test': [
    P('Dusty Rose & Lisianthus Bouquet', 'flowers', 'flowers', ['anniversary', 'mothers-day', 'congratulations'], 1599, 1949, EXPRESS_60, 18, {
      per: true, feat: true, best: true, stock: 26,
      hi: ['24 stems in dusty pinks and cream', 'Handmade paper wrap', 'Lasts 6–8 days'],
      d: 'A restrained arrangement in dusty rose and cream, built from whatever the market had best that morning.',
      tags: ['premium', 'roses', 'express'],
    }),
    P('White Lily Vase Arrangement', 'flowers', 'flowers', ['house-warming', 'corporate', 'thank-you'], 2199, 2699, PRIORITY_3H, 35, {
      per: true, stock: 16,
      hi: ['Oriental lilies in a glass vase', 'Ten days of blooms', 'Care card included'],
      d: 'Lilies in a heavy glass vase — the arrangement for a reception desk or a first dinner party.',
      tags: ['lilies', 'premium', 'office'],
    }),
    P('Marigold & Rose Festive Garland', 'festival-gifts', 'flowers', ['diwali', 'just-because'], 549, 699, EXPRESS_60, 15, {
      per: true, stock: 70,
      hi: ['Six feet of fresh garland', 'Strung the same morning', 'For doorways and mandirs'],
      d: 'Fresh marigold and rose, strung the morning it reaches you.',
      tags: ['festive', 'traditional', 'express'],
    }),
    P('Seasonal Hand-Tied Bunch', 'flowers', 'flowers', ['get-well-soon', 'thank-you', 'just-because'], 849, 1049, EXPRESS_60, 15, {
      per: true, stock: 50,
      hi: ['Whatever is best that day', 'Kraft paper and jute', 'Free message card'],
      d: 'We pick the best stems on the morning bench and tie them simply. Never the same twice.',
      tags: ['seasonal', 'express'],
    }),
  ],

  'punjabibagh@upahaar.test': [
    P('Custom Photo Cake (1kg)', 'cakes', 'cakes', ['birthday', 'anniversary'], 1349, 1649, PRIORITY_3H, 150, {
      per: true, pz: true, photo: true, feat: true, stock: 20, pzFee: 149,
      hi: ['Edible print of your photograph', 'Vanilla, chocolate or butterscotch', 'Eggless on request'],
      d: 'Upload any photograph and we print it in edible ink across a full kilo of fresh cream cake.',
      tags: ['photo-cake', 'personalised', 'birthday'],
    }),
    P('Belgian Chocolate Truffle Cake', 'cakes', 'cakes', ['birthday', 'anniversary'], 999, 1249, EXPRESS_60, 30, {
      per: true, best: true, stock: 28,
      hi: ['Belgian couverture ganache', 'Fresh cream, never whipped fat', 'Candles and knife included'],
      d: 'Dense, dark and not too sweet — a proper chocolate cake, cut and boxed when you order.',
      tags: ['cake', 'chocolate', 'express'],
      variants: [{ name: '500g', priceDelta: 0, stock: 28 }, { name: '1kg', priceDelta: 520, stock: 14 }],
    }),
    P('Pineapple Cream Cake (1kg)', 'cakes', 'cakes', ['birthday', 'congratulations'], 799, 999, EXPRESS_60, 30, {
      per: true, stock: 24,
      hi: ['Fresh pineapple layers', 'Light whipped cream', 'Eggless available'],
      d: 'The lightest cake on the counter, and the first one to disappear at a party.',
      tags: ['cake', 'classic', 'express'],
    }),
    P('Celebration Cupcake Box (6)', 'cakes', 'cakes', ['birthday', 'congratulations', 'thank-you'], 649, 799, EXPRESS_60, 25, {
      per: true, pz: true, stock: 44, pzFee: 49,
      hi: ['Six frosted cupcakes', 'Custom message topper', 'Mixed flavours'],
      d: 'Six cupcakes with a message topper — easier to share around an office than a cake.',
      tags: ['cupcake', 'express'],
    }),
  ],

  'dwarka@upahaar.test': [
    P('The Grand Celebration Hamper', 'gift-hampers', 'hampers', ['wedding', 'congratulations', 'diwali'], 3299, 3999, PRIORITY_3H, 60, {
      feat: true, best: true, stock: 20,
      hi: ['Dry fruits, chocolates, tea and preserves', 'Reusable wicker basket', 'Handwritten note'],
      d: 'Our largest hamper — the one people photograph before they open it.',
      tags: ['premium', 'wedding', 'hamper'],
    }),
    P('Gourmet Tea & Cookie Basket', 'gift-hampers', 'hampers', ['thank-you', 'get-well-soon', 'corporate'], 1449, 1799, PRIORITY_3H, 45, {
      stock: 40,
      hi: ['Four single-estate teas', 'Butter cookies and shortbread', 'Kraft gift box'],
      d: 'Darjeeling, Assam, Nilgiri and a green — with enough biscuits to do them justice.',
      tags: ['tea', 'hamper'],
    }),
    P('New Baby Welcome Hamper', 'baby-gifts', 'hampers', ['new-baby'], 2199, 2699, PRIORITY_3H, 50, {
      stock: 26,
      hi: ['Cotton onesie, bib and booties', 'Soft rattle and blanket', 'Keepsake wooden box'],
      d: 'Everything useful for the first month, in a box the parents will actually keep.',
      tags: ['baby', 'hamper'],
    }),
    P('Corporate Diwali Gift Box', 'corporate-gifts', 'hampers', ['diwali', 'corporate'], 1299, 1599, NEXT_DAY, 120, {
      stock: 220,
      hi: ['Bulk pricing from 25 boxes', 'Company logo on the sleeve', 'Dry fruits, diya and sweets'],
      d: 'A restrained, genuinely nice Diwali box — orderable by the hundred.',
      tags: ['corporate', 'diwali', 'bulk'],
    }),
  ],

  'rohini@upahaar.test': [
    P('Personalised Photo Mug', 'personalized-gifts', 'personalized', ['birthday', 'thank-you', 'just-because'], 449, 649, NEXT_DAY, 180, {
      pz: true, photo: true, best: true, stock: 130, pzFee: 0,
      hi: ['Upload any photograph', 'Dishwasher safe print', 'Ceramic, 330ml'],
      d: 'Upload a photo, add a line, and it ships the next morning. The gift that started this shop.',
      tags: ['mug', 'personalised', 'photo'],
    }),
    P('Engraved Wooden Photo Frame', 'personalized-gifts', 'personalized', ['anniversary', 'wedding', 'house-warming'], 1249, 1599, NEXT_DAY, 240, {
      pz: true, photo: true, feat: true, stock: 48, pzFee: 149,
      hi: ['Laser-engraved sheesham', 'Names and date engraved', 'Wall or table mount'],
      d: 'Solid sheesham, laser-engraved with two names and a date that matters.',
      tags: ['wood', 'engraved', 'anniversary'],
    }),
    P('Magic Photo LED Lamp', 'personalized-gifts', 'personalized', ['anniversary', 'birthday', 'valentines-day'], 1549, 1999, NEXT_DAY, 300, {
      pz: true, photo: true, best: true, stock: 38, pzFee: 199,
      hi: ['Photo appears only when lit', 'Warm LED, USB powered', 'Wooden base'],
      d: 'Looks like plain acrylic until you switch it on — then their photograph appears.',
      tags: ['lamp', 'photo', 'wow'],
    }),
    P('Custom Photo Cushion', 'personalized-gifts', 'personalized', ['birthday', 'valentines-day'], 699, 899, NEXT_DAY, 200, {
      pz: true, photo: true, stock: 72, pzFee: 0,
      hi: ['16 x 16 inch, filler included', 'Full-colour photo print', 'Soft velvet finish'],
      d: 'A cushion with their favourite photograph on it. Slightly ridiculous, universally loved.',
      tags: ['cushion', 'photo'],
    }),
  ],

  'mayurvihar@upahaar.test': [
    P('Fudgy Brownie Box (12 pc)', 'chocolates', 'chocolates', ['birthday', 'thank-you', 'just-because'], 799, 999, EXPRESS_60, 25, {
      per: true, best: true, stock: 60,
      hi: ['12 dense walnut brownies', 'Baked fresh each morning', 'Eggless available'],
      d: 'Twelve brownies, properly fudgy, still slightly warm if you are close enough.',
      tags: ['brownie', 'express'],
    }),
    P('Signature Truffle Box (24 pc)', 'chocolates', 'chocolates', ['anniversary', 'corporate', 'diwali'], 1799, 2199, EXPRESS_60, 20, {
      feat: true, stock: 42,
      hi: ['24 assorted truffles', 'Single-origin cacao', 'Keeps for 10 days'],
      d: 'Twenty-four truffles across eight flavours, boxed for gifting rather than snacking.',
      tags: ['premium', 'chocolate', 'express'],
    }),
    P('Dessert Jar Sampler (6 jars)', 'chocolates', 'chocolates', ['birthday', 'congratulations'], 1149, 1449, PRIORITY_3H, 40, {
      per: true, stock: 34,
      hi: ['Tiramisu, biscoff, red velvet and more', 'Glass jars with spoons', 'Chilled delivery'],
      d: 'Six desserts in six jars, so nobody has to share.',
      tags: ['dessert', 'sampler'],
    }),
    P('Chocolate Dipped Strawberries', 'chocolates', 'chocolates', ['valentines-day', 'anniversary'], 999, 1249, EXPRESS_60, 30, {
      per: true, stock: 22,
      hi: ['12 strawberries, dark and white chocolate', 'Chilled box', 'Same-day only'],
      d: 'A dozen strawberries in dark and white chocolate. Eat them the same day.',
      tags: ['romantic', 'fresh', 'express'],
    }),
  ],

  'modeltown@upahaar.test': [
    P('Pastel Rose & Carnation Bouquet', 'flowers', 'flowers', ['birthday', 'thank-you', 'mothers-day'], 1049, 1299, EXPRESS_60, 20, {
      per: true, best: true, stock: 42,
      hi: ['24 pastel stems', 'Handmade paper wrap', 'Free message card'],
      d: 'Two dozen stems in dusty pinks and creams — our most-ordered bouquet in North Delhi.',
      tags: ['pastel', 'express'],
    }),
    P('Indoor Plant Gift Duo', 'gift-hampers', 'misc', ['house-warming', 'get-well-soon', 'corporate'], 949, 1199, PRIORITY_3H, 50, {
      stock: 50,
      hi: ['Snake plant and money plant', 'Ceramic pots included', 'Care instructions'],
      d: 'Two plants that survive being forgotten, in pots worth keeping.',
      tags: ['plants', 'home', 'green'],
    }),
    P('Birthday Balloon & Bloom Surprise', 'birthday-gifts', 'flowers', ['birthday'], 1449, 1799, EXPRESS_60, 35, {
      per: true, stock: 30,
      hi: ['12 roses with helium balloons', 'Birthday banner included', 'Delivered together'],
      d: 'Flowers, balloons and a banner, arriving before they have finished their morning chai.',
      tags: ['birthday', 'balloons', 'express'],
    }),
    P('Scented Candle Trio Gift Set', 'gift-hampers', 'hampers', ['house-warming', 'thank-you', 'diwali'], 1249, 1599, PRIORITY_3H, 40, {
      stock: 55,
      hi: ['Soy wax, 40-hour burn each', 'Oud, jasmine and vanilla', 'Gift box with ribbon'],
      d: 'Three soy candles in the three scents people actually finish.',
      tags: ['candles', 'home'],
    }),
  ],

  'lajpatnagar@upahaar.test': [
    P('Royal Dry Fruit Gift Chest', 'festival-gifts', 'hampers', ['diwali', 'wedding', 'corporate'], 3199, 3899, PRIORITY_3H, 55, {
      feat: true, best: true, stock: 32,
      hi: ['Six varieties of premium dry fruit', 'Wooden chest with brass latch', 'Festive wrap'],
      d: 'Six compartments of premium dry fruit in a wooden chest that outlives the festival.',
      tags: ['dry-fruits', 'premium', 'diwali'],
    }),
    P('Attar & Keepsake Gift Set', 'gift-hampers', 'hampers', ['wedding', 'thank-you', 'diwali'], 2399, 2899, PRIORITY_3H, 60, {
      stock: 28,
      hi: ['Three traditional attars', 'Hand-carved wooden case', 'Gift card included'],
      d: 'Three attars in a carved case — oud, rose and khus.',
      tags: ['attar', 'traditional', 'premium'],
    }),
    P('Wedding Silver Coin Gift Box', 'wedding-gifts', 'hampers', ['wedding'], 3899, 4699, PRIORITY_3H, 60, {
      stock: 22,
      hi: ['10g silver coin, 999 purity', 'Velvet presentation box', 'Certificate included'],
      d: 'A silver coin in a velvet box — the wedding gift that never misses.',
      tags: ['wedding', 'silver', 'premium'],
    }),
    P('Festive Diya & Rangoli Kit', 'festival-gifts', 'misc', ['diwali'], 799, 999, PRIORITY_3H, 40, {
      stock: 85,
      hi: ['12 hand-painted diyas', 'Rangoli colours and stencils', 'Marigold string'],
      d: 'Everything needed for the doorway, in one box.',
      tags: ['diwali', 'decor'],
    }),
  ],
};

export default DELHI_SELLERS;
