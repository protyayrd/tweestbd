const express = require('express');
const router = express.Router();
const predefinedDescriptionController = require('../controllers/predefinedDescription.controller');
const authenticate = require('../middleware/authenticate');
const isAdmin = require('../middleware/isAdmin');

// Admin routes (protected)
router.post('/', authenticate, isAdmin, predefinedDescriptionController.createPredefinedDescription);
router.put('/:id', authenticate, isAdmin, predefinedDescriptionController.updatePredefinedDescription);
router.delete('/:id', authenticate, isAdmin, predefinedDescriptionController.deletePredefinedDescription);

// Public routes
router.get('/', predefinedDescriptionController.getPredefinedDescriptions);
router.get('/:id', predefinedDescriptionController.getPredefinedDescriptionById);

module.exports = router; 