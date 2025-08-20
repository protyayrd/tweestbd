const express = require('express');
const router = express.Router();
const {
  createTshirtOrder,
  getAllTshirtOrders,
  getTshirtOrderById,
  updateTshirtOrderStatus,
  handlePaymentSuccess,
  handlePaymentFailure,
  handlePaymentCancel,
  handleIPN,
  getAllTshirtOrdersAdmin,
  updateTshirtOrderStatusAdmin,
  updateTshirtOrderPaymentStatus,
  deleteTshirtOrder
} = require('../controllers/tshirtOrder.controller.js');
const { protect, authorize } = require('../middleware/auth');

// Create a new T-shirt order (no auth required)
router.post('/', createTshirtOrder);

// Payment webhook routes
router.get('/payment/success/:orderId', handlePaymentSuccess);
router.post('/payment/success/:orderId', handlePaymentSuccess);
router.get('/payment/fail/:orderId', handlePaymentFailure);
router.post('/payment/fail/:orderId', handlePaymentFailure);
router.get('/payment/cancel/:orderId', handlePaymentCancel);
router.post('/payment/cancel/:orderId', handlePaymentCancel);
router.post('/payment/ipn/:orderId', handleIPN);

// Admin routes
router.get('/', protect, authorize('ADMIN'), getAllTshirtOrders);
router.get('/admin', protect, authorize('ADMIN'), getAllTshirtOrdersAdmin);
router.get('/:id', protect, authorize('ADMIN'), getTshirtOrderById);
router.put('/:id/status', protect, authorize('ADMIN'), updateTshirtOrderStatus);
router.put('/admin/:id/status', protect, authorize('ADMIN'), updateTshirtOrderStatusAdmin);
router.put('/admin/:id/payment-status', protect, authorize('ADMIN'), updateTshirtOrderPaymentStatus);
router.delete('/admin/:id', protect, authorize('ADMIN'), deleteTshirtOrder);

module.exports = router; 