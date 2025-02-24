const express = require("express");
const router = express.Router();

const cartService = require("../services/cart.service.js");
const CartItem = require("../models/cartItem.model.js");

const findUserCart = async (req, res) => {
    try {
        const user = req.user;
        if (!user || !user._id) {
            return res.status(401).json({
                message: "User not authenticated",
                status: false
            });
        }

        console.log("Finding cart for user:", user._id);
        const cart = await cartService.findUserCart(user._id);
        
        // Transform cart items to include color
        const transformedCart = {
            cartItems: cart.cartItems.map(item => ({
                _id: item._id,
                cart: item.cart,
                product: item.product,
                size: item.size,
                color: item.color || null,
                quantity: item.quantity,
                userId: item.userId,
                createdAt: item.createdAt,
                updatedAt: item.updatedAt,
                totalPrice: item.totalPrice,
                totalDiscountedPrice: item.totalDiscountedPrice,
                discount: item.discount
            })),
            totalPrice: cart.totalPrice,
            totalDiscountedPrice: cart.totalDiscountedPrice,
            discounte: cart.discounte
        };
        
        console.log("Cart found:", transformedCart);
        res.status(200).json(transformedCart);
    } catch (error) {
        console.error("Error in findUserCart:", error);
        res.status(500).json({ 
            message: "Failed to get user cart", 
            error: error.message,
            status: false
        });
    }
}

const addItemToCart = async (req, res) => {
    try {
        const user = req.user;
        if (!user || !user._id) {
            return res.status(401).json({
                message: "User not authenticated",
                status: false
            });
        }

        if (!req.body || !req.body.productId || !req.body.size || !req.body.color) {
            return res.status(400).json({
                message: "Missing required fields: productId, size, and color are required",
                status: false
            });
        }

        // Ensure color is a string
        req.body.color = String(req.body.color);

        console.log("Adding item to cart for user:", user._id);
        console.log("Cart item data:", req.body);
        
        const cart = await cartService.addCartItem(user._id, req.body);
        
        // Transform cart items to include color
        const transformedCart = {
            cartItems: cart.cartItems.map(item => ({
                _id: item._id,
                cart: item.cart,
                product: item.product,
                size: item.size,
                color: item.color || null,
                quantity: item.quantity,
                userId: item.userId,
                createdAt: item.createdAt,
                updatedAt: item.updatedAt,
                totalPrice: item.totalPrice,
                totalDiscountedPrice: item.totalDiscountedPrice,
                discount: item.discount
            })),
            totalPrice: cart.totalPrice,
            totalDiscountedPrice: cart.totalDiscountedPrice,
            discounte: cart.discounte
        };
        
        console.log("Item added successfully, returning cart:", transformedCart);
        res.status(200).json(transformedCart);
    } catch (error) {
        console.error("Error in addItemToCart:", error);
        res.status(500).json({ 
            message: "Failed to add item to cart", 
            error: error.message,
            status: false
        });
    }
}

const removeCartItem = async (req, res) => {
    try {
        const user = req.user;
        if (!user || !user._id) {
            return res.status(401).json({
                message: "User not authenticated",
                status: false
            });
        }

        const cartItemId = req.params.cartItemId;
        if (!cartItemId) {
            return res.status(400).json({
                message: "Cart item ID is required",
                status: false
            });
        }

        console.log("Removing item from cart for user:", user._id);
        console.log("Cart item ID:", cartItemId);
        
        const cart = await cartService.removeCartItem(user._id, cartItemId);
        
        console.log("Item removed successfully, returning cart:", cart);
        res.status(200).json({
            cartItems: cart.cartItems || [],
            totalPrice: cart.totalPrice || 0,
            totalDiscountedPrice: cart.totalDiscountedPrice || 0,
            discounte: cart.discounte || 0
        });
    } catch (error) {
        console.error("Error in removeCartItem:", error);
        res.status(500).json({ 
            message: "Failed to remove item from cart", 
            error: error.message,
            status: false
        });
    }
}

const updateCartItem = async (req, res) => {
    try {
        const user = req.user;
        if (!user || !user._id) {
            return res.status(401).json({
                message: "User not authenticated",
                status: false
            });
        }

        const cartItemId = req.params.cartItemId;
        if (!cartItemId) {
            return res.status(400).json({
                message: "Cart item ID is required",
                status: false
            });
        }

        if (!req.body || !req.body.quantity) {
            return res.status(400).json({
                message: "Quantity is required",
                status: false
            });
        }

        console.log("Updating cart item for user:", user._id);
        console.log("Cart item ID:", cartItemId);
        console.log("Update data:", req.body);
        
        const cart = await cartService.updateCartItem(user._id, cartItemId, req.body);
        
        console.log("Item updated successfully, returning cart:", cart);
        res.status(200).json({
            cartItems: cart.cartItems || [],
            totalPrice: cart.totalPrice || 0,
            totalDiscountedPrice: cart.totalDiscountedPrice || 0,
            discounte: cart.discounte || 0
        });
    } catch (error) {
        console.error("Error in updateCartItem:", error);
        res.status(500).json({ 
            message: "Failed to update cart item", 
            error: error.message,
            status: false
        });
    }
}

const getCartItem = async (req, res) => {
    try {
        const user = req.user;
        if (!user || !user._id) {
            return res.status(401).json({
                message: "User not authenticated",
                status: false
            });
        }

        const cartItemId = req.params.cartItemId;
        if (!cartItemId) {
            return res.status(400).json({
                message: "Cart item ID is required",
                status: false
            });
        }

        console.log("Getting cart item:", cartItemId);
        const cartItem = await CartItem.findById(cartItemId)
            .populate({
                path: 'product',
                select: '_id title price discountedPrice imageUrl'
            })
            .lean();
        
        if (!cartItem) {
            return res.status(404).json({
                message: "Cart item not found",
                status: false
            });
        }

        if (cartItem.userId.toString() !== user._id.toString()) {
            return res.status(403).json({
                message: "Unauthorized: This cart item does not belong to you",
                status: false
            });
        }

        console.log("Cart item found:", cartItem);
        res.status(200).json(cartItem);
    } catch (error) {
        console.error("Error in getCartItem:", error);
        res.status(500).json({ 
            message: "Failed to get cart item", 
            error: error.message,
            status: false
        });
    }
}

module.exports = {
    findUserCart,
    addItemToCart,
    removeCartItem,
    updateCartItem,
    getCartItem
};