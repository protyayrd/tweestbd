const Cart = require("../models/cart.model.js");
const CartItem = require("../models/cartItem.model.js");
const Product = require("../models/product.model.js");

// Create a new cart for a user
async function createCart(userId) {
    try {
        if (!userId) {
            throw new Error("User ID is required");
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
        if (!userId) {
            throw new Error("User ID is required");
        }

        let cart = await Cart.findOne({ user: userId });
        if (!cart) {
            cart = await createCart(userId);
        }

        await cart.populate([
            {
                path: 'cartItems',
                populate: {
                    path: 'product',
                    select: '_id title price discountedPrice discountPersent colors'
                }
            },
            {
                path: 'promoCode',
                select: '_id code discountType discountAmount maxDiscountAmount'
            }
        ]);

        // Calculate total base price after product discounts
        const totalBaseDiscountedPrice = cart.cartItems.reduce((total, item) => {
            const baseDiscountedPrice = item.product.discountedPrice || item.product.price;
            return total + (baseDiscountedPrice * item.quantity);
        }, 0);

        // Get promo code details and calculate total promo discount
        let promoDetails = null;
        let totalPromoDiscount = 0;

        if (cart.promoCode) {
            promoDetails = {
                code: cart.promoCode.code,
                discountType: cart.promoCode.discountType,
                discountAmount: cart.promoCode.discountAmount,
                maxDiscountAmount: cart.promoCode.maxDiscountAmount
            };

            // Calculate total promo discount
            if (cart.promoCode.discountType === 'PERCENTAGE') {
                totalPromoDiscount = (totalBaseDiscountedPrice * cart.promoCode.discountAmount) / 100;
                if (cart.promoCode.maxDiscountAmount) {
                    totalPromoDiscount = Math.min(totalPromoDiscount, cart.promoCode.maxDiscountAmount);
                }
            } else {
                totalPromoDiscount = cart.promoCode.discountAmount;
            }

            // Ensure promo discount doesn't exceed total price
            totalPromoDiscount = Math.min(totalPromoDiscount, totalBaseDiscountedPrice);
        }

        // Calculate cart items with promo distribution
        const cartItems = await Promise.all(cart.cartItems.map(async (item) => {
            const cartItem = item.toObject();
            
            const selectedColor = cartItem.product.colors.find(c => c.name === cartItem.color);
            const firstColor = cartItem.product.colors[0];
            
            let imageUrl = selectedColor?.images?.[0] || firstColor?.images?.[0] || null;

            // Calculate base prices
            const originalPrice = cartItem.product.price || 0;
            const baseDiscountedPrice = cartItem.product.discountedPrice || originalPrice;
            const quantity = cartItem.quantity || 0;
            const itemBaseTotal = baseDiscountedPrice * quantity;

            // Calculate this item's share of promo discount
            const promoDiscountRatio = totalBaseDiscountedPrice > 0 ? 
                (itemBaseTotal / totalBaseDiscountedPrice) : 0;
            const itemPromoDiscount = totalPromoDiscount * promoDiscountRatio;

            // Calculate all price components
            const totalOriginalPrice = originalPrice * quantity;
            const itemTotalBaseDiscountedPrice = baseDiscountedPrice * quantity;
            const productDiscount = totalOriginalPrice - itemTotalBaseDiscountedPrice;
            const finalDiscountedPrice = Math.max(itemTotalBaseDiscountedPrice - itemPromoDiscount, 0);

            return {
                ...cartItem,
                cart: {
                    promoCodeDiscount: totalPromoDiscount || 0,
                    promoDetails: promoDetails || null
                },
                product: {
                    ...cartItem.product,
                    imageUrl,
                    price: originalPrice,
                    discountedPrice: baseDiscountedPrice,
                    discountPersent: cartItem.product.discountPersent || 
                        Math.round((productDiscount / totalOriginalPrice) * 100)
                },
                color: cartItem.color,
                quantity,
                totalPrice: totalOriginalPrice,
                totalDiscountedPrice: finalDiscountedPrice,
                productDiscount,
                promoDiscount: itemPromoDiscount,
                totalDiscount: productDiscount + itemPromoDiscount
            };
        }));

        // Return cart with all calculated values
        return {
            cartItems,
            totalPrice: cart.totalPrice,
            totalDiscountedPrice: cart.totalDiscountedPrice,
            discount: cart.discount,
            totalItem: cart.totalItem,
            promoCode: cart.promoCode || null,
            promoCodeDiscount: totalPromoDiscount || 0,
            promoDetails: promoDetails || null
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
        const validColor = product.colors.some(c => c.name === cartItemData.color);
        if (!validColor) {
            console.error("Invalid color. Available colors:", product.colors.map(c => c.name));
            throw new Error(`Invalid color. Available colors: ${product.colors.map(c => c.name).join(', ')}`);
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

module.exports = {
    createCart,
    findUserCart,
    addCartItem,
    removeCartItem,
    updateCartItem
};
