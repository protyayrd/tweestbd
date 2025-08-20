const express = require("express");
const router = express.Router();

const cartService = require("../services/cart.service.js");
const CartItem = require("../models/cartItem.model.js");
const PromoCode = require("../models/promoCode.model.js");
const Cart = require("../models/cart.model.js");

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
        
        // Use actual promo details from cart if they exist, otherwise don't include promo details
        const actualPromoDetails = cart.promoDetails || null;
        
        const transformedCart = {
            cartItems: cart.cartItems.map(item => ({
                _id: item._id,
                cart: {
                    ...item.cart,
                    promoCodeDiscount: cart.promoCodeDiscount || 0,
                    promoDetails: actualPromoDetails
                },
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
            discount: cart.discount,
            totalItem: cart.totalItem,
            promoCodeDiscount: cart.promoCodeDiscount || 0,
            promoDetails: actualPromoDetails
        };
        
        console.log("Cart found:", transformedCart);
        res.status(200).json(transformedCart);
    } catch (error) {
        console.error("Error in findUserCart:", error);
        res.status(500).json({ 
            message: "Failed to get cart", 
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

        req.body.color = String(req.body.color);

        console.log("Adding item to cart for user:", user._id);
        console.log("Cart item data:", req.body);
        
        const cart = await cartService.addCartItem(user._id, req.body);
        
        const transformedCart = {
            cartItems: cart.cartItems.map(item => ({
                _id: item._id,
                cart: item.cart,
                product: item.product,
                size: item.size,
                color: item.color || null,
                sku: item.sku || item.product?.sku || null,
                quantity: item.quantity,
                userId: item.userId,
                createdAt: item.createdAt,
                updatedAt: item.updatedAt,
                totalPrice: item.totalPrice,
                totalDiscountedPrice: item.totalDiscountedPrice,
                discount: item.discount
            })),
            totalPrice: cart.totalPrice || 0,
            totalDiscountedPrice: cart.totalDiscountedPrice || 0,
            discount: cart.discount || 0,
            totalItem: cart.totalItem || 0,
            promoCodeDiscount: cart.promoCodeDiscount || 0,
            promoDetails: cart.promoDetails || null
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
            discount: cart.discount || 0,
            totalItem: cart.totalItem || 0,
            promoCodeDiscount: cart.promoCodeDiscount || 0,
            promoDetails: cart.promoDetails || null
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
        
        // Transform cart data for response
        const transformedCart = {
            cartItems: cart.cartItems || [],
            totalPrice: cart.totalPrice || 0,
            totalDiscountedPrice: cart.totalDiscountedPrice || 0,
            discount: cart.discount || 0,
            totalItem: cart.totalItem || 0,
            promoCodeDiscount: cart.promoCodeDiscount || 0,
            promoDetails: cart.promoDetails || null,
            promoCode: cart.promoCode || null
        };
        
        console.log("Item updated successfully, returning cart:", transformedCart);
        res.status(200).json(transformedCart);
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

const applyPromoCode = async (req, res) => {
    try {
        const user = req.user;
        if (!user || !user._id) {
            return res.status(401).json({
                message: "User not authenticated",
                status: false
            });
        }

        const { code } = req.body;
        if (!code) {
            return res.status(400).json({
                message: "Promo code is required",
                status: false
            });
        }

        // Find the promo code
        const promoCode = await PromoCode.findOne({ 
            code: code.toUpperCase(),
            isActive: true,
            validFrom: { $lte: new Date() },
            validUntil: { $gte: new Date() }
        });

        if (!promoCode) {
            return res.status(404).json({
                message: "Invalid or expired promo code",
                status: false
            });
        }

        // Check usage limit
        if (promoCode.usageLimit !== null && promoCode.usageCount >= promoCode.usageLimit) {
            return res.status(400).json({
                message: "Promo code usage limit exceeded",
                status: false
            });
        }

        // Get user's cart with populated items
        let cart = await Cart.findOne({ user: user._id }).populate({
            path: 'cartItems',
            populate: {
                path: 'product',
                select: '_id title price discountedPrice'
            }
        });

        if (!cart || !cart.cartItems || cart.cartItems.length === 0) {
            return res.status(400).json({
                message: "Cart is empty",
                status: false
            });
        }

        // Calculate base total (after product discounts, before promo)
        const baseTotal = cart.cartItems.reduce((total, item) => {
            const price = item.product.discountedPrice || item.product.price;
            return total + (price * item.quantity);
        }, 0);

        // Check minimum order amount
        if (baseTotal < promoCode.minOrderAmount) {
            return res.status(400).json({
                message: `Minimum order amount of Tk. ${promoCode.minOrderAmount} required`,
                status: false
            });
        }

        // Calculate promo discount
        let promoDiscount = 0;
        if (promoCode.discountType === 'FIXED') {
            promoDiscount = promoCode.discountAmount;
        } else {
            promoDiscount = (baseTotal * promoCode.discountAmount) / 100;
            if (promoCode.maxDiscountAmount) {
                promoDiscount = Math.min(promoDiscount, promoCode.maxDiscountAmount);
            }
        }

        // Update cart with promo code
        const cartUpdate = {
            promoCode: promoCode._id,
            promoCodeDiscount: promoDiscount,
            promoDetails: {
                code: promoCode.code,
                discountType: promoCode.discountType,
                discountAmount: promoCode.discountAmount,
                maxDiscountAmount: promoCode.maxDiscountAmount
            }
        };

        // Calculate final totals
        const totalPrice = cart.cartItems.reduce((total, item) => {
            return total + (item.product.price * item.quantity);
        }, 0);

        const productDiscount = cart.cartItems.reduce((total, item) => {
            const originalPrice = item.product.price;
            const discountedPrice = item.product.discountedPrice || originalPrice;
            return total + ((originalPrice - discountedPrice) * item.quantity);
        }, 0);

        // Update cart totals
        Object.assign(cartUpdate, {
            totalPrice,
            totalDiscountedPrice: baseTotal - promoDiscount,
            discount: productDiscount + promoDiscount
        });

        // Save cart using findOneAndUpdate to ensure atomic update
        cart = await Cart.findOneAndUpdate(
            { _id: cart._id },
            cartUpdate,
            { new: true }
        ).populate({
            path: 'cartItems',
            populate: {
                path: 'product',
                select: '_id title price discountedPrice'
            }
        });

        // Increment promo code usage
        await PromoCode.findByIdAndUpdate(
            promoCode._id,
            { $inc: { usageCount: 1 } }
        );

        // Get updated cart with all calculations
        const updatedCart = await cartService.findUserCart(user._id);

        res.status(200).json({
            message: "Promo code applied successfully",
            status: true,
            cart: {
                cartItems: updatedCart.cartItems,
                totalPrice: updatedCart.totalPrice,
                totalDiscountedPrice: updatedCart.totalDiscountedPrice,
                discount: updatedCart.discount,
                totalItem: updatedCart.totalItem,
                promoCode: updatedCart.promoCode,
                promoCodeDiscount: updatedCart.promoCodeDiscount,
                promoDetails: updatedCart.promoDetails,
                productDiscount: updatedCart.discount - updatedCart.promoCodeDiscount,
                promoDiscount: updatedCart.promoCodeDiscount,
                totalDiscount: updatedCart.discount
            }
        });
    } catch (error) {
        console.error("Error in applyPromoCode:", error);
        res.status(500).json({ 
            message: "Failed to apply promo code", 
            error: error.message,
            status: false
        });
    }
};

const removePromoCode = async (req, res) => {
    try {
        const user = req.user;
        if (!user || !user._id) {
            return res.status(401).json({
                message: "User not authenticated",
                status: false
            });
        }

        // Get user's cart with populated items
        let cart = await Cart.findOne({ user: user._id }).populate({
            path: 'cartItems',
            populate: {
                path: 'product',
                select: '_id title price discountedPrice'
            }
        });

        if (!cart) {
            return res.status(404).json({
                message: "Cart not found",
                status: false
            });
        }

        // Calculate base total (after product discounts, before promo)
        const baseTotal = cart.cartItems.reduce((total, item) => {
            const price = item.product.discountedPrice || item.product.price;
            return total + (price * item.quantity);
        }, 0);

        // Calculate product discount
        const productDiscount = cart.cartItems.reduce((total, item) => {
            const originalPrice = item.product.price;
            const discountedPrice = item.product.discountedPrice || originalPrice;
            return total + ((originalPrice - discountedPrice) * item.quantity);
        }, 0);

        // Completely reset all promo code related fields
        const cartUpdate = {
            promoCode: undefined,
            promoCodeDiscount: 0,
            totalDiscountedPrice: baseTotal,
            discount: productDiscount,
            promoDetails: {
                code: undefined,
                discountType: 'FIXED',
                discountAmount: 0,
                maxDiscountAmount: undefined
            }
        };

        // Update the cart with validation disabled
        await Cart.findOneAndUpdate(
            { _id: cart._id },
            cartUpdate,
            { validateBeforeSave: false }
        );

        // Get updated cart with full details
        const updatedCart = await cartService.findUserCart(user._id);

        if (!updatedCart) {
            return res.status(404).json({
                message: "Failed to retrieve updated cart",
                status: false
            });
        }

        res.status(200).json({
            message: "Promo code removed successfully",
            status: true,
            cart: updatedCart
        });
    } catch (error) {
        console.error("Error in removePromoCode:", error);
        res.status(500).json({ 
            message: "Failed to remove promo code", 
            error: error.message,
            status: false
        });
    }
};

const clearCart = async (req, res) => {
    try {
        const user = req.user;
        if (!user || !user._id) {
            return res.status(401).json({
                message: "User not authenticated",
                status: false
            });
        }

        console.log("Clearing cart for user:", user._id);
        
        // Clear the existing cart and create a new one
        const newCart = await cartService.clearCart(user._id);
        
        console.log("Cart cleared and new cart created successfully:", newCart);
        res.status(200).json({
            message: "Cart cleared successfully",
            status: true,
            cart: {
                _id: newCart._id,
                cartItems: [],
                totalPrice: 0,
                totalDiscountedPrice: 0,
                discount: 0,
                totalItem: 0,
                promoCodeDiscount: 0,
                promoDetails: {
                    code: null,
                    discountType: 'FIXED',
                    discountAmount: 0,
                    maxDiscountAmount: null
                }
            }
        });
    } catch (error) {
        console.error("Error in clearCart:", error);
        res.status(500).json({ 
            message: "Failed to clear cart", 
            error: error.message,
            status: false
        });
    }
};

module.exports = {
    findUserCart,
    addItemToCart,
    removeCartItem,
    updateCartItem,
    getCartItem,
    applyPromoCode,
    removePromoCode,
    clearCart
};