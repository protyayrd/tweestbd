const express = require('express');
const router = express.Router();
const pathaoController = require('../controllers/pathao.controller');
const { protect } = require('../middleware/auth');

// Public routes (accessible by guests)
router.get('/cities', pathaoController.getCities);
router.get('/zones/:cityId', pathaoController.getZones);
router.get('/areas/:zoneId', pathaoController.getAreas);
router.post('/calculate-price', pathaoController.calculateDeliveryPrice);

// Protected routes (require authentication)
router.use(protect);

module.exports = router; 