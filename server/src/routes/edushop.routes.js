const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const edushopController = require('../controllers/edushop.controller');
const authenticate = require('../middleware/authenticate');
const isAdmin = require('../middleware/isAdmin');

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../../public/uploads/edushop');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Not an image! Please upload an image.'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Handle both logo and image uploads
const uploadFields = upload.fields([
  { name: 'logo', maxCount: 1 },
  { name: 'image', maxCount: 1 }
]);

// Add error handling middleware for multer
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ message: `Upload error: ${err.message}` });
  } else if (err) {
    return res.status(400).json({ message: err.message });
  }
  next();
};

// Public routes
router.get('/', edushopController.getAllEdushopCategories);
router.get('/:id', edushopController.getEdushopCategoryById);

// Protected routes (admin only)
router.post('/', authenticate, isAdmin, uploadFields, handleMulterError, edushopController.createEdushopCategory);
router.put('/:id', authenticate, isAdmin, uploadFields, handleMulterError, edushopController.updateEdushopCategory);
router.delete('/:id', authenticate, isAdmin, edushopController.deleteEdushopCategory);

module.exports = router; 