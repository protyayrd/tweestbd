const mongoose = require('mongoose');
const paymentService = require('../services/payment.service.js');
const Payment = require("../models/payment.model.js");
const Order = require("../models/order.model.js");
const cartService = require("../services/cart.service.js");
const { errorHandler } = require("../utils/error.js");
const axios = require("axios");
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const Cart = require("../models/cart.model.js");
const User = require("../models/user.model.js");
const Address = require("../models/address.model.js");
const bkashService = require('../services/bkashService.js');

// SSLCommerz configuration
const sslcommerz = {
  store_id: process.env.SSLCOMMERZ_STORE_ID || 'tweestbd0live',
  store_passwd: process.env.SSLCOMMERZ_STORE_PASSWORD || '67C58E66C207D33977',
  is_live: process.env.SSLCOMMERZ_IS_LIVE === 'true' || false, // true for live, false for sandbox
};

// Create a new payment
const createPayment = async (req, res, next) => {
  try {
    console.log("\n=== Payment Creation Started ===");
    console.log("Payment Request Body:", JSON.stringify(req.body, null, 2));
    
    // 1. Extract data from request body
    const { orderId, paymentMethod, amount, transactionId, paymentPhoneNumber, customerName, customerEmail, paymentOption } = req.body;

    // Validate required fields
    if (!orderId) {
      console.error("Order ID is required but not provided");
      return res.status(400).json({ 
        message: "Order ID is required", 
        status: false
      });
    }

    if (!paymentMethod) {
      console.error("Payment method is required but not provided");
      return res.status(400).json({ 
        message: "Payment method is required", 
        status: false
      });
    }
    
    // 2. Get user from request
    const user = req.user;
    console.log("User making payment:", {
      id: user._id,
      email: user.email,
      name: user.firstName + " " + user.lastName
    });
    
    // 3. Find the order
    console.log("Looking for order ID:", orderId);
    const order = await Order.findById(orderId)
      .populate("user", "firstName lastName email mobile")
      .populate({
        path: "shippingAddress",
        select: "firstName lastName streetAddress division district upazilla zipCode mobile"
      });
    
    if (!order) {
      console.error("Order not found");
      return res.status(404).json({ 
        message: "Order not found", 
        status: false
      });
    }
    
    if (!order.shippingAddress) {
      console.error("Order has no shipping address");
      return res.status(400).json({
        message: "Order has no shipping address",
        status: false
      });
    }

    console.log("Found order:", {
      id: order._id,
      userId: order.user._id,
      totalPrice: order.totalPrice,
      shippingAddress: {
        firstName: order.shippingAddress.firstName,
        lastName: order.shippingAddress.lastName,
        streetAddress: order.shippingAddress.streetAddress,
        division: order.shippingAddress.division,
        district: order.shippingAddress.district,
        upazilla: order.shippingAddress.upazilla,
        zipCode: order.shippingAddress.zipCode,
        mobile: order.shippingAddress.mobile
      }
    });
    
    // Check if order belongs to the authenticated user
    if (order.user._id.toString() !== user._id.toString()) {
      console.error("Unauthorized access: Order does not belong to user");
      return res.status(403).json({ 
        message: "Unauthorized", 
        status: false
      });
    }
    
    // 4. Format phone number
    const phoneNumber = paymentPhoneNumber || order.shippingAddress.mobile;
    const formattedPhone = phoneNumber?.replace(/[^0-9]/g, '');
    if (!formattedPhone || formattedPhone.length < 10) {
      console.error("Invalid phone number format:", phoneNumber);
      return res.status(400).json({
        message: "Invalid phone number format",
        status: false
      });
    }
    console.log("Formatted phone number:", formattedPhone);

    // 5. Validate shipping address
    const shippingAddress = order.shippingAddress;
    if (!shippingAddress || !shippingAddress.streetAddress || !shippingAddress.district || !shippingAddress.division || !shippingAddress.zipCode) {
      console.error("Shipping address is incomplete:", JSON.stringify(shippingAddress, null, 2));
      return res.status(400).json({
        message: "Shipping address is incomplete. Please update your shipping address with complete information.",
        status: false
      });
    }
    
    console.log("Shipping address validated successfully");
    
    // Handle Outlet Pickup option - no payment needed
    if (paymentOption === "outlet") {
      console.log("Processing outlet pickup order");
      
      // Calculate total amount and set it as due
      const totalAmount = order.totalDiscountedPrice;
      const dueAmount = req.body.dueAmount || totalAmount;
      
      // Create a payment record with zero amount and full amount as due
      const outletPayment = new Payment({
        order: orderId,
        user: user._id,
        amount: 0,
        dueAmount: dueAmount,
        dueStatus: 'PENDING',
        paymentMethod: "Outlet",
        paymentOption: "outlet",
        status: "COMPLETED",
        transactionId: `OUTLET-${order.formattedOrderId ? order.formattedOrderId : order._id.substring(0, 8)}`
      });
      
      const savedPayment = await outletPayment.save();
      console.log("Created outlet payment record:", {
        id: savedPayment._id,
        amount: savedPayment.amount,
        dueAmount: savedPayment.dueAmount,
        status: savedPayment.status,
        paymentMethod: savedPayment.paymentMethod
      });
      
      // Update order status
      order.orderStatus = "PLACED";
      order.paymentStatus = "FREE_PICKUP";
      order.paymentOption = "outlet";
      order.dueAmount = dueAmount;
      order.dueStatus = "PENDING";
      order.paymentDetails = {
        paymentId: savedPayment._id,
        paymentMethod: "Outlet",
        status: "COMPLETED",
        dueAmount: dueAmount,
        dueStatus: "PENDING"
      };
      
      await order.save();
      
      return res.status(200).json({
        message: "Order confirmed for outlet pickup",
        status: true,
        paymentId: savedPayment._id,
        orderId: order._id,
        dueAmount: dueAmount
      });
    }
    
    // Handle Cash on Delivery - only shipping charges are paid now
    console.log("Checking payment conditions:", {
      paymentOption,
      paymentMethod,
      isCOD: paymentOption === "cod" || paymentMethod === "COD"
    });
    
    if (paymentOption === "cod" || paymentMethod === "COD") {
      console.log("Processing Cash on Delivery order");
      console.log("COD Payment Method from Request:", paymentMethod);
      console.log("COD Payment Option from Request:", paymentOption);
      
      // Calculate due amount (total minus shipping charges)
      const deliveryCharge = Number(amount) || 0;
      const totalAmount = Number(order.totalDiscountedPrice) || 0;
      const dueAmount = req.body.dueAmount || totalAmount; // For COD, entire amount is due
      
      console.log("COD Payment Amounts:", {
        totalAmount,
        deliveryCharge,
        dueAmount,
        requestDueAmount: req.body.dueAmount
      });
      
      // For COD orders, always create payment record with COD method and full due amount
      const codPayment = new Payment({
        order: orderId,
        user: user._id,
        amount: 0, // No upfront payment for COD
        dueAmount: dueAmount,
        dueStatus: 'PENDING',
        paymentMethod: "COD",
        paymentOption: "cod",
        status: "PENDING",
        transactionId: `COD-${order.formattedOrderId ? order.formattedOrderId : order._id.substring(0, 8)}`
      });
      
      const savedPayment = await codPayment.save();
      console.log("COD Payment Record Created:", {
        id: savedPayment._id,
        paymentMethod: savedPayment.paymentMethod,
        paymentOption: savedPayment.paymentOption,
        amount: savedPayment.amount,
        dueAmount: savedPayment.dueAmount
      });
      
      // Update order
      order.orderStatus = "PLACED";
      order.paymentStatus = "COD_PENDING";
      order.paymentOption = "cod";
      order.dueAmount = dueAmount;
      order.dueStatus = "PENDING";
      order.paymentDetails = {
        paymentId: savedPayment._id,
        paymentMethod: "COD",
        status: "PENDING",
        dueAmount: dueAmount,
        dueStatus: "PENDING",
        deliveryChargePaid: false,
        remainingAmountDue: dueAmount
      };
      
      console.log("Updating order with payment details:", order.paymentDetails);
      
      await order.save();
      
      return res.status(200).json({
        message: "Order confirmed with Cash on Delivery",
        status: true,
        paymentId: savedPayment._id,
        orderId: order._id,
        dueAmount: dueAmount
      });
    } else {
      console.log("Payment is NOT COD, proceeding with regular payment flow");
      console.log("Payment details:", { paymentOption, paymentMethod, amount });
    }
    
    // 6. Generate transaction ID if not provided
    const tran_id = transactionId || (order.formattedOrderId ? `ORDER-${order.formattedOrderId}` : `ORDER-${order._id.substring(0, 8)}`);
    console.log("Using transaction ID:", tran_id);
    
    // 7. Create a new payment record
    // Map paymentMethod to appropriate paymentOption
    let mappedPaymentOption = paymentOption;
    if (paymentMethod === 'bKash') {
      mappedPaymentOption = 'bkash';
    } else if (paymentMethod === 'SSLCommerz') {
      mappedPaymentOption = 'sslcommerz';
    } else if (paymentMethod === 'COD') {
      mappedPaymentOption = 'cod';
    } else if (paymentMethod === 'Outlet') {
      mappedPaymentOption = 'outlet';
    }
    
    const payment = new Payment({
      order: orderId,
      user: user._id,
      amount: amount || order.totalDiscountedPrice,
      paymentMethod,
      status: "PENDING",
      transactionId: tran_id,
      paymentOption: mappedPaymentOption || paymentOption,
      dueAmount: req.body.dueAmount || 0,
      dueStatus: req.body.dueStatus || 'NONE'
    });
    
    console.log("Creating regular payment record:", {
      paymentMethod,
      paymentOption: mappedPaymentOption || paymentOption,
      amount: amount || order.totalDiscountedPrice,
      dueAmount: req.body.dueAmount || 0
    });
    
    const savedPayment = await payment.save();
    console.log("Created payment record:", {
      id: savedPayment._id,
      paymentMethod: savedPayment.paymentMethod,
      paymentOption: savedPayment.paymentOption,
      amount: savedPayment.amount,
      dueAmount: savedPayment.dueAmount,
      status: savedPayment.status,
      transactionId: savedPayment.transactionId
    });
    
    const apiHost = process.env.API_BASE_URL;
    if (!apiHost) {
      throw new Error('API_BASE_URL environment variable is not set');
    }
    console.log("API Host for callbacks:", apiHost);
    
    if (paymentMethod === "bKash") {
      try {
        console.log("Processing bKash payment...");
        
        const bkashPaymentData = {
          amount: payment.amount,
          payerReference: formattedPhone,
          callbackURL: `${apiHost}/api/payments/bkash/callback`,
          merchantInvoiceNumber: tran_id
        };
        
        console.log("Creating bKash payment with data:", bkashPaymentData);
        const bkashResponse = await bkashService.createPayment(bkashPaymentData);
        
        // Check for successful response using status code
        if (bkashResponse && bkashResponse.statusCode === "0000" && bkashResponse.paymentID && bkashResponse.bkashURL) {
          console.log("bKash payment creation successful");
          
          // Update payment record with bKash data
          savedPayment.paymentDetails = {
            ...bkashResponse,
            paymentData: bkashPaymentData
          };
          await savedPayment.save();
          
          // Return success response with redirect URL
          return res.status(200).json({
            message: "bKash payment initialization successful",
            status: true,
            paymentUrl: bkashResponse.bkashURL,
            payment: {
              id: savedPayment._id,
              transactionId: tran_id,
              amount: savedPayment.amount,
              status: savedPayment.status,
              paymentID: bkashResponse.paymentID
            }
          });
        } else {
          // Update payment status to FAILED
          savedPayment.status = "FAILED";
          savedPayment.paymentDetails = bkashResponse;
          await savedPayment.save();
          
          console.error("bKash payment initialization failed:", bkashResponse);
          
          // Use status code and status message from response
          const errorMessage = bkashResponse.statusMessage || "Failed to initialize bKash payment";
          const statusCode = bkashResponse.statusCode || "UNKNOWN_ERROR";
          
          return res.status(400).json({
            message: `${errorMessage} (StatusCode: ${statusCode})`,
            status: false,
            error: bkashResponse
          });
        }
      } catch (bkashError) {
        // Update payment status to FAILED
        savedPayment.status = "FAILED";
        savedPayment.paymentDetails = {
          error: bkashError.message,
          errorAt: new Date()
        };
        await savedPayment.save();
        
        console.error("Error in bKash payment request:", {
          message: bkashError.message,
          stack: bkashError.stack,
          paymentId: savedPayment._id,
          transactionId: tran_id
        });
        
        return res.status(500).json({
          message: "Error in bKash payment gateway",
          status: false,
          error: bkashError.message
        });
      }
    }
    
    const firstName = order.user.firstName || order.shippingAddress.firstName;
    const lastName = order.user.lastName || order.shippingAddress.lastName;
    const email = order.user.email;

    const paymentData = {
      total_amount: payment.amount,
      currency: "BDT",
      tran_id,
      success_url: `${apiHost}/api/payments/success?payment_id=${encodeURIComponent(savedPayment._id.toString())}&order_id=${encodeURIComponent(order._id.toString())}&payment_option=${encodeURIComponent(paymentOption || "cod")}&formatted_id=${encodeURIComponent(order.formattedOrderId || '')}`,
      fail_url: `${apiHost}/api/payments/fail?payment_id=${encodeURIComponent(savedPayment._id.toString())}&order_id=${encodeURIComponent(order._id.toString())}&payment_option=${encodeURIComponent(paymentOption || "cod")}&formatted_id=${encodeURIComponent(order.formattedOrderId || '')}`,
      cancel_url: `${apiHost}/api/payments/cancel?payment_id=${encodeURIComponent(savedPayment._id.toString())}&order_id=${encodeURIComponent(order._id.toString())}&payment_option=${encodeURIComponent(paymentOption || "cod")}&formatted_id=${encodeURIComponent(order.formattedOrderId || '')}`,
      ipn_url: `${apiHost}/api/payments/ipn`,
      shipping_method: "NO",
      product_name: paymentOption === "cod" ? "TwestBD Delivery Charge" : `TwestBD Order #${order.formattedOrderId ? order.formattedOrderId : order._id.substring(0, 8)}`,
      product_category: "Fashion",
      product_profile: "general",
      cus_name: `${firstName} ${lastName}`,
      cus_email: email,
      cus_add1: shippingAddress.streetAddress,
      cus_add2: `${shippingAddress.upazilla}, ${shippingAddress.district}`,
      cus_city: shippingAddress.district,
      cus_state: shippingAddress.division,
      cus_postcode: shippingAddress.zipCode,
      cus_country: "Bangladesh",
      cus_phone: formattedPhone,
      ship_name: `${firstName} ${lastName}`,
      ship_add1: shippingAddress.streetAddress,
      ship_add2: `${shippingAddress.upazilla}, ${shippingAddress.district}`,
      ship_city: shippingAddress.district,
      ship_state: shippingAddress.division,
      ship_postcode: shippingAddress.zipCode,
      ship_country: "Bangladesh",
      value_a: savedPayment._id.toString(), 
      value_b: order._id.toString(), 
      value_c: user._id.toString(), 
      value_d: paymentOption || "cod", 
      value_e: order.formattedOrderId || ''
    };
    
    console.log("Prepared SSLCommerz payment data");
    
    const storeId = process.env.SSLCOMMERZ_STORE_ID;
    const storePassword = process.env.SSLCOMMERZ_STORE_PASSWORD;
    const isLive = process.env.SSLCOMMERZ_IS_LIVE === 'true';
    
    // Determine SSL API endpoint based on environment
    const sslUrl = isLive 
      ? 'https://securepay.sslcommerz.com/gwprocess/v4/api.php' 
      : 'https://sandbox.sslcommerz.com/gwprocess/v4/api.php';
      
    console.log("Using SSLCommerz API URL:", sslUrl);
    console.log("Store ID:", storeId);
    
    // 9. Prepare to make the SSLCommerz API request
    try {
      console.log("Making API request to SSLCommerz...");
      
      const formData = new URLSearchParams({
        ...paymentData,
        store_id: storeId,
        store_passwd: storePassword
      }).toString();

      console.log("SSLCommerz Request URL:", sslUrl);
      console.log("SSLCommerz Request Data:", formData);
      
      const sslResponse = await axios.post(sslUrl, formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        }
      });
      
      // Log response status
      console.log("SSLCommerz API Response Status:", sslResponse.status);
      
      // Get response data
      const data = sslResponse.data;
      console.log("SSLCommerz API Response:", JSON.stringify(data, null, 2));
      
      // 10. Handle SSL response
      if (data.status === 'SUCCESS') {
        console.log("SSLCommerz payment initialization successful");
        
        // Log redirect URL
        console.log("Gateway redirect URL:", data.GatewayPageURL);
        
        // Update payment record with SSL data
        savedPayment.paymentDetails = {
          ...data,
          paymentData: {
            ...paymentData,
          } 
        };
        await savedPayment.save();
        
        // Return success response with redirect URL
        return res.status(200).json({
          message: "Payment initialization successful",
          status: true,
          paymentUrl: data.GatewayPageURL,
          payment: {
            id: savedPayment._id,
            transactionId: tran_id,
            amount: savedPayment.amount,
            status: savedPayment.status
          }
        });
      } else {
        // Update payment status to FAILED
        savedPayment.status = "FAILED";
        savedPayment.paymentDetails = data;
        await savedPayment.save();
        
        console.error("SSLCommerz payment initialization failed:", {
          status: data.status,
          failureMessage: data.failedreason
        });
        
        return res.status(400).json({
          message: data.failedreason || "Failed to initialize payment",
          status: false,
          error: data
        });
      }
    } catch (sslError) {
      savedPayment.status = "FAILED";
      savedPayment.paymentDetails = {
        error: sslError.message,
        errorAt: new Date()
      };
      await savedPayment.save();
      
      console.error("Error in SSLCommerz API request:", {
        message: sslError.message,
        stack: sslError.stack,
        paymentId: savedPayment._id,
        transactionId: tran_id
      });
      
      return res.status(500).json({
        message: "Error in payment gateway",
        status: false,
        error: sslError.message
      });
    }
  } catch (error) {
    console.error("Error creating payment:", {
      message: error.message,
      stack: error.stack
    });
    
    return res.status(500).json({
      message: "Something went wrong!",
      error: error.message,
      status: false
    });
  }
};

const verifyPayment = async (req, res) => {
    try {
        const payment = await paymentService.verifyPayment(req.params.paymentId);
        return res.status(200).json({
            success: true,
            payment: payment,
            message: "Payment verified successfully"
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Get payment by ID
const getPaymentById = async (req, res) => {
    try {
    const paymentId = req.params.id;
    const payment = await Payment.findById(paymentId);
    
    if (!payment) {
      return res.status(404).json({
        message: "Payment not found",
        success: false
      });
    }

    // If user is not admin, check if payment belongs to the user
    if (req.user.role !== 'ADMIN') {
      if (payment.user.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          message: "Unauthorized",
          success: false
        });
      }
    }

    res.status(200).json({
      message: "Payment retrieved successfully",
            success: true,
      payment
        });
    } catch (error) {
    console.error("Error retrieving payment:", error);
    res.status(500).json({
      message: "Failed to retrieve payment",
      success: false,
      error: error.message
    });
  }
};

// Get payment by order ID
const getPaymentByOrderId = async (req, res) => {
  try {
    const orderId = req.params.orderId;
    
    // Check if orderId is a valid MongoDB ObjectId
    const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(orderId);
    
    let order;
    if (isValidObjectId) {
      // Try to find by MongoDB ID first
      order = await Order.findById(orderId);
    } 
    
    if (!order) {
      // Try to find by formatted ID
      order = await Order.findOne({ formattedOrderId: orderId });
    }
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }
    
    const payment = await Payment.findOne({ order: order._id }).populate('order', 'formattedOrderId');
    
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found for this order"
      });
    }
    
    return res.status(200).json({
      success: true,
      payment
    });
  } catch (error) {
    console.error("Error in getPaymentByOrderId:", error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get payment by transaction ID
const getPaymentByTransactionId = async (req, res) => {
  try {
    const transactionId = req.params.transactionId;
    const payment = await Payment.findOne({ transactionId: transactionId });
    
    if (!payment) {
      return res.status(404).json({
        message: "No payment found with this transaction ID",
        success: false
      });
    }

    // If user is not admin, check if payment belongs to the user
    if (req.user.role !== 'ADMIN') {
      if (payment.user.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          message: "Unauthorized",
          success: false
        });
      }
    }

    res.status(200).json({
      message: "Payment retrieved successfully",
      success: true,
      payment
    });
  } catch (error) {
    console.error("Error retrieving payment by transaction ID:", error);
    res.status(500).json({
      message: "Failed to retrieve payment",
            success: false,
            error: error.message
        });
    }
};

const getAllPayments = async (req, res) => {
    try {
        const payments = await paymentService.getAllPayments();
        return res.status(200).json({
            success: true,
            payments: payments
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Handle SSLCommerz payment success callback
const handlePaymentSuccess = async (req, res) => {
  try {
    // Set CORS headers directly in the handler
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
    res.header('Access-Control-Allow-Credentials', 'true');

    console.log("\n=== Payment Success Handler ===");
    console.log("Payment Success Request Body:", JSON.stringify(req.body, null, 2));
    console.log("Payment Success Query Params:", JSON.stringify(req.query, null, 2));
    
    // Extract data from request body or query parameters
    const body = req.body || {};
    const query = req.query || {};
    
    // Handle both POST and GET requests by checking both body and query
    const payment_id = body.payment_id || query.payment_id;
    const order_id = body.order_id || query.order_id;
    const payment_option = body.payment_option || query.payment_option || 'online';
    const tran_id = body.tran_id || query.tran_id;
    const val_id = body.val_id || query.val_id;
    const amount = body.amount || query.amount;
    const status = body.status || query.status;
    const formatted_id = body.formatted_id || query.formatted_id || body.value_e || query.value_e || '';
    
    console.log("Extracted payment details:", {
      payment_id,
      order_id,
      payment_option,
      tran_id,
      val_id,
      amount,
      status,
      formatted_id
    });
    
    if (!payment_id && !order_id) {
      // Extract from SSL Commerz response if not directly available
      const paymentId = body.value_a || query.value_a;
      const orderId = body.value_b || query.value_b;
      const formattedId = body.value_e || query.value_e || '';
      
      if (paymentId && orderId) {
        console.log("Retrieved IDs from value fields:", {
          paymentId,
          orderId,
          formattedId
        });
        
        // Redirect to complete the process with query parameters
        const redirectUrl = `/api/payments/success?payment_id=${encodeURIComponent(paymentId)}&order_id=${encodeURIComponent(orderId)}&payment_option=${encodeURIComponent(payment_option)}&formatted_id=${encodeURIComponent(formattedId)}`;
        console.log("Redirecting to:", redirectUrl);
        
        return res.redirect(redirectUrl);
      }
    }
    
    if (!payment_id) {
      console.error("Payment ID is required");
      return res.status(400).send(`
        <html>
          <head>
            <title>Payment Error</title>
            <style>
              body { font-family: Arial, sans-serif; text-align: center; margin-top: 50px; }
              .error { color: red; }
              .container { max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 5px; }
            </style>
          </head>
          <body>
            <div class="container">
              <h2 class="error">Payment Verification Failed</h2>
              <p>Payment ID is missing.</p>
              <p>Please contact customer support if you believe this is an error.</p>
              <a href="/" style="display: inline-block; margin-top: 20px; padding: 10px 20px; background-color: #000; color: #fff; text-decoration: none; border-radius: 4px;">Return to Homepage</a>
            </div>
          </body>
        </html>
      `);
    }
    
    // Find payment by ID
    console.log("Finding payment with ID:", payment_id);
    const payment = await Payment.findById(payment_id);
    
    if (!payment) {
      console.error("Payment not found");
      return res.status(404).send(`
        <html>
          <head>
            <title>Payment Error</title>
            <style>
              body { font-family: Arial, sans-serif; text-align: center; margin-top: 50px; }
              .error { color: red; }
              .container { max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 5px; }
            </style>
          </head>
          <body>
            <div class="container">
              <h2 class="error">Payment Not Found</h2>
              <p>We couldn't find the payment in our system.</p>
              <p>Please contact customer support if you believe this is an error.</p>
              <a href="/" style="display: inline-block; margin-top: 20px; padding: 10px 20px; background-color: #000; color: #fff; text-decoration: none; border-radius: 4px;">Return to Homepage</a>
            </div>
          </body>
        </html>
      `);
    }
    
    console.log("Found payment:", {
      id: payment._id,
      amount: payment.amount,
      status: payment.status,
      transactionId: payment.transactionId,
      paymentOption: payment.paymentOption
    });
    
    // Find order
    console.log("Finding order with ID:", payment.order);
    const order = await Order.findById(payment.order);
    
    if (!order) {
      console.error("Order not found");
      return res.status(404).send(`
        <html>
          <head>
            <title>Payment Error</title>
            <style>
              body { font-family: Arial, sans-serif; text-align: center; margin-top: 50px; }
              .error { color: red; }
              .container { max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 5px; }
            </style>
          </head>
          <body>
            <div class="container">
              <h2 class="error">Order Not Found</h2>
              <p>We couldn't find the order associated with this payment.</p>
              <p>Please contact customer support if you believe this is an error.</p>
              <a href="/" style="display: inline-block; margin-top: 20px; padding: 10px 20px; background-color: #000; color: #fff; text-decoration: none; border-radius: 4px;">Return to Homepage</a>
            </div>
          </body>
        </html>
      `);
    }
    
    console.log("Found order:", {
      id: order._id,
      status: order.orderStatus,
      paymentStatus: order.paymentStatus,
      totalAmount: order.totalDiscountedPrice
    });
    
    // Check if payment is already completed to prevent double processing
    if (payment.status === 'COMPLETED') {
      console.log("Payment already completed, redirecting to order success page");
      return res.redirect(`${process.env.CLIENT_BASE_URL || 'http://localhost:3000'}/payment/success?orderId=${order._id}`);
    }
    
    // Update payment status
    console.log("Updating payment status to COMPLETED");
    payment.status = 'COMPLETED';
    
    // Store SSL transaction details if available
    if (val_id) {
      payment.sslDetails = {
        valId: val_id,
        transactionId: tran_id || payment.transactionId,
        amount: amount || payment.amount,
        status: status || 'VALID',
        formattedOrderId: formatted_id || order.formattedOrderId || ''
      };
    }
    
    await payment.save();
    console.log("Payment updated successfully");
    
    // Update order status based on payment option
    if (payment.paymentMethod === 'COD' || payment_option === 'cod') {
      console.log("Processing COD payment in success callback");
      console.log("Payment method from database:", payment.paymentMethod);
      console.log("Payment option from request:", payment_option);
      
      // Calculate due amount (order total minus delivery charge)
      const dueAmount = order.totalDiscountedPrice - payment.amount;
      
      // For COD, mark order as placed but payment still pending (only delivery charge paid)
      order.orderStatus = 'PLACED';
      order.paymentStatus = 'COD_PENDING';
      order.paymentOption = 'cod';
      order.dueAmount = dueAmount;
      order.dueStatus = 'PENDING';
      order.paymentDetails = {
        paymentId: payment._id,
        paymentMethod: 'COD',
        status: 'PENDING',
        deliveryChargePaid: true,
        remainingAmountDue: dueAmount,
        dueAmount: dueAmount,
        dueStatus: 'PENDING'
      };
      
      console.log("COD order updated with due amount:", dueAmount);
      console.log("COD order payment details:", order.paymentDetails);
    } else {
      // For other payment methods, set paymentOption based on actual payment method
      let orderPaymentOption = 'cod'; // default fallback
      
      if (payment.paymentMethod === 'bKash') {
        orderPaymentOption = 'bkash';
      } else if (payment.paymentMethod === 'SSLCommerz') {
        orderPaymentOption = 'sslcommerz';
      } else if (payment.paymentMethod === 'Outlet') {
        orderPaymentOption = 'outlet';
      }
      
      // For regular payment, mark as placed and paid
      order.orderStatus = 'PLACED';
      order.paymentStatus = 'COMPLETED';
      order.paymentOption = orderPaymentOption;
      order.dueAmount = 0;
      order.dueStatus = 'NONE';
      order.paymentDetails = {
        paymentId: payment._id,
        paymentMethod: payment.paymentMethod,
        status: 'COMPLETED',
        dueAmount: 0,
        dueStatus: 'NONE'
      };
    }
    
    await order.save();
    console.log("Order updated successfully");
    
    // Redirect to success page with order ID and formatted ID if available
    const formattedIdParam = formatted_id || order.formattedOrderId ? `&formattedId=${encodeURIComponent(formatted_id || order.formattedOrderId)}` : '';
    const tranIdParam = tran_id ? `&tran_id=${encodeURIComponent(tran_id)}` : '';
    const phoneParam = payment.paymentPhoneNumber ? `&cus_phone=${encodeURIComponent(payment.paymentPhoneNumber)}` : '';
    
    // Check if this is a direct API call or a browser redirect
    const isDirectApiCall = req.get('accept') && req.get('accept').includes('application/json');
    
    // Check if this is a guest order
    const isGuestOrder = !order.user || order.isGuestOrder || order.user.toString() === "000000000000000000000000";
    const guestParam = isGuestOrder ? "&guest=true" : "";
    
    if (isDirectApiCall) {
      // For API calls, return JSON
      return res.status(200).json({
        success: true,
        message: 'Payment completed successfully',
        orderId: order._id,
        formattedOrderId: formatted_id || order.formattedOrderId || '',
        transactionId: tran_id || payment.transactionId,
        paymentPhoneNumber: payment.paymentPhoneNumber,
        redirectUrl: `${process.env.CLIENT_BASE_URL || 'https://tweestbd.com'}/payment/success?orderId=${order._id}${formattedIdParam}${tranIdParam}${phoneParam}${guestParam}`
      });
    } else {
      // For browser redirects, use HTML with meta refresh to avoid CORS issues
      const clientUrl = process.env.CLIENT_BASE_URL || 'https://tweestbd.com';
      const redirectUrl = `${clientUrl}/payment/success?orderId=${order._id}${formattedIdParam}${tranIdParam}${phoneParam}${guestParam}`;
      console.log("Redirecting to success page:", redirectUrl);
      
      return res.send(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Payment Successful</title>
            <meta http-equiv="refresh" content="0;url=${redirectUrl}">
            <script type="text/javascript">
              window.location.href = "${redirectUrl}";
            </script>
          </head>
          <body>
            <h1>Payment Successful</h1>
            <p>Redirecting to order confirmation page...</p>
            <p>If you are not redirected automatically, <a href="${redirectUrl}">click here</a>.</p>
          </body>
        </html>
      `);
    }
  } catch (error) {
    console.error("Error in payment success handler:", error);
    
    // Respond with error page
    return res.status(500).send(`
      <html>
        <head>
          <title>Payment Error</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; margin-top: 50px; }
            .error { color: red; }
            .container { max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 5px; }
          </style>
        </head>
        <body>
          <div class="container">
            <h2 class="error">Payment Processing Error</h2>
            <p>There was a problem processing your payment: ${error.message}</p>
            <p>Please contact customer support if you believe this is an error.</p>
            <a href="/" style="display: inline-block; margin-top: 20px; padding: 10px 20px; background-color: #000; color: #fff; text-decoration: none; border-radius: 4px;">Return to Homepage</a>
          </div>
        </body>
      </html>
    `);
  }
};

// Handle SSLCommerz payment failure
const handlePaymentFail = async (req, res) => {
  try {
    console.log("\n=== Payment Failure Handler Started ===");
    console.log("Payment Fail Query:", JSON.stringify(req.query, null, 2));
    console.log("Payment Fail Body:", JSON.stringify(req.body, null, 2));
    
    // Extract relevant data from the request
    const payment_id = req.query.payment_id || req.body.payment_id || req.body.value_a;
    const order_id = req.query.order_id || req.body.order_id || req.body.value_b;
    const tran_id = req.query.tran_id || req.body.tran_id;
    const error_message = req.query.error || req.body.error || req.body.failedreason || 'Payment failed';
    const formatted_id = req.query.formatted_id || req.body.formatted_id || req.body.value_e || req.query.value_e || '';
    
    console.log("Payment Failure - IDs:", { payment_id, order_id, tran_id, error_message, formatted_id });
    
    // 1. Try to find payment by payment_id
    let payment = null;
    let order = null;
    
    if (payment_id) {
      console.log("Looking for payment by payment_id:", payment_id);
      payment = await Payment.findById(payment_id);
      if (payment) {
        console.log("Found payment by ID:", payment._id);
      }
    }
    
    // 2. If not found, try to find payment by transaction ID
    if (!payment && tran_id) {
      console.log("Looking for payment by transaction ID:", tran_id);
      payment = await Payment.findOne({ transactionId: tran_id });
      if (payment) {
        console.log("Found payment by transaction ID:", payment._id);
      }
    }
    
    // 3. If not found, try to find the latest payment for the order
    if (!payment && order_id) {
      console.log("Looking for payment by order ID:", order_id);
      payment = await Payment.findOne({ order: order_id }).sort({ createdAt: -1 });
      if (payment) {
        console.log("Found payment by order ID:", payment._id);
      }
    }
    
    // Update payment status if found
    if (payment) {
      console.log("Updating payment status to FAILED. Payment ID:", payment._id);
        payment.status = 'FAILED';
      payment.paymentDetails = {
        ...payment.paymentDetails || {},
        ...req.body,
        status: 'FAILED',
        error: error_message,
        updated_at: new Date()
      };
        await payment.save();
        
      // Try to get the order directly if we have payment
      if (payment.order) {
        console.log("Looking for order:", payment.order);
        order = await Order.findById(payment.order);
      }
    }
    
    // If still no order but we have order_id, try to find it directly
    if (!order && order_id) {
      console.log("Looking for order by ID:", order_id);
      order = await Order.findById(order_id);
    }
    
    // Update order payment status if found
    if (order) {
      console.log("Updating order payment status to FAILED. Order ID:", order._id);
      order.paymentDetails = {
        ...order.paymentDetails || {},
        paymentStatus: 'FAILED',
        error: error_message,
        updated_at: new Date()
      };
      await order.save();
    }
    
    // Log outcome of the failure handling
    if (payment && order) {
      console.log("Successfully updated payment and order status to FAILED");
    } else if (payment) {
      console.log("Updated payment status to FAILED, but order not found");
    } else if (order) {
      console.log("Updated order payment status to FAILED, but payment not found");
    } else {
      console.error("Could not find payment or order to update status");
    }
    
    // Redirect to failure page with appropriate error message
    const redirectUrl = `${process.env.CLIENT_URL}/payment/failed?error=${encodeURIComponent(error_message)}&redirect=cart`;
    console.log("Redirecting to:", redirectUrl);
    return res.redirect(redirectUrl);
  } catch (error) {
    console.error("Error in handlePaymentFail:", {
      message: error.message,
      stack: error.stack
    });
    return res.redirect(`${process.env.CLIENT_URL}/payment/failed?error=server_error&message=${encodeURIComponent(error.message)}&redirect=cart`);
  }
};

// Handle SSLCommerz payment cancellation
const handlePaymentCancel = async (req, res) => {
  try {
    console.log("\n=== Payment Cancel Handler Started ===");
    console.log("Payment Cancel Query:", JSON.stringify(req.query, null, 2));
    console.log("Payment Cancel Body:", JSON.stringify(req.body, null, 2));
    
    // Extract relevant data from the request
    const payment_id = req.query.payment_id || req.body.payment_id || req.body.value_a;
    const order_id = req.query.order_id || req.body.order_id || req.body.value_b;
    const tran_id = req.query.tran_id || req.body.tran_id;
    const formatted_id = req.query.formatted_id || req.body.formatted_id || req.body.value_e || req.query.value_e || '';
    
    console.log("Payment Cancel - IDs:", { payment_id, order_id, tran_id, formatted_id });
    
    // 1. Try to find payment by payment_id
    let payment = null;
    let order = null;
    
    if (payment_id) {
      console.log("Looking for payment by payment_id:", payment_id);
      payment = await Payment.findById(payment_id);
      if (payment) {
        console.log("Found payment by ID:", payment._id);
      }
    }
    
    // 2. If not found, try to find payment by transaction ID
    if (!payment && tran_id) {
      console.log("Looking for payment by transaction ID:", tran_id);
      payment = await Payment.findOne({ transactionId: tran_id });
      if (payment) {
        console.log("Found payment by transaction ID:", payment._id);
      }
    }
    
    // 3. If not found, try to find the latest payment for the order
    if (!payment && order_id) {
      console.log("Looking for payment by order ID:", order_id);
      payment = await Payment.findOne({ order: order_id }).sort({ createdAt: -1 });
      if (payment) {
        console.log("Found payment by order ID:", payment._id);
      }
    }
    
    // Update payment status if found
    if (payment) {
      console.log("Updating payment status to CANCELLED. Payment ID:", payment._id);
        payment.status = 'CANCELLED';
      payment.paymentDetails = {
        ...payment.paymentDetails || {},
        ...req.body,
        status: 'CANCELLED',
        cancelled_at: new Date()
      };
        await payment.save();
        
      // Try to get the order directly if we have payment
      if (payment.order) {
        console.log("Looking for order:", payment.order);
        order = await Order.findById(payment.order);
      }
    }
    
    // If still no order but we have order_id, try to find it directly
    if (!order && order_id) {
      console.log("Looking for order by ID:", order_id);
      order = await Order.findById(order_id);
    }
    
    // Update order payment status if found
    if (order) {
      console.log("Updating order payment status to PENDING. Order ID:", order._id);
      order.paymentDetails = {
        ...order.paymentDetails || {},
        paymentStatus: 'PENDING',
        cancelled_at: new Date()
      };
      await order.save();
    }
    
    // Log outcome of the cancellation handling
    if (payment && order) {
      console.log("Successfully updated payment to CANCELLED and order to PENDING");
    } else if (payment) {
      console.log("Updated payment status to CANCELLED, but order not found");
    } else if (order) {
      console.log("Updated order payment status to PENDING, but payment not found");
    } else {
      console.error("Could not find payment or order to update status");
    }
    
    // Redirect to cancellation page
    const redirectUrl = `${process.env.CLIENT_URL}/payment/cancelled?redirect=cart`;
    console.log("Redirecting to:", redirectUrl);
    return res.redirect(redirectUrl);
  } catch (error) {
    console.error("Error in handlePaymentCancel:", {
      message: error.message,
      stack: error.stack
    });
    return res.redirect(`${process.env.CLIENT_URL}/payment/cancelled?error=server_error&message=${encodeURIComponent(error.message)}&redirect=cart`);
  }
};

// Handle SSLCommerz IPN (Instant Payment Notification)
const handleIPN = async (req, res) => {
  try {
    console.log("\n=== IPN Handler Started ===");
    console.log("IPN Request Method:", req.method);
    console.log("IPN Query:", JSON.stringify(req.query, null, 2));
    console.log("IPN Body:", JSON.stringify(req.body, null, 2));
    
    // Validate the request first
    const tran_id = req.body.tran_id;
    const val_id = req.body.val_id;
    const status = req.body.status;
    const verified = req.body.verified || 'No';
    const formatted_id = req.body.formatted_id || req.body.value_e || '';
    
    // Check if required parameters are present
    if (!tran_id || !val_id) {
      console.error("Missing required IPN parameters");
      return res.status(400).json({ message: "Missing required parameters" });
    }
    
    console.log("IPN Critical Parameters:", {
      tran_id,
      val_id,
      status,
      verified,
      formatted_id
    });
    
    // Validate with SSLCommerz API
    let validationResult;
    try {
      console.log("Validating IPN with SSLCommerz using val_id:", val_id);
      validationResult = await validateSSLCommerzTransaction(val_id);
      
      console.log("IPN Validation Result:", JSON.stringify(validationResult, null, 2));
      
      if (!validationResult.isValid) {
        console.warn("IPN Validation failed with SSLCommerz");
        // We&apos;ll still process the IPN but log the warning
      }
    } catch (validationError) {
      console.error("Error validating IPN with SSLCommerz:", {
        message: validationError.message,
        stack: validationError.stack
      });
      // Continue processing even if validation fails to be safe
    }
    
    // Try to find the payment by various identifiers
    let payment = null;
    let order = null;
    
    // 1. Try to find payment by payment_id
    if (val_id) {
      console.log("Looking for payment by val_id:", val_id);
      payment = await Payment.findOne({ val_id: val_id });
      if (payment) {
        console.log("Found payment by val_id:", payment._id);
      }
    }
    
    // 2. If not found, try to find payment by transaction ID
    if (!payment && tran_id) {
      console.log("Looking for payment by transaction ID:", tran_id);
      payment = await Payment.findOne({ transactionId: tran_id });
      if (payment) {
        console.log("Found payment by transaction ID:", payment._id);
      }
    }
    
    // 3. If not found, try to find the latest payment for the order
    if (!payment && val_id) {
      console.log("Looking for payment by val_id:", val_id);
      payment = await Payment.findOne({ val_id: val_id }).sort({ createdAt: -1 });
      if (payment) {
        console.log("Found payment by val_id:", payment._id);
      }
    }
    
    if (!payment) {
      console.error("Payment not found in IPN handler");
      return res.status(404).json({ message: "Payment not found" });
    }
    
    // Determine payment status based on validation and request data
    let finalStatus = 'PENDING';
    
    // Give priority to SSLCommerz validation if available
    if (validationResult && validationResult.isValid) {
      finalStatus = 'COMPLETED';
    } 
    // If no validation available, use the status from the request
    else if (status === 'VALID' || status === 'SUCCESS' || status === 'COMPLETED') {
      finalStatus = 'COMPLETED';
    } else if (status === 'FAILED' || status === 'FAILURE') {
      finalStatus = 'FAILED';
    } else if (status === 'CANCELLED') {
      finalStatus = 'CANCELLED';
    }
    
    console.log(`Updating payment status to ${finalStatus}. Payment ID:`, payment._id);
    
    // Update payment status
    payment.status = finalStatus;
    payment.paymentDetails = {
      ...payment.paymentDetails || {},
      ...req.body,
      validationStatus: validationResult ? validationResult.isValid : null,
      status: finalStatus,
      ipn_processed_at: new Date()
    };
      await payment.save();
      
    // Get the corresponding order
    if (payment.order) {
      console.log("Looking for order:", payment.order);
      order = await Order.findById(payment.order);
    }
    
    // If still no order but we have order_id, try to find it directly
    if (!order && val_id) {
      console.log("Looking for order by val_id:", val_id);
      order = await Order.findOne({ val_id: val_id });
    }
    
    if (!order) {
      console.error("Order not found in IPN handler");
      return res.status(404).json({ message: "Order not found" });
    }
    
    // Update order status based on payment status
    if (finalStatus === 'COMPLETED') {
      console.log("Updating order status to CONFIRMED. Order ID:", order._id);
      order.status = 'CONFIRMED';
        order.paymentDetails = {
        ...order.paymentDetails || {},
        paymentStatus: 'COMPLETED',
        completedAt: new Date()
        };
        await order.save();
      
      // If payment is completed, try to clear the user's cart
      const userId = order.user;
      if (userId) {
        console.log("Attempting to clear cart for user:", userId);
        
        try {
          // Step 1: Delete all cart items
          console.log("Deleting all cart items for user:", userId);
          await cartService.deleteCartItems(userId);
          console.log("Successfully deleted all cart items");
          
          // Step 2: Reset cart
          console.log("Resetting cart for user:", userId);
          await cartService.resetCart(userId);
          console.log("Successfully reset cart");
          
          console.log("Cart successfully cleared for user:", userId);
        } catch (cartError) {
          console.error("Error clearing cart:", {
            message: cartError.message,
            stack: cartError.stack
          });
        }
      }
    } else if (finalStatus === 'FAILED') {
      console.log("Updating order payment status to FAILED. Order ID:", order._id);
      order.paymentDetails = {
        ...order.paymentDetails || {},
        paymentStatus: 'FAILED',
        failedAt: new Date()
      };
      await order.save();
    } else if (finalStatus === 'CANCELLED') {
      console.log("Updating order payment status to PENDING. Order ID:", order._id);
      order.paymentDetails = {
        ...order.paymentDetails || {},
        paymentStatus: 'PENDING',
        cancelledAt: new Date()
      };
      await order.save();
    }
    
    console.log("IPN Handler completed successfully");
    return res.status(200).json({ message: "IPN received successfully" });
  } catch (error) {
    console.error("Error in handleIPN:", {
      message: error.message,
      stack: error.stack
    });
    return res.status(500).json({ message: "Error processing IPN", error: error.message });
  }
};

const validateSSLCommerzTransaction = async (val_id) => {
  try {
    const storeId = process.env.SSLCOMMERZ_STORE_ID;
    const storePassword = process.env.SSLCOMMERZ_STORE_PASSWORD;
    const isLive = process.env.SSLCOMMERZ_IS_LIVE === 'true';
    
    // Determine validation URL based on environment
    const validationUrl = isLive
      ? 'https://securepay.sslcommerz.com/validator/api/validationserverAPI.php'
      : 'https://sandbox.sslcommerz.com/validator/api/validationserverAPI.php';
      
    console.log('Validating transaction with URL:', validationUrl);
    
    // Build the validation API URL
    const fullValidationUrl = `${validationUrl}?val_id=${encodeURIComponent(val_id)}&store_id=${encodeURIComponent(storeId)}&store_passwd=${encodeURIComponent(storePassword)}&format=json`;
    
    console.log("Full validation URL:", fullValidationUrl);
    
    const response = await axios.get(fullValidationUrl);
    const data = response.data;
    
    console.log("Validation API response:", JSON.stringify(data, null, 2));
    
    if (data && (data.status === 'VALID' || data.status === 'VALIDATED')) {
      return {
        isValid: true,
        data
      };
    }
    
    return {
      isValid: false,
      data
    };
  } catch (error) {
    console.error("Error in validateSSLCommerzTransaction:", {
      message: error.message,
      stack: error.stack
    });
    return {
      isValid: false,
      error: error.message
    };
  }
};

// Create a guest payment (no authentication required)
const createGuestPayment = async (req, res, next) => {
  try {
    console.log("\n=== Guest Payment Creation Started ===");
    console.log("Guest Payment Request Body:", JSON.stringify(req.body, null, 2));
    
    // 1. Extract data from request body
    const { 
      orderId, 
      paymentMethod, 
      amount, 
      transactionId, 
      paymentPhoneNumber, 
      customerName, 
      customerEmail, 
      paymentOption,
      shippingAddress,
      dueAmount
    } = req.body;

    // Validate required fields
    if (!orderId) {
      console.error("Order ID is required but not provided");
      return res.status(400).json({ 
        message: "Order ID is required", 
        status: false
      });
    }

    if (!paymentMethod) {
      console.error("Payment method is required but not provided");
      return res.status(400).json({ 
        message: "Payment method is required", 
        status: false
      });
    }
    
    if (!paymentPhoneNumber) {
      console.error("Payment phone number is required but not provided");
      return res.status(400).json({ 
        message: "Payment phone number is required", 
        status: false
      });
    }
    
    // 2. Find the order
    console.log("Looking for guest order ID:", orderId);
    let order;
    try {
      order = await Order.findById(orderId);
    } catch (err) {
      console.error("Error finding order:", err);
      return res.status(500).json({
        message: "Failed to retrieve order details",
        status: false
      });
    }
    
    if (!order) {
      console.error("Order not found");
      return res.status(404).json({ 
        message: "Order not found", 
        status: false
      });
    }
    
    // 3. Verify this is a guest order (has no user field or matches provided shippingAddress details)
    const isGuestOrder = !order.user || order.user.toString() === "000000000000000000000000";
    
    if (!isGuestOrder) {
      console.error("This is not a guest order");
      return res.status(400).json({
        message: "This operation is only allowed for guest orders",
        status: false
      });
    }
    
    // 4. Format phone number
    let formattedPhone = paymentPhoneNumber || '';
    if (formattedPhone && !formattedPhone.startsWith('+880')) {
      formattedPhone = formattedPhone.startsWith('0') 
        ? '+88' + formattedPhone 
        : '+880' + formattedPhone;
    }
    
    // Ensure formattedPhone is valid
    if (!formattedPhone || formattedPhone.length < 10) {
      console.error("Invalid or missing payment phone number:", formattedPhone);
      return res.status(400).json({
        message: "Valid phone number is required",
        status: false
      });
    }
    
    console.log("Formatted phone number:", formattedPhone);
    
    // 5. Handle Cash on Delivery for guest checkout
    if (paymentOption === "cod" || paymentMethod === "COD") {
      console.log("Processing Cash on Delivery for guest order");
      
      // Calculate due amount for COD - entire amount is due
      const totalAmount = Number(order.totalDiscountedPrice) || 0;
      const codDueAmount = dueAmount || totalAmount; // For COD, entire amount is due
      
      console.log("Guest COD Payment Amounts:", {
        totalAmount,
        dueAmount: codDueAmount
      });
      
      try {
        // Convert ObjectId to string before using substring
        const orderIdString = order._id.toString();
        
        // Create payment record for COD
        const codPayment = new Payment({
          order: orderId,
          amount: 0,
          dueAmount: codDueAmount,
          dueStatus: 'PENDING',
          paymentMethod: "COD",
          paymentOption: "cod",
          status: "PENDING",
          transactionId: `COD-GUEST-${orderIdString.substring(0, 8)}-${Date.now().toString().substring(8, 13)}`
        });
        
        const savedPayment = await codPayment.save();
        console.log("Guest COD Payment Record Created:", {
          id: savedPayment._id,
          paymentMethod: savedPayment.paymentMethod,
          paymentOption: savedPayment.paymentOption,
          amount: savedPayment.amount,
          dueAmount: savedPayment.dueAmount
        });
        
        // Update order status
        order.orderStatus = "PLACED";
        order.paymentStatus = "COD_PENDING";
        order.paymentOption = "cod";
        order.dueAmount = codDueAmount;
        order.dueStatus = "PENDING";
        order.paymentDetails = {
          paymentId: savedPayment._id,
          paymentMethod: "COD",
          status: "PENDING",
          dueAmount: codDueAmount,
          dueStatus: "PENDING",
          deliveryChargePaid: false,
          remainingAmountDue: codDueAmount
        };
        
        console.log("Updating guest order with payment details:", order.paymentDetails);
        
        await order.save();
        
        return res.status(200).json({
          message: "Order confirmed with Cash on Delivery",
          status: true,
          paymentId: savedPayment._id,
          orderId: order._id,
          dueAmount: codDueAmount
        });
      } catch (err) {
        console.error("Error processing COD payment:", err);
        return res.status(500).json({
          message: "Failed to process COD payment",
          status: false,
          error: err.message
        });
      }
    }
    
    // 6. Generate transaction ID and get API host
    const orderIdString = order._id.toString();
    const tran_id = transactionId || `GUEST-${orderIdString.substring(0, 8)}-${Date.now().toString().substring(8, 13)}`;
    
    // Get API host
    const apiHost = process.env.API_BASE_URL;
    if (!apiHost) {
      console.error('API_BASE_URL environment variable is not set');
      return res.status(500).json({
        message: 'Server configuration error',
        status: false
      });
    }
    
    // Get shipping address from request or set default values for guest orders
    const guestShippingAddress = shippingAddress || {
      firstName: customerName?.split(' ')[0] || 'Guest',
      lastName: customerName?.split(' ').slice(1).join(' ') || 'User',
      streetAddress: 'Guest Address',
      division: 'Dhaka',
      district: 'Dhaka',
      upazilla: 'Dhaka',
      zipCode: '1212',
      mobile: formattedPhone
    };
    
    if (paymentMethod === "bKash") {
      console.log("Processing bKash payment for guest order");
      
      // Update transaction ID for bKash
      const bkashTranId = `BKASH-GUEST-${orderIdString.substring(0, 8)}-${Date.now().toString().substring(8, 13)}`;
      
      // Create payment record
      const bkashPayment = new Payment({
        order: orderId,
        amount: amount || order.totalDiscountedPrice,
        paymentMethod: "bKash",
        status: "PENDING",
        transactionId: bkashTranId,
        paymentOption: paymentOption || "bkash",
        dueAmount: dueAmount || 0,
        dueStatus: 'NONE'
      });
      
      const savedPayment = await bkashPayment.save();
      
      try {
        const bkashPaymentData = {
          amount: savedPayment.amount,
          payerReference: formattedPhone,
          callbackURL: `${apiHost}/api/payments/bkash/callback`,
          merchantInvoiceNumber: bkashTranId
        };
        
        console.log("Creating bKash payment with data:", bkashPaymentData);
        const bkashResponse = await bkashService.createPayment(bkashPaymentData);
        
        if (bkashResponse && bkashResponse.statusCode === "0000" && bkashResponse.paymentID && bkashResponse.bkashURL) {
          console.log("bKash payment creation successful");
          
          // Update payment record with bKash data
          savedPayment.paymentDetails = {
            ...bkashResponse,
            paymentData: bkashPaymentData
          };
          await savedPayment.save();
          
          // Return success response with redirect URL
          return res.status(200).json({
            message: "bKash payment initialization successful",
            status: true,
            paymentUrl: bkashResponse.bkashURL,
            payment: {
        id: savedPayment._id,
              transactionId: bkashTranId,
        amount: savedPayment.amount,
        status: savedPayment.status,
              paymentID: bkashResponse.paymentID
            }
          });
        } else {
          // Update payment status to FAILED
          savedPayment.status = "FAILED";
          savedPayment.paymentDetails = bkashResponse;
          await savedPayment.save();
          
          console.error("bKash payment initialization failed:", bkashResponse);
          
          // Use status code and status message from response
          const errorMessage = bkashResponse.statusMessage || "Failed to initialize bKash payment";
          const statusCode = bkashResponse.statusCode || "UNKNOWN_ERROR";
          
          return res.status(400).json({
            message: `${errorMessage} (StatusCode: ${statusCode})`,
        status: false,
            error: bkashResponse
      });
    }
      } catch (bkashError) {
        // Update payment status to FAILED
        savedPayment.status = "FAILED";
        savedPayment.paymentDetails = {
          error: bkashError.message,
          errorAt: new Date()
        };
        await savedPayment.save();
        
        console.error("Error in bKash payment request:", {
          message: bkashError.message,
          stack: bkashError.stack,
          paymentId: savedPayment._id,
          transactionId: bkashTranId
        });
        
      return res.status(500).json({
          message: "Error in bKash payment gateway",
          status: false,
          error: bkashError.message
        });
      }
    }
    
    // 8. For non-bKash payments, create payment record first
    const payment = new Payment({
      order: orderId,
      amount: amount || order.totalDiscountedPrice,
      paymentMethod,
      status: "PENDING",
      transactionId: tran_id,
      paymentOption: paymentOption || "online",
      dueAmount: dueAmount || 0,
      dueStatus: dueAmount > 0 ? 'PENDING' : 'NONE'
    });
    
    const savedPayment = await payment.save();
    
    // 9. Prepare data for SSLCommerz
    const firstName = order.user?.firstName || guestShippingAddress.firstName;
    const lastName = order.user?.lastName || guestShippingAddress.lastName;
    const email = order.user?.email || customerEmail || '';

    const paymentData = {
      total_amount: savedPayment.amount,
      currency: "BDT",
      tran_id,
      // Use absolute URLs with no template literals in the query parameters
      success_url: `${apiHost}/api/payments/success?payment_id=${encodeURIComponent(savedPayment._id.toString())}&order_id=${encodeURIComponent(order._id.toString())}&payment_option=${encodeURIComponent(paymentOption || "cod")}&formatted_id=${encodeURIComponent(order.formattedOrderId || '')}`,
      fail_url: `${apiHost}/api/payments/fail?payment_id=${encodeURIComponent(savedPayment._id.toString())}&order_id=${encodeURIComponent(order._id.toString())}&payment_option=${encodeURIComponent(paymentOption || "cod")}&formatted_id=${encodeURIComponent(order.formattedOrderId || '')}`,
      cancel_url: `${apiHost}/api/payments/cancel?payment_id=${encodeURIComponent(savedPayment._id.toString())}&order_id=${encodeURIComponent(order._id.toString())}&payment_option=${encodeURIComponent(paymentOption || "cod")}&formatted_id=${encodeURIComponent(order.formattedOrderId || '')}`,
      ipn_url: `${apiHost}/api/payments/ipn`,
      shipping_method: "NO",
      product_name: paymentOption === "cod" ? "TwestBD Delivery Charge" : `TwestBD Order #${order.formattedOrderId ? order.formattedOrderId : order._id.substring(0, 8)}`,
      product_category: "Fashion",
      product_profile: "general",
      cus_name: `${firstName} ${lastName}`,
      cus_email: email,
      cus_add1: guestShippingAddress.streetAddress,
      cus_add2: `${guestShippingAddress.upazilla}, ${guestShippingAddress.district}`,
      cus_city: guestShippingAddress.district,
      cus_state: guestShippingAddress.division,
      cus_postcode: guestShippingAddress.zipCode,
      cus_country: "Bangladesh",
      cus_phone: formattedPhone,
      ship_name: `${firstName} ${lastName}`,
      ship_add1: guestShippingAddress.streetAddress,
      ship_add2: `${guestShippingAddress.upazilla}, ${guestShippingAddress.district}`,
      ship_city: guestShippingAddress.district,
      ship_state: guestShippingAddress.division,
      ship_postcode: guestShippingAddress.zipCode,
      ship_country: "Bangladesh",
      value_a: savedPayment._id.toString(),
      value_b: order._id.toString(),
      value_c: "guest", 
      value_d: paymentOption || "cod",
      value_e: ""  
    };
    
    // Get SSLCommerz configuration from environment variables
    const storeId = process.env.SSLCOMMERZ_STORE_ID;
    const storePassword = process.env.SSLCOMMERZ_STORE_PASSWORD;
    
    if (!storeId || !storePassword) {
      console.error("Missing SSLCommerz credentials in environment variables");
      return res.status(500).json({
        message: "Payment gateway configuration error",
        status: false
      });
    }
    
    const isLive = process.env.SSLCOMMERZ_IS_LIVE === 'true';
    
    // Determine SSL API endpoint based on environment
    const sslUrl = isLive 
      ? 'https://securepay.sslcommerz.com/gwprocess/v4/api.php' 
      : 'https://sandbox.sslcommerz.com/gwprocess/v4/api.php';
      
    console.log("Using SSLCommerz API URL:", sslUrl);
    
    // 9. Make SSLCommerz API request
    try {
      console.log("Making API request to SSLCommerz for guest payment...");
      
      const formData = new URLSearchParams({
        ...paymentData,
        store_id: storeId,
        store_passwd: storePassword
      }).toString();
      
      const sslResponse = await axios.post(sslUrl, formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        }
      });
      
      const data = sslResponse.data;
      console.log("SSLCommerz API Response for guest payment:", JSON.stringify(data, null, 2));
      
      if (data.status === 'SUCCESS') {
        console.log("SSLCommerz payment session created successfully for guest");
        
        try {
          // Update order payment status
          order.paymentStatus = "PENDING";
          order.paymentOption = paymentOption || "online";
          order.paymentDetails = {
            paymentId: savedPayment._id,
            paymentMethod,
            status: "PENDING",
            transactionId: tran_id,
          };
          await order.save();
        } catch (err) {
          console.error("Error updating order status:", err);
          // Continue with the process even if order update fails
        }
        
        // Send GatewayPageURL to client
        return res.status(200).json({
          status: true,
          message: "Payment initialization successful",
          paymentId: savedPayment._id,
          paymentUrl: data.GatewayPageURL,
          orderStatus: order.orderStatus
        });
      } else {
        console.error("SSLCommerz payment session creation failed for guest:", data);
        return res.status(400).json({
          status: false,
          message: data.failedreason || "Payment initialization failed",
          error: data
        });
      }
    } catch (sslError) {
      console.error("Error making SSLCommerz API request for guest payment:", {
        message: sslError.message,
        response: sslError.response?.data,
        stack: sslError.stack
      });
      
      return res.status(500).json({
        status: false,
        message: "Payment gateway error",
        error: sslError.message
      });
    }
  } catch (error) {
    console.error("Error creating guest payment:", {
      message: error.message,
      stack: error.stack
    });
    
    return res.status(500).json({
      message: "Something went wrong with guest payment!",
      error: error.message,
      status: false
    });
  }
};

// Handle bKash payment callback
const handleBkashCallback = async (req, res) => {
  try {
    const { paymentID, status } = req.query;
    
    if (!paymentID) {
      return res.status(400).json({ message: "Payment ID is required" });
    }
    
    const payment = await Payment.findOne({
      'paymentDetails.paymentID': paymentID
    }).populate('order');
    
    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }
    
    const clientUrl = process.env.CLIENT_BASE_URL || 'https://tweestbd.com';
    const order = payment.order;
    
    if (status === 'failure') {
      payment.status = "FAILED";
      payment.paymentDetails = {
        ...payment.paymentDetails,
        callbackStatus: status,
        failureReason: "Payment failed at bKash interface",
        failedAt: new Date()
      };
      await payment.save();
      
      const redirectUrl = `${clientUrl}/payment/failed?orderId=${order._id}&paymentId=${payment._id}&error=payment_failed&message=Payment+failed+at+bKash`;
      return res.redirect(redirectUrl);
    }
    
    if (status === 'cancel') {
      payment.status = "CANCELLED";
      payment.paymentDetails = {
        ...payment.paymentDetails,
        callbackStatus: status,
        cancelReason: "Payment cancelled by user",
        cancelledAt: new Date()
      };
      await payment.save();
      
      const redirectUrl = `${clientUrl}/payment/failed?orderId=${order._id}&paymentId=${payment._id}&error=payment_cancelled&message=Payment+cancelled+by+user`;
      return res.redirect(redirectUrl);
    }
    
    if (status === 'success') {
      try {
        const executeResponse = await bkashService.executePayment(paymentID);
        
        if (executeResponse.statusCode === "0000" && 
            executeResponse.statusMessage === "Successful" && 
            executeResponse.transactionStatus === "Completed") {
          
          payment.status = "COMPLETED";
          payment.paymentDetails = {
            ...payment.paymentDetails,
            callbackStatus: status,
            executeResponse: executeResponse,
            executedAt: new Date()
          };
          await payment.save();
          
          if (order) {
            order.orderStatus = "PLACED";
            order.paymentStatus = "COMPLETED";
            order.paymentOption = "bkash";
            order.paymentDetails = {
              ...order.paymentDetails,
              paymentMethod: "bKash",
              status: "COMPLETED",
              transactionId: executeResponse.trxID,
              paymentId: payment._id
            };
            await order.save();
          }
          
          // Check if this is a guest order and redirect accordingly
          const isGuestOrder = !order.user || order.isGuestOrder || order.user.toString() === "000000000000000000000000";
          const guestParam = isGuestOrder ? "&guest=true" : "";
          const redirectUrl = `${clientUrl}/payment/success?orderId=${order._id}&paymentId=${payment._id}&transactionId=${executeResponse.trxID}${guestParam}`;
          return res.redirect(redirectUrl);
          
        } else if (executeResponse.timeout || executeResponse.statusCode === 'TIMEOUT_ERROR') {
          try {
            const queryResponse = await bkashService.queryPayment(paymentID);
            
            if (queryResponse.statusCode === "0000" && queryResponse.transactionStatus === "Completed") {
              payment.status = "COMPLETED";
              payment.paymentDetails = {
                ...payment.paymentDetails,
                callbackStatus: status,
                executeResponse: executeResponse,
                queryResponse: queryResponse,
                completedViaQuery: true,
                completedAt: new Date()
              };
              await payment.save();
              
              if (order) {
                order.orderStatus = "PLACED";
                order.paymentStatus = "COMPLETED";
                order.paymentOption = "bkash";
                order.paymentDetails = {
                  ...order.paymentDetails,
                  paymentMethod: "bKash",
                  status: "COMPLETED",
                  transactionId: queryResponse.trxID,
                  paymentId: payment._id
                };
                await order.save();
              }
              
              // Check if this is a guest order and redirect accordingly
              const isGuestOrder = !order.user || order.isGuestOrder || order.user.toString() === "000000000000000000000000";
              const guestParam = isGuestOrder ? "&guest=true" : "";
              const redirectUrl = `${clientUrl}/payment/success?orderId=${order._id}&paymentId=${payment._id}&transactionId=${queryResponse.trxID}${guestParam}`;
              return res.redirect(redirectUrl);
              
            } else {
              payment.status = "FAILED";
              payment.paymentDetails = {
                ...payment.paymentDetails,
                callbackStatus: status,
                executeResponse: executeResponse,
                queryResponse: queryResponse,
                failedAt: new Date()
              };
              await payment.save();
              
              const errorMessage = queryResponse.statusMessage || "Payment verification failed";
              const redirectUrl = `${clientUrl}/payment/failed?orderId=${order._id}&paymentId=${payment._id}&error=query_failed&message=${encodeURIComponent(errorMessage)}`;
              return res.redirect(redirectUrl);
            }
            
          } catch (queryError) {
            payment.status = "FAILED";
            payment.paymentDetails = {
              ...payment.paymentDetails,
              callbackStatus: status,
              executeResponse: executeResponse,
              queryError: queryError.message,
              failedAt: new Date()
            };
            await payment.save();
            
            const redirectUrl = `${clientUrl}/payment/failed?orderId=${order._id}&paymentId=${payment._id}&error=api_failure&message=Payment+verification+failed`;
            return res.redirect(redirectUrl);
          }
          
        } else {
          payment.status = "FAILED";
          payment.paymentDetails = {
            ...payment.paymentDetails,
            callbackStatus: status,
            executeResponse: executeResponse,
            failedAt: new Date()
          };
          await payment.save();
          
          const errorMessage = executeResponse.statusMessage || "Payment execution failed";
          const redirectUrl = `${clientUrl}/payment/failed?orderId=${order._id}&paymentId=${payment._id}&error=execution_failed&message=${encodeURIComponent(errorMessage)}`;
          return res.redirect(redirectUrl);
        }
        
      } catch (executeError) {
        payment.status = "FAILED";
        payment.paymentDetails = {
          ...payment.paymentDetails,
          callbackStatus: status,
          executeError: executeError.message,
          failedAt: new Date()
        };
        await payment.save();
        
        const redirectUrl = `${clientUrl}/payment/failed?orderId=${order._id}&paymentId=${payment._id}&error=execution_error&message=Payment+execution+failed`;
        return res.redirect(redirectUrl);
      }
      
    } else {
      payment.status = "FAILED";
      payment.paymentDetails = {
        ...payment.paymentDetails,
        callbackStatus: status,
        unknownStatus: true,
        failedAt: new Date()
      };
      await payment.save();
      
      const redirectUrl = `${clientUrl}/payment/failed?orderId=${order._id}&paymentId=${payment._id}&error=unknown_status&message=Unknown+payment+status`;
      return res.redirect(redirectUrl);
    }
    
  } catch (error) {
    let orderId = 'unknown';
    let paymentId = 'unknown';
    
    try {
      const { paymentID } = req.query;
      if (paymentID) {
        const payment = await Payment.findOne({
          'paymentDetails.paymentID': paymentID
        }).populate('order');
        if (payment) {
          orderId = payment.order?._id || 'unknown';
          paymentId = payment._id;
        }
      }
    } catch (lookupError) {
      console.error("Error looking up payment for error redirect:", lookupError);
    }
    
    const clientUrl = process.env.CLIENT_BASE_URL || 'https://tweestbd.com';
    const redirectUrl = `${clientUrl}/payment/failed?orderId=${orderId}&paymentId=${paymentId}&error=server_error&message=Internal+server+error`;
    
    return res.redirect(redirectUrl);
  }
};

module.exports = {
    createPayment,
    createGuestPayment,
    verifyPayment,
    getPaymentById,
    getPaymentByOrderId,
    getPaymentByTransactionId,
    getAllPayments,
    handlePaymentSuccess,
    handlePaymentFail,
    handlePaymentCancel,
    handleIPN,
    handleBkashCallback
};