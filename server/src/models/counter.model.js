const mongoose = require('mongoose');
const { Schema } = mongoose;

const counterSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  value: {
    type: Number,
    required: true,
    default: 0
  },
  year: {
    type: Number,
    required: true
  },
  month: {
    type: Number, 
    required: true
  }
});

// Create a compound index on year and month
counterSchema.index({ year: 1, month: 1 });

const Counter = mongoose.model('counters', counterSchema);

module.exports = Counter; 