import api from "../../../config/api";
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
    REMOVE_PROMO_CODE_FAILURE
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
        console.log('Fetching cart...');

        // Use ensureCart instead of direct API call
        const cart = await ensureCart();
        console.log('Cart response:', cart);

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
        console.log('Adding to cart - Request data:', reqData);

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

        console.log('Sending formatted data to API:', formattedData);

        const response = await api.put('/api/cart/add', formattedData);
        console.log('Add to cart API response:', response.data);
        
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
        console.log('Removing cart item:', cartItemId);

        // Ensure cart exists before removing item
        await ensureCart();

        const response = await api.delete(`/api/cart/remove/${cartItemId}`);
        console.log('Remove item response:', response.data);
        
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

        console.log('Updating cart item:', { cartItemId, data });

        // Ensure cart exists before updating item
        await ensureCart();

        const response = await api.put(`/api/cart/update/${cartItemId}`, data);
        console.log('Update item response:', response.data);
        
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
            throw new Error('Promo code is required');
        }
        
        // Ensure cart exists before applying promo code
        await ensureCart();
        
        const response = await api.post('/api/cart/apply-promo', { code });
        console.log('Apply promo code API response:', response.data);
        
        if (!response.data || !response.data.status) {
            throw new Error(response.data?.message || 'Failed to apply promo code');
        }
        
        dispatch({
            type: APPLY_PROMO_CODE_SUCCESS,
            payload: response.data.cart
        });
        
        // Fetch updated cart to ensure we have the latest data
        await dispatch(getCart());
        
        return response.data;
    } catch (error) {
        console.error('Error applying promo code:', error);
        
        dispatch({
            type: APPLY_PROMO_CODE_FAILURE,
            payload: error.response?.data?.message || error.message || 'Failed to apply promo code'
        });
        
        throw error;
    }
};

export const removePromoCode = () => async (dispatch) => {
    try {
        dispatch({ type: REMOVE_PROMO_CODE_REQUEST });
        
        // Ensure cart exists before removing promo code
        await ensureCart();
        
        const response = await api.delete('/api/cart/remove-promo');
        console.log('Remove promo code API response:', response.data);
        
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
  