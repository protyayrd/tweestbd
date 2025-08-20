const mongoose = require('mongoose');

const sizeGuideSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'categories',
    required: true
  },
  measurements: {
    S: {
      chest: String,
      length: String,
      shoulder: String
    },
    M: {
      chest: String,
      length: String,
      shoulder: String
    },
    L: {
      chest: String,
      length: String,
      shoulder: String
    },
    XL: {
      chest: String,
      length: String,
      shoulder: String
    },
    XXL: {
      type: Object,
      required: true
    }
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'users',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

const SizeGuide = mongoose.model('sizeGuides', sizeGuideSchema);

module.exports = SizeGuide; 