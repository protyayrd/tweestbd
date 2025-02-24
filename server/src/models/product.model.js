// productModel.js
const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  discountedPrice: {
    type: Number,
    required: true,
  },
  discountPersent: {
    type: Number,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
  },
  colors: [{
    name: {
      type: String,
      required: true
    },
    images: [{
      type: String,
      required: true
    }],
    sizes: [{
      name: {
        type: String,
        required: true
      },
      quantity: {
        type: Number,
        required: true,
        min: 0
      }
    }],
    quantity: {
      type: Number,
      required: true,
      min: 0
    }
  }],
  sizeGuide: {
    type: Object,
    required: false,
    default: null
  },
  ratings: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ratings',
    },
  ], 
  reviews: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'reviews',
    },
  ], 
  numRatings: {
    type: Number,
    default: 0,
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'categories',
    required: true,
  }, 
  isNewArrival: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Add a pre-save middleware to ensure discountedPrice is less than or equal to price
productSchema.pre('save', function(next) {
  if (this.discountedPrice > this.price) {
    next(new Error('Discounted price cannot be greater than regular price'));
  }
  next();
});

const Product = mongoose.model('products', productSchema);

module.exports = Product;
