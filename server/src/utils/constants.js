/**
 * Shared domain vocabulary for Upahaar.
 * The delivery tiers here are the spine of the whole product — they drive the
 * availability engine, the product badges, the checkout options and the filters.
 */

export const ROLES = {
  CUSTOMER: 'CUSTOMER',
  SELLER: 'SELLER',
  ADMIN: 'ADMIN',
};

export const DELIVERY_TIERS = {
  EXPRESS_60: 'EXPRESS_60',
  PRIORITY_3H: 'PRIORITY_3H',
  NEXT_DAY: 'NEXT_DAY',
  STANDARD_2_3D: 'STANDARD_2_3D',
};

export const TIER_ORDER = [
  DELIVERY_TIERS.EXPRESS_60,
  DELIVERY_TIERS.PRIORITY_3H,
  DELIVERY_TIERS.NEXT_DAY,
  DELIVERY_TIERS.STANDARD_2_3D,
];

/**
 * Everything the UI needs to render a tier lives here so the badge on a product
 * card, the group heading on the homepage and the checkout option never drift.
 *
 * `icon` is a stable key — the client maps it to a glyph, so the API never
 * dictates presentation.
 */
export const TIER_META = {
  [DELIVERY_TIERS.EXPRESS_60]: {
    key: DELIVERY_TIERS.EXPRESS_60,
    label: 'Deliver in 60 Minutes',
    shortLabel: '60 Min',
    badge: '60 MIN',
    icon: 'bolt',
    tagline: 'Available near you',
    eta: 'Delivery in ~45–60 min',
    maxMinutes: 60,
    shippingName: 'Express',
    shippingFee: 99,
    rank: 0,
  },
  [DELIVERY_TIERS.PRIORITY_3H]: {
    key: DELIVERY_TIERS.PRIORITY_3H,
    label: 'Deliver in 3 Hours',
    shortLabel: '3 Hours',
    badge: '3 HOURS',
    icon: 'clock',
    tagline: 'From sellers a short ride away',
    eta: 'Delivery in ~2–3 hours',
    maxMinutes: 180,
    shippingName: 'Priority',
    shippingFee: 49,
    rank: 1,
  },
  [DELIVERY_TIERS.NEXT_DAY]: {
    key: DELIVERY_TIERS.NEXT_DAY,
    label: 'Deliver Tomorrow',
    shortLabel: 'Tomorrow',
    badge: 'TOMORROW',
    icon: 'package',
    tagline: 'Handpicked by regional sellers',
    eta: 'Arrives tomorrow',
    maxMinutes: 60 * 24,
    shippingName: 'Standard',
    shippingFee: 0,
    rank: 2,
  },
  [DELIVERY_TIERS.STANDARD_2_3D]: {
    key: DELIVERY_TIERS.STANDARD_2_3D,
    label: 'Deliver in 2–3 Days',
    shortLabel: '2–3 Days',
    badge: '2–3 DAYS',
    icon: 'calendar',
    tagline: 'Worth the little wait',
    eta: 'Arrives in 2–3 days',
    maxMinutes: 60 * 72,
    shippingName: 'Shipped',
    shippingFee: 0,
    rank: 3,
  },
};

export const ORDER_STATUS = {
  PLACED: 'PLACED',
  ACCEPTED: 'ACCEPTED',
  PREPARING: 'PREPARING',
  READY_FOR_PICKUP: 'READY_FOR_PICKUP',
  PICKED_UP: 'PICKED_UP',
  OUT_FOR_DELIVERY: 'OUT_FOR_DELIVERY',
  DELIVERED: 'DELIVERED',
  CANCELLED: 'CANCELLED',
};

/** The happy path, in order. Used to render the tracking timeline. */
export const ORDER_FLOW = [
  ORDER_STATUS.PLACED,
  ORDER_STATUS.ACCEPTED,
  ORDER_STATUS.PREPARING,
  ORDER_STATUS.READY_FOR_PICKUP,
  ORDER_STATUS.PICKED_UP,
  ORDER_STATUS.OUT_FOR_DELIVERY,
  ORDER_STATUS.DELIVERED,
];

export const ORDER_STATUS_META = {
  [ORDER_STATUS.PLACED]: { label: 'Order placed', customerNote: 'We have your order.', icon: 'order', sellerAction: null },
  [ORDER_STATUS.ACCEPTED]: { label: 'Seller accepted', customerNote: 'Your order has been accepted.', icon: 'accepted', sellerAction: 'Accept Order' },
  [ORDER_STATUS.PREPARING]: { label: 'Preparing', customerNote: 'Your gift is being prepared.', icon: 'preparing', sellerAction: 'Start Preparing' },
  [ORDER_STATUS.READY_FOR_PICKUP]: { label: 'Ready for pickup', customerNote: 'Your gift is packed and waiting for pickup.', icon: 'pickup', sellerAction: 'Ready for Pickup' },
  [ORDER_STATUS.PICKED_UP]: { label: 'Picked up', customerNote: 'A delivery partner has picked up your gift.', icon: 'rider', sellerAction: 'Mark Picked Up' },
  [ORDER_STATUS.OUT_FOR_DELIVERY]: { label: 'Out for delivery', customerNote: 'Your gift is out for delivery.', icon: 'delivery', sellerAction: 'Out for Delivery' },
  [ORDER_STATUS.DELIVERED]: { label: 'Delivered', customerNote: 'Your gift has been delivered.', icon: 'delivered', sellerAction: 'Mark Delivered' },
  [ORDER_STATUS.CANCELLED]: { label: 'Cancelled', customerNote: 'Your order was cancelled.', icon: 'cancelled', sellerAction: null },
};

export const SELLER_STATUS = {
  PENDING: 'PENDING',
  ACTIVE: 'ACTIVE',
  SUSPENDED: 'SUSPENDED',
  REJECTED: 'REJECTED',
};

export const KYC_STATUS = {
  NOT_SUBMITTED: 'NOT_SUBMITTED',
  PENDING: 'PENDING',
  VERIFIED: 'VERIFIED',
  REJECTED: 'REJECTED',
};

export const PAYMENT_METHODS = {
  UPI: 'UPI',
  CARD: 'CARD',
  NETBANKING: 'NETBANKING',
  WALLET: 'WALLET',
  COD: 'COD',
};

export const PAYMENT_STATUS = {
  PENDING: 'PENDING',
  PAID: 'PAID',
  FAILED: 'FAILED',
  REFUNDED: 'REFUNDED',
};

export const COUPON_TYPES = {
  PERCENT: 'PERCENT',
  FLAT: 'FLAT',
};

export const NOTIFICATION_AUDIENCE = {
  CUSTOMER: 'CUSTOMER',
  SELLER: 'SELLER',
  ADMIN: 'ADMIN',
};

export const PRICE_BUCKETS = [
  { key: 'under-500', label: 'Under ₹500', min: 0, max: 499 },
  { key: '500-1000', label: '₹500 – ₹1,000', min: 500, max: 1000 },
  { key: '1000-2500', label: '₹1,000 – ₹2,500', min: 1000, max: 2500 },
  { key: '2500-plus', label: '₹2,500+', min: 2500, max: Number.MAX_SAFE_INTEGER },
];

export const SORT_OPTIONS = [
  { key: 'popular', label: 'Popular' },
  { key: 'price-asc', label: 'Price: Low → High' },
  { key: 'price-desc', label: 'Price: High → Low' },
  { key: 'rating', label: 'Best Rated' },
  { key: 'fastest', label: 'Fastest Delivery' },
  { key: 'newest', label: 'New Arrivals' },
];
