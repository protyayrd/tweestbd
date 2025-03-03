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
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  discountedPrice: {
    type: Number,
    required: true,
    min: 0
  }
}, { 
  timestamps: true,
  toJSON: { 
    virtuals: true,
    getters: true,
    transform: function(doc, ret) {
      const originalPrice = ret.price || 0;
      const baseDiscountedPrice = ret.discountedPrice || originalPrice;
      const quantity = ret.quantity || 0;
      
      // Calculate product discount
      const totalOriginalPrice = originalPrice * quantity;
      const totalBaseDiscountedPrice = baseDiscountedPrice * quantity;
      const productDiscount = totalOriginalPrice - totalBaseDiscountedPrice;
      
      // Get promo discount from cart
      const promoDiscount = doc.cart?.promoCodeDiscount || 0;
      const cartTotalValue = doc.cart?.totalDiscountedPrice || totalBaseDiscountedPrice;
      
      // Calculate this item's share of promo discount based on its value ratio
      const itemValueRatio = totalBaseDiscountedPrice / cartTotalValue;
      const itemPromoDiscount = promoDiscount * itemValueRatio;
      
      // Calculate final price after all discounts
      const finalDiscountedPrice = totalBaseDiscountedPrice - itemPromoDiscount;
      
      return {
        _id: ret._id,
        cart: {
          promoCodeDiscount: promoDiscount,
          promoDetails: doc.cart?.promoDetails
        },
        product: ret.product,
        size: ret.size,
        color: ret.color,
        quantity: ret.quantity,
        userId: ret.userId,
        price: originalPrice,
        discountedPrice: baseDiscountedPrice,
        totalPrice: totalOriginalPrice,
        totalDiscountedPrice: finalDiscountedPrice,
        productDiscount,
        promoDiscount: itemPromoDiscount,
        totalDiscount: productDiscount + itemPromoDiscount,
        discountPercentage: ((productDiscount + itemPromoDiscount) / totalOriginalPrice * 100).toFixed(2)
      };
    }
  },
  toObject: { virtuals: true }
});

// Virtual fields for price calculations
cartItemSchema.virtual('totalPrice').get(function() {
  return this.price * this.quantity;
});

cartItemSchema.virtual('totalDiscountedPrice').get(function() {
  return this.discountedPrice * this.quantity;
});

cartItemSchema.virtual('productDiscount').get(function() {
  return this.totalPrice - this.totalDiscountedPrice;
});

cartItemSchema.virtual('discountPercentage').get(function() {
  if (this.totalPrice === 0) return 0;
  return ((this.productDiscount / this.totalPrice) * 100).toFixed(2);
});

// Pre-save middleware to validate prices
cartItemSchema.pre('save', async function(next) {
  try {
    if (!this.price || !this.discountedPrice) {
      const product = await this.model('products').findById(this.product);
      if (!product) {
        throw new Error('Product not found');
      }
      this.price = product.price;
      this.discountedPrice = product.discountedPrice || product.price;
    }

    if (this.discountedPrice > this.price) {
      this.discountedPrice = this.price;
    }

    next();
  } catch (error) {
    next(error);
  }
});

const CartItem = mongoose.model('cartItems', cartItemSchema);

module.exports = CartItem;
