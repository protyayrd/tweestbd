const BulkOrder = require('../models/bulkOrder.model.js');
const Product = require('../models/product.model.js');
const User = require('../models/user.model.js');
const Address = require('../models/address.model.js');
const { generateOrderId } = require('../utils/orderIdGenerator.js');

async function createBulkOrder(user, orderData) {
  try {
    const address = await Address.findById(orderData.shippingAddress);
    if (!address) {
      throw new Error('Shipping address not found');
    }

    // Validate and process order items
    const processedItems = [];
    let totalPrice = 0;
    let totalDiscountedPrice = 0;
    let totalItems = 0;

    for (const item of orderData.orderItems) {
      const product = await Product.findById(item.product);
      if (!product) {
        throw new Error(`Product not found with ID: ${item.product}`);
      }

      // Validate stock availability
      const selectedSize = product.colors.reduce((acc, color) => {
        const size = color.sizes.find(s => s.name === item.size);
        return size ? size : acc;
      }, null);

      if (!selectedSize || selectedSize.quantity < item.quantity) {
        throw new Error(`Insufficient stock for product ${product.title} in size ${item.size}`);
      }

      const itemPrice = product.price * item.quantity;
      const itemDiscountedPrice = product.discountedPrice * item.quantity;

      processedItems.push({
        product: product._id,
        size: item.size,
        color: item.color,
        quantity: item.quantity,
        price: itemPrice,
        discountedPrice: itemDiscountedPrice
      });

      totalPrice += itemPrice;
      totalDiscountedPrice += itemDiscountedPrice;
      totalItems += item.quantity;
    }

    // Calculate expected delivery date (e.g., 7 days from order date)
    const expectedDeliveryDate = new Date();
    expectedDeliveryDate.setDate(expectedDeliveryDate.getDate() + 7);

    // Generate a formatted order ID
    const formattedOrderId = await generateOrderId();
    console.log("Generated formatted order ID for bulk order:", formattedOrderId);
    
    // Generate a clean transaction ID
    const transactionId = `BULK-${formattedOrderId}`;
    
    const bulkOrder = new BulkOrder({
      user: user._id,
      formattedOrderId,
      transactionId,
      orderItems: processedItems,
      shippingAddress: address._id,
      expectedDeliveryDate,
      paymentMethod: orderData.paymentMethod,
      totalPrice,
      totalDiscountedPrice,
      discount: totalPrice - totalDiscountedPrice,
      totalItem: totalItems,
      notes: orderData.notes,
      orderStatus: 'PLACED'
    });

    const savedOrder = await bulkOrder.save();

    // Return populated order
    return await BulkOrder.findById(savedOrder._id)
      .populate('user', 'firstName lastName email')
      .populate({
        path: 'orderItems.product',
        select: 'title price discountedPrice imageUrl brand category'
      })
      .populate('shippingAddress');
  } catch (error) {
    console.error('Error in createBulkOrder service:', error);
    throw error;
  }
}

async function updateBulkOrderStatus(orderId, status) {
  const order = await BulkOrder.findById(orderId);
  if (!order) {
    throw new Error('Bulk order not found');
  }
  
  order.orderStatus = status;
  if (status === 'DELIVERED') {
    order.paymentDetails.paymentStatus = 'COMPLETED';
  }
  
  return await order.save();
}

async function getBulkOrderById(orderId) {
  const order = await BulkOrder.findById(orderId)
    .populate('user', 'firstName lastName email')
    .populate({
      path: 'orderItems.product',
      select: 'title price discountedPrice imageUrl brand category'
    })
    .populate('shippingAddress')
    .lean();

  if (!order) {
    throw new Error('Bulk order not found');
  }

  return order;
}

async function getBulkOrderByFormattedId(formattedOrderId) {
  const order = await BulkOrder.findOne({ formattedOrderId })
    .populate('user', 'firstName lastName email')
    .populate({
      path: 'orderItems.product',
      select: 'title price discountedPrice imageUrl brand category'
    })
    .populate('shippingAddress')
    .lean();

  if (!order) {
    throw new Error('Bulk order not found with formatted ID: ' + formattedOrderId);
  }

  return order;
}

async function getAllBulkOrders(filters = {}) {
  const query = {};
  
  if (filters.status) {
    query.orderStatus = filters.status;
  }
  
  if (filters.startDate && filters.endDate) {
    query.orderDate = {
      $gte: new Date(filters.startDate),
      $lte: new Date(filters.endDate)
    };
  }

  return await BulkOrder.find(query)
    .populate('user', 'firstName lastName email')
    .populate({
      path: 'orderItems.product',
      select: 'title price discountedPrice imageUrl'
    })
    .populate('shippingAddress')
    .sort({ createdAt: -1 });
}

async function getUserBulkOrders(userId) {
  return await BulkOrder.find({ user: userId })
    .populate({
      path: 'orderItems.product',
      select: 'title price discountedPrice imageUrl'
    })
    .populate('shippingAddress')
    .sort({ createdAt: -1 });
}

async function deleteBulkOrder(orderId) {
  const order = await BulkOrder.findById(orderId);
  if (!order) {
    throw new Error('Bulk order not found');
  }
  
  if (order.orderStatus !== 'PLACED' && order.orderStatus !== 'CANCELLED') {
    throw new Error('Cannot delete order in current status');
  }
  
  await BulkOrder.findByIdAndDelete(orderId);
  return { message: 'Bulk order deleted successfully' };
}

module.exports = {
  createBulkOrder,
  updateBulkOrderStatus,
  getBulkOrderById,
  getBulkOrderByFormattedId,
  getAllBulkOrders,
  getUserBulkOrders,
  deleteBulkOrder
}; 