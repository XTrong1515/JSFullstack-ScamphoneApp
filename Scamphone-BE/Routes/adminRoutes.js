import express from 'express';
const router = express.Router();
import {
  createUser,
  getUsers,
  getUserByIdAdmin,
  updateUser,
  promoteToAdmin,
  toggleUserLock,
  deleteUser,
  getProductsAdmin,
  updateProductAdmin,
  deleteProductAdmin,
  getOrdersAdmin,
  getOrderByIdAdmin,
  updateOrderStatusAdmin,
  deleteOrderAdmin,
  getDashboardStats,
} from '../Controllers/adminController.js';
import { protect, admin } from '../Middleware/authMiddleware.js';

// Dashboard Stats
router.get('/stats', protect, admin, getDashboardStats);

// Users
router.post('/users', protect, admin, createUser);
router.get('/users', protect, admin, getUsers);
router.get('/users/:id', protect, admin, getUserByIdAdmin);
router.put('/users/:id', protect, admin, updateUser);
router.put('/users/:id/promote', protect, admin, promoteToAdmin);
router.put('/users/:id/lock', protect, admin, toggleUserLock);
router.delete('/users/:id', protect, admin, deleteUser);

// Products
router.get('/products', protect, admin, getProductsAdmin);
router.put('/products/:id', protect, admin, updateProductAdmin);
router.delete('/products/:id', protect, admin, deleteProductAdmin);

// Orders
router.get('/orders', protect, admin, getOrdersAdmin);
router.get('/orders/:id', protect, admin, getOrderByIdAdmin);
router.put('/orders/:id', protect, admin, updateOrderStatusAdmin);
router.delete('/orders/:id', protect, admin, deleteOrderAdmin);

export default router;
