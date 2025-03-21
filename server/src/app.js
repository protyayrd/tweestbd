const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { connectDb } = require('./config/db');

// Import all routes
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const productRoutes = require('./routes/product.routes');
const adminProductRoutes = require('./routes/product.admin.routes');
const categoryRoutes = require('./routes/category.routes');
const cartRoutes = require('./routes/cart.routes');
const cartItemRoutes = require('./routes/cartItem.routes');
const orderRoutes = require('./routes/order.routes');
const adminOrderRoutes = require('./routes/adminOrder.routes');
const paymentRoutes = require('./routes/payment.routes');
const reviewRoutes = require('./routes/review.routes');
const ratingRoutes = require('./routes/rating.routes');
const promoCodeRoutes = require('./routes/promoCode.routes');

const app = express();

// Connect to MongoDB
connectDb();

// Middleware
app.use(cors());
app.use(express.json());

// Create uploads directories if they don't exist
const uploadDirs = [
  path.join(__dirname, '../public/uploads/categories'),
  path.join(__dirname, '../public/uploads/products')
];

uploadDirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log('Created uploads directory:', dir);
  }
});

// Debug middleware to log all requests
app.use((req, res, next) => {
  console.log('Request URL:', req.url);
  console.log('Request Method:', req.method);
  
  // Don't log authentication headers to avoid confusion
  const headers = { ...req.headers };
  if (headers.authorization) {
    headers.authorization = 'Bearer [REDACTED]';
  }
  console.log('Request Headers:', headers);
  
  console.log('Request Body:', req.body);
  next();
});

// Serve static files from public directory
app.use(express.static(path.join(__dirname, '../public')));
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));
console.log('Serving static files from:', path.join(__dirname, '../public'));
console.log('Serving uploads from:', path.join(__dirname, '../public/uploads'));

// Serve React build files in production
if (process.env.NODE_ENV === 'production') {
  // Serve static files from React build
  app.use(express.static(path.join(__dirname, '../../client/build')));
  
  // For any route that doesn't match API routes, serve the React app
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/auth') || req.path.startsWith('/uploads')) {
      next();
    } else {
      res.sendFile(path.join(__dirname, '../../client/build', 'index.html'));
    }
  });
  console.log('Serving React build from:', path.join(__dirname, '../../client/build'));
}

// Debug route to check file existence and serve file
app.get('/check-file/:type/:filename', (req, res) => {
  const { type, filename } = req.params;
  const filePath = path.join(__dirname, `../public/uploads/${type}`, filename);
  console.log('Checking file:', filePath);
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).json({ exists: false, path: filePath });
  }
});

// Debug route to check file paths
app.get('/debug-static/*', (req, res) => {
  const requestedPath = req.params[0];
  const fullPath = path.join(__dirname, '../public', requestedPath);
  const exists = fs.existsSync(fullPath);
  res.json({
    requestedPath,
    fullPath,
    exists,
    __dirname,
    publicPath: path.join(__dirname, '../public')
  });
});

// Welcome route
app.get("/", (req, res) => {
  return res.status(200).send({ message: "welcome to ecommerce api - node" });
});

// Mount all routes
console.log('Mounting routes...');
app.use('/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/admin/products', adminProductRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/admin/categories', categoryRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/cart_items', cartItemRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin/orders', adminOrderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/ratings', ratingRoutes);
app.use('/api/promo-codes', promoCodeRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

module.exports = app; 