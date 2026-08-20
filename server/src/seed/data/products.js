import { DELIVERY_TIERS } from '../../utils/constants.js';

const { EXPRESS_60, PRIORITY_3H, NEXT_DAY, STANDARD_2_3D } = DELIVERY_TIERS;

/**
 * Stock photography pool, grouped roughly by category.
 * Swap these for Cloudinary URLs when real product shots are uploaded — the
 * seller product form already accepts any image URL.
 */
const PHOTOS = {
  cakes: ['1535254973040-607b474cb50d', '1578985545062-69928b1d9587', '1558618666-fcd25c85cd64', '1587248720327-8eb72564be1e'],
  flowers: ['1519225421980-715cb0215aed', '1490481651871-ab68de25d43d', '1563729784474-d77dbb933a9e', '1502920917128-1aa500764cbd'],
  chocolates: ['1549465220-1a8b9238cd48', '1548544149-4835e62ee5b3', '1481391319762-47dff72954d9', '1571115177098-24ec42ed204d'],
  hampers: ['1513885535751-8b9238bd345a', '1607344645866-009c320b63e0', '1546868871-7041f2a55e12', '1608303588026-884930af2559'],
  personalized: ['1513151233558-d860c5398176', '1517686469429-8bdb88b9f907', '1600334089648-b0d9d3028eb2', '1606890737304-57a1ca8a5b62'],
  toys: ['1596461404969-9ae70f2830c1', '1602351447937-745cb720612f', '1611085583191-a3b181a88401', '1621784563330-caee0b138a00'],
  misc: ['1464349095431-e9a21285b5f3', '1470071459604-3b5ec3a7fe05', '1486427944299-d1955d23e34d', '1512909006721-3d6018887383', '1519741497674-611481863552', '1522748906645-95d8adfd52c7', '1550617931-e17a7b70dce2'],
};

let photoCursor = 0;
/** Deterministic rotation so the same seed always produces the same gallery. */
function pickPhotos(pool, count = 3) {
  const ids = PHOTOS[pool] || PHOTOS.misc;
  return Array.from({ length: count }, (_, i) => {
    const id = ids[(photoCursor + i) % ids.length];
    return `https://images.unsplash.com/photo-${id}?w=900&q=80&auto=format&fit=crop`;
  });
}

function P(n, c, pool, o, price, mrp, t, prep, extra = {}) {
  photoCursor += 1;
  return {
    n,
    c,
    o,
    price,
    mrp,
    t,
    prep,
    images: pickPhotos(pool, 3),
    ...extra,
  };
}

/**
 * Products keyed by seller email.
 * `t` is the best tier the seller promises for that item; the engine can only
 * ever downgrade it based on distance, stock, hours and ops configuration.
 */
export const PRODUCTS = {
  'seller@upahaar.test': [
    P('Chocolate & Rose Gift Box', 'chocolates', 'chocolates', ['birthday', 'valentines-day', 'just-because'], 999, 1299, EXPRESS_60, 20, {
      per: true, best: true, feat: true, stock: 40,
      hi: ['12 handmade truffles', 'Six long-stem red roses', 'Handwritten note included'],
      d: 'Our most-gifted box: a dozen dark and milk truffles nestled beside six long-stem roses, tied the moment your order lands.',
      tags: ['bestseller', 'romantic', 'express'],
    }),
    P('Classic Red Rose Bouquet', 'flowers', 'flowers', ['valentines-day', 'anniversary', 'just-because'], 749, 899, EXPRESS_60, 15, {
      per: true, best: true, stock: 60,
      hi: ['20 fresh red roses', 'Hand-tied with jute and ribbon', 'Fresh from the Dadar market'],
      d: 'Twenty roses, hand-tied that morning. Simple, and it has never once failed.',
      tags: ['roses', 'express', 'classic'],
    }),
    P('Fresh Cream Truffle Cake (500g)', 'cakes', 'cakes', ['birthday', 'anniversary'], 649, 799, EXPRESS_60, 25, {
      per: true, feat: true, stock: 25,
      hi: ['Eggless option available', 'Fresh cream, never whipped fat', 'Candles and knife included'],
      d: 'A half-kilo of dark chocolate truffle cake, baked at dawn and finished when you order.',
      tags: ['cake', 'chocolate', 'express'],
      variants: [{ name: '500g', priceDelta: 0, stock: 25 }, { name: '1kg', priceDelta: 550, stock: 12 }],
    }),
    P('Mini Celebration Hamper', 'gift-hampers', 'hampers', ['birthday', 'congratulations', 'thank-you'], 1249, 1599, EXPRESS_60, 30, {
      stock: 30,
      hi: ['Cookies, truffles and a scented candle', 'Ready-to-gift box', 'Under an hour in South Mumbai'],
      d: 'Everything you need for a small celebration, in a box that looks like you planned it for weeks.',
      tags: ['hamper', 'express'],
    }),
    P('Birthday Blooms & Cake Combo', 'birthday-gifts', 'cakes', ['birthday'], 1399, 1799, EXPRESS_60, 30, {
      per: true, best: true, stock: 20,
      hi: ['500g cake plus a 12-rose bouquet', 'Free birthday candles', 'Message card included'],
      d: 'The two things every birthday needs, delivered together and still cold.',
      tags: ['combo', 'birthday', 'express'],
    }),
  ],

  'cocoa@upahaar.test': [
    P('Artisan Chocolate Bouquet', 'chocolates', 'chocolates', ['birthday', 'valentines-day', 'thank-you'], 1199, 1499, EXPRESS_60, 25, {
      feat: true, best: true, stock: 35,
      hi: ['16 wrapped bonbons on stems', 'Bean-to-bar, 62% dark', 'Wrapped like a bouquet'],
      d: 'Sixteen bonbons arranged as a bouquet — the gift for someone who would rather have chocolate than flowers.',
      tags: ['chocolate', 'bouquet', 'express'],
    }),
    P('Signature Truffle Box (24 pc)', 'chocolates', 'chocolates', ['anniversary', 'corporate', 'diwali'], 1899, 2299, EXPRESS_60, 20, {
      best: true, stock: 45,
      hi: ['24 assorted truffles', 'Single-origin Idukki cacao', 'Keeps for 10 days'],
      d: 'Twenty-four truffles across eight flavours, from Madagascar vanilla to Malabar pepper.',
      tags: ['premium', 'chocolate'],
    }),
    P('Hot Chocolate Gifting Jar', 'chocolates', 'chocolates', ['get-well-soon', 'just-because', 'house-warming'], 649, 799, PRIORITY_3H, 30, {
      stock: 50,
      hi: ['Drinking chocolate with marshmallows', 'Makes 12 cups', 'Reusable glass jar'],
      d: 'Thick Parisian-style drinking chocolate in a jar worth keeping.',
      tags: ['winter', 'cosy'],
    }),
    P('Dark Chocolate Diwali Tray', 'festival-gifts', 'chocolates', ['diwali', 'corporate'], 2499, 2999, PRIORITY_3H, 45, {
      stock: 28,
      hi: ['Brass-finish serving tray', '36 assorted chocolates', 'Festive gift sleeve'],
      d: 'A brass tray loaded with chocolate — the Diwali box people actually finish.',
      tags: ['diwali', 'festive', 'premium'],
    }),
    P('Personalised Chocolate Bar Set', 'personalized-gifts', 'chocolates', ['birthday', 'thank-you'], 899, 1099, PRIORITY_3H, 60, {
      pz: true, stock: 40, pzFee: 99,
      hi: ['Three bars with a printed name', 'Choose milk, dark or white', 'Message on the sleeve'],
      d: 'Three chocolate bars with their name printed on the wrapper. Silly, and it works every time.',
      tags: ['personalised', 'chocolate'],
    }),
  ],

  'petal@upahaar.test': [
    P('Peach Garden Roses & Lilies', 'flowers', 'flowers', ['anniversary', 'congratulations', 'mothers-day'], 1499, 1899, EXPRESS_60, 20, {
      per: true, feat: true, stock: 22,
      hi: ['Garden roses, oriental lilies, eucalyptus', 'Wrapped in handmade paper', 'Lasts 6–8 days'],
      d: 'A soft peach and cream arrangement built around whatever the market had best that morning.',
      tags: ['premium', 'roses', 'lilies'],
    }),
    P('White Orchid Vase Arrangement', 'flowers', 'flowers', ['house-warming', 'corporate', 'thank-you'], 2299, 2799, PRIORITY_3H, 40, {
      per: true, stock: 15,
      hi: ['Phalaenopsis orchids in a ceramic vase', 'Two to three weeks of blooms', 'Care card included'],
      d: 'Quiet, architectural and appropriate for absolutely any occasion.',
      tags: ['orchid', 'premium', 'office'],
    }),
    P('Sunshine Gerbera Bunch', 'flowers', 'flowers', ['get-well-soon', 'just-because', 'birthday'], 649, 799, EXPRESS_60, 15, {
      per: true, best: true, stock: 55,
      hi: ['15 mixed gerberas', 'Bright yellows and oranges', 'Under an hour across Bandra'],
      d: 'Fifteen gerberas in the loudest colours we can find. Hard to be sad around them.',
      tags: ['cheerful', 'express'],
    }),
    P("Mother's Day Tulip Box", 'mothers-day', 'flowers', ['mothers-day', 'birthday'], 1799, 2199, PRIORITY_3H, 35, {
      per: true, stock: 18,
      hi: ['20 imported tulips', 'Hat-box with water foam', 'Personal note card'],
      d: 'Twenty tulips in a hat-box, which means she does not have to find a vase.',
      tags: ['tulips', 'mothers-day', 'premium'],
    }),
    P('Jasmine & Marigold Festive Garland', 'festival-gifts', 'flowers', ['diwali', 'just-because'], 449, 549, EXPRESS_60, 15, {
      per: true, stock: 70,
      hi: ['Six feet of fresh garland', 'Strung the same morning', 'For doorways and mandirs'],
      d: 'Fresh jasmine and marigold, strung the morning it reaches you.',
      tags: ['festive', 'traditional'],
    }),
  ],

  'hamper@upahaar.test': [
    P('The Grand Celebration Hamper', 'gift-hampers', 'hampers', ['wedding', 'congratulations', 'diwali'], 3499, 4299, PRIORITY_3H, 60, {
      feat: true, best: true, stock: 18,
      hi: ['Dry fruits, chocolates, tea and preserves', 'Wicker basket, reusable', 'Handwritten note'],
      d: 'Our largest hamper — the one people photograph before they open it.',
      tags: ['premium', 'wedding', 'hamper'],
    }),
    P('Gourmet Tea & Cookie Basket', 'gift-hampers', 'hampers', ['thank-you', 'get-well-soon', 'corporate'], 1499, 1899, PRIORITY_3H, 45, {
      stock: 40,
      hi: ['Four single-estate teas', 'Butter cookies and shortbread', 'Kraft gift box'],
      d: 'Darjeeling, Assam, Nilgiri and a green — with enough biscuits to do them justice.',
      tags: ['tea', 'hamper'],
    }),
    P('New Baby Welcome Hamper', 'baby-gifts', 'hampers', ['new-baby'], 2299, 2799, PRIORITY_3H, 50, {
      stock: 24,
      hi: ['Cotton onesie, bib and booties', 'Soft rattle and baby blanket', 'Keepsake wooden box'],
      d: 'Everything useful for the first month, in a box the parents will keep afterwards.',
      tags: ['baby', 'hamper'],
    }),
    P('Housewarming Comfort Box', 'gift-hampers', 'hampers', ['house-warming', 'congratulations'], 1899, 2399, NEXT_DAY, 90, {
      stock: 30,
      hi: ['Soy candle, ceramic mugs and coffee', 'Linen napkins', 'Card with your message'],
      d: 'The things a new home never has on day one.',
      tags: ['home', 'hamper'],
    }),
    P('Corporate Diwali Gift Box', 'corporate-gifts', 'hampers', ['diwali', 'corporate'], 1299, 1599, NEXT_DAY, 120, {
      stock: 200,
      hi: ['Bulk pricing from 25 boxes', 'Company logo on the sleeve', 'Dry fruits, diya and sweets'],
      d: 'A restrained, genuinely nice Diwali box — orderable by the hundred.',
      tags: ['corporate', 'diwali', 'bulk'],
    }),
  ],

  'cakecraft@upahaar.test': [
    P('Custom Photo Cake (1kg)', 'cakes', 'cakes', ['birthday', 'anniversary'], 1299, 1599, PRIORITY_3H, 150, {
      per: true, pz: true, photo: true, feat: true, stock: 20, pzFee: 149,
      hi: ['Edible print of your photo', 'Vanilla, chocolate or butterscotch', 'Eggless on request'],
      d: 'Upload any photo and we print it in edible ink on a full kilo of fresh cream cake.',
      tags: ['photo-cake', 'personalised', 'birthday'],
    }),
    P('Red Velvet Cheesecake (1kg)', 'cakes', 'cakes', ['anniversary', 'valentines-day'], 1099, 1349, PRIORITY_3H, 120, {
      per: true, best: true, stock: 16,
      hi: ['Baked cheesecake base', 'Cream cheese frosting', 'Serves 8–10'],
      d: 'Red velvet and New York cheesecake in one tin, which is as good as it sounds.',
      tags: ['cheesecake', 'premium'],
    }),
    P('Butterscotch Celebration Cake (500g)', 'cakes', 'cakes', ['birthday', 'congratulations'], 599, 749, PRIORITY_3H, 100, {
      per: true, stock: 30,
      hi: ['Praline crunch layers', 'Fresh cream', 'Candles and knife included'],
      d: 'The butterscotch cake every Indian birthday has had at least once.',
      tags: ['cake', 'birthday'],
      variants: [{ name: '500g', priceDelta: 0, stock: 30 }, { name: '1kg', priceDelta: 500, stock: 15 }],
    }),
    P('Rainbow Kids Birthday Cake', 'birthday-gifts', 'cakes', ['birthday'], 1499, 1799, NEXT_DAY, 240, {
      per: true, pz: true, stock: 12, pzFee: 99,
      hi: ['Six coloured sponge layers', 'Name piped on top', 'Vanilla buttercream'],
      d: 'Six layers, six colours, and a name piped across the top.',
      tags: ['kids', 'birthday'],
    }),
    P('Anniversary Heart Cake with Message', 'anniversary-gifts', 'cakes', ['anniversary', 'valentines-day'], 1199, 1449, PRIORITY_3H, 130, {
      per: true, pz: true, stock: 18, pzFee: 79,
      hi: ['Heart-shaped, 1kg', 'Your message piped on top', 'Chocolate or red velvet'],
      d: 'A heart-shaped kilo with your own words on it. Sentimental on purpose.',
      tags: ['anniversary', 'romantic'],
    }),
  ],

  'priya@upahaar.test': [
    P('Personalised Photo Mug', 'personalized-gifts', 'personalized', ['birthday', 'thank-you', 'just-because'], 449, 649, NEXT_DAY, 180, {
      pz: true, photo: true, best: true, stock: 120, pzFee: 0,
      hi: ['Upload any photo', 'Dishwasher safe print', 'Ceramic, 330ml'],
      d: 'The gift that started everything. Upload a photo, add a line, and it ships tomorrow.',
      tags: ['mug', 'personalised', 'photo'],
    }),
    P('Engraved Wooden Photo Frame', 'personalized-gifts', 'personalized', ['anniversary', 'wedding', 'house-warming'], 1299, 1699, NEXT_DAY, 240, {
      pz: true, photo: true, feat: true, stock: 45, pzFee: 149,
      hi: ['Laser-engraved sheesham wood', 'Names and date engraved', 'Wall or table mount'],
      d: 'Solid sheesham, laser-engraved with two names and a date that matters.',
      tags: ['wood', 'engraved', 'anniversary'],
    }),
    P('Custom Photo Cushion', 'personalized-gifts', 'personalized', ['birthday', 'valentines-day'], 699, 899, NEXT_DAY, 200, {
      pz: true, photo: true, stock: 70, pzFee: 0,
      hi: ['16 x 16 inch, filler included', 'Full-colour photo print', 'Soft velvet finish'],
      d: 'A cushion with their favourite photograph on it. Slightly ridiculous, universally loved.',
      tags: ['cushion', 'photo'],
    }),
    P('Magic Photo LED Lamp', 'personalized-gifts', 'personalized', ['anniversary', 'birthday', 'valentines-day'], 1599, 2099, NEXT_DAY, 300, {
      pz: true, photo: true, best: true, stock: 35, pzFee: 199,
      hi: ['Photo appears only when lit', 'Warm LED, USB powered', 'Wooden base'],
      d: 'Looks like plain acrylic until you switch it on — then their photograph appears.',
      tags: ['lamp', 'photo', 'wow'],
    }),
    P('Personalised Name Keychain Pair', 'personalized-gifts', 'personalized', ['valentines-day', 'just-because'], 399, 549, NEXT_DAY, 150, {
      pz: true, stock: 90, pzFee: 0,
      hi: ['Two engraved steel keychains', 'Up to 12 characters each', 'Gift pouch included'],
      d: 'Two steel keychains, two names. A small thing that gets carried every day.',
      tags: ['keychain', 'couples'],
    }),
  ],

  'teddy@upahaar.test': [
    P('Giant Cuddle Teddy Bear (3 ft)', 'soft-toys', 'toys', ['birthday', 'valentines-day'], 2499, 3199, NEXT_DAY, 120, {
      feat: true, best: true, stock: 22,
      hi: ['Three feet of hypoallergenic plush', 'Safety-tested stitched eyes', 'Ribbon and gift tag included'],
      d: 'Three feet tall, impossible to wrap discreetly, and completely worth it.',
      tags: ['teddy', 'big', 'romantic'],
    }),
    P('Baby Bunny Comfort Set', 'baby-gifts', 'toys', ['new-baby'], 1299, 1649, NEXT_DAY, 90, {
      stock: 40,
      hi: ['Plush bunny with a comfort blanket', 'Machine washable', 'Newborn safe'],
      d: 'A bunny and a blanket, both soft enough for day one.',
      tags: ['baby', 'plush'],
    }),
    P('Elephant Plush with Name Tag', 'soft-toys', 'toys', ['new-baby', 'birthday'], 899, 1199, NEXT_DAY, 150, {
      pz: true, stock: 55, pzFee: 79,
      hi: ['Embroidered name on the ear tag', '14 inches tall', 'Organic cotton outer'],
      d: 'A plush elephant with their name stitched onto the ear tag.',
      tags: ['plush', 'personalised', 'baby'],
    }),
    P('Couple Teddy Set with Heart', 'valentines-day', 'toys', ['valentines-day', 'anniversary'], 1099, 1449, NEXT_DAY, 100, {
      stock: 48,
      hi: ['Two 12-inch bears', 'Removable plush heart', 'Gift box included'],
      d: 'Two bears holding a heart between them. Nobody has ever complained.',
      tags: ['couples', 'valentines'],
    }),
    P('Soft Toy & Chocolate Combo', 'soft-toys', 'toys', ['birthday', 'get-well-soon'], 1199, 1499, NEXT_DAY, 110, {
      stock: 60,
      hi: ['18-inch teddy plus a truffle box', 'Wrapped together', 'Card included'],
      d: 'Teddy in one hand, chocolate in the other. Covers most emergencies.',
      tags: ['combo', 'teddy'],
    }),
  ],

  'delhipetals@upahaar.test': [
    P('Red Roses in a Hat Box', 'flowers', 'flowers', ['valentines-day', 'anniversary'], 1699, 2099, EXPRESS_60, 20, {
      per: true, feat: true, best: true, stock: 26,
      hi: ['25 roses arranged in foam', 'No vase needed', 'Velvet hat-box'],
      d: 'Twenty-five roses arranged in a velvet box, ready to sit on a table as-is.',
      tags: ['roses', 'premium', 'express'],
    }),
    P('Black Forest Cake (1kg)', 'cakes', 'cakes', ['birthday', 'congratulations'], 899, 1099, EXPRESS_60, 30, {
      per: true, stock: 24,
      hi: ['Cherries and dark chocolate shavings', 'Fresh cream', 'Eggless available'],
      d: 'A full kilo of black forest, cut and boxed the moment the order comes in.',
      tags: ['cake', 'classic', 'express'],
    }),
    P('Mixed Seasonal Bouquet', 'flowers', 'flowers', ['thank-you', 'get-well-soon', 'just-because'], 899, 1149, EXPRESS_60, 18, {
      per: true, stock: 45,
      hi: ['Carnations, roses and daisies', 'Seasonal mix', 'Wrapped in kraft paper'],
      d: 'Whatever is best in the market that day, wrapped beautifully.',
      tags: ['seasonal', 'express'],
    }),
    P('Chocolate Truffle Jar Set', 'chocolates', 'chocolates', ['diwali', 'thank-you'], 1099, 1399, PRIORITY_3H, 45, {
      stock: 38,
      hi: ['Three glass jars of assorted truffles', 'Ribbon-tied', 'Keeps two weeks'],
      d: 'Three jars, three flavours, one very reasonable excuse.',
      tags: ['chocolate', 'jar'],
    }),
    P('Anniversary Rose & Cake Combo', 'anniversary-gifts', 'cakes', ['anniversary'], 1999, 2499, EXPRESS_60, 35, {
      per: true, stock: 18,
      hi: ['1kg cake and 20 red roses', 'Message card', 'Under an hour in central Delhi'],
      d: 'Cake and roses together, because choosing between them is a mistake.',
      tags: ['combo', 'anniversary', 'express'],
    }),
  ],

  'giftgrove@upahaar.test': [
    P('Scented Candle Trio Gift Set', 'gift-hampers', 'hampers', ['house-warming', 'thank-you', 'diwali'], 1299, 1699, PRIORITY_3H, 40, {
      stock: 55,
      hi: ['Soy wax, 40-hour burn each', 'Oud, jasmine and vanilla', 'Gift box with ribbon'],
      d: 'Three soy candles in the three scents people actually finish.',
      tags: ['candles', 'home'],
    }),
    P('Luxury Dry Fruit Platter', 'festival-gifts', 'hampers', ['diwali', 'corporate', 'wedding'], 2799, 3399, PRIORITY_3H, 50, {
      feat: true, stock: 40,
      hi: ['Almonds, pista, cashew, anjeer', 'Brass-finish partitioned tray', 'Festive sleeve'],
      d: 'Four premium dry fruits in a brass-finish tray that gets reused every year.',
      tags: ['dry-fruits', 'diwali', 'premium'],
    }),
    P('Indoor Plant Gift Duo', 'gift-hampers', 'misc', ['house-warming', 'get-well-soon', 'corporate'], 999, 1299, NEXT_DAY, 60, {
      stock: 48,
      hi: ['Snake plant and money plant', 'Ceramic pots included', 'Care instructions'],
      d: 'Two plants that survive being forgotten, in pots worth keeping.',
      tags: ['plants', 'home', 'green'],
    }),
    P('Wedding Silver Coin Gift Box', 'wedding-gifts', 'hampers', ['wedding'], 3999, 4799, NEXT_DAY, 90, {
      stock: 20,
      hi: ['10g silver coin, 999 purity', 'Velvet presentation box', 'Certificate included'],
      d: 'A silver coin in a velvet box — the wedding gift that never misses.',
      tags: ['wedding', 'silver', 'premium'],
    }),
    P('Festive Sweets & Diya Hamper', 'festival-gifts', 'hampers', ['diwali'], 1699, 2099, PRIORITY_3H, 55, {
      stock: 60,
      hi: ['Kaju katli and besan laddoo', 'Four hand-painted diyas', 'Marigold-wrapped box'],
      d: 'Sweets, diyas and marigold — the whole festival in one box.',
      tags: ['diwali', 'sweets'],
    }),
  ],

  'blrblooms@upahaar.test': [
    P('Pastel Rose & Carnation Bouquet', 'flowers', 'flowers', ['birthday', 'thank-you', 'mothers-day'], 1099, 1399, EXPRESS_60, 20, {
      per: true, feat: true, best: true, stock: 40,
      hi: ['24 pastel stems', 'Handmade paper wrap', 'Free message card'],
      d: 'Two dozen stems in dusty pinks and creams — our most-ordered bouquet in Bengaluru.',
      tags: ['pastel', 'express'],
    }),
    P('Succulent Garden Bowl', 'gift-hampers', 'misc', ['house-warming', 'corporate', 'thank-you'], 899, 1149, PRIORITY_3H, 45, {
      stock: 52,
      hi: ['Five succulents in a ceramic bowl', 'Very low maintenance', 'Care card included'],
      d: 'Five succulents in one shallow bowl. Needs light and almost nothing else.',
      tags: ['plants', 'desk', 'office'],
    }),
    P('Belgian Chocolate Cake (1kg)', 'cakes', 'cakes', ['birthday', 'anniversary'], 1199, 1499, EXPRESS_60, 30, {
      per: true, stock: 20,
      hi: ['Belgian couverture ganache', 'Three sponge layers', 'Eggless available'],
      d: 'Dense, dark and not too sweet — a proper chocolate cake.',
      tags: ['cake', 'chocolate', 'express'],
    }),
    P('Lily & Orchid Premium Vase', 'flowers', 'flowers', ['congratulations', 'corporate', 'wedding'], 2599, 3099, PRIORITY_3H, 50, {
      per: true, stock: 14,
      hi: ['Oriental lilies and orchids', 'Glass vase included', 'Ten days of blooms'],
      d: 'Lilies and orchids in a heavy glass vase — the arrangement for a reception desk.',
      tags: ['premium', 'office'],
    }),
    P('Birthday Balloon & Bloom Surprise', 'birthday-gifts', 'flowers', ['birthday'], 1499, 1899, EXPRESS_60, 35, {
      per: true, stock: 30,
      hi: ['12 roses with helium balloons', 'Birthday banner included', 'Delivered together'],
      d: 'Flowers, balloons and a banner, arriving before they have finished their coffee.',
      tags: ['birthday', 'balloons', 'express'],
    }),
  ],

  'cocoacraft@upahaar.test': [
    P('Fudgy Brownie Box (12 pc)', 'chocolates', 'chocolates', ['birthday', 'thank-you', 'just-because'], 799, 999, EXPRESS_60, 25, {
      per: true, best: true, stock: 60,
      hi: ['12 dense walnut brownies', 'Baked fresh each morning', 'Eggless available'],
      d: 'Twelve brownies, properly fudgy, still slightly warm if you are close by.',
      tags: ['brownie', 'express'],
    }),
    P('Dessert Jar Sampler (6 jars)', 'chocolates', 'chocolates', ['birthday', 'congratulations'], 1199, 1499, PRIORITY_3H, 40, {
      per: true, stock: 36,
      hi: ['Tiramisu, biscoff, red velvet and more', 'Glass jars with spoons', 'Chilled delivery'],
      d: 'Six desserts in six jars, so nobody has to share.',
      tags: ['dessert', 'sampler'],
    }),
    P('Assorted Chocolate Hamper', 'gift-hampers', 'chocolates', ['diwali', 'corporate', 'thank-you'], 1899, 2399, PRIORITY_3H, 50, {
      feat: true, stock: 42,
      hi: ['Bars, truffles and dragees', 'Kraft hamper box', 'Personalised card'],
      d: 'A well-judged spread of everything we make, in one box.',
      tags: ['hamper', 'chocolate'],
    }),
    P('Chocolate Dipped Strawberries', 'chocolates', 'chocolates', ['valentines-day', 'anniversary'], 999, 1249, EXPRESS_60, 30, {
      per: true, stock: 24,
      hi: ['12 strawberries, dark and white chocolate', 'Chilled box', 'Same-day only'],
      d: 'A dozen strawberries in dark and white chocolate. Eat them the same day.',
      tags: ['romantic', 'fresh', 'express'],
    }),
    P('Coffee & Cocoa Gift Kit', 'corporate-gifts', 'chocolates', ['corporate', 'thank-you', 'house-warming'], 1499, 1849, NEXT_DAY, 90, {
      stock: 70,
      hi: ['Single-origin coffee and drinking chocolate', 'Two ceramic mugs', 'Logo printing available'],
      d: 'Coffee, chocolate and two mugs — our most-repeated corporate order.',
      tags: ['coffee', 'corporate'],
    }),
  ],

  'punepat@upahaar.test': [
    P('Pineapple Cream Cake (1kg)', 'cakes', 'cakes', ['birthday', 'congratulations'], 749, 949, EXPRESS_60, 30, {
      per: true, best: true, stock: 26,
      hi: ['Fresh pineapple layers', 'Light whipped cream', 'Eggless available'],
      d: 'The lightest cake on our counter, and the one that disappears first.',
      tags: ['cake', 'classic', 'express'],
    }),
    P('Assorted French Macarons (12)', 'chocolates', 'chocolates', ['thank-you', 'birthday', 'just-because'], 1099, 1349, PRIORITY_3H, 45, {
      per: true, stock: 30,
      hi: ['Six flavours, twelve pieces', 'Gift box with ribbon', 'Best within 48 hours'],
      d: 'Twelve macarons across six flavours, boxed the way they should be.',
      tags: ['macaron', 'premium'],
    }),
    P('Celebration Cupcake Box (6)', 'cakes', 'cakes', ['birthday', 'congratulations'], 599, 749, EXPRESS_60, 25, {
      per: true, pz: true, stock: 44, pzFee: 49,
      hi: ['Six frosted cupcakes', 'Custom message topper', 'Mixed flavours'],
      d: 'Six cupcakes with a message topper — easier to share than a cake.',
      tags: ['cupcake', 'express'],
    }),
    P('Anniversary Cake & Wine Glasses', 'anniversary-gifts', 'cakes', ['anniversary', 'wedding'], 2299, 2799, PRIORITY_3H, 90, {
      per: true, stock: 16,
      hi: ['1kg cake with two etched glasses', 'Gift-boxed together', 'Personal message'],
      d: 'A kilo of cake and two etched glasses. The evening is more or less planned.',
      tags: ['anniversary', 'combo'],
    }),
    P('Festive Mithai & Cake Combo', 'festival-gifts', 'cakes', ['diwali', 'raksha-bandhan'], 1399, 1749, PRIORITY_3H, 60, {
      per: true, stock: 34,
      hi: ['500g cake and 500g assorted mithai', 'Festive box', 'Diya included'],
      d: 'Half a kilo of cake and half a kilo of mithai, for households that want both.',
      tags: ['festive', 'combo'],
    }),
  ],

  'nizami@upahaar.test': [
    P('Royal Dry Fruit Gift Chest', 'festival-gifts', 'hampers', ['diwali', 'wedding', 'corporate'], 3299, 3999, PRIORITY_3H, 60, {
      feat: true, best: true, stock: 30,
      hi: ['Six varieties of premium dry fruit', 'Wooden chest with brass latch', 'Festive wrap'],
      d: 'Six compartments of premium dry fruit in a wooden chest that outlives the festival.',
      tags: ['dry-fruits', 'premium', 'diwali'],
    }),
    P('Hyderabadi Sweet Box (1kg)', 'festival-gifts', 'hampers', ['diwali', 'raksha-bandhan', 'congratulations'], 1299, 1599, PRIORITY_3H, 45, {
      per: true, stock: 48,
      hi: ['Badam ki jali, khubani and more', 'Made fresh weekly', 'Traditional box'],
      d: 'A kilo of Hyderabadi classics, made in small batches each week.',
      tags: ['sweets', 'traditional'],
    }),
    P('Attar & Keepsake Gift Set', 'gift-hampers', 'hampers', ['wedding', 'thank-you', 'diwali'], 2499, 2999, NEXT_DAY, 90, {
      stock: 26,
      hi: ['Three traditional attars', 'Hand-carved wooden case', 'Gift card included'],
      d: 'Three attars in a carved case — oud, rose and khus.',
      tags: ['attar', 'traditional', 'premium'],
    }),
    P('Pearl Jewellery Gift Box', 'wedding-gifts', 'misc', ['wedding', 'anniversary'], 4499, 5499, NEXT_DAY, 120, {
      stock: 14,
      hi: ['Freshwater pearl set', 'Velvet-lined presentation box', 'Authenticity card'],
      d: 'A freshwater pearl set in a velvet box. Understated, and clearly considered.',
      tags: ['jewellery', 'wedding', 'premium'],
    }),
    P('Festive Diya & Rangoli Kit', 'festival-gifts', 'misc', ['diwali'], 799, 999, PRIORITY_3H, 40, {
      stock: 80,
      hi: ['12 hand-painted diyas', 'Rangoli colours and stencils', 'Marigold string'],
      d: 'Everything needed for the doorway, in one box.',
      tags: ['diwali', 'decor'],
    }),
  ],

  'parkstreet@upahaar.test': [
    P('Classic Chocolate Rum Cake', 'cakes', 'cakes', ['birthday', 'diwali', 'congratulations'], 949, 1199, EXPRESS_60, 30, {
      per: true, best: true, stock: 22,
      hi: ['Dark rum-soaked sponge', 'Park Street recipe since 1974', 'Serves 8'],
      d: 'The rum cake this bakery has been making since 1974.',
      tags: ['cake', 'classic', 'express'],
    }),
    P('Assorted Pastry Box (8)', 'cakes', 'cakes', ['thank-you', 'just-because'], 699, 899, EXPRESS_60, 25, {
      per: true, stock: 40,
      hi: ['Eight assorted pastries', 'Baked the same morning', 'Chilled box'],
      d: 'Eight pastries, no two the same, boxed cold.',
      tags: ['pastry', 'express'],
    }),
    P('Bengali Sweet Platter', 'festival-gifts', 'hampers', ['diwali', 'congratulations', 'thank-you'], 1099, 1349, PRIORITY_3H, 45, {
      per: true, stock: 44,
      hi: ['Sandesh, rosogolla and mishti doi', 'Traditional clay pots', 'Made fresh daily'],
      d: 'Sandesh, rosogolla and mishti doi, in the clay pots they belong in.',
      tags: ['sweets', 'bengali'],
    }),
    P('Rose & Chocolate Combo Box', 'gift-hampers', 'chocolates', ['valentines-day', 'anniversary'], 1399, 1749, EXPRESS_60, 35, {
      per: true, stock: 28,
      hi: ['12 roses with a truffle box', 'Single gift box', 'Message card'],
      d: 'Roses and truffles in one box, which saves carrying two.',
      tags: ['combo', 'romantic', 'express'],
    }),
    P('Tea Time Gift Hamper', 'gift-hampers', 'hampers', ['thank-you', 'get-well-soon', 'corporate'], 1599, 1999, NEXT_DAY, 90, {
      stock: 38,
      hi: ['Darjeeling first flush and biscuits', 'Bone china cup and saucer', 'Kraft hamper box'],
      d: 'First-flush Darjeeling, good biscuits and a cup to drink it from.',
      tags: ['tea', 'hamper'],
    }),
  ],

  'chennai@upahaar.test': [
    P('Jasmine Garland & Sweets Combo', 'festival-gifts', 'flowers', ['diwali', 'just-because', 'thank-you'], 749, 949, EXPRESS_60, 20, {
      per: true, stock: 60,
      hi: ['Fresh jasmine garland', '250g assorted sweets', 'Strung the same morning'],
      d: 'Jasmine strung that morning, with a box of sweets alongside.',
      tags: ['jasmine', 'traditional', 'express'],
    }),
    P('Filter Coffee Gift Kit', 'corporate-gifts', 'misc', ['corporate', 'house-warming', 'thank-you'], 1299, 1599, PRIORITY_3H, 50, {
      best: true, stock: 55,
      hi: ['Stainless steel filter and tumbler set', '500g Kumbakonam blend', 'Gift box'],
      d: 'A steel filter, a tumbler and half a kilo of properly ground Kumbakonam coffee.',
      tags: ['coffee', 'south-indian', 'corporate'],
    }),
    P('Mysore Pak & Dry Fruit Box', 'festival-gifts', 'hampers', ['diwali', 'congratulations'], 1099, 1349, PRIORITY_3H, 45, {
      stock: 46,
      hi: ['500g ghee Mysore pak', 'Assorted dry fruits', 'Traditional gift box'],
      d: 'Ghee Mysore pak and dry fruit, in a box that travels well.',
      tags: ['sweets', 'traditional'],
    }),
    P('Silk Saree Gift Box', 'wedding-gifts', 'misc', ['wedding', 'mothers-day'], 5999, 7499, NEXT_DAY, 120, {
      stock: 12,
      hi: ['Kanjivaram blend silk', 'Presentation box with sleeve', 'Six-yard with blouse piece'],
      d: 'A Kanjivaram-blend silk saree in a presentation box.',
      tags: ['saree', 'wedding', 'premium'],
    }),
    P('Rose & Marigold Festive Bunch', 'flowers', 'flowers', ['diwali', 'just-because'], 549, 699, EXPRESS_60, 15, {
      per: true, stock: 65,
      hi: ['Roses and marigolds', 'Tied with banana fibre', 'Same-morning flowers'],
      d: 'Roses and marigold tied with banana fibre — bright, and very Chennai.',
      tags: ['festive', 'express'],
    }),
  ],

  'karigar@upahaar.test': [
    P('Blue Pottery Serving Bowl Set', 'gift-hampers', 'misc', ['house-warming', 'wedding', 'diwali'], 2299, 2899, STANDARD_2_3D, 120, {
      feat: true, stock: 40,
      hi: ['Four hand-painted Jaipur bowls', 'Food safe glaze', 'Ships nationwide'],
      d: 'Four hand-painted blue pottery bowls from a Jaipur family workshop.',
      tags: ['handmade', 'pottery', 'artisan'],
    }),
    P('Brass Diya Set of Five', 'festival-gifts', 'misc', ['diwali', 'house-warming'], 1499, 1899, STANDARD_2_3D, 90, {
      best: true, stock: 90,
      hi: ['Solid brass, hand-finished', 'Five graduated sizes', 'Polishing cloth included'],
      d: 'Five solid brass diyas, hand-finished and heavy enough to last decades.',
      tags: ['brass', 'diwali', 'handmade'],
    }),
    P('Hand-Block Print Table Linen', 'gift-hampers', 'misc', ['house-warming', 'wedding', 'thank-you'], 1899, 2399, STANDARD_2_3D, 120, {
      stock: 55,
      hi: ['Six-seater runner and napkins', 'Natural dye block print', 'Pure cotton'],
      d: 'A block-printed runner with six napkins, dyed with natural colours.',
      tags: ['linen', 'handmade', 'home'],
    }),
    P('Marble Inlay Keepsake Box', 'wedding-gifts', 'misc', ['wedding', 'anniversary'], 3499, 4299, STANDARD_2_3D, 150, {
      stock: 26,
      hi: ['Hand-inlaid semi-precious stone', 'Velvet-lined interior', 'Makrana marble'],
      d: 'Makrana marble with hand-set stone inlay, velvet lined inside.',
      tags: ['marble', 'premium', 'handmade'],
    }),
    P('Engraved Brass Nameplate', 'personalized-gifts', 'personalized', ['house-warming', 'wedding'], 2199, 2699, STANDARD_2_3D, 240, {
      pz: true, stock: 45, pzFee: 199,
      hi: ['Your family name engraved', 'Weatherproof brass', 'Mounting kit included'],
      d: 'A hand-engraved brass nameplate for the front door of a new home.',
      tags: ['brass', 'personalised', 'home'],
    }),
  ],

  'corporate@upahaar.test': [
    P('Executive Welcome Kit', 'corporate-gifts', 'hampers', ['corporate'], 2499, 2999, STANDARD_2_3D, 180, {
      feat: true, stock: 300,
      hi: ['Notebook, pen, bottle and tote', 'Full logo branding', 'From 25 units'],
      d: 'The onboarding kit that does not go straight into a drawer. Branded to your spec.',
      tags: ['corporate', 'onboarding', 'bulk'],
    }),
    P('Branded Diwali Corporate Hamper', 'corporate-gifts', 'hampers', ['diwali', 'corporate'], 1899, 2299, STANDARD_2_3D, 200, {
      best: true, stock: 500,
      hi: ['Dry fruits, candle and sweets', 'Company logo on box and sleeve', 'From 50 units'],
      d: 'A restrained Diwali hamper you can send to five hundred people without embarrassment.',
      tags: ['diwali', 'corporate', 'bulk'],
    }),
    P('Work Anniversary Gift Set', 'corporate-gifts', 'personalized', ['corporate', 'congratulations'], 1699, 2099, STANDARD_2_3D, 240, {
      pz: true, stock: 220, pzFee: 149,
      hi: ['Engraved desk plaque and pen', 'Name and years engraved', 'Gift box'],
      d: 'An engraved plaque and pen for the people who stayed.',
      tags: ['corporate', 'personalised'],
    }),
    P('Client Appreciation Luxury Box', 'corporate-gifts', 'hampers', ['corporate', 'thank-you'], 3999, 4799, STANDARD_2_3D, 220, {
      stock: 150,
      hi: ['Single-malt-grade glassware and chocolates', 'Leather notebook', 'Handwritten card per recipient'],
      d: 'The box you send when the account matters. Card handwritten per recipient.',
      tags: ['corporate', 'premium'],
    }),
    P('Team Celebration Snack Crate', 'corporate-gifts', 'hampers', ['corporate', 'congratulations'], 2999, 3599, STANDARD_2_3D, 180, {
      stock: 180,
      hi: ['Serves a team of 10–12', 'Sweet and savoury mix', 'Wooden crate'],
      d: 'A wooden crate of snacks sized for a team that just shipped something.',
      tags: ['corporate', 'team'],
    }),
  ],
};

export default PRODUCTS;
