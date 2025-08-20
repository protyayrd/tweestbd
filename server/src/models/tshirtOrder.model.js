const mongoose = require('mongoose');

const tshirtOrderSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  formattedOrderId: {
    type: String,
    unique: true
  },
  email: {
    type: String,
  },
  phone: {
    type: String,
    required: true,
  },
  address: {
    type: String,
    required: true,
  },
  district: {
    type: String,
    required: true,
  },
  division: {
    type: String,
    required: true,
  },
  zipCode: {
    type: String,
    required: true,
  },
  tshirtSize: {
    type: String,
    required: true,
    enum: ['S', 'M', 'L', 'XL', 'XXL', '3XL'],
  },
  jerseyCategory: {
    type: String,
    required: true,
    enum: ['Half Sleeve', 'Full Sleeve'],
  },
  jerseyName: {
    type: String,
    required: true,
  },
  jerseyNumber: {
    type: Number,
    required: true,
    min: 1,
    max: 99,
  },
  sscBatch: {
    type: String,
  },
  price: {
    type: Number,
    required: true,
  },
  paymentStatus: {
    type: String,
    enum: ['Pending', 'Paid', 'Failed'],
    default: 'Pending'
  },
  transactionId: {
    type: String,
  },
  paymentDetails: {
    type: Object,
  },
  status: {
    type: String,
    default: 'Pending',
    enum: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const TshirtOrder = mongoose.model('TshirtOrder', tshirtOrderSchema);

module.exports = TshirtOrder; 