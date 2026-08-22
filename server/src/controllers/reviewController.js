import Review from '../models/Review.js';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import Seller from '../models/Seller.js';
import asyncHandler from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { paginate } from '../utils/helpers.js';

/** Recomputes the stored averages after any change to a review. */
async function recalcAggregates(productId, sellerId) {
  if (productId) {
    const [agg] = await Review.aggregate([
      { $match: { product: productId, status: 'APPROVED' } },
      { $group: { _id: null, avg: { $avg: '$productRating' }, count: { $sum: 1 } } },
    ]);
    await Product.updateOne(
      { _id: productId },
      { $set: { rating: Math.round((agg?.avg || 0) * 10) / 10, reviewCount: agg?.count || 0 } }
    );
  }

  if (sellerId) {
    const [agg] = await Review.aggregate([
      { $match: { seller: sellerId, status: 'APPROVED' } },
      {
        $group: {
          _id: null,
          avg: { $avg: '$sellerRating' },
          delivery: { $avg: '$deliveryRating' },
          count: { $sum: 1 },
        },
      },
    ]);
    await Seller.updateOne(
      { _id: sellerId },
      {
        $set: {
          rating: Math.round((agg?.avg || 0) * 10) / 10,
          deliveryRating: Math.round((agg?.delivery || 0) * 10) / 10,
          reviewCount: agg?.count || 0,
        },
      }
    );
  }
}

/** GET /api/reviews?product=… */
export const listReviews = asyncHandler(async (req, res) => {
  const { page, limit, skip } = paginate(req.query);
  const filter = { status: 'APPROVED' };
  if (req.query.product) filter.product = req.query.product;
  if (req.query.seller) filter.seller = req.query.seller;

  const [reviews, total] = await Promise.all([
    Review.find(filter).sort('-createdAt').skip(skip).limit(limit).lean(),
    Review.countDocuments(filter),
  ]);

  res.json({ success: true, reviews, total, page, pages: Math.ceil(total / limit) });
});

/**
 * POST /api/reviews — one review per product per delivered order.
 * Reviews are only accepted against an order the customer actually received.
 */
export const createReview = asyncHandler(async (req, res) => {
  const { productId, orderId, productRating, sellerRating, deliveryRating, title, comment, images } = req.body;

  const order = await Order.findOne({ orderId, customer: req.user._id });
  if (!order) throw new ApiError(404, 'We could not find that order');
  if (order.status !== 'DELIVERED') throw new ApiError(400, 'You can review a gift once it has been delivered');

  const line = order.items.find((i) => String(i.product) === String(productId));
  if (!line) throw new ApiError(400, 'That gift was not part of this order');

  const existing = await Review.findOne({ user: req.user._id, product: productId, order: order._id });
  if (existing) throw new ApiError(409, 'You have already reviewed this gift');

  const review = await Review.create({
    product: productId,
    seller: line.seller,
    order: order._id,
    user: req.user._id,
    userName: req.user.name,
    productRating,
    sellerRating: sellerRating || productRating,
    deliveryRating: deliveryRating || productRating,
    title,
    comment,
    images,
    isVerifiedPurchase: true,
  });

  await recalcAggregates(review.product, review.seller);

  const reviewedProducts = await Review.countDocuments({ order: order._id, user: req.user._id });
  if (reviewedProducts >= order.items.length) {
    order.isReviewed = true;
    await order.save();
  }

  res.status(201).json({ success: true, review });
});

/** GET /api/reviews/mine */
export const myReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ user: req.user._id })
    .populate('product', 'name slug images')
    .populate('seller', 'businessName slug')
    .sort('-createdAt')
    .lean();
  res.json({ success: true, reviews });
});

/** GET /api/reviews/pending — delivered items still waiting on a review. */
export const pendingReviews = asyncHandler(async (req, res) => {
  const orders = await Order.find({ customer: req.user._id, status: 'DELIVERED', isReviewed: false })
    .sort('-deliveredAt')
    .limit(10)
    .lean();

  const reviewed = await Review.find({ user: req.user._id }).select('product order').lean();
  const seen = new Set(reviewed.map((r) => `${r.order}:${r.product}`));

  const pending = orders.flatMap((order) =>
    order.items
      .filter((item) => !seen.has(`${order._id}:${item.product}`))
      .map((item) => ({
        orderId: order.orderId,
        deliveredAt: order.deliveredAt,
        product: { _id: item.product, name: item.name, image: item.image },
      }))
  );

  res.json({ success: true, pending });
});

export const deleteReview = asyncHandler(async (req, res) => {
  const review = await Review.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!review) throw new ApiError(404, 'Review not found');
  await recalcAggregates(review.product, review.seller);
  res.json({ success: true, message: 'Review removed' });
});

export { recalcAggregates };
