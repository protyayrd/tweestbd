const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    maxlength: 50,
    trim: true
  },
  slug: {
    type: String,
    unique: true,
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
// and to generate slug from name
categorySchema.pre('save', function(next) {
  // Generate slug if it doesn't exist or name has changed
  if (!this.slug || this.isModified('name')) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

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
  
  // If name is being updated, update the slug too
  if (update.name) {
    update.slug = update.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
  
  next();
});

const Category = mongoose.model('categories', categorySchema);

module.exports = Category;
