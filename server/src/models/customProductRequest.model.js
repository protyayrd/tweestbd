const mongoose = require('mongoose');
const { Schema } = mongoose;

const customProductRequestSchema = new Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'users',
    required: true,
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'categories',
    required: true
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  specifications: [{
    name: String,
    value: String
  }],
  requiredQuantity: {
    type: Number,
    required: true,
    min: 1
  },
  targetPrice: {
    type: Number,
    required: true
  },
  attachments: [{
    url: String,
    type: String // e.g., 'image', 'document'
  }],
  status: {
    type: String,
    enum: ['PENDING', 'REVIEWING', 'APPROVED', 'REJECTED', 'IN_PRODUCTION', 'COMPLETED'],
    default: 'PENDING'
  },
  adminNotes: {
    type: String
  },
  quotation: {
    price: Number,
    validUntil: Date,
    notes: String
  },
  timeline: {
    requestedAt: {
      type: Date,
      default: Date.now
    },
    reviewedAt: Date,
    quotedAt: Date,
    approvedAt: Date,
    completedAt: Date
  },
  deliveryRequirements: {
    preferredDeliveryDate: Date,
    shippingAddress: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'addresses'
    },
    specialInstructions: String
  }
}, {
  timestamps: true
});

const CustomProductRequest = mongoose.model('customProductRequests', customProductRequestSchema);

module.exports = CustomProductRequest; 