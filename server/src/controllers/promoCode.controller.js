const PromoCode = require('../models/promoCode.model');
const Product = require('../models/product.model');
const Category = require('../models/category.model');

// Create a new promo code
exports.createPromoCode = async (req, res) => {
  try {
    const promoCode = new PromoCode(req.body);
    
    // Validate products if applicable
    if (promoCode.applicableOn === 'PRODUCT' && promoCode.applicableProducts) {
      const products = await Product.find({ _id: { $in: promoCode.applicableProducts } });
      if (products.length !== promoCode.applicableProducts.length) {
        return res.status(400).json({ message: 'One or more product IDs are invalid' });
      }
    }

    // Validate categories if applicable
    if (promoCode.applicableOn === 'CATEGORY' && promoCode.applicableCategories) {
      const categories = await Category.find({ _id: { $in: promoCode.applicableCategories } });
      if (categories.length !== promoCode.applicableCategories.length) {
        return res.status(400).json({ message: 'One or more category IDs are invalid' });
      }
    }

    await promoCode.save();
    res.status(201).json(promoCode);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get all promo codes
exports.getAllPromoCodes = async (req, res) => {
  try {
    const promoCodes = await PromoCode.find()
      .populate('applicableProducts', 'title')
      .populate('applicableCategories', 'name');
    res.json(promoCodes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get a single promo code
exports.getPromoCode = async (req, res) => {
  try {
    const promoCode = await PromoCode.findById(req.params.id)
      .populate('applicableProducts', 'title')
      .populate('applicableCategories', 'name');
    if (!promoCode) {
      return res.status(404).json({ message: 'Promo code not found' });
    }
    res.json(promoCode);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update a promo code
exports.updatePromoCode = async (req, res) => {
  try {
    const promoCode = await PromoCode.findById(req.params.id);
    if (!promoCode) {
      return res.status(404).json({ message: 'Promo code not found' });
    }

    // Validate products if applicable
    if (req.body.applicableOn === 'PRODUCT' && req.body.applicableProducts) {
      const products = await Product.find({ _id: { $in: req.body.applicableProducts } });
      if (products.length !== req.body.applicableProducts.length) {
        return res.status(400).json({ message: 'One or more product IDs are invalid' });
      }
    }

    // Validate categories if applicable
    if (req.body.applicableOn === 'CATEGORY' && req.body.applicableCategories) {
      const categories = await Category.find({ _id: { $in: req.body.applicableCategories } });
      if (categories.length !== req.body.applicableCategories.length) {
        return res.status(400).json({ message: 'One or more category IDs are invalid' });
      }
    }

    Object.assign(promoCode, req.body);
    await promoCode.save();
    res.json(promoCode);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete a promo code
exports.deletePromoCode = async (req, res) => {
  try {
    const promoCode = await PromoCode.findById(req.params.id);
    if (!promoCode) {
      return res.status(404).json({ message: 'Promo code not found' });
    }
    await promoCode.remove();
    res.json({ message: 'Promo code deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Validate a promo code
exports.validatePromoCode = async (req, res) => {
  try {
    const { code, productId, categoryId, orderAmount } = req.body;
    
    const promoCode = await PromoCode.findOne({ 
      code: code.toUpperCase(),
      isActive: true,
      validFrom: { $lte: new Date() },
      validUntil: { $gte: new Date() }
    });

    if (!promoCode) {
      return res.status(404).json({ message: 'Invalid or expired promo code' });
    }

    // Check usage limit
    if (promoCode.usageLimit !== null && promoCode.usageCount >= promoCode.usageLimit) {
      return res.status(400).json({ message: 'Promo code usage limit exceeded' });
    }

    // Check minimum order amount
    if (orderAmount < promoCode.minOrderAmount) {
      return res.status(400).json({ 
        message: `Minimum order amount of ${promoCode.minOrderAmount} required`
      });
    }

    // Validate based on applicability
    if (promoCode.applicableOn === 'PRODUCT' && productId) {
      if (!promoCode.applicableProducts.includes(productId)) {
        return res.status(400).json({ message: 'Promo code not applicable for this product' });
      }
    } else if (promoCode.applicableOn === 'CATEGORY' && categoryId) {
      if (!promoCode.applicableCategories.includes(categoryId)) {
        return res.status(400).json({ message: 'Promo code not applicable for this category' });
      }
    }

    // Calculate discount
    let discount = 0;
    if (promoCode.discountType === 'FIXED') {
      discount = promoCode.discountAmount;
    } else {
      discount = (orderAmount * promoCode.discountAmount) / 100;
      if (promoCode.maxDiscountAmount) {
        discount = Math.min(discount, promoCode.maxDiscountAmount);
      }
    }

    res.json({
      valid: true,
      discount,
      promoCode
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}; 