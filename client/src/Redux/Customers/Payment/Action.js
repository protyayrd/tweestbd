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
      const { orderId, jwt } = reqData;
      
      // Validate required fields
      if (!orderId) {
        const error = "Order ID is required";
        dispatch({
          type: CREATE_PAYMENT_FAILURE,
          payload: error,
        });
        return { error };
      }
      
      const config = {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwt}`,
        },
      };
      
      // Create payment data object with SSLCommerz as the payment method
      const paymentData = {
        orderId,
        paymentMethod: "SSLCommerz",
        amount: reqData.amount,
        transactionId: reqData.transactionId,
        paymentPhoneNumber: reqData.paymentPhoneNumber,
        customerName: reqData.customerName,
        customerEmail: reqData.customerEmail
      };
      
      console.log("Sending payment request:", paymentData);
      
      const response = await axios.post(
        `${API_BASE_URL}/api/payments/${orderId}`,
        paymentData,
        config
      );
      
      const data = response.data;
      
      if (data.success) {
        dispatch({
          type: CREATE_PAYMENT_SUCCESS,
          payload: data,
        });
        
        // For SSLCommerz, redirect to payment gateway
        if (data.payment_link_url) {
          window.location.href = data.payment_link_url;
        }
        
        return data;
      } else {
        throw new Error(data.message || "Payment creation failed");
      }
    } catch (error) {
      console.error("Payment creation error:", error);
      
      const errorMessage = error.response?.data?.message || error.message || "Payment creation failed";
      
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

 
  