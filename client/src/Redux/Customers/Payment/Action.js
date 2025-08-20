import { API_BASE_URL } from '../../../config/api';
import {
    CREATE_PAYMENT_REQUEST,
    CREATE_PAYMENT_SUCCESS,
    CREATE_PAYMENT_FAILURE,
    UPDATE_PAYMENT_REQUEST,
    UPDATE_PAYMENT_SUCCESS,
    UPDATE_PAYMENT_FAILURE,
  } from './ActionType';
  
  import axios from 'axios';
  
  export const createPayment = (reqData) => async (dispatch) => {
    dispatch({ type: CREATE_PAYMENT_REQUEST });
    
    try {
      const { orderId, jwt, isGuestCheckout } = reqData;
      
      // Validate required fields
      if (!orderId) {
        const error = "Order ID is required";
        dispatch({
          type: CREATE_PAYMENT_FAILURE,
          payload: error,
        });
        return { error };
      }
      
      // Set up config with or without auth header based on guest status
      let config = {
        headers: {
          "Content-Type": "application/json",
        },
      };
      
      // Only add Authorization header for authenticated users
      if (jwt && !isGuestCheckout) {
        config.headers.Authorization = `Bearer ${jwt}`;
      }
      
      // Map paymentMethod based on paymentOption to match database enum values
      // Priority: Use paymentMethod if it's already correctly set, otherwise map from paymentOption
      let mappedPaymentMethod = "COD"; // default
      
      if (reqData.paymentMethod && ['SSLCommerz', 'bKash', 'COD', 'Outlet'].includes(reqData.paymentMethod)) {
        // If paymentMethod is already correctly set, use it
        mappedPaymentMethod = reqData.paymentMethod;
      } else if (reqData.paymentOption === 'cod') {
        mappedPaymentMethod = "COD";
      } else if (reqData.paymentOption === 'outlet') {
        mappedPaymentMethod = "Outlet";
      } else if (reqData.paymentOption === 'online') {
        mappedPaymentMethod = "SSLCommerz";
      } else if (reqData.paymentOption === 'bkash') {
        mappedPaymentMethod = "bKash";
      }
      
      // Create payment data object with mapped payment method
      const paymentData = {
        orderId,
        paymentMethod: mappedPaymentMethod,
        amount: reqData.amount,
        dueAmount: reqData.dueAmount || 0,
        transactionId: reqData.transactionId || `ORDER-${orderId}-${Date.now()}`,
        paymentPhoneNumber: reqData.paymentPhoneNumber || '',
        customerName: reqData.customerName || '',
        customerEmail: reqData.customerEmail || '',
        paymentOption: reqData.paymentOption || 'cod',
        isGuestCheckout: isGuestCheckout || false,
        // Include shipping address for guest checkout
        shippingAddress: reqData.shippingAddress || {}
      };
      
      // Log payment data
      console.log('payment details:', {
        orderId,
        paymentMethod: paymentData.paymentMethod,
        amount: paymentData.amount,
        dueAmount: paymentData.dueAmount,
        paymentOption: paymentData.paymentOption,
        transactionId: paymentData.transactionId,
        isGuestCheckout: paymentData.isGuestCheckout
      });
      
      // Validate phone number
      if (!paymentData.paymentPhoneNumber) {
        const error = "Payment phone number is required";
        dispatch({
          type: CREATE_PAYMENT_FAILURE,
          payload: error,
        });
        return { error };
      }
      
      // Additional validation for guest checkout
      if (isGuestCheckout) {
        if (!paymentData.shippingAddress) {
          const error = "Shipping address is required for guest checkout";
          dispatch({
            type: CREATE_PAYMENT_FAILURE,
            payload: error,
          });
          return { error };
        }
        
        // Validate required address fields for guest checkout
        const { shippingAddress } = paymentData;
        if (!shippingAddress.streetAddress) {
          const error = "Street address is required";
          dispatch({
            type: CREATE_PAYMENT_FAILURE,
            payload: error,
          });
          return { error };
        }
        
        if (!shippingAddress.division) {
          const error = "Division/State is required";
          dispatch({
            type: CREATE_PAYMENT_FAILURE,
            payload: error,
          });
          return { error };
        }
        
        if (!shippingAddress.district) {
          const error = "District/City is required";
          dispatch({
            type: CREATE_PAYMENT_FAILURE,
            payload: error,
          });
          return { error };
        }
      }
      
      // Use different endpoints for guest and authenticated users
      const endpoint = isGuestCheckout 
        ? `${API_BASE_URL}/api/payments/guest/create` 
        : `${API_BASE_URL}/api/payments/create`;
      
      // Log the endpoint being used
      console.log("Using payment endpoint:", endpoint);
      
      // Make the API request
      try {
        const response = await axios.post(
          endpoint,
          paymentData,
          config
        );
        
        const data = response.data;
        console.log("Payment API response:", data);
        
        // Check for COD success response first - for both guest and regular users
        // This is a special case where the success message might come with status: true
        if (data.status === true && 
            (data.message?.includes("Order confirmed with Cash on Delivery") || 
             data.message?.includes("COD") || 
             paymentData.paymentOption === 'cod')) {
          
          console.log("COD payment successful:", data);
          
          // Dispatch success action for COD
          dispatch({
            type: CREATE_PAYMENT_SUCCESS,
            payload: data,
          });
          
          // Return a standardized success response
          return { 
            success: true, 
            paymentId: data.paymentId,
            orderId: data.orderId,
            message: data.message || "Order confirmed with Cash on Delivery"
          };
        }
        
        // For other regular success responses
        if (data.status === true) {
          // Dispatch success action
          dispatch({
            type: CREATE_PAYMENT_SUCCESS,
            payload: data,
          });
            
          // Return the response data for the component to handle
          return { 
            success: true, 
            paymentUrl: data.paymentUrl,
            paymentId: data.paymentId,
            orderId: data.orderId,
            message: data.message
          };
        } 
        
        // For error responses with status: false
        console.error("Payment API returned status: false", data);
        const errorMsg = data.message || data.error || "Payment initialization failed";
        
        dispatch({
          type: CREATE_PAYMENT_FAILURE,
          payload: errorMsg,
        });
        
        return { error: errorMsg };
        
      } catch (apiError) {
        console.error("Payment API request error:", apiError);
        
        // Check for special COD success response in error message
        // (this is a workaround for a backend that returns COD success as an error response)
        if (apiError.response?.data?.message?.includes("Order confirmed with Cash on Delivery") ||
            (paymentData.paymentOption === 'cod' && apiError.response?.data?.orderId)) {
          
          console.log("Detected COD success in error response:", apiError.response.data);
          
          // Dispatch success action for this special case
          dispatch({
            type: CREATE_PAYMENT_SUCCESS,
            payload: apiError.response.data,
          });
          
          // Return success with message for COD
          return { 
            success: true, 
            orderId: apiError.response.data.orderId || orderId,
            message: "Order confirmed with Cash on Delivery"
          };
        }
        
        // Extract the error message from the response
        let errorMessage = "Payment initialization failed";
        
        if (apiError.response?.data?.message) {
          errorMessage = apiError.response.data.message;
        } else if (apiError.response?.data?.error) {
          errorMessage = apiError.response.data.error;
        } else if (apiError.message) {
          errorMessage = apiError.message;
        }
        
        // Handle specific HTTP status codes
        if (apiError.response?.status === 401) {
          errorMessage = "Authentication required for this operation";
        } else if (apiError.response?.status === 404) {
          errorMessage = "Order not found or no longer valid";
        } else if (apiError.response?.status === 400) {
          errorMessage = apiError.response.data.message || "Invalid payment data";
        } else if (apiError.response?.status === 500) {
          errorMessage = "Server error. Please try again later or contact support.";
        }
        
        dispatch({
          type: CREATE_PAYMENT_FAILURE,
          payload: errorMessage,
        });
        
        return { error: errorMessage };
      }
      
    } catch (error) {
      console.error("Unexpected payment error:", error);
      
      const errorMessage = error.message || "Payment initialization failed";
      
      dispatch({
        type: CREATE_PAYMENT_FAILURE,
        payload: errorMessage,
      });
      
      return { error: errorMessage };
    }
  };
  
  export const updatePayment = (reqData) => async (dispatch) => {
    dispatch({ type: UPDATE_PAYMENT_REQUEST });
    
    try {
      const { paymentId, jwt } = reqData;
      
      const config = {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwt}`,
        },
      };
      
      const response = await axios.get(
        `${API_BASE_URL}/api/payments/${paymentId}`,
        config
      );
      
      const data = response.data;
      
      if (data.success) {
        dispatch({
          type: UPDATE_PAYMENT_SUCCESS,
          payload: data,
        });
        
        return data;
      }
    } catch (error) {
      console.error("Payment update error:", error);
      
      dispatch({
        type: UPDATE_PAYMENT_FAILURE,
        payload: error.response?.data?.message || "Payment update failed",
      });
      
      return { error: error.response?.data?.message || "Payment update failed" };
    }
  };

export const updatePaymentRequest = () => {
  return {
    type: UPDATE_PAYMENT_REQUEST,
  };
};

export const updatePaymentSuccess = (payment) => {
  return {
    type: UPDATE_PAYMENT_SUCCESS,
    payload: payment,
  };
};

export const updatePaymentFailure = (error) => {
  return {
    type: UPDATE_PAYMENT_FAILURE,
    payload: error,
  };
};

 
  