const express = require('express');
const router = express.Router();
const comboOfferController = require('../controllers/comboOffer.controller');
const authenticate = require('../middleware/authenticate');

// Public routes
router.get('/category/:categoryId', comboOfferController.getComboOfferByCategory);
router.get('/pricing', comboOfferController.getComboPricing);

// Protected routes (require authentication)
router.use(authenticate);

// Admin routes
router.post('/', comboOfferController.createComboOffer);
router.get('/', comboOfferController.getAllComboOffers);
router.get('/:id', comboOfferController.getComboOfferById);
router.put('/:id', comboOfferController.updateComboOffer);
router.delete('/:id', comboOfferController.deleteComboOffer);
router.patch('/:id/toggle-status', comboOfferController.toggleComboOfferStatus);

module.exports = router; 