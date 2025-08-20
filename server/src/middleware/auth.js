const jwt = require('jsonwebtoken');
const User = require('../models/user.model.js');
const { errorHandler } = require('../utils/error');

// Middleware to check if user is authenticated
exports.isAuthenticated = async (req, res, next) => {
  try {
    let token;
    
    // Get token from header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    
    // Check if token exists
    if (!token) {
      return res.status(401).json({ message: 'Not authorized, no token' });
    }
    
    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.SECRET_KEY);
      
      // Find user by id
      const user = await User.findById(decoded._id || decoded.id);
      
      if (!user) {
        return res.status(401).json({ message: 'Not authorized, user not found' });
      }
      
      // Set user in request object
      req.user = user;
      next();
    } catch (error) {
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

// Middleware to check if user is admin
exports.isAdmin = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }
    
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }
    
    next();
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
};

// Middleware to protect routes (legacy version - kept for compatibility)
exports.protect = async (req, res, next) => {
  try {
    let token;
    
    // Get token from header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    
    // Check if token exists
    if (!token) {
      return next(errorHandler(401, 'Not authorized, no token'));
    }
    
    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.SECRET_KEY);
      
      // Find user by id
      const user = await User.findById(decoded._id || decoded.id);
      
      if (!user) {
        return next(errorHandler(401, 'Not authorized, user not found'));
      }
      
      // Set user in request object
      req.user = user;
      next();
    } catch (error) {
      return next(errorHandler(401, 'Not authorized, token failed'));
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

// Middleware to authorize roles (legacy version - kept for compatibility)
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(errorHandler(401, 'User not authenticated'));
    }
    
    // Check if user has the required role
    if (!roles.includes(req.user.role)) {
      return next(errorHandler(403, `Role ${req.user.role} is not authorized`));
    }
    
    next();
  };
};

// Export the middlewares correctly
// module.exports = { protect, authorize }; // This causes an error
// Keep using the exports syntax we used above 