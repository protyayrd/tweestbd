const express = require('express');
const router = express.Router();
const sizeGuideController = require('../controllers/sizeGuide.controller');
const authenticate = require('../middleware/authenticate');
const isAdmin = require('../middleware/isAdmin');

// Admin routes (protected)
router.post('/', authenticate, isAdmin, sizeGuideController.createSizeGuide);
router.put('/:id', authenticate, isAdmin, sizeGuideController.updateSizeGuide);
router.delete('/:id', authenticate, isAdmin, sizeGuideController.deleteSizeGuide);

// Public routes
router.get('/', sizeGuideController.getSizeGuides);
router.get('/:id', sizeGuideController.getSizeGuideById);

module.exports = router; 