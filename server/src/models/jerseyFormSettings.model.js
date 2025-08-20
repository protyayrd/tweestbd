const mongoose = require('mongoose');

const jerseyFormSettingsSchema = new mongoose.Schema({
  jerseyCategories: [{
    name: {
      type: String,
      required: true
    },
    price: {
      type: Number,
      required: true
    },
    image: {
      type: String,
      required: true
    },
    isActive: {
      type: Boolean,
      default: true
    }
  }],
  jerseySizes: [{
    size: {
      type: String,
      required: true
    },
    chest: {
      type: String,
      required: true
    },
    length: {
      type: String,
      required: true
    },
    shoulder: {
      type: String,
      required: true
    },
    isActive: {
      type: Boolean,
      default: true
    }
  }],
  sscBatchYears: [{
    year: {
      type: String,
      required: true
    },
    isActive: {
      type: Boolean,
      default: true
    }
  }],
  defaultLocation: {
    zipCode: {
      type: String,
      default: '5100'
    },
    division: {
      type: String,
      default: 'Rangpur'
    },
    district: {
      type: String,
      default: 'Thakurgaon'
    }
  },
  isFormActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

const JerseyFormSettings = mongoose.model('JerseyFormSettings', jerseyFormSettingsSchema);

module.exports = JerseyFormSettings; 