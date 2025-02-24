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
        const cart = new Cart({ 
            user: userId,
            cartItems: []
        });
        const createdCart = await cart.save();
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

        console.log("Finding cart for user:", userId);
        let cart = await Cart.findOne({ user: userId });
        
        if (!cart) {
            console.log("No cart found, creating new cart");
            cart = await createCart(userId);
        }
        
        // Populate cart items with product details
        await cart.populate({
            path: 'cartItems',
            select: '_id cart product size color quantity userId createdAt updatedAt',
            populate: {
                path: 'product',
                select: '_id title price discountedPrice imageUrl'
            }
        });

        // Log raw cart items for debugging
        console.log("Raw cart items before transform:", cart.cartItems.map(item => ({
            _id: item._id,
            size: item.size,
            color: item.color,
            quantity: item.quantity
        })));

        // Recalculate totals
        await cart.recalculateTotals();
        
        // Transform cart items to include color
        const transformedCart = {
            ...cart.toObject(),
            cartItems: cart.cartItems.map(item => {
                const cartItem = item.toObject();
                console.log("Processing cart item:", {
                    _id: cartItem._id,
                    size: cartItem.size,
                    color: cartItem.color,
                    quantity: cartItem.quantity
                });
                return {
                    ...cartItem,
                    color: cartItem.color // Ensure color is included
                };
            })
        };
        
        console.log("Final transformed cart items:", transformedCart.cartItems.map(item => ({
            _id: item._id,
            size: item.size,
            color: item.color,
            quantity: item.quantity
        })));
        return transformedCart;
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
            // Create new cart item
            const newCartItemData = {
                cart: cart._id,
                product: product._id,
                size: cartItemData.size,
                color: cartItemData.color,
                quantity: cartItemData.quantity || 1,
                userId: userId
            };
            console.log("Creating new cart item with data:", JSON.stringify(newCartItemData, null, 2));
            
            cartItem = new CartItem(newCartItemData);
            console.log("New cart item instance created:", {
                _id: cartItem._id,
                size: cartItem.size,
                color: cartItem.color,
                quantity: cartItem.quantity
            });
            
            const savedCartItem = await cartItem.save();
            console.log("New cart item saved successfully:", {
                _id: savedCartItem._id,
                size: savedCartItem.size,
                color: savedCartItem.color,
                quantity: savedCartItem.quantity
            });
            
            console.log("Adding cart item to cart's items array. Current cart items:", cart.cartItems);
            cart.cartItems.push(savedCartItem._id);
            const savedCart = await cart.save();
            console.log("Updated cart saved successfully. New cart items:", savedCart.cartItems);
        }

        // Verify the cart item was saved by fetching it again
        const verifyCartItem = await CartItem.findById(cartItem._id);
        console.log("Verification - Cart item in database:", verifyCartItem ? {
            _id: verifyCartItem._id,
            size: verifyCartItem.size,
            color: verifyCartItem.color,
            quantity: verifyCartItem.quantity
        } : "Cart item not found in database!");

        // Return updated cart with populated cart items
        const updatedCart = await Cart.findById(cart._id).populate({
            path: 'cartItems',
            select: '_id cart product size color quantity userId createdAt updatedAt',
            populate: {
                path: 'product',
                select: '_id title price discountedPrice imageUrl colors'
            }
        });

        // Log raw cart items for debugging
        console.log("Raw cart items after update:", updatedCart.cartItems.map(item => ({
            _id: item._id,
            size: item.size,
            color: item.color,
            quantity: item.quantity,
            productColors: item.product.colors.map(c => c.name)
        })));

        // Recalculate totals
        await updatedCart.recalculateTotals();
        
        // Transform cart items to include color
        const transformedCart = {
            ...updatedCart.toObject(),
            cartItems: updatedCart.cartItems.map(item => {
                const cartItem = item.toObject();
                console.log("Processing cart item:", {
                    _id: cartItem._id,
                    size: cartItem.size,
                    color: cartItem.color,
                    quantity: cartItem.quantity,
                    productColors: cartItem.product.colors.map(c => c.name)
                });
                return {
                    ...cartItem,
                    color: cartItem.color // Ensure color is included
                };
            })
        };
        
        console.log("Final transformed cart items:", transformedCart.cartItems.map(item => ({
            _id: item._id,
            size: item.size,
            color: item.color,
            quantity: item.quantity,
            productColors: item.product.colors.map(c => c.name)
        })));
        return transformedCart;
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

        // Update quantity
        cartItem.quantity = data.quantity;
        await cartItem.save();
        
        // Return updated cart
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
