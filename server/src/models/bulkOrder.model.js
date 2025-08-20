const mongoose = require('mongoose');
const { Schema } = mongoose;

const bulkOrderSchema = new Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'users',
    required: true,
  },
  formattedOrderId: {
    type: String,
    unique: true
  },
  orderItems: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'products',
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    size: {
      type: String,
      required: true
    },
    price: {
      type: Number,
      required: true
    },
    discountedPrice: {
      type: Number,
      required: true
    }
  }],
  orderDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  expectedDeliveryDate: {
    type: Date,
    required: true
  },
  shippingAddress: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'addresses',
    required: true
  },
  paymentDetails: {
    paymentMethod: {
      type: String,
      required: true
    },
    transactionId: {
      type: String
    },
    paymentId: {
      type: String
    },
    paymentStatus: {
      type: String,
      enum: ['PENDING', 'COMPLETED', 'FAILED'],
      default: 'PENDING'
    }
  },
  totalPrice: {
    type: Number,
    required: true
  },
  totalDiscountedPrice: {
    type: Number,
    required: true
  },
  discount: {
    type: Number,
    required: true
  },
  orderStatus: {
    type: String,
    enum: ['PLACED', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'],
    default: 'PLACED'
  },
  totalItems: {
    type: Number,
    required: true
  },
  notes: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

const BulkOrder = mongoose.model('bulkOrders', bulkOrderSchema);

module.exports = BulkOrder; 