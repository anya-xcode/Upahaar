import { z } from 'zod';
import {
  PAYMENT_METHODS,
  DELIVERY_TIERS,
  SELLER_STATUS,
  KYC_STATUS,
  COUPON_TYPES,
} from './constants.js';

/**
 * The shapes the API accepts.
 *
 * Kept in one file so the rules for "what is a valid order" are stated once
 * rather than re-derived in each controller. Messages are written to be shown
 * to a customer verbatim.
 */

const objectId = z.string().trim().regex(/^[0-9a-fA-F]{24}$/, 'That reference is not valid');
const pincode = z.string().trim().regex(/^\d{6}$/, 'Please enter a valid 6-digit PIN code');
const mobile = z.string().trim().min(6, 'Please enter a valid mobile number').max(20);
// Order matters in zod 4: checks and transforms run as declared, so the tidying
// has to happen before the format check or " A@B.com " would be rejected.
const email = z.string().trim().toLowerCase().email('Please enter a valid email address');
const password = z.string().min(6, 'Password must be at least 6 characters');
const money = z.coerce.number().min(0, 'Amount cannot be negative');

/** Trims and rejects whitespace-only strings, which slip past `.min(1)`. */
const text = (min, max, label) =>
  z
    .string()
    .trim()
    .min(min, `${label} is required`)
    .max(max, `${label} is too long`);

/* --------------------------------- auth --------------------------------- */

export const registerSchema = z.object({
  name: text(2, 80, 'Name'),
  email,
  password,
  mobile: mobile.optional(),
  pincode: pincode.optional().or(z.literal('')),
  referredBy: z.string().trim().max(20).optional().or(z.literal('')),
});

export const loginSchema = z.object({
  email,
  password: z.string().min(1, 'Password is required'),
});

export const sellerRegisterSchema = z.object({
  name: z.string().trim().max(80).optional(),
  email,
  password,
  mobile: mobile.optional(),
  businessName: text(2, 120, 'Business name'),
  ownerName: z.string().trim().max(80).optional(),
  description: z.string().trim().max(2000).optional(),
  address: z
    .object({
      line1: z.string().trim().max(200).optional(),
      street: z.string().trim().max(200).optional(),
      city: z.string().trim().max(80).optional(),
      state: z.string().trim().max(80).optional(),
      pincode: pincode.optional().or(z.literal('')),
    })
    .optional(),
  servedPincodes: z.array(pincode).max(500).optional(),
  deliveryRadiusKm: z.coerce.number().min(1).max(60).optional(),
  gstNumber: z.string().trim().max(20).optional(),
  panNumber: z.string().trim().max(15).optional(),
  bankDetails: z
    .object({
      accountHolder: z.string().trim().max(120).optional(),
      accountNumber: z.string().trim().max(40).optional(),
      ifsc: z.string().trim().max(15).optional(),
      bankName: z.string().trim().max(120).optional(),
    })
    .optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: password,
});

/* ------------------------------- addresses ------------------------------- */

export const addressSchema = z.object({
  label: z.enum(['Home', 'Work', 'Other']).optional(),
  name: text(2, 80, 'Full name'),
  mobile,
  pincode,
  house: text(1, 200, 'House or flat'),
  street: z.string().trim().max(200).optional(),
  landmark: z.string().trim().max(200).optional(),
  city: text(1, 80, 'City'),
  state: text(1, 80, 'State'),
  location: z
    .object({ lat: z.number().nullable().optional(), lng: z.number().nullable().optional(), formatted: z.string().optional() })
    .optional(),
  isDefault: z.boolean().optional(),
});

/** Editing may send any subset. */
export const addressPatchSchema = addressSchema.partial();

/* ---------------------------------- cart --------------------------------- */

const quantity = z.coerce
  .number()
  .int()
  .min(1, 'Quantity must be at least 1')
  .max(50, 'That is more than we can supply');

/** The fields both adding and editing a line share. */
const cartLineFields = {
  variant: z.string().trim().max(80).optional(),
  personalization: z
    .object({
      message: z.string().trim().max(200, 'Keep the message under 200 characters').optional(),
      photoUrl: z.string().trim().max(1000).optional(),
    })
    .optional(),
  deliveryDate: z.coerce.date().optional(),
  deliveryWindow: z.string().trim().max(60).optional(),
  specialInstructions: z.string().trim().max(300).optional(),
};

export const cartItemSchema = z.object({
  productId: objectId,
  /** Adding without a quantity means one. */
  quantity: quantity.default(1),
  ...cartLineFields,
  pincode: pincode.optional(),
});

/**
 * Editing sends only what changed, and the controller distinguishes "absent"
 * from "set" — so this is built by hand rather than `.partial()`, which would
 * let the add-schema's default fill in a quantity nobody asked to change.
 */
export const cartItemPatchSchema = z.object({
  quantity: quantity.optional(),
  ...cartLineFields,
});

export const couponCodeSchema = z.object({
  code: z.string().trim().min(2, 'Enter a coupon code').max(30).toUpperCase(),
});

export const cartPincodeSchema = z.object({
  pincode,
  /** Absent means "remember it" — only an explicit false opts out. */
  remember: z.boolean().optional(),
});

/* --------------------------------- orders -------------------------------- */

export const placeOrderSchema = z
  .object({
    addressId: objectId.optional(),
    address: addressSchema.optional(),
    saveAddress: z.boolean().optional(),
    deliveryTier: z.enum(Object.values(DELIVERY_TIERS)).optional(),
    deliverySlot: z
      .object({ date: z.coerce.date().optional(), window: z.string().trim().max(60).optional() })
      .optional(),
    giftOptions: z
      .object({
        giftWrap: z.boolean().optional(),
        greetingCard: z.boolean().optional(),
        giftMessage: z.string().trim().max(300).optional(),
        hidePrice: z.boolean().optional(),
      })
      .optional(),
    specialInstructions: z.string().trim().max(300).optional(),
    paymentMethod: z.enum(Object.values(PAYMENT_METHODS), {
      message: 'Please choose a payment method',
    }),
  })
  .refine((d) => d.addressId || d.address, {
    message: 'A delivery address is required',
    path: ['addressId'],
  });

/* -------------------------------- products ------------------------------- */

export const productSchema = z.object({
  name: text(2, 160, 'Product name'),
  description: z.string().trim().max(4000).optional(),
  highlights: z.array(z.string().trim().max(200)).max(12).optional(),
  images: z.array(z.string().trim().max(1000)).max(10).optional(),
  category: objectId,
  occasions: z.array(objectId).max(20).optional(),
  price: money.refine((v) => v > 0, 'Price must be greater than zero'),
  mrp: money.optional(),
  stock: z.coerce.number().int().min(0).max(100000).optional(),
  lowStockThreshold: z.coerce.number().int().min(0).max(1000).optional(),
  variants: z
    .array(
      z.object({
        name: z.string().trim().max(80),
        priceDelta: z.coerce.number().optional(),
        stock: z.coerce.number().int().min(0).optional(),
      })
    )
    .max(20)
    .optional(),
  baseTier: z.enum(Object.values(DELIVERY_TIERS)).optional(),
  prepTimeMinutes: z.coerce.number().int().min(0).max(2880).optional(),
  isPerishable: z.boolean().optional(),
  personalizable: z.boolean().optional(),
  allowsPhotoUpload: z.boolean().optional(),
  personalizationFee: money.optional(),
  personalizationNote: z.string().trim().max(300).optional(),
  tags: z.array(z.string().trim().max(40)).max(20).optional(),
  isActive: z.boolean().optional(),
});

export const productPatchSchema = productSchema.partial().extend({
  stockNote: z.string().trim().max(200).optional(),
});

export const stockAdjustSchema = z
  .object({
    change: z.coerce.number().int().optional(),
    absolute: z.coerce.number().int().min(0).optional(),
    note: z.string().trim().max(200).optional(),
  })
  .refine((d) => d.change !== undefined || d.absolute !== undefined, {
    message: 'Provide a stock change or an absolute value',
  });

/* --------------------------------- reviews ------------------------------- */

const star = z.coerce.number().int().min(1, 'Please give a rating').max(5);

export const reviewSchema = z.object({
  productId: objectId,
  orderId: z.string().trim().min(3, 'An order reference is required').max(40),
  productRating: star,
  sellerRating: star.optional(),
  deliveryRating: star.optional(),
  title: z.string().trim().max(120).optional(),
  comment: z.string().trim().max(2000).optional(),
  images: z.array(z.string().trim().max(1000)).max(5).optional(),
});

/* ------------------------------ saved payments ---------------------------- */

export const savedPaymentSchema = z.object({
  label: z.string().trim().max(60).optional(),
  method: z.enum(Object.values(PAYMENT_METHODS), { message: 'Choose a payment method' }),
  maskedValue: text(2, 60, 'Payment details'),
  isDefault: z.boolean().optional(),
});

/* -------------------------------- reminders ------------------------------ */

export const reminderSchema = z.object({
  title: text(2, 120, 'Reminder title'),
  relation: z.string().trim().max(40).optional(),
  occasionName: z.string().trim().max(60).optional(),
  occasion: objectId.optional(),
  month: z.coerce.number().int().min(1, 'Choose a month').max(12),
  day: z.coerce.number().int().min(1, 'Choose a day').max(31),
  remindDaysBefore: z.coerce.number().int().min(0).max(120).optional(),
  notes: z.string().trim().max(300).optional(),
  isActive: z.boolean().optional(),
});

export const reminderPatchSchema = reminderSchema.partial();

/* ---------------------------------- admin -------------------------------- */

export const sellerStatusSchema = z.object({
  status: z.enum(Object.values(SELLER_STATUS), { message: 'Unknown seller status' }),
  reason: z.string().trim().max(500).optional(),
});

export const sellerKycSchema = z.object({
  kycStatus: z.enum(Object.values(KYC_STATUS), { message: 'Unknown KYC status' }),
  note: z.string().trim().max(500).optional(),
});

export const productApprovalSchema = z
  .object({
    approvalStatus: z.enum(['PENDING', 'APPROVED', 'REJECTED'], { message: 'Unknown approval status' }),
    note: z.string().trim().max(500).optional(),
  })
  .refine((d) => d.approvalStatus !== 'REJECTED' || (d.note && d.note.length > 0), {
    message: 'Tell the seller why it was rejected',
    path: ['note'],
  });

export const reviewModerationSchema = z.object({
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED'], { message: 'Unknown review status' }),
  note: z.string().trim().max(500).optional(),
});

export const pincodeSchema = z.object({
  code: pincode,
  city: text(1, 80, 'City'),
  state: text(1, 80, 'State'),
  area: z.string().trim().max(120).optional(),
  district: z.string().trim().max(80).optional(),
  location: z.object({ lat: z.coerce.number().optional(), lng: z.coerce.number().optional() }).optional(),
  isServiceable: z.boolean().optional(),
  express60Available: z.boolean().optional(),
  priority3hAvailable: z.boolean().optional(),
  nextDayAvailable: z.boolean().optional(),
  standardAvailable: z.boolean().optional(),
  codAvailable: z.boolean().optional(),
  expressFee: z.coerce.number().min(0).nullable().optional(),
  priorityFee: z.coerce.number().min(0).nullable().optional(),
  standardFee: z.coerce.number().min(0).nullable().optional(),
  deliveryPartners: z.array(z.string().trim().max(60)).max(20).optional(),
  notes: z.string().trim().max(500).optional(),
});

export const pincodePatchSchema = pincodeSchema.partial().omit({ code: true });

export const couponSchema = z.object({
  code: z.string().trim().min(3, 'A coupon code is required').max(24).toUpperCase(),
  title: z.string().trim().max(120).optional(),
  description: z.string().trim().max(300).optional(),
  type: z.enum(Object.values(COUPON_TYPES)).optional(),
  value: z.coerce.number().positive('Discount value must be greater than zero'),
  maxDiscount: z.coerce.number().min(0).optional(),
  minOrderValue: z.coerce.number().min(0).optional(),
  categories: z.array(objectId).max(50).optional(),
  sellers: z.array(objectId).max(50).optional(),
  pincodes: z.array(pincode).max(2000).optional(),
  firstOrderOnly: z.boolean().optional(),
  usageLimit: z.coerce.number().int().min(0).optional(),
  perUserLimit: z.coerce.number().int().min(0).optional(),
  startsAt: z.coerce.date().optional(),
  expiresAt: z.coerce.date().optional(),
  isActive: z.boolean().optional(),
  isVisible: z.boolean().optional(),
});

export const couponPatchSchema = couponSchema.partial();

export const broadcastSchema = z.object({
  audience: z.enum(['CUSTOMER', 'SELLER', 'ADMIN'], { message: 'Choose an audience' }),
  title: text(2, 120, 'Title'),
  body: z.string().trim().max(500).optional(),
  icon: z.string().trim().max(40).optional(),
  link: z.string().trim().max(200).optional(),
});

/* --------------------------------- shared -------------------------------- */

export const pincodeQuerySchema = z.object({ pincode }).passthrough();
export const idParamSchema = z.object({ id: objectId });
