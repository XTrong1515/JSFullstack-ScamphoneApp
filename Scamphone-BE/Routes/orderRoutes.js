import express from 'express';
const router = express.Router();
import {
  addOrderItems,
  getOrderById,
  getMyOrders,
  getAllOrders,
  updateOrderStatus,
  confirmOrder,
  rejectOrder,
  cancelOrder,
  assignDeliveryPerson,
  requestRefund
} from '../Controllers/orderController.js';
import { protect, admin } from '../Middleware/authMiddleware.js';

// User routes
router.post('/', protect, addOrderItems);
router.get('/myorders', protect, getMyOrders);
router.put('/:id/cancel', protect, cancelOrder);
router.put('/:id/refund', protect, requestRefund);

// Admin routes - Đặt TRƯỚC các route có :id
router.get('/', protect, admin, getAllOrders);
router.put('/:id/status', protect, admin, updateOrderStatus);
router.put('/:id/confirm', protect, admin, confirmOrder);
router.put('/:id/reject', protect, admin, rejectOrder);
router.put('/:id/assign-delivery', protect, admin, assignDeliveryPerson);

// Get order by ID - Đặt CUỐI CÙNG
router.get('/:id', protect, getOrderById);

export default router;
