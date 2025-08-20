const mongoose = require('mongoose');

const comboOfferSchema = new mongoose.Schema({
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'categories',
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: false
  },
  minimumQuantity: {
    type: Number,
    required: true,
    default: 2,
    min: 2
  },
  comboPrice: {
    type: Number,
    required: true,
    min: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  validFrom: {
    type: Date,
    default: Date.now
  },
  validUntil: {
    type: Date,
    default: null // null means no expiry
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'users',
    required: true
  }
}, {
  timestamps: true
});

// Index for performance
comboOfferSchema.index({ category: 1, isActive: 1 });

// Virtual for per-unit price in combo
comboOfferSchema.virtual('perUnitComboPrice').get(function() {
  return this.comboPrice / this.minimumQuantity;
});

// Method to check if offer is currently valid
comboOfferSchema.methods.isCurrentlyValid = function() {
  const now = new Date();
  return this.isActive && 
         this.validFrom <= now && 
         (this.validUntil === null || this.validUntil >= now);
};

// Method to calculate total price for given quantity
comboOfferSchema.methods.calculateComboTotal = function(quantity) {
  if (quantity < this.minimumQuantity) {
    return null; // Not eligible for combo
  }
  
  // Price per unit when buying in combo
  const perUnitPrice = this.comboPrice / this.minimumQuantity;
  return perUnitPrice * quantity;
};

const ComboOffer = mongoose.model('comboOffers', comboOfferSchema);

module.exports = ComboOffer; 