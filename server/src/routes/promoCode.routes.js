const express = require('express');
const router = express.Router();
const promoCodeController = require('../controllers/promoCode.controller');
const authenticate = require('../middleware/authenticate');
const isAdmin = require('../middleware/isAdmin');

// Admin routes (protected)
router.post('/', authenticate, isAdmin, promoCodeController.createPromoCode);
router.get('/admin/all', authenticate, isAdmin, promoCodeController.getAllPromoCodes);
router.get('/admin/:id', authenticate, isAdmin, promoCodeController.getPromoCode);
router.put('/:id', authenticate, isAdmin, promoCodeController.updatePromoCode);
router.delete('/:id', authenticate, isAdmin, promoCodeController.deletePromoCode);

// Customer routes
router.post('/validate', authenticate, promoCodeController.validatePromoCode);

module.exports = router; 
