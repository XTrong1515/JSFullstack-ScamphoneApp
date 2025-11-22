import Review from '../Models/ReviewModel.js';
import Order from '../Models/OrderModel.js';
import asyncHandler from 'express-async-handler';

// @desc    Get reviews for a product
// @route   GET /api/v1/reviews/product/:productId
// @access  Public
const getProductReviews = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  const reviews = await Review.find({ product: productId })
    .populate('user', 'name avatar')
    .sort({ createdAt: -1 });

  // Check if each reviewer has purchased the product (verified purchase)
  const reviewsWithVerification = await Promise.all(
    reviews.map(async (review) => {
      // Check if user has a delivered order containing this product
      const hasOrder = await Order.findOne({
        user: review.user._id,
        'orderItems.product': productId,
        status: 'delivered'
      });

      return {
        _id: review._id,
        user: {
          _id: review.user._id,
          name: review.user.name,
          avatar: review.user.avatar
        },
        product: review.product,
        rating: review.rating,
        comment: review.comment,
        createdAt: review.createdAt,
        isVerifiedPurchase: !!hasOrder
      };
    })
  );

  res.json({
    reviews: reviewsWithVerification,
    total: reviewsWithVerification.length
  });
});

// @desc    Create a review
// @route   POST /api/v1/reviews
// @access  Private
const createReview = asyncHandler(async (req, res) => {
  const { product, rating, comment } = req.body;

  // Check if user has purchased this product (delivered order)
  const hasOrder = await Order.findOne({
    user: req.user._id,
    'orderItems.product': product,
    status: 'delivered'
  });

  if (!hasOrder) {
    res.status(403);
    throw new Error('Bạn cần mua và nhận sản phẩm này trước khi đánh giá');
  }

  // Check if user already reviewed this product
  const existingReview = await Review.findOne({
    user: req.user._id,
    product
  });

  if (existingReview) {
    res.status(400);
    throw new Error('Bạn đã đánh giá sản phẩm này rồi');
  }

  const review = await Review.create({
    user: req.user._id,
    product,
    rating,
    comment
  });

  const populatedReview = await Review.findById(review._id).populate('user', 'name avatar');

  res.status(201).json({
    _id: populatedReview._id,
    user: {
      _id: populatedReview.user._id,
      name: populatedReview.user.name,
      avatar: populatedReview.user.avatar
    },
    product: populatedReview.product,
    rating: populatedReview.rating,
    comment: populatedReview.comment,
    createdAt: populatedReview.createdAt,
    isVerifiedPurchase: true // Always true since we validate above
  });
});

// @desc    Update a review
// @route   PUT /api/v1/reviews/:id
// @access  Private
const updateReview = asyncHandler(async (req, res) => {
  const { rating, comment } = req.body;

  const review = await Review.findById(req.params.id);

  if (!review) {
    res.status(404);
    throw new Error('Không tìm thấy đánh giá');
  }

  // Check if user owns this review
  if (review.user.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Bạn không có quyền chỉnh sửa đánh giá này');
  }

  review.rating = rating || review.rating;
  review.comment = comment || review.comment;

  const updatedReview = await review.save();
  const populatedReview = await Review.findById(updatedReview._id).populate('user', 'name avatar');

  // Check verified purchase
  const hasOrder = await Order.findOne({
    user: req.user._id,
    'orderItems.product': populatedReview.product,
    status: 'delivered'
  });

  res.json({
    _id: populatedReview._id,
    user: {
      _id: populatedReview.user._id,
      name: populatedReview.user.name,
      avatar: populatedReview.user.avatar
    },
    product: populatedReview.product,
    rating: populatedReview.rating,
    comment: populatedReview.comment,
    createdAt: populatedReview.createdAt,
    isVerifiedPurchase: !!hasOrder
  });
});

// @desc    Delete a review
// @route   DELETE /api/v1/reviews/:id
// @access  Private
const deleteReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);

  if (!review) {
    res.status(404);
    throw new Error('Không tìm thấy đánh giá');
  }

  // Check if user owns this review or is admin
  if (review.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Bạn không có quyền xóa đánh giá này');
  }

  await review.deleteOne();

  res.json({ message: 'Đã xóa đánh giá' });
});

export {
  getProductReviews,
  createReview,
  updateReview,
  deleteReview
};
