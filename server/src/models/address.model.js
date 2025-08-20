const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },
  streetAddress: {
    type: String,
    required: true,
  },
  mobile: {
    type: String,
    required: true,
  },
  // Primary location fields (Pathao format)
  city: {
    type: String,
    required: true,
  },
  zone: {
    type: String,
    required: true,
  },
  area: {
    type: String,
    required: true,
  },
  // Backend compatibility fields
  division: {
    type: String,
    required: true,
    default: function() {
      return this.city;
    }
  },
  district: {
    type: String,
    required: true,
    default: function() {
      return this.zone;
    }
  },
  upazilla: {
    type: String,
    required: true,
    default: function() {
      return this.area;
    }
  },
  zipCode: {
    type: String,
    required: true,
    default: "1212" // Default Dhaka zip code
  },
  // Pathao-specific fields
  pathao_city_id: {
    type: Number,
  },
  pathao_zone_id: {
    type: Number,
  },
  pathao_area_id: {
    type: Number,
  },
  // Flag to indicate if this is a Pathao-verified address
  is_pathao_verified: {
    type: Boolean,
    default: false
  },
  // Flag to indicate if this is a guest address
  isGuestAddress: {
    type: Boolean,
    default: false
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'users',
    required: function() { 
      // User is required only if this is not a guest address
      return !this.isGuestAddress; 
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Add middleware to ensure location fields are synced
addressSchema.pre('save', function(next) {
  // If division/district/upazilla are not set, use city/zone/area
  if (!this.division) this.division = this.city;
  if (!this.district) this.district = this.zone;
  if (!this.upazilla) this.upazilla = this.area;
  
  // If city/zone/area are not set, use division/district/upazilla
  if (!this.city) this.city = this.division;
  if (!this.zone) this.zone = this.district;
  if (!this.area) this.area = this.upazilla;

  next();
});

// Add index for faster queries
addressSchema.index({ pathao_city_id: 1, pathao_zone_id: 1, pathao_area_id: 1 });
addressSchema.index({ user: 1 });

const Address = mongoose.model('addresses', addressSchema);

module.exports = Address;
