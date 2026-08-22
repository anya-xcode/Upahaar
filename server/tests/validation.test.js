import { describe, it, expect } from 'vitest';
import { validate } from '../src/middleware/validate.js';
import {
  registerSchema,
  loginSchema,
  addressSchema,
  cartItemSchema,
  cartItemPatchSchema,
  placeOrderSchema,
  productSchema,
  productPatchSchema,
  stockAdjustSchema,
  reviewSchema,
  couponSchema,
  pincodeSchema,
  pincodePatchSchema,
  productApprovalSchema,
} from '../src/utils/schemas.js';

/**
 * Validation is the boundary between "anything a client can send" and code that
 * assumes its input is sane. These tests cover the three jobs it does: rejecting
 * what is malformed, normalising what is sloppy, and — most importantly —
 * stripping fields a client is not allowed to set.
 *
 * Pure functions: no database, no clock.
 */

const OID = 'a'.repeat(24);

/** Runs the middleware and reports what the controller would have seen. */
function run(schemas, req) {
  let error = null;
  const request = { body: {}, query: {}, params: {}, ...req };
  validate(schemas)(request, {}, (err) => {
    error = err || null;
  });
  return { error, req: request };
}

const errorFor = (schema, body) => run({ body: schema }, { body }).error;

describe('the validate middleware', () => {
  it('passes a good body straight through', () => {
    const { error, req } = run(
      { body: loginSchema },
      { body: { email: 'a@b.com', password: 'secret' } }
    );
    expect(error).toBeNull();
    expect(req.body.email).toBe('a@b.com');
  });

  it('reports a failure as a 400 with a readable first message', () => {
    const { error } = run({ body: loginSchema }, { body: { email: 'nope', password: 'x' } });
    expect(error.statusCode).toBe(400);
    expect(error.message).toBe('Please enter a valid email address');
  });

  it('names every bad field so a form can mark them all at once', () => {
    const { error } = run({ body: addressSchema }, { body: { name: 'A' } });
    const fields = error.details.map((d) => d.field);
    expect(fields).toContain('name');
    expect(fields).toContain('mobile');
    expect(fields).toContain('pincode');
  });

  it('replaces req.body with the parsed value, not just checks it', () => {
    const { req } = run(
      { body: registerSchema },
      { body: { name: '  Asha  ', email: ' ASHA@EXAMPLE.COM ', password: 'secret1' } }
    );
    expect(req.body.name).toBe('Asha');
    expect(req.body.email).toBe('asha@example.com');
  });

  it('validates query and params too', () => {
    const { error } = run({ params: productApprovalSchema }, { params: { approvalStatus: 'MAYBE' } });
    expect(error.statusCode).toBe(400);
  });

  it('leaves a section alone when no schema is given for it', () => {
    const { error, req } = run({ body: loginSchema }, {
      body: { email: 'a@b.com', password: 'x' },
      query: { anything: 'goes' },
    });
    expect(error).toBeNull();
    expect(req.query.anything).toBe('goes');
  });
});

describe('normalising sloppy input', () => {
  it('trims and lower-cases an email before checking its shape', () => {
    const parsed = registerSchema.parse({
      name: 'Asha',
      email: '  Asha@Example.COM  ',
      password: 'secret1',
    });
    expect(parsed.email).toBe('asha@example.com');
  });

  it('upper-cases a coupon code', () => {
    expect(couponSchema.parse({ code: ' diwali20 ', value: 20 }).code).toBe('DIWALI20');
  });

  it('rejects a whitespace-only name rather than storing it', () => {
    expect(errorFor(registerSchema, { name: '   ', email: 'a@b.com', password: 'secret1' })).not.toBeNull();
  });

  it('coerces the numbers a form sends as strings', () => {
    const parsed = productSchema.parse({ name: 'Rose box', category: OID, price: '899', stock: '12' });
    expect(parsed.price).toBe(899);
    expect(parsed.stock).toBe(12);
  });

  it('defaults a cart quantity to one', () => {
    expect(cartItemSchema.parse({ productId: OID }).quantity).toBe(1);
  });

  it('does not invent a quantity when a patch does not mention it', () => {
    expect(cartItemPatchSchema.parse({ variant: 'Large' }).quantity).toBeUndefined();
  });
});

describe('what a client is not allowed to set', () => {
  it('strips a seller-supplied approval status from a product', () => {
    const parsed = productSchema.parse({
      name: 'Rose box',
      category: OID,
      price: 899,
      approvalStatus: 'APPROVED',
      seller: OID,
      rating: 5,
      soldCount: 9999,
    });
    expect(parsed).not.toHaveProperty('approvalStatus');
    expect(parsed).not.toHaveProperty('seller');
    expect(parsed).not.toHaveProperty('rating');
    expect(parsed).not.toHaveProperty('soldCount');
  });

  it('strips them from an edit as well', () => {
    const parsed = productPatchSchema.parse({ price: 799, approvalStatus: 'APPROVED', slug: 'mine' });
    expect(parsed).toEqual({ price: 799 });
  });

  it('will not let a PIN code be renamed, which would orphan its sellers', () => {
    expect(pincodePatchSchema.parse({ code: '110099', isServiceable: false })).toEqual({
      isServiceable: false,
    });
  });

  it('will not let an admin reset a coupon redemption tally', () => {
    const parsed = couponSchema.parse({ code: 'X10', value: 10, usageCount: 0, usedBy: [] });
    expect(parsed).not.toHaveProperty('usageCount');
    expect(parsed).not.toHaveProperty('usedBy');
  });
});

describe('the rules worth stating once', () => {
  it('needs either a saved address or a typed-in one', () => {
    expect(errorFor(placeOrderSchema, { paymentMethod: 'COD' }).message).toBe(
      'A delivery address is required'
    );
  });

  it('accepts an order against a saved address', () => {
    expect(errorFor(placeOrderSchema, { paymentMethod: 'COD', addressId: OID })).toBeNull();
  });

  it('rejects a typed-in address that is missing half its fields', () => {
    const error = errorFor(placeOrderSchema, {
      paymentMethod: 'COD',
      address: { name: 'Asha', mobile: '9876543210' },
    });
    expect(error.details.map((d) => d.field)).toContain('address.pincode');
  });

  it('rejects an unknown payment method', () => {
    expect(errorFor(placeOrderSchema, { addressId: OID, paymentMethod: 'BITCOIN' }).message).toBe(
      'Please choose a payment method'
    );
  });

  it('requires a reason when a product is rejected', () => {
    expect(errorFor(productApprovalSchema, { approvalStatus: 'REJECTED' }).message).toBe(
      'Tell the seller why it was rejected'
    );
    expect(errorFor(productApprovalSchema, { approvalStatus: 'REJECTED', note: 'Blurry photos' })).toBeNull();
    // Approving needs no note.
    expect(errorFor(productApprovalSchema, { approvalStatus: 'APPROVED' })).toBeNull();
  });

  it('needs a stock adjustment to actually say something', () => {
    expect(errorFor(stockAdjustSchema, { note: 'restocked' }).message).toBe(
      'Provide a stock change or an absolute value'
    );
    expect(errorFor(stockAdjustSchema, { change: -2 })).toBeNull();
    expect(errorFor(stockAdjustSchema, { absolute: 0 })).toBeNull();
  });

  it('holds a PIN code to six digits wherever one appears', () => {
    expect(errorFor(pincodeSchema, { code: '11001', city: 'Delhi', state: 'Delhi' }).message).toBe(
      'Please enter a valid 6-digit PIN code'
    );
    expect(errorFor(addressSchema, { ...validAddress(), pincode: 'ABC123' })).not.toBeNull();
  });

  it('rejects an id that is not an id, before it reaches Mongo', () => {
    expect(errorFor(cartItemSchema, { productId: 'not-an-id' }).message).toBe('That reference is not valid');
  });

  it('keeps a rating inside one to five', () => {
    expect(errorFor(reviewSchema, { productId: OID, orderId: 'UP-1', productRating: 9 })).not.toBeNull();
    expect(errorFor(reviewSchema, { productId: OID, orderId: 'UP-1', productRating: 4 })).toBeNull();
  });

  it('caps a gift message rather than letting it run away', () => {
    const error = errorFor(cartItemSchema, {
      productId: OID,
      personalization: { message: 'x'.repeat(201) },
    });
    expect(error.message).toBe('Keep the message under 200 characters');
  });

  it('refuses a price of zero', () => {
    expect(errorFor(productSchema, { name: 'Free box', category: OID, price: 0 }).message).toBe(
      'Price must be greater than zero'
    );
  });
});

function validAddress() {
  return {
    name: 'Asha Rao',
    mobile: '9876543210',
    pincode: '110016',
    house: 'B-14',
    city: 'New Delhi',
    state: 'Delhi',
  };
}
