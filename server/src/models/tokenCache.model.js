const mongoose = require("mongoose");

const tokenCacheSchema = new mongoose.Schema({
  service: {
    type: String,
    required: true,
    unique: true,
    enum: ['bkash'], // Can extend for other services
    index: true
  },
  token: {
    type: String,
    required: true
  },
  expiresAt: {
    type: Date,
    required: true,
    index: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// TTL index to automatically remove expired tokens
tokenCacheSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const TokenCache = mongoose.model("TokenCache", tokenCacheSchema);

module.exports = TokenCache; 