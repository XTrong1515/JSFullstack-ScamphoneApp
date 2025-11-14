import express from 'express';
const router = express.Router();
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getAdminProducts,
  searchProducts,
  getBrands,
  getPriceRange,
  getSearchSuggestions
} from '../Controllers/productController.js';
import { protect, admin } from '../Middleware/authMiddleware.js';

// Admin routes
router.get('/admin/all', protect, admin, getAdminProducts);

// Public routes
router.get('/search', searchProducts);
router.get('/brands', getBrands);
router.get('/price-range', getPriceRange);
router.get('/suggestions', getSearchSuggestions);
router.get('/', getProducts);
router.get('/:id', getProductById);

// Admin only routes
router.post('/', protect, admin, createProduct);
router.put('/:id', protect, admin, updateProduct);
router.delete('/:id', protect, admin, deleteProduct);

export default router;