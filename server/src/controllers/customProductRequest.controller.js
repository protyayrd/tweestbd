const customProductRequestService = require('../services/customProductRequest.service.js');

async function createRequest(req, res) {
  try {
    const request = await customProductRequestService.createRequest(req.user, req.body);
    res.status(201).json(request);
  } catch (error) {
    console.error('Error creating custom product request:', error);
    res.status(400).json({ error: error.message });
  }
}

async function updateRequestStatus(req, res) {
  try {
    const { requestId } = req.params;
    const { status, adminData } = req.body;
    
    const request = await customProductRequestService.updateRequestStatus(requestId, status, adminData);
    res.json(request);
  } catch (error) {
    console.error('Error updating custom product request status:', error);
    res.status(400).json({ error: error.message });
  }
}

async function getRequestById(req, res) {
  try {
    const { requestId } = req.params;
    const request = await customProductRequestService.getRequestById(requestId);
    res.json(request);
  } catch (error) {
    console.error('Error getting custom product request:', error);
    res.status(404).json({ error: error.message });
  }
}

async function getAllRequests(req, res) {
  try {
    const filters = {
      status: req.query.status,
      userId: req.query.userId,
      startDate: req.query.startDate,
      endDate: req.query.endDate
    };
    
    const requests = await customProductRequestService.getAllRequests(filters);
    res.json(requests);
  } catch (error) {
    console.error('Error getting all custom product requests:', error);
    res.status(400).json({ error: error.message });
  }
}

async function getUserRequests(req, res) {
  try {
    const requests = await customProductRequestService.getUserRequests(req.user._id);
    res.json(requests);
  } catch (error) {
    console.error('Error getting user custom product requests:', error);
    res.status(400).json({ error: error.message });
  }
}

async function deleteRequest(req, res) {
  try {
    const { requestId } = req.params;
    const result = await customProductRequestService.deleteRequest(requestId);
    res.json(result);
  } catch (error) {
    console.error('Error deleting custom product request:', error);
    res.status(400).json({ error: error.message });
  }
}

module.exports = {
  createRequest,
  updateRequestStatus,
  getRequestById,
  getAllRequests,
  getUserRequests,
  deleteRequest
}; 