// productModel.js
const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  slug: {
    type: String,
    unique: true,
  },
  description: {
    type: String,
    required: true,
  },
  sku: {
    type: String,
    required: false,
  },
  features: {
    type: String,
    required: false,
  },
  perfectFor: {
    type: String,
    required: false,
  },
  additionalInfo: {
    type: String,
    required: false,
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
  ratings: {
    type: Number,
    default: 0,
  }, 
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

// Generate slug from title or SKU before saving
productSchema.pre('save', function(next) {
  // Generate slug if it doesn't exist or title/sku has changed
  if (!this.slug || this.isModified('title') || this.isModified('sku')) {
    // Prefer using SKU if available, otherwise use title
    const baseText = this.sku || this.title;
    this.slug = baseText
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
  
  // Continue with existing validation
  if (this.discountedPrice > this.price) {
    next(new Error('Discounted price cannot be greater than regular price'));
  }
  next();
});

const Product = mongoose.model('products', productSchema);

module.exports = Product;
