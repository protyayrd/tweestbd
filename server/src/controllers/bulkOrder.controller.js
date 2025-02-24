const bulkOrderService = require('../services/bulkOrder.service.js');

async function createBulkOrder(req, res) {
  try {
    const order = await bulkOrderService.createBulkOrder(req.user, req.body);
    res.status(201).json(order);
  } catch (error) {
    console.error('Error creating bulk order:', error);
    res.status(400).json({ error: error.message });
  }
}

async function updateBulkOrderStatus(req, res) {
  try {
    const { orderId } = req.params;
    const { status } = req.body;
    
    const order = await bulkOrderService.updateBulkOrderStatus(orderId, status);
    res.json(order);
  } catch (error) {
    console.error('Error updating bulk order status:', error);
    res.status(400).json({ error: error.message });
  }
}

async function getBulkOrderById(req, res) {
  try {
    const { orderId } = req.params;
    const order = await bulkOrderService.getBulkOrderById(orderId);
    res.json(order);
  } catch (error) {
    console.error('Error getting bulk order:', error);
    res.status(404).json({ error: error.message });
  }
}

async function getAllBulkOrders(req, res) {
  try {
    const filters = {
      status: req.query.status,
      startDate: req.query.startDate,
      endDate: req.query.endDate
    };
    
    const orders = await bulkOrderService.getAllBulkOrders(filters);
    res.json(orders);
  } catch (error) {
    console.error('Error getting all bulk orders:', error);
    res.status(400).json({ error: error.message });
  }
}

async function getUserBulkOrders(req, res) {
  try {
    const orders = await bulkOrderService.getUserBulkOrders(req.user._id);
    res.json(orders);
  } catch (error) {
    console.error('Error getting user bulk orders:', error);
    res.status(400).json({ error: error.message });
  }
}

async function deleteBulkOrder(req, res) {
  try {
    const { orderId } = req.params;
    const result = await bulkOrderService.deleteBulkOrder(orderId);
    res.json(result);
  } catch (error) {
    console.error('Error deleting bulk order:', error);
    res.status(400).json({ error: error.message });
  }
}

module.exports = {
  createBulkOrder,
  updateBulkOrderStatus,
  getBulkOrderById,
  getAllBulkOrders,
  getUserBulkOrders,
  deleteBulkOrder
}; 