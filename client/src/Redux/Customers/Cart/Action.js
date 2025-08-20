import api from "../../../config/api";
import { trackAddToCart } from "../../../utils/gtmEvents";
import {
    ADD_ITEM_TO_CART_REQUEST,
    ADD_ITEM_TO_CART_SUCCESS,
    ADD_ITEM_TO_CART_FAILURE,
    GET_CART_FAILURE,
    GET_CART_REQUEST,
    GET_CART_SUCCESS,
    REMOVE_CART_ITEM_FAILURE,
    REMOVE_CART_ITEM_REQUEST,
    REMOVE_CART_ITEM_SUCCESS,
    UPDATE_CART_ITEM_FAILURE,
    UPDATE_CART_ITEM_REQUEST,
    UPDATE_CART_ITEM_SUCCESS,
    APPLY_PROMO_CODE_REQUEST,
    APPLY_PROMO_CODE_SUCCESS,
    APPLY_PROMO_CODE_FAILURE,
    REMOVE_PROMO_CODE_REQUEST,
    REMOVE_PROMO_CODE_SUCCESS,
    REMOVE_PROMO_CODE_FAILURE,
    CLEAR_CART_REQUEST,
    CLEAR_CART_SUCCESS,
    CLEAR_CART_FAILURE,
    FIND_CART_REQUEST,
    FIND_CART_SUCCESS,
    FIND_CART_FAILURE
} from "./ActionType";

// Helper function to ensure cart exists
const ensureCart = async () => {
    try {
        // Try to get the cart first
        const response = await api.get('/api/cart');
        return response.data;
    } catch (error) {
        // If cart doesn't exist (404) or other error, create a new cart
        if (error.response?.status === 404) {
            const createResponse = await api.post('/api/cart');
            return createResponse.data;
        }
        throw error;
    }
};

export const getCart = () => async (dispatch) => {
    try {
        dispatch({ type: GET_CART_REQUEST });

        // Use ensureCart instead of direct API call
        const cart = await ensureCart();

        dispatch({
            type: GET_CART_SUCCESS,
            payload: cart
        });
        
        return cart;
    } catch (error) {
        console.error('Error fetching cart:', error);
        
        // Handle authentication errors
        if (error.message === 'Authentication required') {
            dispatch({
                type: GET_CART_FAILURE,
                payload: 'Please login to view your cart'
            });
            window.location.href = '/login';
            return;
        }

        // Handle other errors
        dispatch({
            type: GET_CART_FAILURE,
            payload: error.response?.data?.message || error.message || 'Error fetching cart'
        });
        throw error;
    }
};

export const addItemToCart = (reqData) => async (dispatch) => {
    try {
        dispatch({ type: ADD_ITEM_TO_CART_REQUEST });

        // Validate required fields
        if (!reqData.productId || !reqData.size || !reqData.color || !reqData.price) {
            throw new Error('Missing required fields: productId, size, color, and price are required');
        }

        // Ensure cart exists before adding item
        await ensureCart();

        // Format the request data
        const formattedData = {
            productId: reqData.productId,
            size: reqData.size,
            color: reqData.color,
            quantity: reqData.quantity || 1,
            price: reqData.price,
            discountedPrice: reqData.discountedPrice || reqData.price,
            product: {
                _id: reqData.productId,
                title: reqData.product?.title,
                price: reqData.price,
                discountedPrice: reqData.discountedPrice || reqData.price
            }
        };


        const response = await api.put('/api/cart/add', formattedData);
        
        if (!response.data) {
            throw new Error('No data received from server');
        }

        // Format the response data
        const formattedResponse = {
            ...response.data,
            cartItems: response.data.cartItems || [],
            totalPrice: response.data.totalPrice || 0,
            totalDiscountedPrice: response.data.totalDiscountedPrice || 0,
            discount: response.data.discount || 0,
            promoCodeDiscount: response.data.promoCodeDiscount || 0,
            promoDetails: response.data.promoDetails || null,
            totalItem: response.data.totalItem || response.data.cartItems?.length || 0
        };

        // Track the AddToCart event for Meta Pixel
        trackAddToCart(reqData, reqData.quantity || 1);
        
        dispatch({
            type: ADD_ITEM_TO_CART_SUCCESS,
            payload: formattedResponse
        });

        // Fetch updated cart
        await dispatch(getCart());
        
        return { payload: formattedResponse };
    } catch (error) {
        console.error('Error adding item to cart:', error);
        
        // Handle authentication errors
        if (error.response?.status === 401 || error.message === 'Authentication required') {
            // Save the product in sessionStorage to add after login
            sessionStorage.setItem('pendingCartItem', JSON.stringify(reqData));
            
            dispatch({
                type: ADD_ITEM_TO_CART_FAILURE,
                payload: 'Please login to add items to cart'
            });
            throw new Error('Authentication required');
        }

        // Handle validation errors
        if (error.message.includes('Missing required fields')) {
            dispatch({
                type: ADD_ITEM_TO_CART_FAILURE,
                payload: error.message
            });
            throw error;
        }

        // Handle other errors
        const errorMessage = error.response?.data?.message || error.message || 'Error adding item to cart';
        dispatch({
            type: ADD_ITEM_TO_CART_FAILURE,
            payload: errorMessage
        });
        throw error;
    }
};

export const removeCartItem = (cartItemId) => async (dispatch) => {
    try {
        dispatch({ type: REMOVE_CART_ITEM_REQUEST });

        // Ensure cart exists before removing item
        await ensureCart();

        const response = await api.delete(`/api/cart/remove/${cartItemId}`);
        
        if (!response.data) {
            throw new Error('No data received from server');
        }

        dispatch({
            type: REMOVE_CART_ITEM_SUCCESS,
            payload: cartItemId
        });

        // Fetch updated cart
        await dispatch(getCart());
        return response.data;
    } catch (error) {
        console.error('Error removing cart item:', error);
        
        // Handle authentication errors
        if (error.message === 'Authentication required') {
            dispatch({
                type: REMOVE_CART_ITEM_FAILURE,
                payload: 'Please login to remove items from cart'
            });
            window.location.href = '/login';
            return;
        }

        // Handle other errors
        dispatch({
            type: REMOVE_CART_ITEM_FAILURE,
            payload: error.response?.data?.message || error.message || 'Error removing item from cart'
        });
        throw error;
    }
};

export const updateCartItem = (reqData) => async (dispatch) => {
    try {
        dispatch({ type: UPDATE_CART_ITEM_REQUEST });
        
        // Extract cartItemId and data from the request
        const cartItemId = reqData.cartItemId;
        const data = reqData.data;

        if (!cartItemId || !data || typeof data.quantity !== 'number') {
            throw new Error('Cart item ID and quantity are required');
        }


        // Ensure cart exists before updating item
        await ensureCart();

        const response = await api.put(`/api/cart/update/${cartItemId}`, data);
        
        if (!response.data) {
            throw new Error('No data received from server');
        }

        // Format the response data with promo details
        const formattedResponse = {
            cartItems: response.data.cartItems || [],
            totalPrice: response.data.totalPrice || 0,
            totalDiscountedPrice: response.data.totalDiscountedPrice || 0,
            discount: response.data.discount || 0,
            promoCodeDiscount: response.data.promoCodeDiscount || 0,
            promoDetails: response.data.promoDetails || null
        };

        dispatch({
            type: UPDATE_CART_ITEM_SUCCESS,
            payload: formattedResponse
        });

        // Fetch updated cart to ensure we have the latest state
        await dispatch(getCart());
        return formattedResponse;
    } catch (error) {
        console.error('Error updating cart item:', error);
        
        // Handle authentication errors
        if (error.message === 'Authentication required') {
            dispatch({
                type: UPDATE_CART_ITEM_FAILURE,
                payload: 'Please login to update items in cart'
            });
            window.location.href = '/login';
            return;
        }

        // Handle other errors
        dispatch({
            type: UPDATE_CART_ITEM_FAILURE,
            payload: error.response?.data?.message || error.message || 'Error updating item in cart'
        });
        throw error;
    }
};

export const applyPromoCode = (code) => async (dispatch) => {
    try {
        dispatch({ type: APPLY_PROMO_CODE_REQUEST });
        
        if (!code || !code.trim()) {
            dispatch({
                type: APPLY_PROMO_CODE_FAILURE,
                payload: 'Promo code is required'
            });
            return { status: false, message: 'Promo code is required' };
        }
        
        const response = await api.post('/api/cart/apply-promo', { code });
        
        if (!response.data.status) {
            dispatch({
                type: APPLY_PROMO_CODE_FAILURE,
                payload: response.data.message || 'Invalid promo code'
            });
            return { status: false, message: response.data.message || 'Invalid promo code' };
        }
        
        dispatch({
            type: APPLY_PROMO_CODE_SUCCESS,
            payload: response.data.cart
        });
        
        return response.data;
    } catch (error) {
        console.error('Error applying promo code:', error);
        
        // Handle different types of errors
        let errorMessage = 'Failed to apply promo code';
        
        if (error.response) {
            // Server responded with an error
            errorMessage = error.response.data?.message || 'Invalid promo code';
            
            // Handle specific error cases with clearer messages
            if (errorMessage.includes('Minimum order amount')) {
                errorMessage = error.response.data?.message || 'Minimum order amount required';
            } else if (errorMessage.includes('Invalid or expired')) {
                errorMessage = error.response.data?.message || 'Invalid or expired promo code';
            }
        } else if (error.message) {
            // Client-side error or network error
            errorMessage = error.message;
        }
        
        dispatch({
            type: APPLY_PROMO_CODE_FAILURE,
            payload: errorMessage
        });
        
        // Always return a response object instead of throwing
        return { status: false, message: errorMessage };
    }
};

export const removePromoCode = () => async (dispatch) => {
    try {
        dispatch({ type: REMOVE_PROMO_CODE_REQUEST });
        
        // Ensure cart exists before removing promo code
        await ensureCart();
        
        const response = await api.delete('/api/cart/remove-promo');
        
        if (!response.data || !response.data.status) {
            throw new Error(response.data?.message || 'Failed to remove promo code');
        }
        
        dispatch({
            type: REMOVE_PROMO_CODE_SUCCESS,
            payload: response.data.cart
        });
        
        // Fetch updated cart to ensure we have the latest data
        await dispatch(getCart());
        
        return response.data;
    } catch (error) {
        console.error('Error removing promo code:', error);
        
        dispatch({
            type: REMOVE_PROMO_CODE_FAILURE,
            payload: error.response?.data?.message || error.message || 'Failed to remove promo code'
        });
        
        throw error;
    }
};

export const clearCart = () => async (dispatch, getState) => {
    try {
        dispatch({ type: CLEAR_CART_REQUEST });
        
        // First ensure cart exists
        await ensureCart();
        
        const response = await api.delete('/api/cart/clear');
        
        if (!response.data || !response.data.status) {
            console.warn('Unexpected response from clear cart API:', response.data);
            throw new Error(response.data?.message || 'Failed to clear cart');
        }
        
        // Dispatch success with the new empty cart
        dispatch({
            type: CLEAR_CART_SUCCESS,
            payload: {
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

        // Ensure we have the latest cart state
        try {
            await dispatch(getCart());
            
            // Verify cart is empty
            const state = getState().cart;
            if (state.cartItems && state.cartItems.length > 0) {
                console.error('Cart still has items after clearing!', state.cartItems);
            } else {
                // Cart was successfully cleared
                console.log('Cart successfully cleared');
            }
        } catch (error) {
            console.error('Error fetching cart after clearing:', error);
        }
        
        return response.data;
    } catch (error) {
        console.error('Error clearing cart:', error);
        
        dispatch({
            type: CLEAR_CART_FAILURE,
            payload: error.response?.data?.message || error.message || 'Failed to clear cart'
        });

        // Try to recover by ensuring cart exists
        try {
            await ensureCart();
            await dispatch(getCart());
        } catch (recoveryError) {
            console.error('Failed to recover cart after clear error:', recoveryError);
        }
        
        // Try a direct fetch approach as a last resort
        try {
            const token = localStorage.getItem('jwt');
            if (token) {
                const response = await fetch(`${api.defaults.baseURL}/api/cart/clear`, {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                if (response.ok) {
                    // Force redux state update
                    dispatch({
                        type: CLEAR_CART_SUCCESS,
                        payload: {
                            cartItems: [],
                            totalPrice: 0,
                            totalDiscountedPrice: 0,
                            discount: 0,
                            totalItem: 0,
                            promoCodeDiscount: 0,
                            promoDetails: null
                        }
                    });
                    return { message: "Cart cleared via fallback method", status: true };
                } else {
                    console.error('Fallback cart clear failed:', await response.text());
                }
            }
        } catch (fallbackError) {
            console.error('Fallback cart clear approach failed:', fallbackError);
        }
        
        throw error;
    }
};

export const findUserCart = () => async (dispatch) => {
    try {
        dispatch({ type: FIND_CART_REQUEST });

        // Check if this is a guest checkout
        const isGuestCheckout = window.location.search.includes('guest=true');
        const isCheckoutPath = window.location.pathname.includes('/checkout');
        
        // If we're in guest checkout mode, return early with a placeholder cart
        if (isGuestCheckout && isCheckoutPath) {
            // Try to get guest cart data from localStorage
            try {
                const guestCartData = localStorage.getItem('guestCart');
                if (guestCartData) {
                    const parsedCart = JSON.parse(guestCartData);
                    
                    // Ensure the cart has all necessary properties
                    const safeCart = {
                        cartItems: parsedCart.cartItems || [],
                        totalItem: parsedCart.totalItem || parsedCart.cartItems?.length || 0,
                        totalPrice: Number(parsedCart.totalPrice || 0),
                        totalDiscountedPrice: Number(parsedCart.totalDiscountedPrice || 0),
                        discount: Number(parsedCart.discount || 0),
                        productDiscount: Number(parsedCart.discount || 0) - Number(parsedCart.promoCodeDiscount || 0),
                        promoCodeDiscount: Number(parsedCart.promoCodeDiscount || 0),
                        promoDetails: parsedCart.promoDetails || null,
                        deliveryCharge: Number(parsedCart.deliveryCharge || 0)
                    };
                    
                    dispatch({
                        type: FIND_CART_SUCCESS,
                        payload: safeCart
                    });
                    return safeCart;
                }
                
                // If no guestCart data, check for guestCartItems
                const guestCartItems = localStorage.getItem('guestCartItems');
                if (guestCartItems) {
                    const parsedItems = JSON.parse(guestCartItems);
                    // Calculate cart totals from items
                    const totalPrice = parsedItems.reduce((sum, item) => sum + (Number(item.price || 0) * Number(item.quantity || 1)), 0);
                    const totalDiscountedPrice = parsedItems.reduce((sum, item) => sum + (Number(item.discountedPrice || 0) * Number(item.quantity || 1)), 0);
                    const discount = totalPrice - totalDiscountedPrice;
                    
                    // Create a complete cart object with all required properties
                    const guestCart = {
                        cartItems: parsedItems,
                        totalItem: parsedItems.length,
                        totalPrice: totalPrice,
                        totalDiscountedPrice: totalDiscountedPrice,
                        discount: discount,
                        productDiscount: discount, // Default to full discount as product discount
                        promoCodeDiscount: 0,
                        promoDetails: null,
                        deliveryCharge: 0 // Will be calculated later
                    };
                    
                    // Save the complete cart object back to localStorage
                    localStorage.setItem('guestCart', JSON.stringify(guestCart));
                    
                    dispatch({
                        type: FIND_CART_SUCCESS,
                        payload: guestCart
                    });
                    
                    return guestCart;
                }
            } catch (error) {
                console.error("Error processing guest cart data:", error);
            }
            
            // Return an empty cart if no guest cart data is found
            const emptyCart = {
                cartItems: [],
                totalPrice: 0,
                totalDiscountedPrice: 0,
                discount: 0,
                productDiscount: 0,
                promoCodeDiscount: 0,
                totalItem: 0,
                promoDetails: null,
                deliveryCharge: 0
            };
            
            dispatch({
                type: FIND_CART_SUCCESS,
                payload: emptyCart
            });
            
            return emptyCart;
        }

        // For regular users, continue with the API call
        const response = await api.get('/api/cart');
        
        if (!response.data) {
            throw new Error('No data received from server');
        }

        // Format the response data
        const formattedResponse = {
            ...response.data,
            cartItems: response.data.cartItems || [],
            totalPrice: response.data.totalPrice || 0,
            totalDiscountedPrice: response.data.totalDiscountedPrice || 0,
            discount: response.data.discount || 0,
            productDiscount: Number(response.data.discount || 0) - Number(response.data.promoCodeDiscount || 0),
            promoCodeDiscount: response.data.promoCodeDiscount || 0,
            promoDetails: response.data.promoDetails || null,
            totalItem: response.data.totalItem || response.data.cartItems?.length || 0
        };

        dispatch({
            type: FIND_CART_SUCCESS,
            payload: formattedResponse
        });

        return formattedResponse;
    } catch (error) {
        console.error('Error finding cart:', error);
        dispatch({
            type: FIND_CART_FAILURE,
            payload: error.message || 'Failed to find cart'
        });
        throw error;
    }
};
  