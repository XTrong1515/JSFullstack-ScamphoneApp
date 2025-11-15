import express from 'express';
import {
  getProductReviews,
  createReview,
  updateReview,
  deleteReview
} from '../Controllers/reviewController.js';
import { protect } from '../Middleware/authMiddleware.js';

const router = express.Router();

// Public route
router.get('/product/:productId', getProductReviews);

// Protected routes
router.post('/', protect, createReview);
router.put('/:id', protect, updateReview);
router.delete('/:id', protect, deleteReview);

export default router;
