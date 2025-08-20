const mongoose = require('mongoose');
const { Schema } = mongoose;

const orderSchema = new Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'users',
    required: function() { return !this.isGuestOrder; }
  },
  isGuestOrder: {
    type: Boolean,
    default: false
  },
  guestPhone: {
    type: String,
    required: function() { return this.isGuestOrder; }
  },
  guestEmail: {
    type: String
  },
  formattedOrderId: {
    type: String,
    unique: true
  },
  orderItems: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'orderItems',
  }],
  orderDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  deliveryDate: {
    type: Date
  },
  shippingAddress: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'addresses',
    required: true
  },
  paymentDetails: {
    paymentMethod: {
      type: String,
      enum: ['SSLCommerz', 'bKash', 'COD', 'Outlet'],
      default: 'SSLCommerz'
    },
    transactionId: {
      type: String
    },
    paymentId: {
      type: String
    },
    paymentStatus: {
      type: String,
      enum: ['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED'],
      default: 'PENDING'
    },
    status: {
      type: String,
      enum: ['PENDING', 'COMPLETED', 'PARTIAL', 'FAILED', 'CANCELLED'],
      default: 'PENDING'
    },
    deliveryChargePaid: {
      type: Boolean,
      default: false
    },
    remainingAmountDue: {
      type: Number,
      default: 0
    },
    dueAmount: {
      type: Number,
      default: 0
    },
    dueStatus: {
      type: String,
      enum: ['NONE', 'PENDING', 'PAID'],
      default: 'NONE'
    }
  },
  paymentStatus: {
    type: String,
    enum: ['PENDING', 'COMPLETED', 'COD_PENDING', 'COD_PARTIAL', 'FREE_PICKUP', 'FAILED', 'REFUNDED'],
    default: 'PENDING'
  },
  paymentOption: {
    type: String,
    enum: ['sslcommerz', 'bkash', 'cod', 'outlet', 'online']
  },
  totalPrice: {
    type: Number,
    required: true,
    min: 0
  },
  totalDiscountedPrice: {
    type: Number,
    required: true,
    min: 0
  },
  discount: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  productDiscount: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  promoCodeDiscount: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  shippingCharges: {
    type: Number,
    default: 0,
    min: 0
  },
  dueAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  dueStatus: {
    type: String,
    enum: ['NONE', 'PENDING', 'PAID'],
    default: 'NONE'
  },
  promoDetails: {
    code: {
      type: String,
      default: null
    },
    discountType: {
      type: String,
      enum: ['FIXED', 'PERCENTAGE', null],
      default: null
    },
    discountAmount: {
      type: Number,
      default: 0,
      min: 0
    },
    maxDiscountAmount: {
      type: Number,
      default: null,
      min: 0
    }
  },
  orderStatus: {
    type: String,
    required: true,
    enum: ['PENDING', 'PLACED', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'],
    default: 'PENDING'
  },
  pickupLocation: {
    type: String,
    default: null
  },
  totalItem: {
    type: Number,
    required: true,
    min: 1
  },
  deliveryCharge: {
    type: Number,
    default: 0,
    min: 0
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for total savings
orderSchema.virtual('totalSavings').get(function() {
  return this.productDiscount + this.promoCodeDiscount;
});

// Virtual for savings percentage
orderSchema.virtual('savingsPercentage').get(function() {
  return ((this.totalSavings / this.totalPrice) * 100).toFixed(2);
});

// Pre-save middleware to ensure consistent calculations
orderSchema.pre('save', function(next) {
  // Ensure discount is sum of product and promo discounts
  this.discount = this.productDiscount + this.promoCodeDiscount;
  
  // Ensure totalDiscountedPrice is correctly calculated
  this.totalDiscountedPrice = this.totalPrice - this.discount;
  
  next();
});

const Order = mongoose.model('orders', orderSchema);

module.exports = Order;
