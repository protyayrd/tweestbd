const mongoose = require('mongoose');

const promoCodeSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
  },
  description: {
    type: String,
    required: true,
  },
  discountType: {
    type: String,
    enum: ['FIXED', 'PERCENTAGE'],
    required: true,
  },
  discountAmount: {
    type: Number,
    required: true,
    min: 0,
  },
  maxDiscountAmount: {
    type: Number,
    required: function() {
      return this.discountType === 'PERCENTAGE';
    },
    min: 0,
  },
  minOrderAmount: {
    type: Number,
    default: 0,
    min: 0,
  },
  applicableOn: {
    type: String,
    enum: ['ALL', 'CATEGORY', 'PRODUCT'],
    required: true,
  },
  applicableProducts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'products',
  }],
  applicableCategories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'categories',
  }],
  validFrom: {
    type: Date,
    required: true,
  },
  validUntil: {
    type: Date,
    required: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  usageLimit: {
    type: Number,
    default: null,
  },
  usageCount: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Validation to ensure end date is after start date
promoCodeSchema.pre('save', function(next) {
  if (this.validUntil <= this.validFrom) {
    next(new Error('End date must be after start date'));
  }
  next();
});

// Validation for applicable items based on applicableOn field
promoCodeSchema.pre('save', function(next) {
  if (this.applicableOn === 'PRODUCT' && (!this.applicableProducts || this.applicableProducts.length === 0)) {
    next(new Error('Products must be specified when applicableOn is PRODUCT'));
  }
  if (this.applicableOn === 'CATEGORY' && (!this.applicableCategories || this.applicableCategories.length === 0)) {
    next(new Error('Categories must be specified when applicableOn is CATEGORY'));
  }
  next();
});

const PromoCode = mongoose.model('promoCodes', promoCodeSchema);

module.exports = PromoCode; 