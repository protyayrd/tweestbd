const mongoose = require("mongoose");
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  googleId: {
    type: String,
  },
  password: {
    type: String,
    required: function() {
      // Make password optional for review users and Google-authenticated users
      return !this.isReviewUser && !this.googleId;
    },
  },
  role: {
    type: String,
    required: true,
    default: "CUSTOMER",
    enum: ["ADMIN", "CUSTOMER"]
  },
  isReviewUser: {
    type: Boolean,
    default: false
  },
  phone: {
    type: String,
    unique: true,
    sparse: true,
  },
  isOTPVerified: {
    type: Boolean,
    default: false
  },
  otpAttempts: {
    type: Number,
    default: 0
  },
  lastOTPSentAt: {
    type: Date
  },
  addresses: [
    {
        type: mongoose.Schema.Types.ObjectId,
        ref: "addresses",
    },
  ], 
  paymentInformation: [
    {
        type: mongoose.Schema.Types.ObjectId,
        ref: "payment_information",
    },
  ],
  ratings: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ratings",
    },
  ], 
  reviews: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "reviews",
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now(),
  },
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function(next) {
  // Skip password hashing for review users or if password hasn't changed
  if (this.isReviewUser || !this.isModified('password')) {
    return next();
  }
  
  // Only hash the password if it exists
  if (this.password) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

const User = mongoose.model("users", userSchema);

module.exports = User;
