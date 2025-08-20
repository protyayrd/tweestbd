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
import api, { API_BASE_URL } from '../../../config/api';

export const createOrder = (reqData) => async (dispatch) => {
  try {
    dispatch({ type: CREATE_ORDER_REQUEST });

    // Add color to the orderItems
    const enhancedOrderItems = reqData.orderItems.map(item => {
      // Save the original order item
      const orderItem = {
        product: item.product,
        size: item.size,
        quantity: item.quantity,
        price: item.price,
        discountedPrice: item.discountedPrice,
        color: item.color // Explicitly include color
      };
      
      return orderItem;
    });

    const orderData = {
      address: reqData.address,
      orderItems: enhancedOrderItems,
      totalPrice: reqData.totalPrice,
      totalDiscountedPrice: reqData.totalDiscountedPrice,
      discount: reqData.discount,
      productDiscount: reqData.productDiscount,
      promoCodeDiscount: reqData.promoCodeDiscount,
      deliveryCharge: reqData.deliveryCharge || 0, // Explicitly include delivery charge
      promoDetails: reqData.promoDetails,
      totalItem: reqData.totalItem
    };


    const { data } = await api.post(
      `/api/orders/`,
      orderData,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${reqData.jwt}`,
        },
      }
    );
    
    // Store color information in the order payload for client-side use
    const orderWithColorInfo = {
      ...data,
      orderItems: data.orderItems.map((orderItem, index) => {
        // Get the original order item with color information
        const originalItem = reqData.orderItems[index];
        return {
          ...orderItem,
          color: originalItem.color,
          productDetails: originalItem.productDetails
        };
      })
    };
    
    dispatch({
      type: CREATE_ORDER_SUCCESS,
      payload: orderWithColorInfo,
    });

    return { payload: orderWithColorInfo };
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

    // Check if this is a guest checkout
    const isGuestCheckout = window.location.search.includes('guest=true');
    const isPaymentSuccessPage = window.location.pathname.includes('/payment/success');
    const hasPaymentParams = window.location.search.includes('paymentId=') || window.location.search.includes('transactionId=');
    
    console.log(`[getOrderById] Guest checkout: ${isGuestCheckout}, Order ID: ${orderId}`);
    console.log(`[getOrderById] Payment success page: ${isPaymentSuccessPage}, Has payment params: ${hasPaymentParams}`);
    
    // For guest checkout, we might need to handle the API call differently
    let data;
    
    try {
      console.log(`[getOrderById] Attempting to fetch order: ${orderId}`);
      const response = await api.get(`/api/orders/${orderId}`);
      data = response.data;
      console.log(`[getOrderById] Order data fetched successfully:`, data);
    } catch (error) {
      console.log(`[getOrderById] Error fetching order:`, error);
      
      // Check if this is a guest checkout authentication error
      const isAuthError = error.response?.status === 401;
      const isGuestOrderDetailsError = error.response?.data?.isGuestOrderDetails === true || 
                                      error.response?.data?.isGuestCheckout === true;
      
      console.log(`[getOrderById] Auth error: ${isAuthError}, Guest order details error: ${isGuestOrderDetailsError}`);
      
      // If we get an authentication error, try the guest order tracking endpoint
      if (isAuthError && (isGuestCheckout || isPaymentSuccessPage || hasPaymentParams || error.message?.includes('Authentication required'))) {
        console.log('[getOrderById] Trying guest order tracking endpoint due to auth error');
        
        try {
          console.log(`[getOrderById] Attempting guest order tracking for: ${orderId}`);
          const guestResponse = await api.get(`/api/orders/guest/track/${orderId}`);
          data = guestResponse.data;
          console.log(`[getOrderById] Guest order data fetched successfully:`, data);
        } catch (guestError) {
          console.log(`[getOrderById] Guest order tracking also failed:`, guestError);
          
          // If guest tracking also fails but we're on a payment success page, provide minimal order data
          if (isPaymentSuccessPage && hasPaymentParams) {
            console.log('[getOrderById] Payment success page - providing minimal order data');
        
        // Create a formatted order ID from the actual order ID
        const formattedId = `Order #${orderId.substring(0, 8)}`;
        console.log(`[getOrderById] Created formatted ID: ${formattedId}`);
        
        // Create a minimal order object with the essential information
        data = {
          _id: orderId,
          formattedId: formattedId,
          orderItems: [],
          createdAt: new Date().toISOString(),
          totalPrice: 0,
          totalDiscountedPrice: 0,
          shippingPrice: 0,
          deliveryCharge: 0,
          discount: 0,
          paymentMethod: window.location.search.includes('payment_type=cod') ? 'COD' : 'OUTLET',
          orderStatus: 'PLACED',
          // Try to get shipping address and pricing from localStorage for guest orders
          ...(() => {
            try {
              const guestOrderData = localStorage.getItem('guestOrderData');
              const guestCart = localStorage.getItem('guestCart');
              
              if (guestOrderData) {
                const parsedOrderData = JSON.parse(guestOrderData);
                return {
                  shippingAddress: parsedOrderData.shippingAddress || parsedOrderData.address,
                  totalPrice: parsedOrderData.totalPrice || 0,
                  totalDiscountedPrice: parsedOrderData.totalDiscountedPrice || 0,
                  deliveryCharge: parsedOrderData.deliveryCharge || 0,
                  shippingPrice: parsedOrderData.deliveryCharge || 0,
                  discount: parsedOrderData.discount || 0
                };
              } else if (guestCart) {
                const parsedCart = JSON.parse(guestCart);
                return {
                  shippingAddress: parsedCart.shippingAddress,
                  totalPrice: parsedCart.totalPrice || 0,
                  totalDiscountedPrice: parsedCart.totalDiscountedPrice || 0,
                  deliveryCharge: parsedCart.deliveryCharge || 0,
                  shippingPrice: parsedCart.deliveryCharge || 0,
                  discount: parsedCart.discount || 0
                };
              }
              return {};
            } catch (e) {
              console.log('Error parsing guest order data:', e);
              return {};
            }
          })()
        };
        
        console.log('[getOrderById] Created minimal order data:', data);
          } else {
            console.log('[getOrderById] Re-throwing error as not a guest checkout scenario');
            throw error;
          }
        }
      } else {
        console.log('[getOrderById] Re-throwing error as not a guest checkout scenario');
        throw error;
      }
    }
    
    // Enhance the order data with color information if it's missing
    const enhancedOrder = {
      ...data,
      orderItems: data.orderItems?.map(item => {
        return {
          ...item,
          color: item.color || 'Unknown', // Default to "Unknown" if no color specified
          productDetails: item.productDetails || {
            title: item.product?.title,
            imageUrl: item.product?.imageUrl
          }
        };
      }) || []
    };
    
    console.log('[getOrderById] Enhanced order data:', enhancedOrder);
    
    dispatch({
      type: GET_ORDER_BY_ID_SUCCESS,
      payload: enhancedOrder,
    });
    
    return enhancedOrder;
  } catch (error) {
    console.log('[getOrderById] Final error:', error);
    
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
    
    // The server returns data.data.orders and data.data.stats
    // Make sure we're passing the correct structure to the reducer
    if (data && data.data) {
      dispatch({
        type: GET_ORDER_HISTORY_SUCCESS,
        payload: data.data, // This contains both orders and stats
      });
    } else {
      console.error("Unexpected response format:", data);
      dispatch({
        type: GET_ORDER_HISTORY_FAILURE,
        payload: "Unexpected server response format",
      });
    }
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

export const getGuestOrderById = (orderId) => async (dispatch) => {
  try {
    dispatch({ type: GET_ORDER_BY_ID_REQUEST });

    console.log(`[getGuestOrderById] Fetching guest order: ${orderId}`);
    
    // Use the guest order tracking endpoint
    const response = await api.get(`/api/orders/guest/track/${orderId}`);
    const data = response.data;
    
    console.log(`[getGuestOrderById] Guest order data fetched successfully:`, data);
    
    // Enhance the order data with color information if it's missing
    const enhancedOrder = {
      ...data,
      orderItems: data.orderItems?.map(item => {
        return {
          ...item,
          color: item.color || 'Unknown', // Default to "Unknown" if no color specified
          productDetails: item.productDetails || {
            title: item.product?.title,
            imageUrl: item.product?.imageUrl
          }
        };
      }) || []
    };
    
    console.log('[getGuestOrderById] Enhanced guest order data:', enhancedOrder);
    
    dispatch({
      type: GET_ORDER_BY_ID_SUCCESS,
      payload: enhancedOrder,
    });
    
    return enhancedOrder;
  } catch (error) {
    console.log('[getGuestOrderById] Error:', error);
    
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
