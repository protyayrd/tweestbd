const mongoose = require('mongoose');
const PromoCode = require('./promoCode.model.js');

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
    required: true,
    default: 0,
    min: 0
  },
  totalItem: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  totalDiscountedPrice: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  discount: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  promoCode: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'promoCodes',
    default: undefined
  },
  promoCodeDiscount: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  // Combo offer discount fields
  comboOfferDiscount: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  appliedComboOffers: [{
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'categories'
    },
    categoryName: String,
    offerName: String,
    totalQuantity: Number,
    perUnitPrice: Number,
    totalDiscount: Number
  }],
  // Store promoDetails as a simple object without validation
  promoDetailsCode: {
    type: String,
    default: null
  },
  promoDetailsDiscountType: {
    type: String,
    default: 'FIXED'
  },
  promoDetailsDiscountAmount: {
    type: Number,
    default: 0
  },
  promoDetailsMaxDiscountAmount: {
    type: Number,
    default: null
  }
}, { 
  timestamps: true,
  toJSON: { 
    virtuals: true,
    transform: function(doc, ret) {
      if (ret.cartItems) {
        ret.cartItems = ret.cartItems.map(item => ({
          ...item,
          color: item.color,
          productDiscount: item.productDiscount || 0,
          promoDiscount: item.promoDiscount || 0,
          totalDiscount: (item.productDiscount || 0) + (item.promoDiscount || 0)
        }));
      }
      // Ensure promoCodeDiscount is always a number
      ret.promoCodeDiscount = ret.promoCodeDiscount || 0;
      
      // Construct promoDetails from individual fields
      ret.promoDetails = {
        code: ret.promoDetailsCode,
        discountType: ret.promoDetailsDiscountType || 'FIXED',
        discountAmount: ret.promoDetailsDiscountAmount || 0,
        maxDiscountAmount: ret.promoDetailsMaxDiscountAmount
      };
      
      // Remove individual fields from response
      delete ret.promoDetailsCode;
      delete ret.promoDetailsDiscountType;
      delete ret.promoDetailsDiscountAmount;
      delete ret.promoDetailsMaxDiscountAmount;
      
      // Remove any 'discounte' field if it exists
      delete ret.discounte;
      return ret;
    }
  },
  toObject: { virtuals: true }
});

// Virtual for total savings
cartSchema.virtual('totalSavings').get(function() {
  return this.discount + this.promoCodeDiscount + this.comboOfferDiscount;
});

// Virtual for savings percentage
cartSchema.virtual('savingsPercentage').get(function() {
  if (this.totalPrice === 0) return 0;
  return ((this.totalSavings / this.totalPrice) * 100).toFixed(2);
});

// Helper function to calculate totals
async function calculateTotals(cart) {
  await cart.populate([
    {
      path: 'cartItems',
      populate: {
        path: 'product',
        select: '_id title price discountedPrice imageUrl'
      }
    },
    {
      path: 'promoCode',
      select: '_id code discountType discountAmount maxDiscountAmount'
    }
  ]);

  let totalPrice = 0;
  let baseDiscountedPrice = 0;
  let totalItems = 0;
  let productDiscount = 0;

  // Calculate product totals
  cart.cartItems.forEach(item => {
    if (item.product) {
      const quantity = item.quantity || 0;
      const price = item.product.price || 0;
      const discountedPrice = item.product.discountedPrice || price;

      totalPrice += price * quantity;
      baseDiscountedPrice += discountedPrice * quantity;
      totalItems += quantity;
      productDiscount += (price - discountedPrice) * quantity;
    }
  });

  // Calculate promo discount if applicable
  let promoDiscount = 0;
  let promoDetailsCode = null;
  let promoDetailsDiscountType = 'FIXED';
  let promoDetailsDiscountAmount = 0;
  let promoDetailsMaxDiscountAmount = null;

  if (cart.promoCode) {
    // Use the already populated promoCode
    const promoCode = cart.promoCode;
    if (promoCode) {
      promoDetailsCode = promoCode.code;
      promoDetailsDiscountType = 'FIXED'; // Always use 'FIXED' regardless of what's in the database
      promoDetailsDiscountAmount = promoCode.discountAmount || 0;
      promoDetailsMaxDiscountAmount = promoCode.maxDiscountAmount;

      // Calculate promo discount based on the discounted price (after product discounts)
      if (promoCode.discountType === 'PERCENTAGE') {
        promoDiscount = (baseDiscountedPrice * promoCode.discountAmount) / 100;
        if (promoCode.maxDiscountAmount && promoDiscount > promoCode.maxDiscountAmount) {
          promoDiscount = promoCode.maxDiscountAmount;
        }
      } else {
        promoDiscount = Math.min(promoCode.discountAmount, baseDiscountedPrice);
      }

      // Ensure promoDiscount doesn't exceed the baseDiscountedPrice
      promoDiscount = Math.min(promoDiscount, baseDiscountedPrice);
    }
  }

  const finalDiscountedPrice = Math.max(baseDiscountedPrice - promoDiscount, 0);

  return {
    totalPrice,
    totalDiscountedPrice: finalDiscountedPrice,
    discount: productDiscount,  // Product discount only
    totalItem: totalItems,
    promoCodeDiscount: promoDiscount,
    promoDetailsCode,
    promoDetailsDiscountType,
    promoDetailsDiscountAmount,
    promoDetailsMaxDiscountAmount
  };
}

// Pre-save middleware
cartSchema.pre('save', async function(next) {
  try {
    if (this.cartItems && this.cartItems.length > 0) {
      const totals = await calculateTotals(this);
      
      this.totalPrice = totals.totalPrice;
      this.totalDiscountedPrice = totals.totalDiscountedPrice;
      this.discount = totals.discount + totals.promoCodeDiscount; // Total discount includes both product and promo
      this.totalItem = totals.totalItem;
      this.promoCodeDiscount = totals.promoCodeDiscount;
      
      // Only update promo details if we have a promo code
      if (this.promoCode) {
        this.promoDetailsCode = totals.promoDetailsCode;
        this.promoDetailsDiscountType = totals.promoDetailsDiscountType;
        this.promoDetailsDiscountAmount = totals.promoDetailsDiscountAmount;
        this.promoDetailsMaxDiscountAmount = totals.promoDetailsMaxDiscountAmount;
      } else {
        // Reset promo code values if no promo code is applied
        this.promoCodeDiscount = 0;
        this.promoDetailsCode = null;
        this.promoDetailsDiscountType = 'FIXED';
        this.promoDetailsDiscountAmount = 0;
        this.promoDetailsMaxDiscountAmount = null;
      }
    } else {
      // Reset all values for empty cart
      this.totalPrice = 0;
      this.totalDiscountedPrice = 0;
      this.discount = 0;
      this.totalItem = 0;
      this.promoCode = undefined;
      this.promoCodeDiscount = 0;
      this.promoDetailsCode = null;
      this.promoDetailsDiscountType = 'FIXED';
      this.promoDetailsDiscountAmount = 0;
      this.promoDetailsMaxDiscountAmount = null;
    }
    next();
  } catch (error) {
    next(error);
  }
});

// Method to recalculate totals
cartSchema.methods.recalculateTotals = async function() {
  try {
    const totals = await calculateTotals(this);
    
    // Update cart with calculated totals
    this.totalPrice = totals.totalPrice;
    this.totalDiscountedPrice = totals.totalDiscountedPrice;
    this.discount = totals.discount + totals.promoCodeDiscount;
    this.totalItem = totals.totalItem;
    this.promoCodeDiscount = totals.promoCodeDiscount;
    
    // Ensure promoDetails has a valid discountType
    if (this.promoCode) {
      this.promoDetailsCode = totals.promoDetailsCode;
      this.promoDetailsDiscountType = totals.promoDetailsDiscountType;
      this.promoDetailsDiscountAmount = totals.promoDetailsDiscountAmount;
      this.promoDetailsMaxDiscountAmount = totals.promoDetailsMaxDiscountAmount;
    } else {
      this.promoDetailsCode = null;
      this.promoDetailsDiscountType = 'FIXED';
      this.promoDetailsDiscountAmount = 0;
      this.promoDetailsMaxDiscountAmount = null;
    }
    
    // Save with validation disabled
    await this.save({ validateBeforeSave: false });
    return this;
  } catch (error) {
    throw error;
  }
};

const Cart = mongoose.model('carts', cartSchema);

module.exports = Cart; 