const cors = require('cors');
require('dotenv').config();

/**
 * Configure CORS for the application
 * @param {Object} options - Additional CORS options
 * @returns {Function} - Express middleware
 */
const configureCors = (options = {}) => {
  // Parse allowed origins from environment variable or use defaults
  let configuredOrigins = [];
  if (process.env.ALLOWED_ORIGINS) {
    try {
      // Try to parse as a comma-separated list, handling various formats
      const originsString = process.env.ALLOWED_ORIGINS;
      configuredOrigins = originsString
        .replace(/'/g, '') // Remove any single quotes
        .replace(/"/g, '') // Remove any double quotes
        .split(',') // Split by comma
        .map(origin => origin.trim()) // Trim whitespace
        .filter(origin => origin.length > 0); // Remove empty strings
      
      console.log('Parsed ALLOWED_ORIGINS:', configuredOrigins);
    } catch (error) {
      console.error('Error parsing ALLOWED_ORIGINS:', error);
    }
  }

  // Always include the main domains
  const allowedOrigins = [
    // Main production domains
    'https://tweestbd.com',
    'http://tweestbd.com',
    'https://www.tweestbd.com',
    'http://www.tweestbd.com',
    
    // Development domains
    'http://localhost:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
    
    // Payment service domains
    'https://sandbox.sslcommerz.com',
    'https://securepay.sslcommerz.com',
    
    // Pathao API domains
    'https://api-hermes.pathao.com',
    'https://hermes-api.p-stg.xyz',
    'https://courier-api-sandbox.pathao.com',
    'https://courier-api.pathao.com',
    
    // Virtual Try-On / AI service domains
    'https://api.replicate.com',
    'https://replicate.delivery',
    'https://pbxt.replicate.delivery',
    'https://tjzk.replicate.delivery',
    
    ...configuredOrigins
  ];
  
  console.log('Final allowed origins:', [...new Set(allowedOrigins)]);
  
  const defaultOptions = {
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) {
        console.log('Request with no origin');
        return callback(null, true);
      }
      
      // Check if the origin is allowed
      if (allowedOrigins.includes(origin) || process.env.NODE_ENV === 'development') {
        console.log('Allowed origin:', origin);
        callback(null, true);
      } else {
        // Check for domain matches without protocol
        const url = new URL(origin);
        const hostname = url.hostname;
        const isAllowed = hostname === 'tweestbd.com' || 
                       hostname === 'www.tweestbd.com' || 
                       hostname === 'localhost' ||
                       hostname === '127.0.0.1' ||
                       hostname === 'sandbox.sslcommerz.com' || 
                       hostname === 'securepay.sslcommerz.com' ||
                       hostname === 'api-hermes.pathao.com' ||
                       hostname === 'hermes-api.p-stg.xyz' ||
                       hostname === 'courier-api-sandbox.pathao.com' ||
                       hostname === 'courier-api.pathao.com' ||
                       hostname === 'api.replicate.com' ||
                       hostname.endsWith('.replicate.delivery');
                       
        if (isAllowed) {
          console.log('Allowed origin by hostname:', origin);
          callback(null, true);
        } else {
          console.warn('Origin not allowed by CORS:', origin);
          callback(new Error('Not allowed by CORS'));
        }
      }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    credentials: true,
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
      'Origin',
      'Access-Control-Request-Method',
      'Access-Control-Request-Headers'
    ],
    exposedHeaders: ['Content-Range', 'X-Content-Range'],
    preflightContinue: false,
    optionsSuccessStatus: 204
  };

  return cors({
    ...defaultOptions,
    ...options
  });
};

module.exports = { configureCors };
