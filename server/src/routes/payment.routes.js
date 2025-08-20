const express = require("express");
const authenticate = require("../middleware/authenticate.js");
const paymentController = require("../controllers/payment.controller.js");
const cors = require('cors');

// Create a new payment
const router = express.Router();

// Allow all origins for SSLCommerz callback endpoints
const sslCommerzCors = cors({
  origin: true, // Allow all origins for SSLCommerz callbacks
  methods: ['GET', 'POST', 'OPTIONS'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  preflightContinue: false,
  optionsSuccessStatus: 204
});

// Regular payment CORS for authenticated endpoints
const paymentCors = cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if(!origin) return callback(null, true);
    
    // List of allowed domains
    const allowedOrigins = [
      'https://tweestbd.com',
      'http://tweestbd.com',
      'https://www.tweestbd.com',
      'http://www.tweestbd.com',
      'https://sandbox.sslcommerz.com',
      'https://securepay.sslcommerz.com'
    ];
    
    if(allowedOrigins.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      callback(null, true); // Allow all origins to be safe
    }
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  preflightContinue: false,
  optionsSuccessStatus: 204
});

// Create payment - authenticated route
router.post("/create", authenticate, paymentController.createPayment);

// Create payment for guest checkout - no authentication required
router.post("/guest/create", paymentController.createGuestPayment);

// Get all payments (for admin)
router.get("/", authenticate, paymentController.getAllPayments);

// Get payment by order ID
router.get("/by-order/:orderId", authenticate, paymentController.getPaymentByOrderId);

// Get payment by transaction ID
router.get("/by-transaction/:transactionId", authenticate, paymentController.getPaymentByTransactionId);

// Get payment by ID
router.get("/:id", authenticate, paymentController.getPaymentById);

// Verify payment
router.post("/verify/:paymentId", authenticate, paymentController.verifyPayment);

// SSL Commerce endpoints with more permissive CORS
router.post("/success", sslCommerzCors, paymentController.handlePaymentSuccess);
router.post("/fail", sslCommerzCors, paymentController.handlePaymentFail);
router.post("/cancel", sslCommerzCors, paymentController.handlePaymentCancel);
router.post("/ipn", sslCommerzCors, paymentController.handleIPN);

// SSL Commerce endpoints for GET requests
router.get("/success", sslCommerzCors, paymentController.handlePaymentSuccess);

// bKash payment callback endpoint
router.get("/bkash/callback", sslCommerzCors, paymentController.handleBkashCallback);
router.post("/bkash/callback", sslCommerzCors, paymentController.handleBkashCallback);

// Test bKash endpoint for debugging
router.get("/bkash/test", async (req, res) => {
  try {
    const bkashService = require('../services/bkashService.js');
    
    console.log('Testing bKash token generation...');
    const token = await bkashService.generateToken();
    
    console.log('Testing payment creation...');
    const paymentData = {
      amount: 100,
      payerReference: '01770618567',
      callbackURL: 'https://tweestbd.com/api/payments/bkash/callback',
      merchantInvoiceNumber: 'TEST-' + Date.now()
    };
    
    const payment = await bkashService.createPayment(paymentData);
    
    res.json({
      success: true,
      message: 'bKash test successful',
      data: {
        tokenGenerated: !!token,
        payment: payment
      }
    });
  } catch (error) {
    console.error('bKash test failed:', error);
    res.status(500).json({
      success: false,
      message: 'bKash test failed',
      error: error.message
    });
  }
});

// Comprehensive bKash configuration test
router.get("/bkash/config-test", async (req, res) => {
  try {
    const axios = require('axios');
    
    // Test different bKash endpoints
    const endpoints = [
      'https://checkout.sandbox.bka.sh/v1.2.0-beta',
      'https://tokenized.sandbox.bka.sh/v1.2.0-beta',
      'https://tokenized.pay.bka.sh/v1.2.0-beta'
    ];
    
    const credentials = {
      username: process.env.BKASH_CHECKOUT_URL_USER_NAME || '01770618567',
      password: process.env.BKASH_CHECKOUT_URL_PASSWORD || 'D7DaC<*E*eG',
      app_key: process.env.BKASH_CHECKOUT_URL_APP_KEY || '0vWQuCRGiUX7EPVjQDr0EUAYtc',
      app_secret: process.env.BKASH_CHECKOUT_URL_APP_SECRET || 'jcUNPBgbcqEDedNKdvE4G1cAK7D3hCjmJccNPZZBq96QIxxwAMEx'
    };
    
    const results = [];
    
    for (const baseURL of endpoints) {
      try {
        console.log(`Testing endpoint: ${baseURL}`);
        
        // Test tokenized endpoint
        try {
          const tokenizedResponse = await axios.post(`${baseURL}/tokenized/checkout/token/grant`, {
            app_key: credentials.app_key,
            app_secret: credentials.app_secret
          }, {
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
              'username': credentials.username,
              'password': credentials.password
            },
            timeout: 10000
          });
          
          results.push({
            endpoint: `${baseURL}/tokenized/checkout/token/grant`,
            success: true,
            response: tokenizedResponse.data
          });
        } catch (tokenizedError) {
          results.push({
            endpoint: `${baseURL}/tokenized/checkout/token/grant`,
            success: false,
            error: tokenizedError.response?.data || tokenizedError.message,
            status: tokenizedError.response?.status
          });
        }
        
        // Test checkout endpoint
        try {
          const checkoutResponse = await axios.post(`${baseURL}/checkout/token/grant`, {
            app_key: credentials.app_key,
            app_secret: credentials.app_secret
          }, {
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
              'username': credentials.username,
              'password': credentials.password
            },
            timeout: 10000
          });
          
          results.push({
            endpoint: `${baseURL}/checkout/token/grant`,
            success: true,
            response: checkoutResponse.data
          });
        } catch (checkoutError) {
          results.push({
            endpoint: `${baseURL}/checkout/token/grant`,
            success: false,
            error: checkoutError.response?.data || checkoutError.message,
            status: checkoutError.response?.status
          });
        }
        
      } catch (generalError) {
        results.push({
          endpoint: baseURL,
          success: false,
          error: 'Connection failed: ' + generalError.message
        });
      }
    }
    
    res.json({
      success: true,
      message: 'bKash configuration test completed',
      credentials: {
        username: credentials.username,
        app_key: credentials.app_key,
        // Don't expose sensitive data
        password: '***masked***',
        app_secret: '***masked***'
      },
      results: results
    });
    
  } catch (error) {
    console.error('bKash config test failed:', error);
    res.status(500).json({
      success: false,
      message: 'bKash configuration test failed',
      error: error.message
    });
  }
});

// Success proxy endpoint for handling SSLCommerz redirects
router.get("/success-proxy", sslCommerzCors, (req, res) => {
  console.log("Payment success proxy endpoint hit");
  console.log("Query params:", req.query);
  
  // Extract the query parameters
  const { payment_id, order_id, payment_option, formatted_id, val_id, tran_id } = req.query;
  
  // Try to extract values from SSL Commerz value fields if regular params not available
  const paymentId = payment_id || req.query.value_a;
  const orderId = order_id || req.query.value_b;
  const formattedId = formatted_id || req.query.value_e || '';
  
  if (!paymentId || !orderId) {
    console.error("Missing payment_id or order_id in success-proxy");
    // Redirect to homepage or error page
    const clientUrl = process.env.CLIENT_BASE_URL || 'https://tweestbd.com';
    return res.redirect(`${clientUrl}/payment/error?message=Missing_payment_information`);
  }
  
  // Construct the client success URL directly
  const clientUrl = process.env.CLIENT_BASE_URL || 'https://tweestbd.com';
  const redirectUrl = `${clientUrl}/payment/success?orderId=${orderId}&paymentId=${paymentId}`;
  
  console.log("Redirecting to:", redirectUrl);
  return res.redirect(redirectUrl);
});

// Handle payment failure and cancellation
router.get("/fail", sslCommerzCors, paymentController.handlePaymentFail);
router.get("/cancel", sslCommerzCors, paymentController.handlePaymentCancel);

// Comprehensive bKash flow test
router.get("/bkash/flow-test", async (req, res) => {
  try {
    const bkashService = require('../services/bkashService.js');
    
    console.log('Testing complete bKash flow...');
    
    // Step 1: Generate token
    console.log('Step 1: Generating token...');
    const token = await bkashService.generateToken();
    
    // Step 2: Create payment
    console.log('Step 2: Creating payment...');
    const paymentData = {
      amount: 50,
      payerReference: '01770618567',
      callbackURL: 'https://tweestbd.com/api/payments/bkash/callback',
      merchantInvoiceNumber: 'FLOW-TEST-' + Date.now()
    };
    
    const payment = await bkashService.createPayment(paymentData);
    
    if (payment && payment.paymentID) {
      console.log('Step 3: Testing payment query...');
      const queryResponse = await bkashService.queryPayment(payment.paymentID);
      
      console.log('Step 4: Testing payment execution (should fail with Invalid Payment State)...');
      let executeResponse;
      try {
        executeResponse = await bkashService.executePayment(payment.paymentID);
      } catch (executeError) {
        executeResponse = {
          error: executeError.message,
          failed: true
        };
      }
      
      res.json({
        success: true,
        message: 'bKash complete flow test completed',
        data: {
          step1_token: !!token,
          step2_payment: payment,
          step3_query: queryResponse,
          step4_execute: executeResponse,
          instructions: {
            message: "To complete the test:",
            steps: [
              "1. Copy the bkashURL from step2_payment",
              "2. Open it in a browser and complete the payment using test credentials",
              "3. After completion, query the payment again to see 'Completed' status",
              "4. Then execute the payment to get transaction details"
            ]
          }
        }
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Payment creation failed',
        error: payment
      });
    }
  } catch (error) {
    console.error('bKash flow test failed:', error);
    res.status(500).json({
      success: false,
      message: 'bKash flow test failed',
      error: error.message
    });
  }
});

// Manual payment status query for debugging
router.get("/bkash/query/:paymentID", async (req, res) => {
  try {
    const { paymentID } = req.params;
    const bkashService = require('../services/bkashService.js');
    
    console.log('Querying bKash payment:', paymentID);
    
    const queryResponse = await bkashService.queryPayment(paymentID);
    
    // Also try to execute if completed
    let executeResponse = null;
    if (queryResponse && queryResponse.transactionStatus === 'Completed') {
      try {
        console.log('Payment is completed, trying execution...');
        executeResponse = await bkashService.executePayment(paymentID);
      } catch (executeError) {
        executeResponse = {
          error: executeError.message,
          failed: true
        };
      }
    }
    
    res.json({
      success: true,
      data: {
        query: queryResponse,
        execute: executeResponse,
        canExecute: queryResponse?.transactionStatus === 'Completed'
      }
    });
    
  } catch (error) {
    console.error('Manual query failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;