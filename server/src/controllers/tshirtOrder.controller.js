const TshirtOrder = require('../models/tshirtOrder.model.js');
const { errorHandler } = require('../utils/error.js');
const SSLCommerzPayment = require('sslcommerz-lts');
const { v4: uuidv4 } = require('uuid');
const { generateOrderId } = require('../utils/orderIdGenerator.js');

// SSLCommerz Configuration
const store_id = process.env.SSLCOMMERZ_STORE_ID || 'tweestbd0sandbox';
const store_passwd = process.env.SSLCOMMERZ_STORE_PASSWORD || 'sandbox@ssl';
const is_live = process.env.SSLCOMMERZ_IS_LIVE === 'true' || false; // false for sandbox

// Create a new T-shirt order
const createTshirtOrder = async (req, res, next) => {
  try {
    console.log('Request received at createTshirtOrder');
    console.log('Request body:', req.body);
    
    const orderData = req.body;
    
    // Create new order
    const newOrder = new TshirtOrder(orderData);
    
    // Generate a formatted order ID
    const now = new Date();
    const year = now.getFullYear() % 100; // Get last 2 digits of year
    const month = now.getMonth() + 1; // JS months are 0-indexed
    
    // Find the latest T-shirt order to determine sequence number
    const latestOrder = await TshirtOrder.findOne()
      .where('formattedOrderId').regex(new RegExp(`^${year}${month.toString().padStart(2, '0')}`))
      .sort({ formattedOrderId: -1 });
    
    let sequenceNumber = 1;
    if (latestOrder && latestOrder.formattedOrderId) {
      try {
        // Extract the sequence number from the latest order's formattedOrderId
        const latestSequence = parseInt(latestOrder.formattedOrderId.substring(4));
        sequenceNumber = isNaN(latestSequence) ? 1 : latestSequence + 1;
      } catch (error) {
        console.error('Error parsing latest sequence number:', error);
      }
    }
    
    // Format the sequence number to ensure it's 6 digits with leading zeros
    const formattedSequence = sequenceNumber.toString().padStart(6, '0');
    
    // Format: YY(year)MM(month)XXXXXX(six-digit sequence)
    const formattedOrderId = `${year}${month.toString().padStart(2, '0')}${formattedSequence}`;
    newOrder.formattedOrderId = formattedOrderId;
    
    console.log('New order instance created with formatted ID:', formattedOrderId);
    
    // Validate the order
    const validationError = newOrder.validateSync();
    if (validationError) {
      console.error('Validation error:', validationError);
      return next(errorHandler(400, validationError.message));
    }
    
    // Save the order
    console.log('Attempting to save order...');
    const savedOrder = await newOrder.save();
    console.log('Order saved successfully:', savedOrder);

    // Initialize SSLCommerz payment
    // Update the transaction ID to include formattedOrderId with cleaner format
    const transactionId = `TSHIRT-${savedOrder.formattedOrderId || savedOrder._id.substring(0, 8)}`;
    savedOrder.transactionId = transactionId;
    await savedOrder.save();

    const data = {
      total_amount: savedOrder.price,
      currency: 'BDT',
      tran_id: transactionId,
      success_url: `${process.env.API_BASE_URL}/api/tshirt-orders/payment/success/${savedOrder._id}?formatted_id=${encodeURIComponent(savedOrder.formattedOrderId || '')}`,
      fail_url: `${process.env.API_BASE_URL}/api/tshirt-orders/payment/fail/${savedOrder._id}?formatted_id=${encodeURIComponent(savedOrder.formattedOrderId || '')}`,
      cancel_url: `${process.env.API_BASE_URL}/api/tshirt-orders/payment/cancel/${savedOrder._id}?formatted_id=${encodeURIComponent(savedOrder.formattedOrderId || '')}`,
      ipn_url: `${process.env.API_BASE_URL}/api/tshirt-orders/payment/ipn/${savedOrder._id}`,
      shipping_method: 'NO',
      product_name: `Jersey #${savedOrder.formattedOrderId || ''} (${savedOrder.jerseyCategory || 'Custom'})`,
      product_category: 'Clothing',
      product_profile: 'physical-goods',
      cus_name: savedOrder.name,
      cus_email: savedOrder.email || 'customer@example.com',
      cus_add1: savedOrder.address,
      cus_city: savedOrder.district,
      cus_state: savedOrder.division,
      cus_postcode: savedOrder.zipCode,
      cus_country: 'Bangladesh',
      cus_phone: savedOrder.phone,
      ship_name: savedOrder.name,
      ship_add1: savedOrder.address,
      ship_city: savedOrder.district,
      ship_state: savedOrder.division,
      ship_postcode: savedOrder.zipCode,
      ship_country: 'Bangladesh',
      value_a: savedOrder._id.toString(), // Store order ID for reference
      value_b: savedOrder.jerseyCategory || 'Custom', // Store jersey category
      value_c: savedOrder.jerseySize || 'N/A', // Store jersey size
      value_d: savedOrder.formattedOrderId || '' // Store formatted order ID
    };

    console.log('SSLCommerz Configuration:', {
      store_id,
      store_passwd,
      is_live
    });
    
    if (!store_id || !store_passwd) {
      console.error('SSLCommerz credentials are missing');
      return next(errorHandler(500, 'Payment gateway configuration error'));
    }
    
    console.log('Initializing SSLCommerz payment with data:', data);
    const sslcz = new SSLCommerzPayment(store_id, store_passwd, is_live);
    const apiResponse = await sslcz.init(data);
    console.log('SSLCommerz init response:', apiResponse);

    if (apiResponse?.GatewayPageURL) {
      // Update order with transaction ID and payment initiation details
      savedOrder.paymentDetails = {
        initiated: true,
        initiatedAt: new Date(),
        sessionKey: apiResponse.sessionkey,
        gatewayPageURL: apiResponse.GatewayPageURL
      };
      await savedOrder.save();
      
      return res.status(200).json({
        success: true,
        data: {
          sslUrl: apiResponse.GatewayPageURL,
          orderId: savedOrder._id,
          transactionId: transactionId
        }
      });
    } else {
      console.error('Failed to get payment URL from SSLCommerz:', apiResponse);
      return next(errorHandler(500, apiResponse?.failedreason || 'Failed to initialize payment'));
    }
  } catch (error) {
    console.error('Error in createTshirtOrder:', error);
    return next(errorHandler(500, error.message));
  }
};

// Payment success handler
const handlePaymentSuccess = async (req, res) => {
  try {
    const orderId = req.params.orderId;
    const order = await TshirtOrder.findById(orderId);
    
    if (!order) {
      return res.redirect(`${process.env.CLIENT_URL}/payment-failed?message=Order not found`);
    }

    order.paymentStatus = 'Paid';
    order.paymentDetails = req.body;
    await order.save();

    res.redirect(`${process.env.CLIENT_URL}/payment-success`);
  } catch (error) {
    console.error('Payment success handler error:', error);
    res.redirect(`${process.env.CLIENT_URL}/payment-failed?message=Server error`);
  }
};

// Payment failure handler
const handlePaymentFailure = async (req, res) => {
  try {
    const orderId = req.params.orderId;
    const order = await TshirtOrder.findById(orderId);
    
    if (order) {
      order.paymentStatus = 'Failed';
      order.paymentDetails = req.body;
      await order.save();
    }

    res.redirect(`${process.env.CLIENT_URL}/payment-failed`);
  } catch (error) {
    console.error('Payment failure handler error:', error);
    res.redirect(`${process.env.CLIENT_URL}/payment-failed?message=Server error`);
  }
};

// Payment cancel handler
const handlePaymentCancel = async (req, res) => {
  res.redirect(`${process.env.CLIENT_URL}/payment-cancelled`);
};

// IPN handler
const handleIPN = async (req, res) => {
  try {
    const orderId = req.params.orderId;
    const order = await TshirtOrder.findById(orderId);
    
    if (order && req.body.status === 'VALID') {
      order.paymentStatus = 'Paid';
      order.paymentDetails = req.body;
      await order.save();
    }

    res.status(200).end();
  } catch (error) {
    console.error('IPN handler error:', error);
    res.status(500).end();
  }
};

// Get all T-shirt orders
const getAllTshirtOrders = async (req, res, next) => {
  try {
    const orders = await TshirtOrder.find().sort({ createdAt: -1 });
    res.status(200).json(orders);
  } catch (error) {
    next(errorHandler(500, error.message || 'Error fetching T-shirt orders'));
  }
};

// Get a single T-shirt order by ID
const getTshirtOrderById = async (req, res, next) => {
  try {
    const orderId = req.params.id;
    let order;
    
    // Check if orderId is a valid MongoDB ObjectId
    const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(orderId);
    
    if (isValidObjectId) {
      // Try to find by MongoDB ID first
      order = await TshirtOrder.findById(orderId);
    } else {
      // If not a valid ObjectId, must be a formatted ID
      order = await TshirtOrder.findOne({ formattedOrderId: orderId });
    }
    
    if (!order) {
      return next(errorHandler(404, 'T-shirt order not found'));
    }
    
    res.status(200).json(order);
  } catch (error) {
    next(errorHandler(500, error.message || 'Error fetching T-shirt order'));
  }
};

// Update T-shirt order status
const updateTshirtOrderStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    
    const order = await TshirtOrder.findById(req.params.id);
    if (!order) {
      return next(errorHandler(404, 'T-shirt order not found'));
    }
    
    order.status = status;
    const updatedOrder = await order.save();
    
    res.status(200).json(updatedOrder);
  } catch (error) {
    next(errorHandler(500, error.message || 'Error updating T-shirt order status'));
  }
};

// Get all T-shirt orders for admin
const getAllTshirtOrdersAdmin = async (req, res, next) => {
  try {
    console.log('[DEBUG] getAllTshirtOrdersAdmin called');
    console.log('[DEBUG] Request headers:', req.headers);
    
    const orders = await TshirtOrder.find().sort({ createdAt: -1 });
    console.log('[DEBUG] Found orders:', orders.length);
    console.log('[DEBUG] Sample order (if available):', orders.length > 0 ? orders[0]._id : 'No orders');
    
    // Convert all ObjectId to string to avoid JSON serialization issues
    const formattedOrders = orders.map(order => {
      const formatted = order.toObject();
      return formatted;
    });
    
    console.log('[DEBUG] Sending response:', {
      success: true,
      count: formattedOrders.length
    });
    
    res.status(200).json({
      success: true,
      count: formattedOrders.length,
      data: formattedOrders
    });
  } catch (error) {
    console.error('[DEBUG] Error in getAllTshirtOrdersAdmin:', error);
    next(errorHandler(500, error.message || 'Error fetching T-shirt orders'));
  }
};

// Update T-shirt order status by admin
const updateTshirtOrderStatusAdmin = async (req, res, next) => {
  try {
    const { status } = req.body;
    
    if (!status) {
      return next(errorHandler(400, 'Status is required'));
    }
    
    const order = await TshirtOrder.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    
    if (!order) {
      return next(errorHandler(404, 'T-shirt order not found'));
    }
    
    res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    next(errorHandler(500, error.message || 'Error updating T-shirt order status'));
  }
};

// Update T-shirt order payment status
const updateTshirtOrderPaymentStatus = async (req, res, next) => {
  try {
    const { paymentStatus } = req.body;
    
    if (!paymentStatus) {
      return next(errorHandler(400, 'Payment status is required'));
    }
    
    const order = await TshirtOrder.findByIdAndUpdate(
      req.params.id,
      { paymentStatus },
      { new: true }
    );
    
    if (!order) {
      return next(errorHandler(404, 'T-shirt order not found'));
    }
    
    res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    next(errorHandler(500, error.message || 'Error updating T-shirt order payment status'));
  }
};

// Delete T-shirt order
const deleteTshirtOrder = async (req, res, next) => {
  try {
    const order = await TshirtOrder.findByIdAndDelete(req.params.id);
    
    if (!order) {
      return next(errorHandler(404, 'T-shirt order not found'));
    }
    
    res.status(200).json({
      success: true,
      message: 'T-shirt order deleted successfully'
    });
  } catch (error) {
    next(errorHandler(500, error.message || 'Error deleting T-shirt order'));
  }
};

module.exports = {
  createTshirtOrder,
  getAllTshirtOrders,
  getTshirtOrderById,
  updateTshirtOrderStatus,
  handlePaymentSuccess,
  handlePaymentFailure,
  handlePaymentCancel,
  handleIPN,
  getAllTshirtOrdersAdmin,
  updateTshirtOrderStatusAdmin,
  updateTshirtOrderPaymentStatus,
  deleteTshirtOrder
}; 