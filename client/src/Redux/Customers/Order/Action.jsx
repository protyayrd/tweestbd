import axios from "axios";
import {
  CREATE_ORDER_FAILURE,
  CREATE_ORDER_REQUEST,
  CREATE_ORDER_SUCCESS,
  GET_ORDER_BY_ID_FAILURE,
  GET_ORDER_BY_ID_REQUEST,
  GET_ORDER_BY_ID_SUCCESS,
  GET_ORDER_HISTORY_FAILURE,
  GET_ORDER_HISTORY_REQUEST,
  GET_ORDER_HISTORY_SUCCESS,
} from "./ActionType";
import api, { API_BASE_URL } from "../../../config/api";

export const createOrder = (reqData) => async (dispatch) => {
  try {
    dispatch({ type: CREATE_ORDER_REQUEST });

    const orderData = {
      address: reqData.address,
      orderItems: reqData.orderItems,
      totalPrice: reqData.totalPrice,
      totalDiscountedPrice: reqData.totalDiscountedPrice,
      discount: reqData.discount,
      productDiscount: reqData.productDiscount,
      promoCodeDiscount: reqData.promoCodeDiscount,
      promoDetails: reqData.promoDetails,
      totalItem: reqData.totalItem
    };

    console.log("Sending order data to server:", JSON.stringify(orderData, null, 2));

    const { data } = await api.post(
      `${API_BASE_URL}/api/orders/`,
      orderData,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${reqData.jwt}`,
        },
      }
    );
    
    dispatch({
      type: CREATE_ORDER_SUCCESS,
      payload: data,
    });

    return { payload: data };
  } catch (error) {
    console.error("Order creation error:", error.response?.data || error.message);
    
    let errorMessage = "Failed to create order. Please try again.";
    
    if (typeof error.response?.data === 'string') {
      errorMessage = error.response.data;
    } else if (error.response?.data?.message) {
      errorMessage = error.response.data.message;
    }

    dispatch({
      type: CREATE_ORDER_FAILURE,
      payload: errorMessage
    });

    throw error;
  }
};

export const getOrderById = (orderId) => async (dispatch) => {
  try {
    dispatch({ type: GET_ORDER_BY_ID_REQUEST });

    const { data } = await api.get(`/api/orders/${orderId}`);
    
    dispatch({
      type: GET_ORDER_BY_ID_SUCCESS,
      payload: data,
    });
    
    return data;
  } catch (error) {
    console.log("catch error: ", error);
    dispatch({
      type: GET_ORDER_BY_ID_FAILURE,
      payload:
        error.response && error.response.data.message
          ? error.response.data.message
          : error.message,
    });
    throw error;
  }
};

export const getOrderHistory = (reqData) => async (dispatch) => {
  try {
    dispatch({ type: GET_ORDER_HISTORY_REQUEST });

    const config = {
      headers: {
        Authorization: `Bearer ${reqData.jwt}`,
      },
    };

    const { data } = await api.get(`/api/orders/user`, config);
    console.log("order history -------- ", data);
    
    dispatch({
      type: GET_ORDER_HISTORY_SUCCESS,
      payload: data.data,
    });
  } catch (error) {
    console.error("Error fetching order history:", error);
    dispatch({
      type: GET_ORDER_HISTORY_FAILURE,
      payload:
        error.response && error.response.data.message
          ? error.response.data.message
          : error.message,
    });
  }
};
