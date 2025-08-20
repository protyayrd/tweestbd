const Cart = require("../models/cart.model.js");
const CartItem = require("../models/cartItem.model.js");
const Product = require("../models/product.model.js");
const comboOfferService = require("../services/comboOffer.service.js");
const mongoose = require('mongoose');

// Create a new cart for a user
async function createCart(userId) {
    try {
        if (!userId) {
            throw new Error("User ID is required");
        }

        console.log("Checking for existing cart for user:", userId);
        
        // First check if cart already exists
        const existingCart = await Cart.findOne({ user: userId });
        if (existingCart) {
            console.log("Cart already exists for user:", userId);
            return existingCart;
        }
        
        console.log("Creating new cart for user:", userId);
        
        // Create a new cart with properly initialized promoDetails
        const cart = new Cart({ 
            user: userId,
            cartItems: [],
            totalPrice: 0,
            totalDiscountedPrice: 0,
            discount: 0,
            totalItem: 0,
            promoCodeDiscount: 0
        });
        
        // Explicitly set promoDetails to avoid schema validation issues
        cart.set('promoDetails', {
            code: undefined,
            discountType: 'FIXED',
            discountAmount: 0,
            maxDiscountAmount: undefined
        });
        
        // Save with validation disabled to avoid enum validation errors
        const createdCart = await cart.save({ validateBeforeSave: false });
        console.log("Created cart:", createdCart);
        return createdCart;
    } catch (error) {
        console.error("Error creating cart:", error);
        throw new Error("Failed to create cart: " + error.message);
    }
}

// Find a user's cart and update cart details
async function findUserCart(userId) {
    try {
        const cart = await Cart.findOne({ user: userId })
            .populate({
                path: 'cartItems',
                populate: {
                    path: 'product',
                    model: 'products',
                    select: 'title price discountedPrice discountPersent colors description imageUrl category',
                    populate: {
                        path: 'category',
                        model: 'categories',
                        select: 'name _id level parentCategory'
                    }
                }
            })
            .populate('promoCode')
            .lean();

        if (!cart) {
            console.log('Cart not found for user:', userId, 'Creating a new cart');
            await createCart(userId);
            
            // Return empty cart structure
            return {
                cartItems: [],
                totalPrice: 0,
                totalDiscountedPrice: 0,
                discount: 0,
                totalItem: 0,
                promoCodeDiscount: 0,
                promoDetails: {
                    code: undefined,
                    discountType: 'FIXED',
                    discountAmount: 0,
                    maxDiscountAmount: undefined
                }
            };
        }

        // Get all product IDs from cart items
        const productIds = cart.cartItems.map(item => item.product._id);

        // Fetch complete product data for all products in cart
        const products = await Product.find({ _id: { $in: productIds } })
            .populate('category', 'name _id level parentCategory')
            .lean();

        // Create a map of product data by ID
        const productMap = products.reduce((map, product) => {
            map[product._id.toString()] = product;
            return map;
        }, {});

        let totalOriginalPrice = 0;
        let totalBaseDiscountedPrice = 0;
        let totalPromoDiscount = 0;
        let promoDetails = null;

        // Calculate base totals first
        cart.cartItems.forEach(item => {
            const originalPrice = item.product.price || 0;
            const baseDiscountedPrice = item.product.discountedPrice || originalPrice;
            const quantity = item.quantity || 0;

            totalOriginalPrice += originalPrice * quantity;
            totalBaseDiscountedPrice += baseDiscountedPrice * quantity;
        });

        // Handle promo code if exists and is valid
        if (cart.promoCode) {
            const now = new Date();
            const isValid = cart.promoCode.isActive && 
                          cart.promoCode.validFrom <= now && 
                          cart.promoCode.validUntil >= now &&
                          (cart.promoCode.usageLimit === null || cart.promoCode.usageCount < cart.promoCode.usageLimit);

            if (isValid && totalBaseDiscountedPrice >= (cart.promoCode.minOrderAmount || 0)) {
                promoDetails = {
                    code: cart.promoCode.code,
                    discountType: cart.promoCode.discountType,
                    discountAmount: cart.promoCode.discountAmount,
                    maxDiscountAmount: cart.promoCode.maxDiscountAmount
                };

                // Calculate promo discount
                if (cart.promoCode.discountType === 'PERCENTAGE') {
                    totalPromoDiscount = (totalBaseDiscountedPrice * cart.promoCode.discountAmount) / 100;
                    if (cart.promoCode.maxDiscountAmount) {
                        totalPromoDiscount = Math.min(totalPromoDiscount, cart.promoCode.maxDiscountAmount);
                    }
                } else {
                    totalPromoDiscount = Math.min(cart.promoCode.discountAmount, totalBaseDiscountedPrice);
                }
            } else {
                // If promo code is invalid, remove it from cart
                await Cart.findByIdAndUpdate(cart._id, {
                    $unset: { promoCode: 1 },
                    promoCodeDiscount: 0,
                    promoDetails: null
                });
            }
        }

        // Calculate final totals
        const productDiscount = totalOriginalPrice - totalBaseDiscountedPrice;

        // Apply combo offers
        let comboOfferDiscount = 0;
        let appliedComboOffers = [];
        let finalCartItems = [];

        try {
            // Ensure all cart items have properly populated product data with categories
            const cartItemsWithCategories = cart.cartItems.map(item => ({
                ...item,
                product: {
                    ...item.product,
                    category: productMap[item.product._id.toString()]?.category || item.product.category
                }
            }));
            
            console.log('🔍 [Backend Cart Service] Cart items with categories for combo offers:', cartItemsWithCategories.map(item => ({
                productId: item.product._id,
                categoryId: item.product.category?._id,
                categoryName: item.product.category?.name,
                hasCategory: !!item.product.category
            })));
            
            const comboResult = await comboOfferService.applyComboOffersToCart(cartItemsWithCategories);
            
            comboOfferDiscount = comboResult.totalComboDiscount;
            appliedComboOffers = comboResult.appliedOffers;
            finalCartItems = comboResult.updatedCartItems || comboResult.items || cartItemsWithCategories;
            
            console.log('Combo offers applied. Discount:', comboOfferDiscount, 'Applied offers:', appliedComboOffers.length);
        } catch (error) {
            console.error('Error applying combo offers:', error);
            // If combo offer fails, continue with original items but ensure they have categories
            finalCartItems = cart.cartItems.map(item => ({
                ...item,
                product: {
                    ...item.product,
                    category: productMap[item.product._id.toString()]?.category || item.product.category
                }
            }));
        }

        // Calculate final total after all discounts
        const afterComboTotal = Math.max(totalBaseDiscountedPrice - comboOfferDiscount, 0);
        const finalTotal = Math.max(afterComboTotal - totalPromoDiscount, 0);

        // Transform cart items with all discount distributions
        const cartItems = await Promise.all(finalCartItems.map(async (item) => {
            const cartItem = item;
            const originalPrice = item.product.price || 0;
            const baseDiscountedPrice = item.product.discountedPrice || originalPrice;
            const quantity = item.quantity || 0;
            
            // Get combo pricing if available
            const comboPrice = item.comboPrice || baseDiscountedPrice;
            const comboDiscount = item.comboDiscount || 0;
            const itemComboTotal = comboPrice * quantity;
            
            // Calculate item's share of promo discount based on post-combo price
            const itemPromoDiscount = totalPromoDiscount > 0 && afterComboTotal > 0
                ? (itemComboTotal / afterComboTotal) * totalPromoDiscount 
                : 0;

            const productDiscount = (originalPrice - baseDiscountedPrice) * quantity;
            const finalDiscountedPrice = itemComboTotal - itemPromoDiscount;

            // Get complete product data from the map
            const completeProduct = productMap[item.product._id.toString()];

            // Find the selected color's images
            let selectedColorImages = [];
            if (completeProduct?.colors && Array.isArray(completeProduct.colors)) {
                const selectedColor = completeProduct.colors.find(c => c && c.name === item.color);
                if (selectedColor && selectedColor.images) {
                    selectedColorImages = selectedColor.images;
                }
            }

            return {
                ...cartItem,
                cart: {
                    promoCodeDiscount: itemPromoDiscount,
                    comboOfferDiscount: comboDiscount,
                    appliedComboOffers,
                    promoDetails
                },
                product: {
                    ...completeProduct,
                    colors: completeProduct?.colors || [],
                    selectedColorImages: selectedColorImages,
                    imageUrl: completeProduct?.imageUrl,
                    category: completeProduct?.category || item.product?.category
                },
                quantity,
                totalPrice: originalPrice * quantity,
                totalDiscountedPrice: finalDiscountedPrice,
                productDiscount,
                comboDiscount,
                promoDiscount: itemPromoDiscount,
                totalDiscount: productDiscount + comboDiscount + itemPromoDiscount,
                hasComboOffer: item.hasComboOffer || false,
                comboOfferName: item.comboOfferName || null,
                originalUnitPrice: originalPrice,
                comboUnitPrice: comboPrice
            };
        }));

        return {
            cartItems,
            totalPrice: totalOriginalPrice,
            totalDiscountedPrice: finalTotal,
            discount: productDiscount + comboOfferDiscount + totalPromoDiscount,
            totalItem: cart.cartItems.length,
            promoCode: cart.promoCode,
            promoCodeDiscount: totalPromoDiscount,
            comboOfferDiscount,
            appliedComboOffers,
            promoDetails
        };
    } catch (error) {
        console.error("Error finding/updating cart:", error);
        throw new Error("Failed to get user cart: " + error.message);
    }
}

// Add an item to the user's cart
async function addCartItem(userId, cartItemData) {
    try {
        if (!userId || !cartItemData || !cartItemData.productId || !cartItemData.size || !cartItemData.color) {
            console.log("Validation failed. Received data:", {
                userId,
                productId: cartItemData?.productId,
                size: cartItemData?.size,
                color: cartItemData?.color
            });
            throw new Error("Missing required fields: userId, productId, size, and color are required");
        }

        // Ensure color is a string and not empty
        if (!cartItemData.color || typeof cartItemData.color !== 'string' || !cartItemData.color.trim()) {
            throw new Error("Color must be a non-empty string");
        }
        cartItemData.color = cartItemData.color.trim();

        console.log("Adding item to cart with data:", {
            userId,
            productId: cartItemData.productId,
            size: cartItemData.size,
            color: cartItemData.color,
            quantity: cartItemData.quantity
        });
        
        // Find or create cart
        let cart = await Cart.findOne({ user: userId });
        if (!cart) {
            console.log("No cart found, creating new cart for user:", userId);
            cart = await createCart(userId);
            console.log("New cart created:", cart._id);
        }

        // Find product and validate color
        const product = await Product.findById(cartItemData.productId);
        if (!product) {
            throw new Error("Product not found");
        }
        console.log("Found product:", product._id);

        // Validate that the color exists in the product's colors
        // Make sure product.colors exists and is an array before calling .some()
        if (!product.colors || !Array.isArray(product.colors)) {
            console.error("Product has no colors defined:", product._id);
            throw new Error("Product has no colors defined");
        }
        
        const validColor = product.colors.some(c => c && c.name === cartItemData.color);
        if (!validColor) {
            console.error("Invalid color. Available colors:", product.colors.map(c => c && c.name).filter(Boolean));
            throw new Error(`Invalid color. Available colors: ${product.colors.map(c => c && c.name).filter(Boolean).join(', ')}`);
        }
        console.log("Color validation passed:", cartItemData.color);

        // Check if item already exists in cart with same size and color
        const query = {
            cart: cart._id,
            product: product._id,
            size: cartItemData.size,
            color: cartItemData.color,
            userId: userId
        };
        console.log("Searching for existing cart item with query:", JSON.stringify(query, null, 2));
        
        let cartItem = await CartItem.findOne(query);
        console.log("Existing cart item search result:", cartItem ? {
            _id: cartItem._id,
            size: cartItem.size,
            color: cartItem.color,
            quantity: cartItem.quantity
        } : "No existing item found");

        if (cartItem) {
            // Update existing cart item
            console.log("Updating existing cart item. Current state:", {
                _id: cartItem._id,
                size: cartItem.size,
                color: cartItem.color,
                quantity: cartItem.quantity
            });
            
            const oldQuantity = cartItem.quantity;
            cartItem.quantity = (cartItemData.quantity || 1) + (oldQuantity || 0);
            cartItem.color = cartItemData.color; // Ensure color is updated
            
            console.log("Saving updated cart item:", {
                _id: cartItem._id,
                size: cartItem.size,
                color: cartItem.color,
                quantity: cartItem.quantity,
                oldQuantity,
                newQuantity: cartItem.quantity
            });
            
            const savedCartItem = await cartItem.save();
            console.log("Cart item updated successfully:", {
                _id: savedCartItem._id,
                size: savedCartItem.size,
                color: savedCartItem.color,
                quantity: savedCartItem.quantity
            });
        } else {
            // Create new cart item with discounted price if provided
            const newCartItemData = {
                cart: cart._id,
                product: product._id,
                size: cartItemData.size,
                color: cartItemData.color,
                quantity: cartItemData.quantity || 1,
                userId: userId,
                price: product.price,
                discountedPrice: product.discountedPrice || product.price
            };
            console.log("Creating new cart item with data:", JSON.stringify(newCartItemData, null, 2));
            
            cartItem = new CartItem(newCartItemData);
            
            console.log("New cart item instance created:", {
                _id: cartItem._id,
                size: cartItem.size,
                color: cartItem.color,
                quantity: cartItem.quantity,
                discountedPrice: cartItem.discountedPrice
            });
            
            const savedCartItem = await cartItem.save();
            console.log("New cart item saved successfully:", {
                _id: savedCartItem._id,
                size: savedCartItem.size,
                color: savedCartItem.color,
                quantity: savedCartItem.quantity,
                discountedPrice: savedCartItem.discountedPrice
            });
            
            console.log("Adding cart item to cart's items array. Current cart items:", cart.cartItems);
            cart.cartItems.push(savedCartItem._id);
        }

        // Set default promoDetails if no promo code exists
        cart.promoDetails = {
            code: undefined,
            discountType: 'FIXED', // Use a valid enum value instead of null or undefined
            discountAmount: 0,
            maxDiscountAmount: undefined
        };
        
        // Save cart with validation disabled to avoid enum validation errors
        await cart.save({ validateBeforeSave: false });
        
        // Recalculate totals
        await cart.recalculateTotals();

        // Return updated cart with populated items
        const updatedCart = await findUserCart(userId);
        
        // Ensure promoDetails has valid values before returning
        if (!updatedCart.promoDetails || updatedCart.promoDetails.discountType === null) {
            updatedCart.promoDetails = {
                code: undefined,
                discountType: 'FIXED',
                discountAmount: 0,
                maxDiscountAmount: undefined
            };
        }
        
        return updatedCart;
    } catch (error) {
        console.error("Error adding item to cart:", error);
        throw new Error("Failed to add item to cart: " + error.message);
    }
}

// Remove an item from the cart
async function removeCartItem(userId, cartItemId) {
    try {
        if (!userId || !cartItemId) {
            throw new Error("User ID and cart item ID are required");
        }

        console.log("Removing item from cart. User:", userId, "Item:", cartItemId);
        
        // Find cart and item
        const cart = await Cart.findOne({ user: userId });
        if (!cart) {
            throw new Error("Cart not found");
        }

        const cartItem = await CartItem.findById(cartItemId);
        if (!cartItem) {
            throw new Error("Cart item not found");
        }

        // Verify ownership
        if (cartItem.userId.toString() !== userId.toString()) {
            throw new Error("Unauthorized: This cart item does not belong to the user");
        }

        // Remove item from cart
        cart.cartItems = cart.cartItems.filter(item => item.toString() !== cartItemId);
        await cart.save();

        // Delete cart item
        await CartItem.findByIdAndDelete(cartItemId);
        
        // Return updated cart
        return await findUserCart(userId);
    } catch (error) {
        console.error("Error removing cart item:", error);
        throw new Error("Failed to remove item from cart: " + error.message);
    }
}

// Update cart item quantity
async function updateCartItem(userId, cartItemId, data) {
    try {
        if (!userId || !cartItemId || !data || typeof data.quantity !== 'number') {
            throw new Error("User ID, cart item ID, and quantity are required");
        }

        if (data.quantity < 1) {
            throw new Error("Quantity must be at least 1");
        }

        console.log("Updating cart item. User:", userId, "Item:", cartItemId, "Data:", data);
        
        // Find cart and item with populated fields
        const cart = await Cart.findOne({ user: userId })
            .populate([
                {
                    path: 'cartItems',
                    populate: {
                        path: 'product',
                        select: '_id title price discountedPrice'
                    }
                },
                {
                    path: 'promoCode',
                    select: '_id code discountType discountAmount maxDiscountAmount'
                }
            ]);
        
        if (!cart) {
            throw new Error("Cart not found");
        }

        const cartItem = await CartItem.findById(cartItemId).populate('product');
        if (!cartItem) {
            throw new Error("Cart item not found");
        }

        // Verify ownership
        if (cartItem.userId.toString() !== userId.toString()) {
            throw new Error("Unauthorized: This cart item does not belong to the user");
        }

        // Store existing promo code details
        const existingPromoCode = cart.promoCode;

        // Update quantity and save cart item
        cartItem.quantity = data.quantity;
        await cartItem.save();

        // Calculate base total (after product discounts, before promo)
        let baseTotal = 0;
        for (const item of cart.cartItems) {
            const itemQuantity = item._id.equals(cartItemId) ? data.quantity : item.quantity;
            const itemPrice = item.product.discountedPrice || item.product.price;
            baseTotal += itemPrice * itemQuantity;
        }

        // If there was a promo code, recalculate the discount
        if (existingPromoCode) {
            let promoDiscount = 0;
            if (existingPromoCode.discountType === 'PERCENTAGE') {
                promoDiscount = (baseTotal * existingPromoCode.discountAmount) / 100;
                if (existingPromoCode.maxDiscountAmount) {
                    promoDiscount = Math.min(promoDiscount, existingPromoCode.maxDiscountAmount);
                }
            } else {
                promoDiscount = existingPromoCode.discountAmount;
            }

            // Update cart with promo details
            cart.promoCode = existingPromoCode._id;
            cart.promoCodeDiscount = promoDiscount;
            cart.promoDetails = {
                code: existingPromoCode.code,
                discountType: existingPromoCode.discountType,
                discountAmount: existingPromoCode.discountAmount,
                maxDiscountAmount: existingPromoCode.maxDiscountAmount
            };
        }

        // Save cart and recalculate totals
        await cart.save();
        await cart.recalculateTotals();

        // Return updated cart with populated items
        return await findUserCart(userId);
    } catch (error) {
        console.error("Error updating cart item:", error);
        throw new Error("Failed to update cart item: " + error.message);
    }
}

// Clear all items from a user's cart
async function clearCart(userId) {
    try {
        if (!userId) {
            throw new Error("User ID is required");
        }

        console.log("Clearing cart for user:", userId);
        
        // Find existing cart
        const existingCart = await Cart.findOne({ user: userId });
        if (!existingCart) {
            // If no cart exists, just create and return a new one
            return await createCart(userId);
        }

        // Get all cart item IDs from old cart
        const cartItemIds = existingCart.cartItems;

        // Delete all cart items from old cart
        if (cartItemIds.length > 0) {
            await CartItem.deleteMany({ _id: { $in: cartItemIds } });
            console.log("Deleted cart items:", cartItemIds);
        }

        // Delete the old cart
        await Cart.findByIdAndDelete(existingCart._id);
        console.log("Deleted old cart:", existingCart._id);

        // Create a new cart
        const newCart = await createCart(userId);
        console.log("Created new cart:", newCart._id);
        
        return newCart;
    } catch (error) {
        console.error("Error clearing cart:", error);
        throw new Error("Failed to clear cart: " + error.message);
    }
}

// Delete all cart items for a user
async function deleteCartItems(userId) {
    try {
        if (!userId) {
            throw new Error("User ID is required");
        }

        console.log("Deleting cart items for user:", userId);
        
        // Find existing cart
        const existingCart = await Cart.findOne({ user: userId });
        if (!existingCart) {
            console.log("No cart found for user:", userId);
            return { message: "No cart found" };
        }

        // Get all cart item IDs from cart
        const cartItemIds = existingCart.cartItems;

        // Delete all cart items
        if (cartItemIds && cartItemIds.length > 0) {
            const result = await CartItem.deleteMany({ _id: { $in: cartItemIds } });
            console.log(`Deleted ${result.deletedCount} cart items`);
            
            // Update cart to clear cartItems array
            existingCart.cartItems = [];
            await existingCart.save();
            
            return { message: `Deleted ${result.deletedCount} cart items` };
        } else {
            console.log("No cart items to delete");
            return { message: "No cart items to delete" };
        }
    } catch (error) {
        console.error("Error deleting cart items:", error);
        throw new Error("Failed to delete cart items: " + error.message);
    }
}

// Reset cart values for a user
async function resetCart(userId) {
    try {
        if (!userId) {
            throw new Error("User ID is required");
        }

        console.log("Resetting cart for user:", userId);
        
        // Find existing cart
        const existingCart = await Cart.findOne({ user: userId });
        if (!existingCart) {
            console.log("No cart found for user:", userId);
            return await createCart(userId);
        }

        // Reset all cart values
        existingCart.totalPrice = 0;
        existingCart.totalDiscountedPrice = 0;
        existingCart.discount = 0;
        existingCart.totalItem = 0;
        existingCart.promoCodeDiscount = 0;
        existingCart.promoCode = null;
        
        // Reset promoDetails
        existingCart.set('promoDetails', {
            code: undefined,
            discountType: 'FIXED',
            discountAmount: 0,
            maxDiscountAmount: undefined
        });
        
        // Save cart with validation disabled to avoid enum validation errors
        const updatedCart = await existingCart.save({ validateBeforeSave: false });
        console.log("Reset cart:", updatedCart);
        
        return updatedCart;
    } catch (error) {
        console.error("Error resetting cart:", error);
        throw new Error("Failed to reset cart: " + error.message);
    }
}

module.exports = {
    createCart,
    findUserCart,
    addCartItem,
    removeCartItem,
    updateCartItem,
    clearCart,
    deleteCartItems,
    resetCart
};
