const mongoose = require('mongoose');

const edushopSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    maxlength: 50,
    trim: true
  },
  description: {
    type: String,
    maxlength: 200
  },
  logoUrl: {
    type: String,
    required: function() {
      return this.level === 1;
    },
    default: null
  },
  imageUrl: {
    type: String,
    required: true
  },
  parentCategory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'edushop_categories',
    required: function() {
      return this.level === 2;
    }
  },
  level: {
    type: Number,
    required: true,
    enum: [1, 2]
  },
  displayOrder: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Add indexes for better query performance
edushopSchema.index({ level: 1, displayOrder: 1 });
edushopSchema.index({ isActive: 1 });
edushopSchema.index({ parentCategory: 1 });

const Edushop = mongoose.model('edushop_categories', edushopSchema);

module.exports = Edushop; 