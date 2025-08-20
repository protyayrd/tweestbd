import api from '../config/api';

class ComboOfferService {
  // Get combo offers for specific categories
  async getComboOffersByCategories(categoryIds) {
    console.log('🔍 [ComboOfferService] getComboOffersByCategories called with:', categoryIds);
    
    try {
      const promises = categoryIds.map(categoryId => {
        console.log(`📡 [ComboOfferService] Making API call for category: ${categoryId}`);
        return api.get(`/api/combo-offers/category/${categoryId}`);
      });
      
      console.log('📡 [ComboOfferService] Waiting for all API calls to complete...');
      const responses = await Promise.allSettled(promises);
      console.log('📡 [ComboOfferService] All API calls completed:', responses);
      
      const comboOffers = [];
      
      responses.forEach((response, index) => {
        const categoryId = categoryIds[index];
        console.log(`🔍 [ComboOfferService] Processing response for category ${categoryId}:`, response);
        
        if (response.status === 'fulfilled') {
          console.log(`✅ [ComboOfferService] API call succeeded for category ${categoryId}:`, response.value.data);
          
          if (response.value.data.success) {
            console.log(`🎉 [ComboOfferService] Found combo offer for category ${categoryId}:`, response.value.data.data);
            comboOffers.push({
              categoryId: categoryId,
              offer: response.value.data.data
            });
          } else {
            console.log(`ℹ️ [ComboOfferService] No combo offer for category ${categoryId}:`, response.value.data.message);
          }
        } else {
          console.log(`❌ [ComboOfferService] API call failed for category ${categoryId}:`, response.reason);
        }
      });
      
      console.log('✅ [ComboOfferService] Final combo offers collected:', comboOffers);
      return comboOffers;
    } catch (error) {
      console.error('❌ [ComboOfferService] Error fetching combo offers:', error);
      console.error('❌ [ComboOfferService] Error stack:', error.stack);
      return [];
    }
  }

  // Apply combo offers to cart items
  applyComboOffersToCart(cartItems, comboOffers) {
    console.log('⚙️ [ComboOfferService] applyComboOffersToCart called');
    console.log('⚙️ [ComboOfferService] Cart items:', cartItems);
    console.log('⚙️ [ComboOfferService] Combo offers:', comboOffers);
    
    if (!cartItems || cartItems.length === 0) {
      console.log('❌ [ComboOfferService] No cart items provided');
      return {
        updatedCartItems: [],
        comboOfferDiscounts: [],
        totalComboDiscount: 0,
        appliedOffers: []
      };
    }
    
    if (!comboOffers || comboOffers.length === 0) {
      console.log('ℹ️ [ComboOfferService] No combo offers available');
      return {
        updatedCartItems: cartItems,
        comboOfferDiscounts: [],
        totalComboDiscount: 0,
        appliedOffers: []
      };
    }

    // Group cart items by category
    console.log('📊 [ComboOfferService] Grouping cart items by category...');
    const itemsByCategory = {};
    cartItems.forEach((item, index) => {
      const categoryId = item.product?.category?._id;
      console.log(`📊 [ComboOfferService] Item ${index + 1} (${item.product?.title}) - Category ID: ${categoryId}`);
      
      if (categoryId) {
        if (!itemsByCategory[categoryId]) {
          itemsByCategory[categoryId] = [];
          console.log(`📊 [ComboOfferService] Created new category group for: ${categoryId}`);
        }
        itemsByCategory[categoryId].push(item);
        console.log(`📊 [ComboOfferService] Added item to category ${categoryId}, total items in category: ${itemsByCategory[categoryId].length}`);
      } else {
        console.log(`⚠️ [ComboOfferService] Item ${item.product?.title} has no category ID`);
      }
    });
    
    console.log('📊 [ComboOfferService] Final items by category:', Object.keys(itemsByCategory).map(categoryId => ({
      categoryId,
      itemCount: itemsByCategory[categoryId].length,
      items: itemsByCategory[categoryId].map(item => item.product?.title)
    })));

    let totalComboDiscount = 0;
    const appliedOffers = [];
    const updatedCartItems = [...cartItems];
    const comboOfferDiscounts = [];

    // Check each category for applicable combo offers
    console.log('🔍 [ComboOfferService] Checking each category for applicable combo offers...');
    Object.keys(itemsByCategory).forEach(categoryId => {
      const categoryItems = itemsByCategory[categoryId];
      const comboOffer = comboOffers.find(offer => offer.categoryId === categoryId);
      
      console.log(`🔍 [ComboOfferService] Processing category ${categoryId}:`);
      console.log(`🔍 [ComboOfferService] - Category items count: ${categoryItems.length}`);
      console.log(`🔍 [ComboOfferService] - Combo offer found: ${!!comboOffer}`);
      
      if (comboOffer && comboOffer.offer) {
        const offer = comboOffer.offer;
        const totalQuantity = categoryItems.reduce((sum, item) => sum + (item.quantity || 0), 0);
        
        console.log(`🔍 [ComboOfferService] - Offer details:`, {
          name: offer.name,
          minimumQuantity: offer.minimumQuantity,
          comboPrice: offer.comboPrice,
          isActive: offer.isActive
        });
        console.log(`🔍 [ComboOfferService] - Total quantity in category: ${totalQuantity}`);
        
        // Check if eligible for combo offer
        if (totalQuantity >= offer.minimumQuantity && offer.isActive) {
          console.log(`✅ [ComboOfferService] - Category ${categoryId} is eligible for combo offer!`);
          const perUnitComboPrice = offer.comboPrice / offer.minimumQuantity;
          console.log(`🔍 [ComboOfferService] - Per unit combo price: ${perUnitComboPrice}`);
          
          // Calculate discount for each item in this category
          categoryItems.forEach(item => {
            const originalItemTotal = (item.product?.discountedPrice || item.product?.price || 0) * (item.quantity || 0);
            const comboItemTotal = perUnitComboPrice * (item.quantity || 0);
            const itemComboDiscount = Math.max(0, originalItemTotal - comboItemTotal);
            
            // Always apply combo offer to eligible items in this category
            // Find and update the item in updatedCartItems
            const itemIndex = updatedCartItems.findIndex(cartItem => {
              // For guest items (no _id), match by productId, size, and color
              if (!cartItem._id && !item._id) {
                return cartItem.productId === item.productId && 
                       cartItem.size === item.size && 
                       cartItem.color === item.color;
              }
              // For items with _id, match by _id
              return cartItem._id === item._id;
            });
            
            console.log(`🔍 [ComboOfferService] Looking for item: ${item.product?.title} (productId: ${item.productId}, size: ${item.size}, color: ${item.color})`);
            console.log(`🔍 [ComboOfferService] Found item at index: ${itemIndex}`);
            
            if (itemIndex !== -1) {
              updatedCartItems[itemIndex] = {
                ...updatedCartItems[itemIndex],
                hasComboOffer: true,
                comboOfferName: offer.name,
                comboOfferDiscount: itemComboDiscount,
                comboPerUnitPrice: perUnitComboPrice,
                finalPriceAfterCombo: comboItemTotal
              };
              console.log(`✅ [ComboOfferService] Updated cart item ${itemIndex + 1} with combo offer`);
            } else {
              console.log(`❌ [ComboOfferService] Could not find cart item to update`);
            }
            
            if (itemComboDiscount > 0) {
              totalComboDiscount += itemComboDiscount;
            }
          });
          
          // Track the applied offer
          appliedOffers.push({
            categoryId,
            offerName: offer.name,
            minimumQuantity: offer.minimumQuantity,
            comboPrice: offer.comboPrice,
            appliedQuantity: totalQuantity,
            totalDiscount: categoryItems.reduce((sum, item) => {
              const originalItemTotal = (item.product?.discountedPrice || item.product?.price || 0) * (item.quantity || 0);
              const comboItemTotal = perUnitComboPrice * (item.quantity || 0);
              return sum + Math.max(0, originalItemTotal - comboItemTotal);
            }, 0)
          });
          
          // Add to combo offer discounts
          comboOfferDiscounts.push({
            categoryId,
            categoryName: categoryItems[0]?.product?.category?.name || 'Unknown Category',
            offerName: offer.name,
            totalQuantity,
            minimumQuantity: offer.minimumQuantity,
            perUnitComboPrice,
            totalDiscount: appliedOffers[appliedOffers.length - 1].totalDiscount
          });
        } else {
          console.log(`❌ [ComboOfferService] - Category ${categoryId} is NOT eligible for combo offer:`);
          if (totalQuantity < offer.minimumQuantity) {
            console.log(`❌ [ComboOfferService] - Reason: Quantity ${totalQuantity} < minimum ${offer.minimumQuantity}`);
          }
          if (!offer.isActive) {
            console.log(`❌ [ComboOfferService] - Reason: Offer is not active`);
          }
        }
      } else {
        console.log(`ℹ️ [ComboOfferService] - No combo offer available for category ${categoryId}`);
      }
    });

    const result = {
      updatedCartItems,
      comboOfferDiscounts,
      totalComboDiscount,
      appliedOffers
    };
    
    console.log('✅ [ComboOfferService] Combo offer application complete:');
    console.log('✅ [ComboOfferService] - Total combo discount:', totalComboDiscount);
    console.log('✅ [ComboOfferService] - Applied offers count:', appliedOffers.length);
    console.log('✅ [ComboOfferService] - Updated cart items count:', updatedCartItems.length);
    console.log('✅ [ComboOfferService] - Items with combo offers:', updatedCartItems.filter(item => item.hasComboOffer).length);
    
    return result;
  }

  // Check if cart items qualify for any combo offers
  async checkComboOfferEligibility(cartItems) {
    if (!cartItems || cartItems.length === 0) {
      return [];
    }

    // Get unique category IDs
    const categoryIds = [...new Set(
      cartItems
        .map(item => item.product?.category?._id)
        .filter(Boolean)
    )];

    if (categoryIds.length === 0) {
      return [];
    }

    // Get combo offers for these categories
    const comboOffers = await this.getComboOffersByCategories(categoryIds);
    
    // Apply combo offers and return the result
    return this.applyComboOffersToCart(cartItems, comboOffers);
  }

  // Format currency for display
  formatCurrency(amount) {
    return `৳${Number(amount).toFixed(2)}`;
  }

  // Calculate potential savings if user adds more items
  calculatePotentialSavings(cartItems, comboOffers) {
    const potentialSavings = [];
    
    // Group cart items by category
    const itemsByCategory = {};
    cartItems.forEach(item => {
      const categoryId = item.product?.category?._id;
      if (categoryId) {
        if (!itemsByCategory[categoryId]) {
          itemsByCategory[categoryId] = [];
        }
        itemsByCategory[categoryId].push(item);
      }
    });

    // Check each category for potential savings
    Object.keys(itemsByCategory).forEach(categoryId => {
      const categoryItems = itemsByCategory[categoryId];
      const comboOffer = comboOffers.find(offer => offer.categoryId === categoryId);
      
      if (comboOffer && comboOffer.offer) {
        const offer = comboOffer.offer;
        const currentQuantity = categoryItems.reduce((sum, item) => sum + (item.quantity || 0), 0);
        
        // If not yet eligible, calculate potential savings
        if (currentQuantity < offer.minimumQuantity && offer.isActive) {
          const itemsNeeded = offer.minimumQuantity - currentQuantity;
          const averageItemPrice = categoryItems.reduce((sum, item) => 
            sum + (item.product?.discountedPrice || item.product?.price || 0), 0
          ) / categoryItems.length;
          
          const perUnitComboPrice = offer.comboPrice / offer.minimumQuantity;
          const savingsPerItem = Math.max(0, averageItemPrice - perUnitComboPrice);
          const totalPotentialSavings = savingsPerItem * offer.minimumQuantity;
          
          if (totalPotentialSavings > 0) {
            potentialSavings.push({
              categoryId,
              categoryName: categoryItems[0]?.product?.category?.name || 'Unknown Category',
              offerName: offer.name,
              currentQuantity,
              minimumQuantity: offer.minimumQuantity,
              itemsNeeded,
              averageItemPrice,
              perUnitComboPrice,
              savingsPerItem,
              totalPotentialSavings
            });
          }
        }
      }
    });

    return potentialSavings;
  }
}

export default new ComboOfferService(); 