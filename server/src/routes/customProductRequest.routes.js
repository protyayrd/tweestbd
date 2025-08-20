const express = require('express');
const router = express.Router();
const customProductRequestController = require('../controllers/customProductRequest.controller.js');
const { authenticate, isAdmin } = require('../middleware/auth.js');

// Create custom product request (authenticated users only)
router.post('/', authenticate, customProductRequestController.createRequest);

// Get all custom product requests (admin only)
router.get('/admin/all', authenticate, isAdmin, customProductRequestController.getAllRequests);

// Get user's custom product requests
router.get('/user', authenticate, customProductRequestController.getUserRequests);

// Get custom product request by ID
router.get('/:requestId', authenticate, customProductRequestController.getRequestById);

// Update custom product request status (admin only)
router.patch('/:requestId/status', authenticate, isAdmin, customProductRequestController.updateRequestStatus);

// Delete custom product request (admin only)
router.delete('/:requestId', authenticate, isAdmin, customProductRequestController.deleteRequest);

module.exports = router; 