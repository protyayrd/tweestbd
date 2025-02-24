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
    console.log("Creating payment with data:", reqData);
    try {
      dispatch({
        type: CREATE_PAYMENT_REQUEST,
      });
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${reqData.jwt}`,
        },
      };
  
      // Remove jwt from the request body
      const paymentData = {
        paymentMethod: reqData.paymentMethod,
        transactionId: reqData.transactionId,
        paymentPhoneNumber: reqData.paymentPhoneNumber
      };
  
      const { data } = await axios.post(`${API_BASE_URL}/api/payments/${reqData.orderId}`, paymentData, config);
  console.log("datta",data)
  if(data.payment_link_url){
    window.location.href=data.payment_link_url;
  }
      dispatch({
        type: CREATE_PAYMENT_SUCCESS,
        payload: data,
      });

      return data;
    } catch (error) {
      console.error("Payment error:", error.response?.data || error.message);
      
      const errorMessage = error.response?.data?.message 
          || error.response?.data?.error 
          || error.message 
          || 'Payment failed';

      dispatch({
        type: CREATE_PAYMENT_FAILURE,
        payload: errorMessage
      });

      throw new Error(errorMessage);
    }
  };
  



  export const updatePayment = (reqData) => {
    return async (dispatch) => {
      console.log("update payment reqData ",reqData)
      dispatch(updatePaymentRequest());
      try {
        const config = {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${reqData.jwt}`,
          },
        };
        const response = await axios.get(`${API_BASE_URL}/api/payments?payment_id=${reqData.paymentId}&order_id=${reqData.orderId}`,config);
        console.log("updated data ---- ",response.data)
        dispatch(updatePaymentSuccess(response.data));
      } catch (error) {
        dispatch(updatePaymentFailure(error.message));
        console.log("catch error ",error)
      }
    };
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

 
  