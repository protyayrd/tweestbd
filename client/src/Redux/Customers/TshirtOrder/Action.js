import { API_BASE_URL } from '../../../config/api';
import {
  CREATE_TSHIRT_ORDER_REQUEST,
  CREATE_TSHIRT_ORDER_SUCCESS,
  CREATE_TSHIRT_ORDER_FAILURE,
  GET_TSHIRT_ORDERS_REQUEST,
  GET_TSHIRT_ORDERS_SUCCESS,
  GET_TSHIRT_ORDERS_FAILURE,
  DELETE_TSHIRT_ORDER_REQUEST,
  DELETE_TSHIRT_ORDER_SUCCESS,
  DELETE_TSHIRT_ORDER_FAILURE,
  UPDATE_TSHIRT_ORDER_REQUEST,
  UPDATE_TSHIRT_ORDER_SUCCESS,
  UPDATE_TSHIRT_ORDER_FAILURE
} from './ActionType';
import axios from 'axios';

// Create T-shirt Order
export const createTshirtOrder = (orderData) => async (dispatch) => {
  dispatch({ type: CREATE_TSHIRT_ORDER_REQUEST });
  
  try {
    const config = {
      headers: {
        'Content-Type': 'application/json',
      },
    };
    
    const response = await axios.post(
      `${API_BASE_URL}/api/tshirt-orders`,
      orderData,
      config
    );
    
    dispatch({
      type: CREATE_TSHIRT_ORDER_SUCCESS,
      payload: response.data,
    });

    return { success: true, data: response.data };
  } catch (error) {
    const errorMessage = error.response?.data?.message 
      || error.message 
      || 'Something went wrong';
    
    dispatch({
      type: CREATE_TSHIRT_ORDER_FAILURE,
      payload: errorMessage,
    });

    return { 
      success: false, 
      error: errorMessage
    };
  }
};

// Get T-shirt Orders
export const getTshirtOrders = () => async (dispatch) => {
  dispatch({ type: GET_TSHIRT_ORDERS_REQUEST });
  
  try {
    // Get JWT token from localStorage
    const jwt = localStorage.getItem('jwt');
    if (!jwt) {
      console.error('No JWT token found in localStorage');
    }
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': jwt ? `Bearer ${jwt}` : ''
      },
    };
    
    console.log('Making API request with config:', {
      url: `${API_BASE_URL}/api/tshirt-orders/admin`,
      hasAuthHeader: !!config.headers.Authorization
    });
    
    const response = await axios.get(
      `${API_BASE_URL}/api/tshirt-orders/admin`,
      config
    );
    
    // Add console logging to see the response data structure
    console.log('T-shirt orders API response:', response.data);
    
    // Check if data exists in the response
    if (response.data && response.data.data) {
      dispatch({
        type: GET_TSHIRT_ORDERS_SUCCESS,
        payload: response.data.data
      });
    } else {
      // If data is not in the expected format, try to use the response directly
      console.log('Data not in expected format, using response directly');
      dispatch({
        type: GET_TSHIRT_ORDERS_SUCCESS,
        payload: Array.isArray(response.data) ? response.data : []
      });
    }

    return response.data;
  } catch (error) {
    console.error('Error fetching t-shirt orders:', error);
    dispatch({
      type: GET_TSHIRT_ORDERS_FAILURE,
      payload: error.response?.data?.message || 'Something went wrong',
    });

    return { error: error.response?.data?.message || 'Failed to fetch orders' };
  }
};

// Update T-shirt Order
export const updateTshirtOrder = (orderId, updateData) => async (dispatch) => {
  dispatch({ type: UPDATE_TSHIRT_ORDER_REQUEST });
  
  try {
    const config = {
      headers: {
        'Content-Type': 'application/json',
      },
    };
    
    let response;
    if ('status' in updateData) {
      response = await axios.put(
        `${API_BASE_URL}/api/tshirt-orders/admin/${orderId}/status`,
        updateData,
        config
      );
    } else if ('paymentStatus' in updateData) {
      response = await axios.put(
        `${API_BASE_URL}/api/tshirt-orders/admin/${orderId}/payment-status`,
        updateData,
        config
      );
    }
    
    dispatch({
      type: UPDATE_TSHIRT_ORDER_SUCCESS,
      payload: response.data
    });

    return { success: true, data: response.data };
  } catch (error) {
    const errorMessage = error.response?.data?.message || 'Failed to update order';
    
    dispatch({
      type: UPDATE_TSHIRT_ORDER_FAILURE,
      payload: errorMessage,
    });

    return { success: false, error: errorMessage };
  }
};

// Delete T-shirt Order
export const deleteTshirtOrder = (orderId) => async (dispatch) => {
  dispatch({ type: DELETE_TSHIRT_ORDER_REQUEST });
  
  try {
    const config = {
      headers: {
        'Content-Type': 'application/json',
      },
    };
    
    await axios.delete(
      `${API_BASE_URL}/api/tshirt-orders/admin/${orderId}`,
      config
    );
    
    dispatch({
      type: DELETE_TSHIRT_ORDER_SUCCESS,
      payload: orderId
    });

    return { success: true };
  } catch (error) {
    const errorMessage = error.response?.data?.message || 'Failed to delete order';
    
    dispatch({
      type: DELETE_TSHIRT_ORDER_FAILURE,
      payload: errorMessage,
    });

    return { success: false, error: errorMessage };
  }
}; 