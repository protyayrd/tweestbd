const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const popupImageController = require('../controllers/popupImage.controller');
const authMiddleware = require('../middleware/auth');

// Create upload directory if it doesn't exist
const uploadDir = path.join(__dirname, '../../public/uploads/popup');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

// Configure upload
const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: function (req, file, cb) {
    // Accept only image files
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif|webp)$/)) {
      return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
  }
});

// Get all popup images (admin)
router.get('/', authMiddleware.isAuthenticated, authMiddleware.isAdmin, popupImageController.findAll);

// Get active popup images (public)
router.get('/active', popupImageController.findActive);

// Update sequence of popup images
router.post('/sequence', authMiddleware.isAuthenticated, authMiddleware.isAdmin, popupImageController.updateSequence);

// Create a new popup image
router.post('/', authMiddleware.isAuthenticated, authMiddleware.isAdmin, upload.single('image'), popupImageController.create);

// Get a single popup image
router.get('/:id', authMiddleware.isAuthenticated, authMiddleware.isAdmin, popupImageController.findOne);

// Update a popup image
router.put('/:id', authMiddleware.isAuthenticated, authMiddleware.isAdmin, upload.single('image'), popupImageController.update);

// Delete a popup image
router.delete('/:id', authMiddleware.isAuthenticated, authMiddleware.isAdmin, popupImageController.delete);

module.exports = router; 