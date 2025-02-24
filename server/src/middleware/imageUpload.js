const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Create upload directories if they don't exist
const createUploadDirectories = () => {
  const dirs = [
    path.join(__dirname, '../../public/uploads/categories'),
    path.join(__dirname, '../../public/uploads/products')
  ];

  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log('Created upload directory:', dir);
    }
  });
};

createUploadDirectories();

// Configure multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Determine the upload directory based on the route
    let uploadDir;
    if (req.originalUrl.includes('categories')) {
      uploadDir = path.join(__dirname, '../../public/uploads/categories');
    } else if (req.originalUrl.includes('products')) {
      uploadDir = path.join(__dirname, '../../public/uploads/products');
    } else {
      uploadDir = path.join(__dirname, '../../public/uploads');
    }
    
    console.log('Saving file to:', uploadDir);
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Create unique filename with timestamp and random string
    const uniqueSuffix = Date.now() + '-' + Math.random().toString(36).substring(7);
    const filename = uniqueSuffix + path.extname(file.originalname);
    console.log('Generated filename:', filename);
    cb(null, filename);
  }
});

// File filter for images
const fileFilter = (req, file, cb) => {
  // Accept images only
  if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
    return cb(new Error('Only image files (jpg, jpeg, png, gif) are allowed!'), false);
  }

  // Check mime type
  if (!file.mimetype.startsWith('image/')) {
    return cb(new Error('File type not supported! Only images are allowed.'), false);
  }

  cb(null, true);
};

// Create multer upload instance
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 1 // Maximum 1 file per request
  }
});

// Middleware for handling file upload errors
const handleUpload = (req, res, next) => {
  const uploadSingle = upload.single('image');

  uploadSingle(req, res, function(err) {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: 'File size too large. Maximum size is 5MB.' });
      }
      return res.status(400).json({ message: `Upload error: ${err.message}` });
    } else if (err) {
      return res.status(400).json({ message: err.message });
    }

    // If no file was uploaded
    if (!req.file) {
      return res.status(400).json({ message: 'Please upload an image file.' });
    }

    // Add file path to request
    req.filePath = `/uploads/${req.file.filename}`;
    next();
  });
};

module.exports = {
  handleUpload
}; 