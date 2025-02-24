const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    maxlength: 50,
    trim: true
  },
  parentCategory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'categories'
  },
  level: {
    type: Number,
    required: true
  },
  imageUrl: {
    type: String,
    required: true
  },
  description: {
    type: String,
    maxlength: 200
  },
  featuredInCarousel: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Add an index for faster queries
categorySchema.index({ level: 1, featuredInCarousel: 1 });

// Pre-save middleware to ensure featuredInCarousel is always set
categorySchema.pre('save', function(next) {
  if (this.featuredInCarousel === undefined) {
    this.featuredInCarousel = false;
  }
  next();
});

// Pre-findOneAndUpdate middleware to ensure featuredInCarousel is handled correctly
categorySchema.pre('findOneAndUpdate', function(next) {
  const update = this.getUpdate();
  if (update.featuredInCarousel === undefined) {
    update.featuredInCarousel = false;
  }
  next();
});

const Category = mongoose.model('categories', categorySchema);

module.exports = Category;
