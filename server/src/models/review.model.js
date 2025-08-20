const mongoose = require('mongoose');
const { Schema } = mongoose;

const reviewSchema = new Schema({
  review: {
    type: String,
    required: true,
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'products',
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'users',
    required: true,
  },
  rating: {
    type: Number,
    required: true,
    default: 5,
  },
  verifiedPurchase: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Review = mongoose.model('reviews', reviewSchema);

module.exports = Review;
