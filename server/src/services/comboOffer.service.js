const ComboOffer = require('../models/comboOffer.model');
const Product = require('../models/product.model');

// Create a new combo offer
async function createComboOffer(offerData) {
  try {
    // Check if combo offer already exists for this category
    const existingOffer = await ComboOffer.findOne({ category: offerData.category });
    if (existingOffer) {
      throw new Error('Combo offer already exists for this category');
    }

    const comboOffer = new ComboOffer(offerData);
    const savedOffer = await comboOffer.save();
    
    return await ComboOffer.findById(savedOffer._id).populate('category', 'name level');
  } catch (error) {
    throw error;
  }
}

// Get all combo offers
async function getAllComboOffers() {
  try {
    return await ComboOffer.find()
      .populate('category', 'name level')
      .populate('createdBy', 'firstName lastName')
      .sort({ createdAt: -1 });
  } catch (error) {
    throw error;
  }
}

// Get combo offer by ID
async function getComboOfferById(offerId) {
  try {
    const offer = await ComboOffer.findById(offerId)
      .populate('category', 'name level')
      .populate('createdBy', 'firstName lastName');
    
    return offer;
  } catch (error) {
    throw error;
  }
}

// Get combo offer by category
async function getComboOfferByCategory(categoryId) {
  try {
    const offer = await ComboOffer.findOne({ 
      category: categoryId, 
      isActive: true 
    }).populate('category', 'name level');
    
    return offer && offer.isCurrentlyValid() ? offer : null;
  } catch (error) {
    throw error;
  }
}

// Update combo offer
async function updateComboOffer(offerId, updateData) {
  try {
    const updatedOffer = await ComboOffer.findByIdAndUpdate(
      offerId, 
      updateData, 
      { new: true, runValidators: true }
    ).populate('category', 'name level');
    
    if (!updatedOffer) {
      throw new Error('Combo offer not found');
    }
    
    return updatedOffer;
  } catch (error) {
    throw error;
  }
}

// Delete combo offer
async function deleteComboOffer(offerId) {
  try {
    const deletedOffer = await ComboOffer.findByIdAndDelete(offerId);
    if (!deletedOffer) {
      throw new Error('Combo offer not found');
    }
    return deletedOffer;
  } catch (error) {
    throw error;
  }
}

// Apply combo offers to cart items
async function applyComboOffersToCart(cartItems) {
  try {
    if (!cartItems || cartItems.length === 0) {
      return {
        items: [],
        totalComboDiscount: 0,
        appliedOffers: []
      };
    }

    // Group cart items by category
    const itemsByCategory = {};
    
    for (const item of cartItems) {
      // Handle both populated and non-populated category objects
      const categoryId = item.product.category?._id ? 
        item.product.category._id.toString() : 
        item.product.category.toString();
      
      if (!itemsByCategory[categoryId]) {
        itemsByCategory[categoryId] = {
          categoryId,
          categoryName: '',
          items: [],
          totalQuantity: 0
        };
      }
      
      itemsByCategory[categoryId].items.push(item);
      itemsByCategory[categoryId].totalQuantity += item.quantity;
      
      // Set category name from first item
      if (item.product.category.name) {
        itemsByCategory[categoryId].categoryName = item.product.category.name;
      } else if (item.product.category._id) {
        // If category is populated, try to get name from the populated object
        itemsByCategory[categoryId].categoryName = item.product.category.name || 'Unknown Category';
      }
    }

    let totalComboDiscount = 0;
    const appliedOffers = [];
    const processedItems = [];

    // Check each category for combo offers
    for (const [categoryId, categoryData] of Object.entries(itemsByCategory)) {
      const comboOffer = await getComboOfferByCategory(categoryId);
      
      if (comboOffer && categoryData.totalQuantity >= comboOffer.minimumQuantity) {
        // Apply combo pricing
        const perUnitComboPrice = comboOffer.comboPrice / comboOffer.minimumQuantity;
        
        for (const item of categoryData.items) {
          const originalItemTotal = item.discountedPrice * item.quantity;
          const comboItemTotal = perUnitComboPrice * item.quantity;
          const itemComboDiscount = Math.max(0, originalItemTotal - comboItemTotal);
          
          processedItems.push({
            ...item,
            originalPrice: item.discountedPrice,
            comboPrice: perUnitComboPrice,
            comboTotal: comboItemTotal,
            comboDiscount: itemComboDiscount,
            hasComboOffer: true,
            comboOfferName: comboOffer.name
          });
          
          totalComboDiscount += itemComboDiscount;
        }
        
        appliedOffers.push({
          categoryId,
          categoryName: categoryData.categoryName,
          offerName: comboOffer.name,
          totalQuantity: categoryData.totalQuantity,
          perUnitPrice: perUnitComboPrice,
          totalDiscount: categoryData.items.reduce((sum, item) => {
            const originalTotal = item.discountedPrice * item.quantity;
            const comboTotal = perUnitComboPrice * item.quantity;
            return sum + Math.max(0, originalTotal - comboTotal);
          }, 0)
        });
      } else {
        // No combo offer applicable, keep original prices
        for (const item of categoryData.items) {
          processedItems.push({
            ...item,
            originalPrice: item.discountedPrice,
            comboPrice: item.discountedPrice,
            comboTotal: item.discountedPrice * item.quantity,
            comboDiscount: 0,
            hasComboOffer: false
          });
        }
      }
    }

    return {
      items: processedItems,
      totalComboDiscount,
      appliedOffers
    };
  } catch (error) {
    throw error;
  }
}

// Get combo pricing for a single category
async function getComboPricingForCategory(categoryId, quantity) {
  try {
    const comboOffer = await getComboOfferByCategory(categoryId);
    
    if (!comboOffer || quantity < comboOffer.minimumQuantity) {
      return null;
    }
    
    return {
      isEligible: true,
      perUnitPrice: comboOffer.comboPrice / comboOffer.minimumQuantity,
      totalPrice: comboOffer.calculateComboTotal(quantity),
      offerName: comboOffer.name,
      minimumQuantity: comboOffer.minimumQuantity
    };
  } catch (error) {
    throw error;
  }
}

module.exports = {
  createComboOffer,
  getAllComboOffers,
  getComboOfferById,
  getComboOfferByCategory,
  updateComboOffer,
  deleteComboOffer,
  applyComboOffersToCart,
  getComboPricingForCategory
}; 