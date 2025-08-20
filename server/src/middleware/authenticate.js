const jwt = require('jsonwebtoken');
const User = require('../models/user.model.js');

const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    console.log('Verifying token with secret:', process.env.SECRET_KEY);
    try {
      const decoded = jwt.verify(token, process.env.SECRET_KEY);
      console.log('Decoded token:', decoded);

      console.log('User ID from token:', decoded._id || decoded.id);
      console.log('Finding user with ID:', decoded._id || decoded.id);
      
      const user = await User.findById(decoded._id || decoded.id);

      if (!user) {
        console.log('User not found in database');
        return res.status(401).json({ message: 'User not found' });
      }

      console.log('Found user:', user);
      req.user = user;
      next();
    } catch (jwtError) {
      console.error('Token verification error:', jwtError);
      
      try {
        // Try to decode the token without verification for debugging
        const decodedForDebugging = token ? jwt.decode(token) : null;
        console.log('Decoding token:', token);
        console.log('Decoded token:', decodedForDebugging);
        
        if (decodedForDebugging && decodedForDebugging._id) {
          console.log('User ID from token:', decodedForDebugging._id);
          console.log('Finding user with ID:', decodedForDebugging._id);
          
          const userForDebug = await User.findById(decodedForDebugging._id);
          console.log('Found user:', userForDebug);
        }
      } catch (debugError) {
        console.error('Error during token debugging:', debugError);
      }
      
      return res.status(401).json({ message: 'Invalid token' });
    }
  } catch (error) {
    console.error('Authentication middleware error:', error);
    return res.status(500).json({ message: 'Server error during authentication' });
  }
};

module.exports = authenticate; 