import {
  Cake, Flower, Chocolate, Hamper, Engrave, Bear, Ring, Rings, Balloon, Tie, Rattle,
  Briefcase, Diya, Confetti, Knot, Sun, HandHeart, Home, Heart, Gift, Sparkles,
  Bolt, Clock, Package, Calendar, Receipt, Check, ChefHat, Bike, Truck, Warning,
  CreditCard, Bank, Wallet, Cash, Phone, Store, Shield, Bell,
  Cart, Search, MapPin, Star, Tag, Users, Chart, Mail, EyeOff, Rupee,
} from '../components/common/Icons.jsx';

/**
 * The single place that decides which glyph represents a thing.
 *
 * The API sends stable keys ('cakes', 'EXPRESS_60', 'DELIVERED'); the client
 * decides how they look. Keeping the mapping here means the storefront, the
 * seller panel and the admin panel can never drift apart, and swapping an icon
 * is a one-line change.
 */

const CATEGORY_ICONS = {
  cakes: Cake,
  flowers: Flower,
  chocolates: Chocolate,
  'gift-hampers': Hamper,
  'personalized-gifts': Engrave,
  'soft-toys': Bear,
  'anniversary-gifts': Ring,
  'birthday-gifts': Balloon,
  'mothers-day': Flower,
  'fathers-day': Tie,
  'valentines-day': Heart,
  'wedding-gifts': Rings,
  'baby-gifts': Rattle,
  'corporate-gifts': Briefcase,
  'festival-gifts': Diya,
};

const OCCASION_ICONS = {
  birthday: Balloon,
  anniversary: Ring,
  wedding: Rings,
  'valentines-day': Heart,
  'mothers-day': Flower,
  'fathers-day': Tie,
  congratulations: Confetti,
  'thank-you': HandHeart,
  'get-well-soon': Sun,
  'new-baby': Rattle,
  'house-warming': Home,
  diwali: Diya,
  'raksha-bandhan': Knot,
  corporate: Briefcase,
  'just-because': Sparkles,
};

export const TIER_ICONS = {
  EXPRESS_60: Bolt,
  PRIORITY_3H: Clock,
  NEXT_DAY: Package,
  STANDARD_2_3D: Calendar,
};

export const ORDER_STATUS_ICONS = {
  PLACED: Receipt,
  ACCEPTED: Check,
  PREPARING: ChefHat,
  READY_FOR_PICKUP: Package,
  PICKED_UP: Bike,
  OUT_FOR_DELIVERY: Truck,
  DELIVERED: Heart,
  CANCELLED: Warning,
};

export const PAYMENT_ICONS = {
  UPI: Phone,
  CARD: CreditCard,
  NETBANKING: Bank,
  WALLET: Wallet,
  COD: Cash,
};

/** Notification `icon` keys sent by the API. */
const NOTIFICATION_ICONS = {
  order: Gift,
  accepted: Check,
  preparing: ChefHat,
  pickup: Package,
  rider: Bike,
  delivery: Truck,
  delivered: Heart,
  cancelled: Warning,
  inventory: Package,
  store: Store,
  kyc: Shield,
  payout: Wallet,
  promo: Sparkles,
  reminder: Calendar,
  welcome: Gift,
  broadcast: Bell,
};

/**
 * General-purpose keys for empty states, placeholders and inline marks.
 * Components take a string key rather than a component so a call site never
 * needs an extra import just to change a glyph.
 */
const UI_ICONS = {
  gift: Gift,
  cart: Cart,
  search: Search,
  location: MapPin,
  store: Store,
  box: Package,
  star: Star,
  tag: Tag,
  card: CreditCard,
  calendar: Calendar,
  bell: Bell,
  users: Users,
  chart: Chart,
  note: Receipt,
  sparkle: Sparkles,
  warning: Warning,
  heart: Heart,
  money: Rupee,
  wallet: Wallet,
  receipt: Receipt,
  book: Mail,
  balloon: Balloon,
  inbox: Package,
  idea: Sparkles,
  map: MapPin,
  shield: Shield,
  truck: Truck,
  bike: Bike,
  chef: ChefHat,
  check: Check,
  bolt: Bolt,
  clock: Clock,
  package: Package,
  cash: Cash,
  phone: Phone,
  bank: Bank,
  mail: Mail,
  hide: EyeOff,
  personalise: Engrave,
  confetti: Confetti,
  diya: Diya,
  flower: Flower,
  home: Home,
};

const fallback = Gift;

/**
 * Resolves any key the app uses — a category slug, an occasion slug, a
 * notification key or a generic UI key — to an icon component.
 */
export function resolveIcon(key) {
  if (!key) return fallback;
  return UI_ICONS[key] || CATEGORY_ICONS[key] || OCCASION_ICONS[key] || NOTIFICATION_ICONS[key] || fallback;
}

export function categoryIcon(slug) {
  return CATEGORY_ICONS[slug] || fallback;
}

export function occasionIcon(slug) {
  return OCCASION_ICONS[slug] || Sparkles;
}

export function notificationIcon(key) {
  return NOTIFICATION_ICONS[key] || Bell;
}

/** Renders a category's glyph from a populated category object or a slug. */
export function CategoryGlyph({ category, slug, size = 20, className = '' }) {
  const Icon = categoryIcon(slug || category?.slug || category?.icon);
  return <Icon size={size} className={className} />;
}

export function OccasionGlyph({ occasion, slug, size = 20, className = '' }) {
  const Icon = occasionIcon(slug || occasion?.slug || occasion?.icon);
  return <Icon size={size} className={className} />;
}

export function TierIcon({ tier, size = 14, className = '' }) {
  const Icon = TIER_ICONS[tier] || Package;
  return <Icon size={size} className={className} />;
}

export function NotificationGlyph({ icon, size = 18, className = '' }) {
  const Icon = notificationIcon(icon);
  return <Icon size={size} className={className} />;
}
