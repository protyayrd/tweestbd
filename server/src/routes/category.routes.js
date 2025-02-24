const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/category.controller.js');
const { handleUpload } = require('../middleware/imageUpload');
const authenticate = require('../middleware/authenticate.js');
const isAdmin = require('../middleware/isAdmin.js');

// Public routes
router.get('/', categoryController.getAllCategories);
router.get('/featured', categoryController.getFeaturedCategories);
router.get('/:id', categoryController.getCategoryById);

// Admin routes - protected with authentication and admin check
router.post('/', authenticate, isAdmin, handleUpload, categoryController.createCategory);
router.put('/:id', authenticate, isAdmin, handleUpload, categoryController.updateCategory);
router.delete('/:id', authenticate, isAdmin, categoryController.deleteCategory);

module.exports = router; 