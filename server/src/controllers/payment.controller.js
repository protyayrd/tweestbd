const paymentService = require('../services/payment.service.js');
const Payment = require("../models/payment.model.js");
const Order = require("../models/order.model.js");
const { errorHandler } = require("../utils/error.js");
const axios = require("axios");
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');

// SSLCommerz configuration
const sslcommerz = {
  store_id: process.env.SSLCOMMERZ_STORE_ID || 'twees679c82365a29b',
  store_passwd: process.env.SSLCOMMERZ_STORE_PASSWORD || 'twees679c82365a29b@ssl',
  is_live: false, // true for live, false for sandbox
};

// Create a new payment
const createPayment = async (req, res, next) => {
  try {
    console.log("Creating payment...", req.body);
    const { orderId, paymentMethod, amount, customerName, customerEmail, paymentPhoneNumber } = req.body;

    // Validate required fields
    if (!orderId) {
      return next(errorHandler(400, "Order ID is required"));
    }

    if (!paymentMethod) {
      return next(errorHandler(400, "Payment method is required"));
    }

    // Check if payment method is valid
    if (paymentMethod !== "SSLCommerz") {
      return next(errorHandler(400, "Invalid payment method. Only SSLCommerz is supported."));
    }

    // Check if order exists
    const order = await Order.findById(orderId);
    if (!order) {
      return next(errorHandler(404, "Order not found"));
    }

    try {
      // Use provided transaction ID or generate a new one
      const tran_id = req.body.transactionId || `TWEES-${Date.now()}`;
      
      // Format phone number - remove '+' and country code if present
      let formattedPhone = paymentPhoneNumber || req.user.mobile || '01700000000';
      if (formattedPhone.startsWith('+')) {
        // Remove the '+' and country code (e.g., +880)
        formattedPhone = formattedPhone.replace(/^\+880/, '0');
      }
      if (formattedPhone.startsWith('880')) {
        formattedPhone = '0' + formattedPhone.substring(3);
      }
      
      // Create a payment record with pending status
      const payment = new Payment({
        order: orderId,
        user: req.user.id,
        paymentMethod,
        amount,
        status: "PENDING",
        transactionId: tran_id,
        paymentPhoneNumber: formattedPhone,
      });
      
      await payment.save();
      
      // Prepare customer info - use provided values or fallback to user data
      const customerInfo = {
        cus_name: customerName || `${req.user.firstName} ${req.user.lastName}` || 'Customer',
        cus_email: customerEmail || req.user.email || 'customer@example.com',
        cus_phone: formattedPhone,
      };
      
      // Prepare shipping info from order
      const shippingAddress = await order.populate('shippingAddress');
      const address = shippingAddress.shippingAddress || {};
      
      // Prepare SSLCommerz data according to official documentation
      const sslData = {
        store_id: sslcommerz.store_id,
        store_passwd: sslcommerz.store_passwd,
        total_amount: amount,
        currency: 'BDT',
        tran_id: tran_id,
        success_url: `${process.env.API_BASE_URL || 'http://localhost:5000'}/api/payments/success?payment_id=${payment._id}&order_id=${orderId}&tran_id=${tran_id}`,
        fail_url: `${process.env.API_BASE_URL || 'http://localhost:5000'}/api/payments/fail?payment_id=${payment._id}&order_id=${orderId}&tran_id=${tran_id}`,
        cancel_url: `${process.env.API_BASE_URL || 'http://localhost:5000'}/api/payments/cancel?payment_id=${payment._id}&order_id=${orderId}&tran_id=${tran_id}`,
        ipn_url: `${process.env.API_BASE_URL || 'http://localhost:5000'}/api/payments/ipn`,
        multi_card_name: '',
        allowed_bin: '',
        shipping_method: 'Courier',
        product_name: 'Order Items',
        product_category: 'Physical Goods',
        product_profile: 'general',
        cus_name: customerInfo.cus_name,
        cus_email: customerInfo.cus_email,
        cus_add1: address.streetAddress || 'Address',
        cus_add2: '',
        cus_city: address.city || 'City',
        cus_state: address.state || 'State',
        cus_postcode: address.zipCode || '1000',
        cus_country: address.country || 'Bangladesh',
        cus_phone: customerInfo.cus_phone,
        cus_fax: customerInfo.cus_phone,
        ship_name: (address.firstName && address.lastName) 
          ? `${address.firstName} ${address.lastName}` 
          : customerInfo.cus_name,
        ship_add1: address.streetAddress || 'Address',
        ship_add2: '',
        ship_city: address.city || 'City',
        ship_state: address.state || 'State',
        ship_postcode: address.zipCode || '1000',
        ship_country: address.country || 'Bangladesh',
        value_a: payment._id.toString(), // Store payment ID for reference
        value_b: orderId,
        value_c: req.user.id,
        value_d: '',
      };
      
      console.log("Sending request to SSLCommerz:", {
        storeId: sslcommerz.store_id,
        amount: sslData.total_amount,
        currency: sslData.currency,
        transactionId: sslData.tran_id,
        customerPhone: sslData.cus_phone,
        customerName: sslData.cus_name,
        customerEmail: sslData.cus_email
      });
      
      // Make API request to SSLCommerz
      // According to the official documentation
      const apiEndpoint = sslcommerz.is_live 
        ? 'https://securepay.sslcommerz.com/gwprocess/v4/api.php'
        : 'https://sandbox.sslcommerz.com/gwprocess/v4/api.php';
      
      try {
        const response = await axios.post(apiEndpoint, sslData, {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        });
        console.log("SSLCommerz response:", response.data);
        
        if (response.data.status === 'SUCCESS') {
          // Return the payment gateway URL
          return res.status(200).json({
            success: true,
            message: "Payment initialization successful",
            payment_id: payment._id,
            payment_link_url: response.data.GatewayPageURL,
          });
        } else {
          // If SSLCommerz initialization failed
          console.error("SSLCommerz initialization failed:", response.data);
          await Payment.findByIdAndUpdate(payment._id, { status: "FAILED" });
          return next(errorHandler(400, "Payment gateway initialization failed: " + (response.data.failedreason || "Unknown error")));
        }
      } catch (error) {
        console.error("SSLCommerz API Error:", error.message);
        if (error.response) {
          console.error("SSLCommerz Error Response:", error.response.data);
        }
        await Payment.findByIdAndUpdate(payment._id, { status: "FAILED" });
        return next(errorHandler(500, "Error connecting to payment gateway: " + error.message));
      }
    } catch (error) {
      console.error("Payment processing error:", error);
      return next(errorHandler(500, "Error processing payment"));
    }
  } catch (error) {
    console.error("Payment creation error:", error);
    next(error);
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

const getPaymentById = async (req, res) => {
    try {
        const payment = await paymentService.getPaymentById(req.params.paymentId);
        return res.status(200).json({
            success: true,
            payment: payment
        });
    } catch (error) {
        return res.status(500).json({
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

// Handle SSLCommerz payment success
const handlePaymentSuccess = async (req, res) => {
  try {
    console.log("Payment Success Callback - Query:", req.query);
    console.log("Payment Success Callback - Body:", req.body);
    
    // Get payment_id from either query or body
    const payment_id = req.query.payment_id || req.body.payment_id || req.body.value_a;
    const order_id = req.query.order_id || req.body.order_id || req.body.value_b;
    const tran_id = req.query.tran_id || req.body.tran_id;
    
    console.log("Payment Success - IDs:", { payment_id, order_id, tran_id });
    
    // If we don't have a payment_id but have an order_id, try to find the payment by order
    if (!payment_id && order_id) {
      const payment = await Payment.findOne({ order: order_id });
      if (payment) {
        // Update payment status
        payment.status = 'COMPLETED';
        payment.paymentDetails = req.body;
        await payment.save();
        
        // Update order status
        const order = await Order.findById(order_id);
        if (order) {
          order.orderStatus = 'CONFIRMED';
          order.paymentDetails.paymentStatus = 'COMPLETED';
          order.paymentDetails.transactionId = tran_id;
          await order.save();
        }
        
        return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:3000'}/payment/success?order_id=${order_id}&redirect=orders`);
      }
    }
    
    // If we have a payment_id, proceed as normal
    if (payment_id) {
      const payment = await Payment.findById(payment_id);
      if (!payment) {
        console.error("Payment not found with ID:", payment_id);
        return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:3000'}/payment/failed?error=payment_not_found`);
      }
      
      // Update payment status
      payment.status = 'COMPLETED';
      payment.paymentDetails = req.body;
      await payment.save();
      
      // Update order status
      const order = await Order.findById(payment.order);
      if (order) {
        order.orderStatus = 'CONFIRMED';
        order.paymentDetails.paymentStatus = 'COMPLETED';
        order.paymentDetails.transactionId = payment.transactionId;
        await order.save();
      }
      
      return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:3000'}/payment/success?order_id=${payment.order}&redirect=orders`);
    }
    
    // If we reach here, we couldn't find the payment
    console.error("Payment reference not found in success callback");
    return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:3000'}/payment/failed?error=payment_reference_missing`);
  } catch (error) {
    console.error("Error in handlePaymentSuccess:", error);
    return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:3000'}/payment/failed?error=server_error`);
  }
};

// Handle SSLCommerz payment failure
const handlePaymentFail = async (req, res) => {
  try {
    console.log("Payment Fail Callback - Query:", req.query);
    console.log("Payment Fail Callback - Body:", req.body);
    
    // Get payment_id and order_id from either query or body
    const payment_id = req.query.payment_id || req.body.payment_id || req.body.value_a;
    const order_id = req.query.order_id || req.body.order_id || req.body.value_b;
    const tran_id = req.query.tran_id || req.body.tran_id;
    
    console.log("Payment Fail - IDs:", { payment_id, order_id, tran_id });
    
    // If we have a payment_id, update the payment
    if (payment_id) {
      const payment = await Payment.findById(payment_id);
      if (payment) {
        payment.status = 'FAILED';
        payment.paymentDetails = req.body;
        await payment.save();
        
        // Update order payment status
        const order = await Order.findById(payment.order);
        if (order) {
          order.paymentDetails.paymentStatus = 'FAILED';
          await order.save();
        }
      }
    } 
    // If we have an order_id but no payment_id, try to find the payment by order
    else if (order_id) {
      const payment = await Payment.findOne({ order: order_id });
      if (payment) {
        payment.status = 'FAILED';
        payment.paymentDetails = req.body;
        await payment.save();
        
        // Update order payment status
        const order = await Order.findById(order_id);
        if (order) {
          order.paymentDetails.paymentStatus = 'FAILED';
          await order.save();
        }
      }
    }
    
    // Get error message if available
    const error_message = req.body?.error || req.query?.error || 'payment_failed';
    
    // Redirect to failure page
    return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:3000'}/payment/failed?error=${error_message}&redirect=cart`);
  } catch (error) {
    console.error("Error in handlePaymentFail:", error);
    return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:3000'}/payment/failed?error=server_error&redirect=cart`);
  }
};

// Handle SSLCommerz payment cancellation
const handlePaymentCancel = async (req, res) => {
  try {
    console.log("Payment Cancel Callback - Query:", req.query);
    console.log("Payment Cancel Callback - Body:", req.body);
    
    // Get payment_id and order_id from either query or body
    const payment_id = req.query.payment_id || req.body.payment_id || req.body.value_a;
    const order_id = req.query.order_id || req.body.order_id || req.body.value_b;
    const tran_id = req.query.tran_id || req.body.tran_id;
    
    console.log("Payment Cancel - IDs:", { payment_id, order_id, tran_id });
    
    // If we have a payment_id, update the payment
    if (payment_id) {
      const payment = await Payment.findById(payment_id);
      if (payment) {
        payment.status = 'CANCELLED';
        payment.paymentDetails = req.body;
        await payment.save();
        
        // Update order payment status
        const order = await Order.findById(payment.order);
        if (order) {
          order.paymentDetails.paymentStatus = 'PENDING';
          await order.save();
        }
      }
    } 
    // If we have an order_id but no payment_id, try to find the payment by order
    else if (order_id) {
      const payment = await Payment.findOne({ order: order_id });
      if (payment) {
        payment.status = 'CANCELLED';
        payment.paymentDetails = req.body;
        await payment.save();
        
        // Update order payment status
        const order = await Order.findById(order_id);
        if (order) {
          order.paymentDetails.paymentStatus = 'PENDING';
          await order.save();
        }
      }
    }
    
    // Redirect to cancellation page
    return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:3000'}/payment/cancelled?redirect=cart`);
  } catch (error) {
    console.error("Error in handlePaymentCancel:", error);
    return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:3000'}/payment/cancelled?redirect=cart`);
  }
};

// Handle SSLCommerz IPN (Instant Payment Notification)
const handleIPN = async (req, res) => {
  try {
    console.log("IPN Callback:", req.body);
    
    // Verify the transaction with SSLCommerz if needed
    const { tran_id, status, val_id } = req.body;
    
    if (!tran_id) {
      return res.status(400).json({ error: "Transaction ID not provided" });
    }
    
    // Find payment by transaction ID
    const payment = await Payment.findOne({ transactionId: tran_id });
    if (!payment) {
      return res.status(404).json({ error: "Payment not found" });
    }
    
    // Update payment status based on SSLCommerz status
    if (status === "VALID" || status === "VALIDATED") {
      payment.status = "COMPLETED";
      payment.validationId = val_id;
      payment.paymentDetails = req.body;
      await payment.save();
      
      // Update order status
      const order = await Order.findById(payment.order);
      if (order) {
        order.orderStatus = "CONFIRMED";
        order.paymentDetails = {
          id: payment._id,
          status: payment.status,
          method: payment.paymentMethod,
          update: new Date()
        };
        await order.save();
      }
      
      return res.status(200).json({ success: true });
    } else if (status === "FAILED") {
      payment.status = "FAILED";
      payment.paymentDetails = req.body;
      await payment.save();
      
      return res.status(200).json({ success: true });
    } else if (status === "CANCELLED") {
      payment.status = "CANCELLED";
      payment.paymentDetails = req.body;
      await payment.save();
      
      return res.status(200).json({ success: true });
    }
    
    // For any other status
    payment.paymentDetails = req.body;
    await payment.save();
    
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("IPN Handler Error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = {
    createPayment,
    verifyPayment,
    getPaymentById,
    getAllPayments,
    handlePaymentSuccess,
    handlePaymentFail,
    handlePaymentCancel,
    handleIPN
};