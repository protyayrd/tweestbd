import axios from 'axios';
import {
  REGISTER_REQUEST,
  REGISTER_SUCCESS,
  REGISTER_FAILURE,
  LOGIN_REQUEST,
  LOGIN_SUCCESS,
  LOGIN_FAILURE,
  GET_USER_REQUEST,
  GET_USER_SUCCESS,
  GET_USER_FAILURE,
  LOGOUT
} from './ActionTypes';
import api, { API_BASE_URL } from '../../config/api';

// Register action creators
const registerRequest = () => ({ type: REGISTER_REQUEST });
const registerSuccess = (user) => ({ type: REGISTER_SUCCESS, payload:user });
const registerFailure = error => ({ type: REGISTER_FAILURE, payload: error });

export const register = userData => async dispatch => {
  dispatch(registerRequest());
  try {
    const response = await api.post(`/auth/signup`, userData);
    const user = response.data;
    if(user.jwt) localStorage.setItem("jwt",user.jwt)
    dispatch(registerSuccess(user));
    return user;
  } catch (error) {
    console.error("Registration error:", error);
    const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message || 'Registration failed';
    dispatch(registerFailure(errorMessage));
    throw error;
  }
};

// Login action creators
const loginRequest = () => ({ type: LOGIN_REQUEST });
const loginSuccess = user => ({ type: LOGIN_SUCCESS, payload: user });
const loginFailure = error => ({ type: LOGIN_FAILURE, payload: error });

export const login = userData => async dispatch => {
  dispatch(loginRequest());
  try {
    const response = await api.post(`/auth/signin`, userData);
    const user = response.data;
    
    if (!user || !user.jwt) {
      throw new Error('Invalid response from server - no JWT token received');
    }
    
    localStorage.setItem("jwt", user.jwt);
    dispatch(loginSuccess(user));
    
    // Check for pending cart items to add after login
    const pendingCartItem = sessionStorage.getItem('pendingCartItem');
    if (pendingCartItem) {
      try {
        // Remove the item from session storage first to prevent duplicates
        sessionStorage.removeItem('pendingCartItem');
        // Import addItemToCart dynamically to avoid circular dependencies
        const cartModule = await import('../Customers/Cart/Action');
        dispatch(cartModule.addItemToCart(JSON.parse(pendingCartItem)));
      } catch (cartError) {
        console.error("Error adding pending cart item:", cartError);
      }
    }
    
    // Return the user data for the component to use
    return user;
  } catch (error) {
    console.error("Login error:", error);
    const errorMessage = error.response?.data?.message || error.message || 'Login failed';
    dispatch(loginFailure(errorMessage));
    throw error;
  }
};

//  get user from token
export const getUser = (token) => {
  return async (dispatch) => {
    dispatch({ type: GET_USER_REQUEST });
    try {
      
      // Clear previous failures that might be cached
      dispatch({ type: 'CLEAR_ERROR' });
      
      let tokenToUse = token;
      
      // If token is provided, use it directly
      // Otherwise use token from localStorage
      if (!token) {
        // Otherwise use token from localStorage
        tokenToUse = localStorage.getItem('jwt');
        if (!tokenToUse) {
          throw new Error("No authentication token found");
        }
      }
      
      // Set the Authorization header directly for this request only
      // Use a short timeout to prevent hanging requests
      const response = await api.get(`/api/users/profile`, {
        headers: {
          'Authorization': `Bearer ${tokenToUse}`
        },
        timeout: 8000 // 8 second timeout
      });
      
      if (!response.data) {
        throw new Error("No user data received from server");
      }
      
      const user = response.data;
      
      // Update visit counter on successful authentication
      if (window.location.pathname.includes('/auth/google/callback')) {
        sessionStorage.removeItem('google_callback_visits');
        
        // Check for pending cart item to add after Google login
        const pendingCartItem = sessionStorage.getItem('pendingCartItem');
        if (pendingCartItem) {
          try {
            // Dynamically import the cart actions to avoid circular dependencies
            const cartModule = await import('../Customers/Cart/Action');
            
            // First get the current cart to make sure it's initialized
            await dispatch(cartModule.getCart());
            
            // Then try to add the pending item to cart
            await dispatch(cartModule.addItemToCart(JSON.parse(pendingCartItem)));
            
            // Remove the item from session storage
            sessionStorage.removeItem('pendingCartItem');
          } catch (cartError) {
            console.error("Error adding pending cart item:", cartError);
            // Don't remove the item from session storage, so we can try again later
          }
        }
      }
      
      dispatch({ type: GET_USER_SUCCESS, payload: user });
      return user;
    } catch (error) {
      console.error("Error fetching user profile:", error);
      const errorMessage = error.response?.data?.message || error.message || "Failed to fetch user data";
      dispatch({ type: GET_USER_FAILURE, payload: errorMessage });
      
      // If this was during Google auth and failed, clear the token
      if (window.location.pathname.includes('/auth/google/callback')) {
        localStorage.removeItem('jwt');
      }
      
      throw error;
    }
  };
};

export const logout = (token) => {
    return async (dispatch) => {
      dispatch({ type: LOGOUT });
      localStorage.clear();
    };
  };

export const UPDATE_USER_PHONE_REQUEST = "UPDATE_USER_PHONE_REQUEST";
export const UPDATE_USER_PHONE_SUCCESS = "UPDATE_USER_PHONE_SUCCESS";
export const UPDATE_USER_PHONE_FAILURE = "UPDATE_USER_PHONE_FAILURE";

export const updateUserPhoneRequest = () => ({
  type: UPDATE_USER_PHONE_REQUEST
});

export const updateUserPhoneSuccess = (user) => ({
  type: UPDATE_USER_PHONE_SUCCESS,
  payload: user
});

export const updateUserPhoneFailure = (error) => ({
  type: UPDATE_USER_PHONE_FAILURE,
  payload: error
});

export const updateUserPhone = (phone) => async (dispatch) => {
  dispatch(updateUserPhoneRequest());
  try {
    const jwt = localStorage.getItem("jwt");
    if (!jwt) {
      throw new Error("No authentication token found");
    }

    // Update phone without OTP verification
    const response = await api.put('/auth/update-phone', { phone });
    
    // Mark user as verified in the UI by dispatching VERIFY_OTP_SUCCESS
    dispatch({ type: VERIFY_OTP_SUCCESS });
    
    // Only dispatch success if we get a valid response
    if (response.data) {
      // Update with isOTPVerified set to true
      const userData = { ...response.data, isOTPVerified: true };
      dispatch(updateUserPhoneSuccess(userData));
      return userData;
    } else {
      throw new Error('Failed to update phone number');
    }
  } catch (error) {
    console.error("Update phone error:", error.response?.data || error);
    const errorMessage = error.response?.data?.message || error.message;
    dispatch(updateUserPhoneFailure(errorMessage));
    throw error;
  }
};

export const SEND_OTP_REQUEST = "SEND_OTP_REQUEST";
export const SEND_OTP_SUCCESS = "SEND_OTP_SUCCESS";
export const SEND_OTP_FAILURE = "SEND_OTP_FAILURE";
export const VERIFY_OTP_REQUEST = "VERIFY_OTP_REQUEST";
export const VERIFY_OTP_SUCCESS = "VERIFY_OTP_SUCCESS";
export const VERIFY_OTP_FAILURE = "VERIFY_OTP_FAILURE";

export const sendOTP = (phone) => async (dispatch) => {
  dispatch({ type: SEND_OTP_REQUEST });
  try {
    const response = await api.post('/auth/send-otp', { phone });
    dispatch({ type: SEND_OTP_SUCCESS, payload: response.data });
    return response.data;
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message;
    dispatch({ type: SEND_OTP_FAILURE, payload: errorMessage });
    throw error;
  }
};

export const verifyOTP = (phone, otp) => async (dispatch) => {
  dispatch({ type: VERIFY_OTP_REQUEST });
  try {
    const response = await api.post('/auth/verify-otp', { phone, otp });
    
    // Only dispatch success if we get a valid response
    if (response.data && !response.data.error) {
      dispatch({ type: VERIFY_OTP_SUCCESS, payload: response.data });
      // Update user data in state if verification was successful
      if (response.data.user) {
        dispatch({ type: GET_USER_SUCCESS, payload: response.data.user });
      }
    } else {
      throw new Error(response.data.error || 'OTP verification failed');
    }
    
    return response.data;
  } catch (error) {
    console.error("Verify OTP error:", error.response?.data || error);
    const errorMessage = error.response?.data?.message || error.message;
    dispatch({ type: VERIFY_OTP_FAILURE, payload: errorMessage });
    throw error;
  }
};

export const UPDATE_USER_PROFILE_REQUEST = "UPDATE_USER_PROFILE_REQUEST";
export const UPDATE_USER_PROFILE_SUCCESS = "UPDATE_USER_PROFILE_SUCCESS";
export const UPDATE_USER_PROFILE_FAILURE = "UPDATE_USER_PROFILE_FAILURE";

export const updateUserProfileRequest = () => ({
  type: UPDATE_USER_PROFILE_REQUEST
});

export const updateUserProfileSuccess = (user) => ({
  type: UPDATE_USER_PROFILE_SUCCESS,
  payload: user
});

export const updateUserProfileFailure = (error) => ({
  type: UPDATE_USER_PROFILE_FAILURE,
  payload: error
});

export const updateUserProfile = (userData) => async (dispatch) => {
  dispatch(updateUserProfileRequest());
  try {
    const response = await api.put('/api/users/profile', userData);
    
    dispatch(updateUserProfileSuccess(response.data));
    return response.data;
  } catch (error) {
    console.error("Update profile error:", error.response?.data || error);
    const errorMessage = error.response?.data?.message || error.message;
    dispatch(updateUserProfileFailure(errorMessage));
    throw error;
  }
};

// Admin actions for customer management
export const ADMIN_UPDATE_CUSTOMER_REQUEST = "ADMIN_UPDATE_CUSTOMER_REQUEST";
export const ADMIN_UPDATE_CUSTOMER_SUCCESS = "ADMIN_UPDATE_CUSTOMER_SUCCESS";
export const ADMIN_UPDATE_CUSTOMER_FAILURE = "ADMIN_UPDATE_CUSTOMER_FAILURE";
export const ADMIN_DELETE_CUSTOMER_REQUEST = "ADMIN_DELETE_CUSTOMER_REQUEST";
export const ADMIN_DELETE_CUSTOMER_SUCCESS = "ADMIN_DELETE_CUSTOMER_SUCCESS";
export const ADMIN_DELETE_CUSTOMER_FAILURE = "ADMIN_DELETE_CUSTOMER_FAILURE";

export const adminUpdateCustomer = (customerId, userData) => async (dispatch) => {
  dispatch({ type: ADMIN_UPDATE_CUSTOMER_REQUEST });
  try {
    const response = await api.put(`/api/users/admin/customers/${customerId}`, userData);
    dispatch({ 
      type: ADMIN_UPDATE_CUSTOMER_SUCCESS,
      payload: response.data
    });
    return response.data;
  } catch (error) {
    dispatch({
      type: ADMIN_UPDATE_CUSTOMER_FAILURE,
      payload: error.response?.data?.message || error.message
    });
    throw error;
  }
};

export const adminDeleteCustomer = (customerId) => async (dispatch) => {
  dispatch({ type: ADMIN_DELETE_CUSTOMER_REQUEST });
  try {
    await api.delete(`/api/users/admin/customers/${customerId}`);
    dispatch({ 
      type: ADMIN_DELETE_CUSTOMER_SUCCESS,
      payload: customerId
    });
    return { success: true };
  } catch (error) {
    dispatch({
      type: ADMIN_DELETE_CUSTOMER_FAILURE,
      payload: error.response?.data?.message || error.message
    });
    throw error;
  }
};

// Password change actions
export const CHANGE_PASSWORD_REQUEST = "CHANGE_PASSWORD_REQUEST";
export const CHANGE_PASSWORD_SUCCESS = "CHANGE_PASSWORD_SUCCESS";
export const CHANGE_PASSWORD_FAILURE = "CHANGE_PASSWORD_FAILURE";

export const changePassword = (passwordData) => async (dispatch) => {
  dispatch({ type: CHANGE_PASSWORD_REQUEST });
  try {
    const response = await api.post('/api/users/change-password', passwordData);
    dispatch({ 
      type: CHANGE_PASSWORD_SUCCESS,
      payload: response.data
    });
    return response.data;
  } catch (error) {
    dispatch({
      type: CHANGE_PASSWORD_FAILURE,
      payload: error.response?.data?.message || error.response?.data?.error || error.message
    });
    throw error;
  }
};

// Admin password reset action
export const ADMIN_RESET_PASSWORD_REQUEST = "ADMIN_RESET_PASSWORD_REQUEST";
export const ADMIN_RESET_PASSWORD_SUCCESS = "ADMIN_RESET_PASSWORD_SUCCESS";
export const ADMIN_RESET_PASSWORD_FAILURE = "ADMIN_RESET_PASSWORD_FAILURE";

export const adminResetPassword = (userId, newPassword) => async (dispatch) => {
  dispatch({ type: ADMIN_RESET_PASSWORD_REQUEST });
  try {
    const response = await api.post(`/api/users/admin/customers/${userId}/reset-password`, { newPassword });
    dispatch({ 
      type: ADMIN_RESET_PASSWORD_SUCCESS,
      payload: response.data
    });
    return response.data;
  } catch (error) {
    dispatch({
      type: ADMIN_RESET_PASSWORD_FAILURE,
      payload: error.response?.data?.message || error.response?.data?.error || error.message
    });
    throw error;
  }
};

// Clear error action
export const CLEAR_ERROR = "CLEAR_ERROR";

export const clearError = () => ({
  type: CLEAR_ERROR
});

// Admin access verification action
export const VERIFY_ADMIN_ACCESS_REQUEST = "VERIFY_ADMIN_ACCESS_REQUEST";
export const VERIFY_ADMIN_ACCESS_SUCCESS = "VERIFY_ADMIN_ACCESS_SUCCESS";
export const VERIFY_ADMIN_ACCESS_FAILURE = "VERIFY_ADMIN_ACCESS_FAILURE";

export const verifyAdminAccessRequest = () => ({
  type: VERIFY_ADMIN_ACCESS_REQUEST
});

export const verifyAdminAccessSuccess = (data) => ({
  type: VERIFY_ADMIN_ACCESS_SUCCESS,
  payload: data
});

export const verifyAdminAccessFailure = (error) => ({
  type: VERIFY_ADMIN_ACCESS_FAILURE,
  payload: error
});

export const verifyAdminAccess = () => async (dispatch) => {
  dispatch(verifyAdminAccessRequest());
  try {
    const token = localStorage.getItem('jwt');
    
    if (!token) {
      throw new Error("No authentication token found");
    }
    
    // Make the request with explicit authorization header and timeout
    const response = await api.get('/api/users/verify-admin', {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      timeout: 10000 // 10 second timeout
    });
    
    dispatch(verifyAdminAccessSuccess(response.data));
    return response.data;
  } catch (error) {
    console.error("Admin verification error:", error.response?.data || error);
    
    let errorMessage = "Authentication failed";
    if (error.code === 'ECONNABORTED') {
      errorMessage = "Request timeout - please check your connection";
    } else if (error.response?.status === 401) {
      errorMessage = "Invalid or expired token";
    } else if (error.response?.status === 403) {
      errorMessage = "Access denied - admin privileges required";
    } else if (error.response?.data?.message) {
      errorMessage = error.response.data.message;
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    dispatch(verifyAdminAccessFailure(errorMessage));
    throw new Error(errorMessage);
  }
};
