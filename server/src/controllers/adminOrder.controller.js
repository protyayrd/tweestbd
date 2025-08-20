const orderService = require("../services/order.service");
const Payment = require("../models/payment.model");
const Order = require("../models/order.model");
const OrderItem = require("../models/orderItems.js");
const User = require("../models/user.model.js");
const Address = require("../models/address.model.js");
const { sendOrderConfirmationSMS, sendCustomSMS } = require('../services/sms.service');
const mongoose = require('mongoose');
const { generateOrderId } = require('../utils/orderIdGenerator');

// Helper function to find order by either MongoDB ID or formatted ID
const findOrder = async (orderId) => {
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
  
  return order;
};

const getAllOrders = async (req, res) => {
  try {
    // Extract filter parameters from query string
    const filters = {
      orderStatus: req.query.orderStatus,
      sortBy: req.query.sortBy
    };
    
    // Remove undefined filters
    Object.keys(filters).forEach(key => 
      filters[key] === undefined && delete filters[key]
    );
    
    console.log("Admin orders filters:", filters);
    
    const orders = await orderService.getAllOrders(filters);
    return res.status(202).send(orders);
  } catch (error) {
    console.error("Error getting admin orders:", error);
    res.status(500).send({ error: "Something went wrong" });
  }
};

const confirmedOrder = async (req, res) => {
  try {
    const orderId = req.params.orderId;
    
    // Try to find order by either MongoDB ID or formatted ID
    const order = await findOrder(orderId);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }
    
    // Use the MongoDB ID for service call
    const updatedOrder = await orderService.confirmedOrder(order._id);

    // Send SMS notification
    if (updatedOrder.user && updatedOrder.user.phoneNumber) {
      await sendOrderConfirmationSMS(updatedOrder.user.phoneNumber, updatedOrder._id);
    }

    res.status(202).json(updatedOrder);
  } catch (error) {
    console.error('Error in confirmedOrder:', error);
    res.status(500).json({ error: "Something went wrong" });
  }
};

const shippOrder = async (req, res) => {
  try {
    const orderId = req.params.orderId;
    
    // Try to find order by either MongoDB ID or formatted ID
    const order = await findOrder(orderId);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }
    
    // Use the MongoDB ID for service call
    const updatedOrder = await orderService.shipOrder(order._id);
    return res.status(202).send(updatedOrder);
  } catch (error) {
    return res.status(500).json({ error: "Something went wrong" });
  }
};

const deliverOrder = async (req, res) => {
  try {
    const orderId = req.params.orderId;
    
    // Try to find order by either MongoDB ID or formatted ID
    const order = await findOrder(orderId);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }
    
    // Use the MongoDB ID for service call
    const updatedOrder = await orderService.deliveredOrder(order._id);
    return res.status(202).send(updatedOrder);
  } catch (error) {
    return res.status(500).json({ error: "Something went wrong" });
  }
};

const cancelledOrder = async (req, res) => {
  try {
    const orderId = req.params.orderId;
    
    // Try to find order by either MongoDB ID or formatted ID
    const order = await findOrder(orderId);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }
    
    // Use the MongoDB ID for service call
    const updatedOrder = await orderService.cancelledOrder(order._id);
    return res.status(202).send(updatedOrder);
  } catch (error) {
    return res.status(500).json({ error: "Something went wrong" });
  }
};

const deleteOrder = async (req, res) => {
  try {
    const orderId = req.params.orderId;
    
    // Try to find order by either MongoDB ID or formatted ID
    const order = await findOrder(orderId);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }
    
    // Use the MongoDB ID for service call
    await orderService.deleteOrder(order._id);
    res
      .status(202)
      .json({ message: "Order Deleted Successfully", success: true });
  } catch (error) {
    res.status(500).json({ error: "Something went wrong" });
  }
};

/**
 * Mark due amount as paid for COD orders
 */
const markDuePaid = async (req, res) => {
  try {
    const orderId = req.params.orderId;
    
    // Find the order by either MongoDB ID or formatted ID
    const order = await findOrder(orderId);
    if (!order) {
      return res.status(404).json({ 
        message: "Order not found", 
        success: false 
      });
    }
    
    // Check if order has due amount
    if (!order.dueAmount || order.dueAmount <= 0) {
      return res.status(400).json({ 
        message: "This order has no due amount", 
        success: false 
      });
    }
    
    // Check if order is COD
    if (order.paymentOption !== 'cod') {
      return res.status(400).json({ 
        message: "This is not a COD order", 
        success: false 
      });
    }
    
    // Find the associated payment
    const payment = await Payment.findOne({ order: order._id });
    if (payment) {
      // Update the payment record
      payment.dueAmount = 0;
      payment.dueStatus = 'PAID';
      payment.status = 'COMPLETED';
      payment.paymentDetails = {
        ...payment.paymentDetails,
        dueStatus: 'PAID',
        dueAmountPaidAt: new Date(),
        status: 'COMPLETED'
      };
      await payment.save();
    }
    
    // Update the order
    order.dueAmount = 0;
    order.dueStatus = 'PAID';
    order.paymentStatus = 'COMPLETED';
    order.paymentDetails = {
      ...order.paymentDetails,
      dueStatus: 'PAID',
      status: 'COMPLETED',
      dueAmountPaidAt: new Date()
    };
    await order.save();
    
    return res.status(200).json({
      message: "Due amount marked as paid successfully",
      success: true,
      order
    });
  } catch (error) {
    console.error("Error marking due as paid:", error);
    return res.status(500).json({ 
      message: "Something went wrong", 
      error: error.message,
      success: false 
    });
  }
};

/**
 * Create outlet order from admin panel
 */
const createOutletOrder = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { customerInfo, products, totalPrice, totalDiscountedPrice, discount, shippingCharges } = req.body;
    
    if (!customerInfo || !products || products.length === 0) {
      return res.status(400).json({
        message: "Customer information and products are required",
        success: false
      });
    }
    
    // Find or create a user for this customer
    let user = await User.findOne({ phoneNumber: customerInfo.phoneNumber });
    
    if (!user) {
      // Create a new user
      user = new User({
        firstName: customerInfo.name.split(' ')[0] || customerInfo.name,
        lastName: customerInfo.name.split(' ').slice(1).join(' ') || '',
        email: customerInfo.email || `${customerInfo.phoneNumber}@placeholder.com`,
        phoneNumber: customerInfo.phoneNumber,
        password: `${customerInfo.phoneNumber}123`, // Default password using phone number
        role: "CUSTOMER"
      });
      
      await user.save({ session });
    }
    
    // Create or find shipping address
    let shippingAddress = await Address.findOne({ 
      user: user._id,
      streetAddress: customerInfo.address
    });
    
    if (!shippingAddress) {
      // Extract address fields from customerInfo or use defaults
      // Handle required fields from Address model
      shippingAddress = new Address({
        user: user._id,
        // Use provided firstName/lastName if available, otherwise split from name
        firstName: customerInfo.firstName || customerInfo.name.split(' ')[0] || customerInfo.name,
        lastName: customerInfo.lastName || customerInfo.name.split(' ').slice(1).join(' ') || '',
        streetAddress: customerInfo.streetAddress || customerInfo.address,
        city: customerInfo.city,
        // Required Address model fields with fallbacks
        zipCode: customerInfo.zipCode || "1212",
        mobile: customerInfo.mobile || customerInfo.phoneNumber,
        // Handle required location fields - use city as default for all location fields if not provided
        zone: customerInfo.zone || customerInfo.city,
        area: customerInfo.area || customerInfo.city,
        district: customerInfo.district || customerInfo.city,
        upazilla: customerInfo.upazilla || customerInfo.city,
        division: customerInfo.division || customerInfo.city
      });
      
      await shippingAddress.save({ session });
    }
    
    // Create order items
    const orderItems = [];
    
    for (const product of products) {
      const orderItem = new OrderItem({
        product: product.productId,
        size: product.size,
        color: product.color,
        quantity: product.quantity,
        price: product.price,
        discountedPrice: product.discountedPrice,
        userId: user._id
      });
      
      const savedOrderItem = await orderItem.save({ session });
      orderItems.push(savedOrderItem._id);
    }
    
    // Generate a unique order ID
    const formattedOrderId = await generateOrderId();
    
    // Create the order with valid promoDetails
    const order = new Order({
      user: user._id,
      orderItems,
      totalPrice,
      totalDiscountedPrice,
      discount,
      shippingAddress: shippingAddress._id,
      status: "CONFIRMED",
      paymentMethod: "COD",
      paymentStatus: "PENDING",
      shippingCharges,
      orderId: formattedOrderId,
      outletOrder: true,
      orderDate: Date.now(),
      // Handle promoDetails validation by providing valid default values
      promoDetails: req.body.promoDetails || {
        discountType: "PERCENTAGE",
        discountValue: 0,
        promoCode: ""
      },
      paymentOption: 'outlet',
      totalPrice,
      totalDiscountedPrice,
      discount,
      shippingCharges: shippingCharges || 0,
      totalItem: products.reduce((total, product) => total + product.quantity, 0)
    });
    
    const savedOrder = await order.save({ session });
    
    // Create a payment record with a generated transactionId for outlet orders
    const payment = new Payment({
      order: savedOrder._id,
      user: user._id,
      amount: totalDiscountedPrice + (shippingCharges || 0),
      paymentMethod: 'Outlet',
      status: 'COMPLETED',
      // Generate a transaction ID for outlet orders (required field)
      transactionId: `OUTLET-${formattedOrderId}-${Date.now()}`,
      paymentDetails: {
        status: 'COMPLETED'
      }
    });
    
    await payment.save({ session });
    
    await session.commitTransaction();
    session.endSession();
    
    // Fetch the complete order with populated fields
    const populatedOrder = await Order.findById(savedOrder._id)
      .populate('user')
      .populate('orderItems')
      .populate('shippingAddress');
    
    return res.status(201).json({
      message: "Outlet order created successfully",
      success: true,
      order: populatedOrder
    });
    
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    
    console.error("Error creating outlet order:", error);
    return res.status(500).json({
      message: "Failed to create outlet order",
      error: error.message,
      success: false
    });
  }
};

/**
 * Send SMS to order shipping address mobile number
 */
const sendSMSToShippingAddress = async (req, res) => {
  try {
    const orderId = req.params.orderId;
    const { message } = req.body;
    
    // Validate message
    if (!message || message.trim().length === 0) {
      return res.status(400).json({ 
        message: "SMS message is required", 
        success: false 
      });
    }

    // Try to find order by either MongoDB ID or formatted ID
    const order = await findOrder(orderId);
    if (!order) {
      return res.status(404).json({ 
        message: "Order not found", 
        success: false 
      });
    }

    // Populate shipping address if needed
    await order.populate('shippingAddress');
    
    if (!order.shippingAddress || !order.shippingAddress.mobile) {
      return res.status(400).json({ 
        message: "No mobile number found in shipping address", 
        success: false 
      });
    }

    // Format phone number (remove any non-digits and ensure Bangladesh format)
    let phoneNumber = order.shippingAddress.mobile.toString().replace(/[^0-9]/g, '');
    
    // Ensure it starts with 01 for Bangladesh mobile numbers
    if (phoneNumber.length === 11 && phoneNumber.startsWith('01')) {
      // Valid Bangladesh mobile number format
    } else if (phoneNumber.length === 13 && phoneNumber.startsWith('880')) {
      // Remove country code and use local format
      phoneNumber = phoneNumber.substring(3);
    } else if (phoneNumber.length === 10 && !phoneNumber.startsWith('01')) {
      // Add 01 prefix if missing
      phoneNumber = '01' + phoneNumber;
    } else {
      return res.status(400).json({ 
        message: "Invalid mobile number format", 
        success: false 
      });
    }

    // Send SMS
    const smsResult = await sendCustomSMS(phoneNumber, message);
    
    if (smsResult.success) {
      return res.status(200).json({
        message: "SMS sent successfully",
        success: true,
        phoneNumber: phoneNumber,
        smsData: smsResult.data
      });
    } else {
      return res.status(500).json({
        message: "Failed to send SMS",
        success: false,
        error: smsResult.error
      });
    }
    
  } catch (error) {
    console.error("Error sending SMS to shipping address:", error);
    return res.status(500).json({ 
      message: "Something went wrong", 
      error: error.message,
      success: false 
    });
  }
};

module.exports = {
  getAllOrders,
  confirmedOrder,
  shippOrder,
  deliverOrder,
  cancelledOrder,
  deleteOrder,
  markDuePaid,
  createOutletOrder,
  sendSMSToShippingAddress
};
