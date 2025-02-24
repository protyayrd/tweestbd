const express = require('express');
const router = express.Router();
const bulkOrderController = require('../controllers/bulkOrder.controller.js');
const { authenticate, isAdmin } = require('../middleware/auth.js');

// Create bulk order (authenticated users only)
router.post('/', authenticate, bulkOrderController.createBulkOrder);

// Get all bulk orders (admin only)
router.get('/admin/all', authenticate, isAdmin, bulkOrderController.getAllBulkOrders);

// Get user's bulk orders
router.get('/user', authenticate, bulkOrderController.getUserBulkOrders);

// Get bulk order by ID
router.get('/:orderId', authenticate, bulkOrderController.getBulkOrderById);

// Update bulk order status (admin only)
router.patch('/:orderId/status', authenticate, isAdmin, bulkOrderController.updateBulkOrderStatus);

// Delete bulk order (admin only)
router.delete('/:orderId', authenticate, isAdmin, bulkOrderController.deleteBulkOrder);

module.exports = router; 