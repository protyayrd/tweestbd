const mongoose = require('mongoose');

const predefinedDescriptionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  content: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: [
      'main_description',
      'product_features',
      'perfect_for',
      'additional_information'
    ],
    default: 'main_description'
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

const PredefinedDescription = mongoose.model('predefinedDescriptions', predefinedDescriptionSchema);

module.exports = PredefinedDescription; 