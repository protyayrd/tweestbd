const orderService = require("../services/order.service.js");

const createOrder = async (req, res) => {
  const user = req.user;
  try {
    console.log("Creating order with data:", JSON.stringify(req.body, null, 2));
    console.log("User:", user._id);

    if (!req.body || !req.body.address) {
      return res.status(400).json({
        message: "Missing address data",
        status: false
      });
    }

    // Validate required address fields
    const requiredFields = ['firstName', 'lastName', 'streetAddress', 'division', 'district', 'upazilla', 'zipCode', 'mobile'];
    const missingFields = requiredFields.filter(field => !req.body.address[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        message: `Missing required fields: ${missingFields.join(', ')}`,
        status: false
      });
    }

    let createdOrder = await orderService.createOrder(user, req.body);
    console.log("Order created successfully:", createdOrder._id);

    return res.status(201).send(createdOrder);
  } catch (error) {
    console.error("Error creating order:", error);
    
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
    let order = await orderService.findOrderById(req.params.id);
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
    
    const result = await orderService.usersOrderHistory(user._id, filters);
    console.log("Found orders:", result.orders.length);
    console.log("Overall stats:", result.stats);
    
    return res.status(200).json({
      success: true,
      data: result,
      message: "Orders retrieved successfully"
    });
  } catch (error) {
    console.error("Error getting order history:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to get order history",
      error: error.message
    });
  }
};

module.exports = { createOrder, findOrderById, orderHistory };
