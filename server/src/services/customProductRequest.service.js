const CustomProductRequest = require('../models/customProductRequest.model.js');
const User = require('../models/user.model.js');
const Address = require('../models/address.model.js');

async function createRequest(user, requestData) {
  try {
    const request = new CustomProductRequest({
      user: user._id,
      ...requestData,
      status: 'PENDING',
      timeline: {
        requestedAt: new Date()
      }
    });

    const savedRequest = await request.save();
    return await populateRequest(savedRequest._id);
  } catch (error) {
    console.error('Error in createRequest service:', error);
    throw error;
  }
}

async function updateRequestStatus(requestId, status, adminData = {}) {
  const request = await CustomProductRequest.findById(requestId);
  if (!request) {
    throw new Error('Custom product request not found');
  }

  request.status = status;
  request.adminNotes = adminData.notes || request.adminNotes;

  // Update timeline based on status
  const now = new Date();
  switch (status) {
    case 'REVIEWING':
      request.timeline.reviewedAt = now;
      break;
    case 'APPROVED':
      request.timeline.approvedAt = now;
      break;
    case 'COMPLETED':
      request.timeline.completedAt = now;
      break;
  }

  // Update quotation if provided
  if (adminData.quotation) {
    request.quotation = {
      ...request.quotation,
      ...adminData.quotation,
      quotedAt: now
    };
    request.timeline.quotedAt = now;
  }

  await request.save();
  return await populateRequest(request._id);
}

async function getRequestById(requestId) {
  const request = await populateRequest(requestId);
  if (!request) {
    throw new Error('Custom product request not found');
  }
  return request;
}

async function getAllRequests(filters = {}) {
  const query = {};
  
  if (filters.status) {
    query.status = filters.status;
  }
  
  if (filters.userId) {
    query.user = filters.userId;
  }
  
  if (filters.startDate && filters.endDate) {
    query.createdAt = {
      $gte: new Date(filters.startDate),
      $lte: new Date(filters.endDate)
    };
  }

  return await CustomProductRequest.find(query)
    .populate('user', 'firstName lastName email')
    .populate('category', 'name')
    .populate('deliveryRequirements.shippingAddress')
    .sort({ createdAt: -1 });
}

async function getUserRequests(userId) {
  return await CustomProductRequest.find({ user: userId })
    .populate('category', 'name')
    .populate('deliveryRequirements.shippingAddress')
    .sort({ createdAt: -1 });
}

async function deleteRequest(requestId) {
  const request = await CustomProductRequest.findById(requestId);
  if (!request) {
    throw new Error('Custom product request not found');
  }
  
  if (!['PENDING', 'REJECTED'].includes(request.status)) {
    throw new Error('Cannot delete request in current status');
  }
  
  await CustomProductRequest.findByIdAndDelete(requestId);
  return { message: 'Custom product request deleted successfully' };
}

// Helper function to populate request references
async function populateRequest(requestId) {
  return await CustomProductRequest.findById(requestId)
    .populate('user', 'firstName lastName email')
    .populate('category', 'name')
    .populate('deliveryRequirements.shippingAddress');
}

module.exports = {
  createRequest,
  updateRequestStatus,
  getRequestById,
  getAllRequests,
  getUserRequests,
  deleteRequest
}; 