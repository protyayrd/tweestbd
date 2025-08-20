require('dotenv').config();
const express = require('express');
const compression = require('compression');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { connectDb } = require('./config/db');
const passport = require('passport');
const session = require('express-session');
const initializePassport = require('./config/passport-config');
const { configureCors } = require('./utils/corsHelper');

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
const comboOfferRoutes = require('./routes/comboOffer.routes');
const tshirtOrderRoutes = require('./routes/tshirtOrder.routes');
const jerseyFormSettingsRoutes = require('./routes/jerseyFormSettings.routes');
const pathaoRoutes = require('./routes/pathao.routes');
const sizeGuideRoutes = require('./routes/sizeGuide.routes');
const popupImageRoutes = require('./routes/popupImage.routes');
const predefinedDescriptionRoutes = require('./routes/predefinedDescription.routes');
const tryonRoutes = require('./routes/tryon.routes');

const app = express();

// Connect to MongoDB
connectDb();

// Payment routes have their own CORS configuration in payment.routes.js
// We don't need to handle CORS here globally for payment routes

// General middleware
app.use(configureCors());
app.use(express.json());
// Enable gzip compression for faster text asset delivery
app.use(compression());

// Session configuration
app.use(session({
  secret: process.env.SECRET_KEY || 'your-secret-key',
  resave: false,
  saveUninitialized: false
}));

// Initialize passport
initializePassport();  // Initialize passport configuration
app.use(passport.initialize());
app.use(passport.session());

// Create uploads directories if they don't exist
const uploadDirs = [
  path.join(__dirname, '../public/uploads/categories'),
  path.join(__dirname, '../public/uploads/products'),
  path.join(__dirname, '../public/uploads/popup')
];

uploadDirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log('Created uploads directory:', dir);
  }
});

// Debug middleware to log requests only in development mode
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    // Only log API requests to reduce noise
    if (req.url.startsWith('/api') && !req.url.includes('/uploads/')) {
      console.log('Request URL:', req.url);
      console.log('Request Method:', req.method);
    }
    next();
  });
}

// Serve static files with proper caching
const staticOptions = {
  etag: true,
  lastModified: true,
  maxAge: '30d', // Cache for 30 days for general static assets
  immutable: true,
  setHeaders: (res, path) => {
    // Use strong caching for images to prevent reloading
    if (path.endsWith('.jpg') || path.endsWith('.jpeg') || path.endsWith('.png') || path.endsWith('.webp') || path.endsWith('.gif')) {
      // 1 year cache for images with SWR
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable, stale-while-revalidate=86400');
    }
    // Cache fonts for 1 year
    if (path.endsWith('.woff') || path.endsWith('.woff2') || path.endsWith('.ttf') || path.endsWith('.otf')) {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable, stale-while-revalidate=86400');
    }
  }
};

app.use(express.static(path.join(__dirname, '../public'), staticOptions));
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads'), staticOptions));

// Serve client public assets with proper caching in production
if (process.env.NODE_ENV === 'production') {
  app.use('/fonts', express.static(path.join(__dirname, '../../client/public/fonts'), staticOptions));
  app.use('/images', express.static(path.join(__dirname, '../../client/public/images'), staticOptions));
}

if (process.env.NODE_ENV !== 'production') {
  console.log('Serving static files from:', path.join(__dirname, '../public'));
  console.log('Serving uploads from:', path.join(__dirname, '../public/uploads'));
}

// Serve React build files in production
if (process.env.NODE_ENV === 'production') {
  // Serve static files from React build
  const buildPath = path.join(__dirname, '../../client/build');
  const buildStaticOptions = {
    etag: true,
    lastModified: true,
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('.html')) {
        // Ensure index.html is always fresh
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      } else if (/\.(js|css|woff2|woff|ttf|otf|svg|png|jpg|jpeg|webp|gif|ico)$/i.test(filePath)) {
        // Long cache for fingerprinted assets
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      }
    }
  };
  app.use(express.static(buildPath, buildStaticOptions));
  
  // Legacy redirect for old /p/:slug URLs to /product/:slug
  app.get('/p/:slug', (req, res) => {
    console.log('Legacy redirect: /p/:slug to /product/:slug');
    res.redirect(301, `/product/${req.params.slug}`);
  });
  
  // For any route that doesn't match API routes, serve the React app
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/auth') || req.path.startsWith('/uploads')) {
      next();
    } else {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
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
app.use('/api/combo-offers', comboOfferRoutes);
app.use('/api/tshirt-orders', tshirtOrderRoutes);
app.use('/api/jersey-form-settings', jerseyFormSettingsRoutes);
app.use('/api/pathao', pathaoRoutes);
app.use('/api/size-guides', sizeGuideRoutes);
app.use('/api/popup-images', popupImageRoutes);
app.use('/api/predefined-descriptions', predefinedDescriptionRoutes);
app.use('/api/tryon', tryonRoutes);

// Direct debug route for jersey form settings
app.get('/api/jersey-form-settings-debug', (req, res) => {
  console.log('Direct debug route hit in app.js');
  res.status(200).json({
    message: 'This is a direct debug route in app.js',
    timestamp: new Date().toISOString()
  });
});

// Log all registered routes for debugging
console.log('=== Registered Routes ===');
const listAllRoutes = (app) => {
  function print(path, layer) {
    if (layer.route) {
      layer.route.stack.forEach(print.bind(null, path));
    } else if (layer.name === 'router' && layer.handle.stack) {
      layer.handle.stack.forEach(print.bind(null, path + layer.regexp.source.replace("^\\", "").replace("\\/?(?=\\/|$)", "")));
    } else if (layer.method) {
      console.log('%s %s', layer.method.toUpperCase(), path);
    }
  }

  app._router.stack.forEach(print.bind(null, ''));
};
listAllRoutes(app);
console.log('========================');

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error occurred:', err);
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  res.status(statusCode).json({ error: message });
});

// 404 handler for routes that don't exist
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

module.exports = app; 