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
        console.log('Raw request data:', reqData);

        // Extract data from nested structure if it exists
        const cartData = reqData.data || reqData;
        console.log('Processed cart data:', cartData);

        // Validate required fields
        if (!cartData.productId || !cartData.size) {
            throw new Error('Missing required fields: productId and size are required');
        }

        // Ensure cart exists before adding item
        await ensureCart();

        // Format the request data to match backend expectations
        const formattedData = {
            productId: cartData.productId,
            size: cartData.size,
            color: cartData.color,
            quantity: cartData.quantity || 1,
            product: {
                _id: cartData.productId,
                title: cartData.product?.title,
                price: cartData.product?.price,
                discountedPrice: cartData.product?.discountedPrice
            }
        };

        console.log('Sending formatted data:', formattedData);

        const response = await api.put('/api/cart/add', formattedData);
        console.log('Add to cart response:', response.data);
        
        if (!response.data) {
            throw new Error('No data received from server');
        }

        // Format the response data
        const formattedResponse = {
            cartItems: response.data.cartItems || [],
            totalPrice: response.data.totalPrice || 0,
            totalDiscountedPrice: response.data.totalDiscountedPrice || 0,
            discounte: response.data.discounte || 0
        };

        dispatch({
            type: ADD_ITEM_TO_CART_SUCCESS,
            payload: formattedResponse
        });

        // Fetch updated cart
        await dispatch(getCart());
        return formattedResponse;
    } catch (error) {
        console.error('Error adding item to cart:', error);
        
        // Handle authentication errors
        if (error.message === 'Authentication required') {
            dispatch({
                type: ADD_ITEM_TO_CART_FAILURE,
                payload: 'Please login to add items to cart'
            });
            window.location.href = '/login';
            return;
        }

        // Handle validation errors
        if (error.message.includes('Missing required fields')) {
            dispatch({
                type: ADD_ITEM_TO_CART_FAILURE,
                payload: error.message
            });
            return;
        }

        // Handle other errors
        dispatch({
            type: ADD_ITEM_TO_CART_FAILURE,
            payload: error.response?.data?.message || error.message || 'Error adding item to cart'
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

export const updateCartItem = (cartItemId, data) => async (dispatch) => {
    try {
        dispatch({ type: UPDATE_CART_ITEM_REQUEST });
        console.log('Updating cart item:', { cartItemId, data });

        // Ensure cart exists before updating item
        await ensureCart();

        const response = await api.put(`/api/cart/update/${cartItemId}`, data);
        console.log('Update item response:', response.data);
        
        if (!response.data) {
            throw new Error('No data received from server');
        }

        dispatch({
            type: UPDATE_CART_ITEM_SUCCESS,
            payload: response.data
        });

        // Fetch updated cart
        await dispatch(getCart());
        return response.data;
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
  