const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'users',
    required: true,
  },
  cartItems: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'cartItems',
  }],
  totalPrice: {
    type: Number,
    default: 0
  },
  totalItem: {
    type: Number,
    default: 0
  },
  totalDiscountedPrice: {
    type: Number,
    default: 0
  },
  discounte: {
    type: Number,
    default: 0
  }
}, { 
  timestamps: true,
  toJSON: { 
    virtuals: true,
    transform: function(doc, ret) {
      if (ret.cartItems) {
        ret.cartItems = ret.cartItems.map(item => ({
          ...item,
          color: item.color // Ensure color is included
        }));
      }
      return ret;
    }
  },
  toObject: { virtuals: true }
});

// Pre-save middleware to calculate totals
cartSchema.pre('save', async function(next) {
  if (this.cartItems && this.cartItems.length > 0) {
    // Populate cart items if not already populated
    if (!this.populated('cartItems')) {
      await this.populate({
        path: 'cartItems',
        select: '_id cart product size color quantity userId createdAt updatedAt color',
        populate: {
          path: 'product',
          select: '_id title price discountedPrice imageUrl'
        }
      });
    }

    // Calculate totals
    let totalPrice = 0;
    let totalDiscountedPrice = 0;
    let totalItems = 0;

    this.cartItems.forEach(item => {
      if (item.product) {
        totalPrice += item.product.price * item.quantity;
        totalDiscountedPrice += item.product.discountedPrice * item.quantity;
        totalItems += item.quantity;
      }
    });

    this.totalPrice = totalPrice;
    this.totalDiscountedPrice = totalDiscountedPrice;
    this.discounte = totalPrice - totalDiscountedPrice;
    this.totalItem = totalItems;
  } else {
    // Reset totals if no items
    this.totalPrice = 0;
    this.totalDiscountedPrice = 0;
    this.discounte = 0;
    this.totalItem = 0;
  }
  next();
});

// Method to recalculate totals
cartSchema.methods.recalculateTotals = async function() {
  await this.populate({
    path: 'cartItems',
    populate: {
      path: 'product',
      select: '_id title price discountedPrice imageUrl'
    }
  });

  let totalPrice = 0;
  let totalDiscountedPrice = 0;
  let totalItems = 0;

  this.cartItems.forEach(item => {
    if (item.product) {
      totalPrice += item.product.price * item.quantity;
      totalDiscountedPrice += item.product.discountedPrice * item.quantity;
      totalItems += item.quantity;
    }
  });

  this.totalPrice = totalPrice;
  this.totalDiscountedPrice = totalDiscountedPrice;
  this.discounte = totalPrice - totalDiscountedPrice;
  this.totalItem = totalItems;

  await this.save();
  return this;
};

const Cart = mongoose.model('carts', cartSchema);

module.exports = Cart;
