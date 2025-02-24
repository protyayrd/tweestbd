const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  cart: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'carts',
    required: true,
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'products',
    required: true,
  },
  size: {
    type: String,
    required: true,
  },
  color: {
    type: String,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    default: 1,
    min: [1, 'Quantity must be at least 1']
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'users',
    required: true,
  }
}, { 
  timestamps: true,
  toJSON: { 
    virtuals: true,
    getters: true,
    transform: function(doc, ret) {
      return {
        _id: ret._id,
        cart: ret.cart,
        product: ret.product,
        size: ret.size,
        color: doc.color || ret.color,
        quantity: ret.quantity,
        userId: ret.userId,
        createdAt: ret.createdAt,
        updatedAt: ret.updatedAt,
        totalPrice: ret.totalPrice,
        totalDiscountedPrice: ret.totalDiscountedPrice,
        discount: ret.discount
      };
    }
  },
  toObject: { 
    virtuals: true,
    getters: true,
    transform: function(doc, ret) {
      return {
        _id: ret._id,
        cart: ret.cart,
        product: ret.product,
        size: ret.size,
        color: doc.color || ret.color,
        quantity: ret.quantity,
        userId: ret.userId,
        createdAt: ret.createdAt,
        updatedAt: ret.updatedAt,
        totalPrice: ret.totalPrice,
        totalDiscountedPrice: ret.totalDiscountedPrice,
        discount: ret.discount
      };
    }
  }
});

// Add virtual fields for price calculations
cartItemSchema.virtual('totalPrice').get(function() {
  if (this.product && typeof this.product === 'object') {
    return this.product.price * this.quantity;
  }
  return 0;
});

cartItemSchema.virtual('totalDiscountedPrice').get(function() {
  if (this.product && typeof this.product === 'object') {
    return this.product.discountedPrice * this.quantity;
  }
  return 0;
});

cartItemSchema.virtual('discount').get(function() {
  return this.totalPrice - this.totalDiscountedPrice;
});

// Add a pre-save middleware to ensure color is saved
cartItemSchema.pre('save', function(next) {
  if (this.isModified('color')) {
    // Make sure color is saved as a string
    this.color = String(this.color);
  }
  next();
});

const CartItem = mongoose.model('cartItems', cartItemSchema);

module.exports = CartItem;
