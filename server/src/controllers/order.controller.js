const orderService = require("../services/order.service.js");
const { sendCustomSMS } = require('../services/sms.service');

const createOrder = async (req, res) => {
  const user = req.user;
  try {
    console.log("========== ORDER CONTROLLER - CREATE ORDER ==========");
    console.log("Request body:", JSON.stringify(req.body, null, 2));
    console.log("User:", user._id);

    if (!req.body || !req.body.address) {
      return res.status(400).json({
        message: "Missing address data",
        status: false
      });
    }

    // Validate required fields
    const requiredFields = ['firstName', 'lastName', 'streetAddress', 'division', 'district', 'upazilla', 'zipCode', 'mobile'];
    const missingFields = requiredFields.filter(field => !req.body.address[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        message: `Missing required fields: ${missingFields.join(', ')}`,
        status: false
      });
    }
    
    // Validate order items
    if (!req.body.orderItems || !Array.isArray(req.body.orderItems) || req.body.orderItems.length === 0) {
      return res.status(400).json({
        message: "Order must contain at least one item",
        status: false
      });
    }
    
    // Check for valid product IDs
    const invalidItems = req.body.orderItems.filter(item => !item.product);
    if (invalidItems.length > 0) {
      return res.status(400).json({
        message: "All order items must have a product ID",
        status: false
      });
    }

    let createdOrder = await orderService.createOrder(user, req.body);
    console.log("Order created successfully:", createdOrder._id);
    console.log("========== ORDER CONTROLLER - CREATE ORDER END ==========");

    return res.status(201).send(createdOrder);
  } catch (error) {
    console.error("Error creating order:", error);
    console.error("Error stack:", error.stack);
    console.log("========== ORDER CONTROLLER - CREATE ORDER FAILED ==========");
    
    // Handle mongoose validation errors
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        message: error.message,
        status: false
      });
    }

    return res.status(500).json({
      message: error.message || "Failed to create order",
      status: false
    });
  }
};

const findOrderById = async (req, res) => {
  const user = req.user;
  try {
    const orderId = req.params.id;
    
    console.log(`Looking up order with ID: ${orderId}`);
    
    if (!orderId) {
      console.error("Order ID not provided");
      return res.status(400).json({
        message: "Order ID is required",
        status: false
      });
    }
    
    let order;
    let errorMessage = null;
    
    // Check if orderId is a valid MongoDB ObjectId
    const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(orderId);
    
    console.log(`Is valid MongoDB ObjectId: ${isValidObjectId}`);
    
    // First try to find by MongoDB ID if valid format
    if (isValidObjectId) {
      try {
        console.log("Trying to find order by MongoDB ID");
        order = await orderService.findOrderById(orderId);
        console.log("Order found by MongoDB ID:", order._id);
      } catch (mongoIdError) {
        console.log("Order not found by MongoDB ID:", mongoIdError.message);
        errorMessage = mongoIdError.message;
        // Don't return error yet, we'll try formatted ID next
      }
    }
    
    // If not found by MongoDB ID or not a valid ObjectId, try formatted ID
    if (!order) {
      try {
        console.log("Trying to find order by formatted ID");
        order = await orderService.findOrderByFormattedId(orderId);
        console.log("Order found by formatted ID:", order._id);
      } catch (formattedIdError) {
        console.log("Order not found by formatted ID:", formattedIdError.message);
        
        // If we already have an error from MongoDB ID lookup, use that,
        // otherwise use the formatted ID error
        if (!errorMessage) {
          errorMessage = formattedIdError.message;
        }
        
        // Return a 404 with the appropriate error message
        return res.status(404).json({
          message: errorMessage || "Order not found",
          status: false
        });
      }
    }
    
    return res.status(200).send(order);
  } catch (error) {
    console.error("Error finding order:", error);
    return res.status(500).json({
      message: error.message || "Failed to find order",
      status: false
    });
  }
};

const orderHistory = async (req, res) => {
  const user = req.user;
  try {
    console.log("Getting order history for user:", user._id);
    
    // Extract filter parameters from query
    const filters = {
      status: req.query.status,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      minPrice: req.query.minPrice,
      maxPrice: req.query.maxPrice,
      sortBy: req.query.sortBy
    };

    // Remove undefined filters
    Object.keys(filters).forEach(key => filters[key] === undefined && delete filters[key]);

    console.log("Applied filters:", filters);
    
    try {
      // First try to get orders directly from the database
      const Order = require("../models/order.model.js");
      const mongoose = require("mongoose");
      
      // Convert user ID to string and ObjectId for comparison
      const userIdStr = user._id.toString();
      const userIdObj = new mongoose.Types.ObjectId(userIdStr);
      
      console.log("Looking for orders with user ID:", userIdStr);
      console.log("User ID as ObjectId:", userIdObj);
      
      // Query the database directly
      const directOrders = await Order.find({ user: userIdObj })
        .populate({
          path: "orderItems",
          populate: {
            path: "product"
          }
        })
        .populate("shippingAddress")
        .lean();
      
      console.log("Direct database query found orders:", directOrders.length);
      
      if (directOrders.length > 0) {
        // If we found orders directly, use them
        const result = {
          orders: directOrders,
          stats: {
            totalOrders: directOrders.length,
            totalSpent: directOrders.reduce((sum, order) => sum + order.totalDiscountedPrice, 0),
            totalSaved: directOrders.reduce((sum, order) => sum + (order.totalPrice - order.totalDiscountedPrice), 0),
            averageOrderValue: directOrders.length ? 
              (directOrders.reduce((sum, order) => sum + order.totalDiscountedPrice, 0) / directOrders.length).toFixed(2) : 0,
            ordersByStatus: directOrders.reduce((acc, order) => {
              acc[order.orderStatus] = (acc[order.orderStatus] || 0) + 1;
              return acc;
            }, {})
          }
        };
        
        return res.status(200).json({
          success: true,
          data: result,
          message: "Orders retrieved successfully"
        });
      }
      
      // If direct query didn't find orders, try the service method
      const result = await orderService.usersOrderHistory(user._id, filters);
      console.log("Service method found orders:", result.orders.length);
      console.log("Overall stats:", result.stats);
      
      return res.status(200).json({
        success: true,
        data: result,
        message: "Orders retrieved successfully"
      });
    } catch (serviceError) {
      console.error("Error in order service:", serviceError);
      // Return empty result structure even on error
      return res.status(200).json({
        success: true,
        data: {
          orders: [],
          stats: {
            totalOrders: 0,
            totalSpent: 0,
            totalSaved: 0,
            averageOrderValue: 0,
            ordersByStatus: {}
          }
        },
        message: "No orders found"
      });
    }
  } catch (error) {
    console.error("Error getting order history:", error);
    // Even on critical errors, return a 200 with empty data
    return res.status(200).json({
      success: true,
      data: {
        orders: [],
        stats: {
          totalOrders: 0,
          totalSpent: 0,
          totalSaved: 0,
          averageOrderValue: 0,
          ordersByStatus: {}
        }
      },
      message: "No orders available"
    });
  }
};

// Guest order creation - No authentication required
const createGuestOrder = async (req, res) => {
  try {
    console.log("========== ORDER CONTROLLER - CREATE GUEST ORDER ==========");
    console.log("Request body:", JSON.stringify(req.body, null, 2));

    if (!req.body || !req.body.address) {
      return res.status(400).json({
        message: "Missing address data",
        status: false
      });
    }

    // Validate required fields
    const requiredFields = ['firstName', 'lastName', 'streetAddress', 'division', 'district', 'upazilla', 'zipCode', 'mobile'];
    const missingFields = requiredFields.filter(field => {
      const value = req.body.address[field];
      return !value || value === "undefined" || (typeof value === 'string' && value.trim() === '');
    });
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        message: `Missing required fields: ${missingFields.join(', ')}`,
        status: false
      });
    }
    
    // Required for guest checkout
    if (!req.body.address.mobile) {
      return res.status(400).json({
        message: "Phone number is required for guest checkout",
        status: false
      });
    }
    
    // Validate order items
    if (!req.body.orderItems || !Array.isArray(req.body.orderItems) || req.body.orderItems.length === 0) {
      return res.status(400).json({
        message: "Order must contain at least one item",
        status: false
      });
    }
    
    // Check for valid product IDs and required fields in order items
    for (const item of req.body.orderItems) {
      if (!item.product) {
        return res.status(400).json({
          message: "All order items must have a product ID",
          status: false
        });
      }
      
      if (!item.quantity || item.quantity < 1) {
        return res.status(400).json({
          message: "All order items must have a valid quantity",
          status: false
        });
      }
    }

    // Pass null as user and set isGuest flag to true
    let createdOrder = await orderService.createOrder(null, {
      ...req.body,
      address: {
        ...req.body.address,
        isGuestAddress: true
      }
    }, true);

    console.log("Guest order created successfully:", createdOrder._id);
    console.log("========== ORDER CONTROLLER - CREATE GUEST ORDER END ==========");

    return res.status(201).send(createdOrder);
  } catch (error) {
    console.error("Error creating guest order:", error);
    console.error("Error stack:", error.stack);
    console.log("========== ORDER CONTROLLER - CREATE GUEST ORDER FAILED ==========");
    
    // Handle mongoose validation errors
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        message: error.message,
        status: false
      });
    }

    return res.status(500).json({
      message: error.message || "Failed to create guest order",
      status: false
    });
  }
};

// Find guest order by ID (formattedOrderId or MongoDB ID)
const findGuestOrderById = async (req, res) => {
  try {
    const orderId = req.params.id;
    
    console.log(`Looking up guest order with ID: ${orderId}`);
    
    if (!orderId) {
      console.error("Order ID not provided");
      return res.status(400).json({
        message: "Order ID is required",
        status: false
      });
    }
    
    let order;
    let errorMessage = null;
    
    // Check if orderId is a valid MongoDB ObjectId
    const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(orderId);
    
    // First try to find by MongoDB ID if valid format
    if (isValidObjectId) {
      try {
        order = await orderService.findOrderById(orderId);
      } catch (mongoIdError) {
        errorMessage = mongoIdError.message;
      }
    }
    
    // If not found by MongoDB ID or not a valid ObjectId, try formatted ID
    if (!order) {
      try {
        order = await orderService.findOrderByFormattedId(orderId);
      } catch (formattedIdError) {
        if (!errorMessage) {
          errorMessage = formattedIdError.message;
        }
        
        return res.status(404).json({
          message: errorMessage || "Order not found",
          status: false
        });
      }
    }
    
    // For guest orders, we don't need to verify ownership
    // But we can show a limited version of order info for non-guest orders
    return res.status(200).send(order);
  } catch (error) {
    console.error("Error finding guest order:", error);
    return res.status(500).json({
      message: error.message || "Failed to find guest order",
      status: false
    });
  }
};

// Find guest orders by phone number
const findGuestOrderByPhone = async (req, res) => {
  try {
    const { phone } = req.query;
    
    if (!phone) {
      return res.status(400).json({
        message: "Phone number is required",
        status: false
      });
    }
    
    const orders = await orderService.findOrdersByPhone(phone);
    
    return res.status(200).json({
      success: true,
      data: {
        orders,
        stats: {
          totalOrders: orders.length,
          totalSpent: orders.reduce((sum, order) => sum + order.totalDiscountedPrice, 0),
          totalSaved: orders.reduce((sum, order) => sum + (order.totalPrice - order.totalDiscountedPrice), 0)
        }
      },
      message: "Orders retrieved successfully"
    });
  } catch (error) {
    console.error("Error finding orders by phone:", error);
    return res.status(500).json({
      message: error.message || "Failed to find orders",
      status: false
    });
  }
};

// Send SMS to order shipping address - Public endpoint for specific use case
const sendSMSToOrderShippingAddress = async (req, res) => {
  try {
    const orderId = req.params.id;
    const { message } = req.body;
    
    // Validate message
    if (!message || message.trim().length === 0) {
      return res.status(400).json({ 
        message: "SMS message is required", 
        success: false 
      });
    }

    // Try to find order by either MongoDB ID or formatted ID
    let order;
    const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(orderId);
    
    if (isValidObjectId) {
      try {
        order = await orderService.findOrderById(orderId);
      } catch (mongoIdError) {
        // Continue to try formatted ID
      }
    }
    
    if (!order) {
      try {
        order = await orderService.findOrderByFormattedId(orderId);
      } catch (formattedIdError) {
        return res.status(404).json({ 
          message: "Order not found", 
          success: false 
        });
      }
    }

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
    console.error("Error sending SMS to order shipping address:", error);
    return res.status(500).json({ 
      message: "Something went wrong", 
      error: error.message,
      success: false 
    });
  }
};

module.exports = {
  createOrder,
  findOrderById,
  orderHistory,
  createGuestOrder,
  findGuestOrderById,
  findGuestOrderByPhone,
  sendSMSToOrderShippingAddress
};
