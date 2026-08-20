import Cart from '../models/Cart.js';
import Product from '../models/Product.js';
import asyncHandler from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { buildCart } from '../services/cartService.js';
import { applyCoupon } from '../services/couponService.js';

async function cartFor(userId) {
  let cart = await Cart.findOne({ user: userId });
  if (!cart) cart = await Cart.create({ user: userId, items: [] });
  return cart;
}

/** GET /api/cart */
export const getCart = asyncHandler(async (req, res) => {
  const summary = await buildCart(req.user._id, {
    pincode: req.query.pincode || req.user.defaultPincode,
    tier: req.query.tier,
    giftOptions: {
      giftWrap: req.query.giftWrap === 'true',
      greetingCard: req.query.greetingCard === 'true',
    },
    user: req.user,
  });
  res.json({ success: true, cart: summary });
});

/** POST /api/cart/items */
export const addItem = asyncHandler(async (req, res) => {
  const { productId, quantity = 1, variant, personalization, deliveryDate, deliveryWindow, specialInstructions } = req.body;

  const product = await Product.findById(productId);
  if (!product || !product.isActive) throw new ApiError(404, 'That gift is no longer available');
  if (product.stock < quantity) throw new ApiError(400, `Only ${product.stock} left in stock`);

  const cart = await cartFor(req.user._id);

  // A personalised line is unique — two mugs with different names are two lines.
  const isPersonalised = Boolean(personalization?.message || personalization?.photoUrl);
  const existing = !isPersonalised
    ? cart.items.find((i) => String(i.product) === String(productId) && (i.variant || '') === (variant || ''))
    : null;

  if (existing) {
    const nextQty = existing.quantity + Number(quantity);
    if (product.stock < nextQty) throw new ApiError(400, `Only ${product.stock} left in stock`);
    existing.quantity = nextQty;
  } else {
    cart.items.push({
      product: productId,
      quantity: Number(quantity),
      variant,
      personalization,
      deliveryDate,
      deliveryWindow,
      specialInstructions,
    });
  }

  if (req.body.pincode) cart.pincode = req.body.pincode;
  await cart.save();

  const summary = await buildCart(req.user._id, { pincode: cart.pincode, user: req.user });
  res.status(201).json({ success: true, message: 'Added to cart', cart: summary });
});

/** PATCH /api/cart/items/:itemId */
export const updateItem = asyncHandler(async (req, res) => {
  const cart = await cartFor(req.user._id);
  const item = cart.items.id(req.params.itemId);
  if (!item) throw new ApiError(404, 'Item not found in your cart');

  if (req.body.quantity !== undefined) {
    const quantity = Number(req.body.quantity);
    if (quantity < 1) throw new ApiError(400, 'Quantity must be at least 1');
    const product = await Product.findById(item.product);
    if (product && product.stock < quantity) throw new ApiError(400, `Only ${product.stock} left in stock`);
    item.quantity = quantity;
  }

  ['variant', 'deliveryDate', 'deliveryWindow', 'specialInstructions'].forEach((field) => {
    if (req.body[field] !== undefined) item[field] = req.body[field];
  });
  if (req.body.personalization !== undefined) item.personalization = req.body.personalization;

  await cart.save();
  const summary = await buildCart(req.user._id, { pincode: cart.pincode, user: req.user });
  res.json({ success: true, cart: summary });
});

/** DELETE /api/cart/items/:itemId */
export const removeItem = asyncHandler(async (req, res) => {
  const cart = await cartFor(req.user._id);
  const item = cart.items.id(req.params.itemId);
  if (!item) throw new ApiError(404, 'Item not found in your cart');
  item.deleteOne();
  await cart.save();

  const summary = await buildCart(req.user._id, { pincode: cart.pincode, user: req.user });
  res.json({ success: true, message: 'Removed from cart', cart: summary });
});

/** DELETE /api/cart */
export const clearCart = asyncHandler(async (req, res) => {
  const cart = await cartFor(req.user._id);
  cart.items = [];
  cart.appliedCoupon = undefined;
  await cart.save();
  res.json({ success: true, cart: await buildCart(req.user._id, { pincode: cart.pincode, user: req.user }) });
});

/** PATCH /api/cart/pincode — customer switched delivery location. */
export const setPincode = asyncHandler(async (req, res) => {
  const cart = await cartFor(req.user._id);
  cart.pincode = req.body.pincode;
  await cart.save();

  if (req.body.remember !== false) {
    req.user.defaultPincode = req.body.pincode;
    await req.user.save({ validateBeforeSave: false });
  }

  res.json({ success: true, cart: await buildCart(req.user._id, { pincode: cart.pincode, user: req.user }) });
});

/** POST /api/cart/coupon */
export const applyCartCoupon = asyncHandler(async (req, res) => {
  const cart = await cartFor(req.user._id);
  const summary = await buildCart(req.user._id, { pincode: cart.pincode, user: req.user });

  // Validate before persisting, so a bad code never sticks to the cart.
  await applyCoupon({
    code: req.body.code,
    user: req.user,
    items: summary.items.filter((i) => !i.issue).map((i) => ({ product: i.product, quantity: i.quantity })),
    subtotal: summary.totals.subtotal,
    pincode: cart.pincode,
  });

  cart.appliedCoupon = String(req.body.code).toUpperCase();
  await cart.save();

  res.json({
    success: true,
    message: `${cart.appliedCoupon} applied`,
    cart: await buildCart(req.user._id, { pincode: cart.pincode, user: req.user }),
  });
});

/** DELETE /api/cart/coupon */
export const removeCartCoupon = asyncHandler(async (req, res) => {
  const cart = await cartFor(req.user._id);
  cart.appliedCoupon = undefined;
  await cart.save();
  res.json({ success: true, cart: await buildCart(req.user._id, { pincode: cart.pincode, user: req.user }) });
});
