import api from "../../../config/api";
import {
  canceledOrderFailure,
  canceledOrderRequest,
  canceledOrderSuccess,
  confirmedOrderFailure,
  confirmedOrderRequest,
  confirmedOrderSuccess,
  deleteOrderFailure,
  deleteOrderRequest,
  deleteOrderSuccess,
  deliveredOrderFailure,
  deliveredOrderRequest,
  deliveredOrderSuccess,
  getOrdersFailure,
  getOrdersRequest,
  getOrdersSuccess,
  placedOrderFailure,
  placedOrderRequest,
  placedOrderSuccess,
  shipOrderFailure,
  shipOrderRequest,
  shipOrderSuccess,
  GET_ORDERS_REQUEST,
  GET_ORDERS_SUCCESS,
  GET_ORDERS_FAILURE
} from "./ActionCreator";

export const getOrders = (reqData) => async (dispatch) => {
  dispatch(getOrdersRequest());
  try {
    // Prepare URL with query parameters if filters are provided
    let url = `/api/admin/orders`;
    const { filters } = reqData;
    
    if (filters && Object.keys(filters).length > 0) {
      // Convert filters object to URL query parameters
      const queryParams = new URLSearchParams();
      
      if (filters.orderStatus) {
        queryParams.append('orderStatus', filters.orderStatus);
      }
      
      if (filters.sortBy) {
        queryParams.append('sortBy', filters.sortBy);
      }
      
      // Add any other filter parameters here if needed
      
      // Append query parameters to URL if there are any
      if (queryParams.toString()) {
        url += `?${queryParams.toString()}`;
      }
    }
    
    const response = await api.get(url, {
      headers: {
        Authorization: `Bearer ${reqData.jwt}`,
      },
    });
    dispatch(getOrdersSuccess(response.data));
  } catch (error) {
    dispatch(getOrdersFailure(error.message));
  }
};

export const confirmOrder = (orderId) => async (dispatch) => {
  dispatch(confirmedOrderRequest());
  const jwt = localStorage.getItem("jwt");
  try {
    const response = await api.put(
      `/api/admin/orders/${orderId}/confirmed`,
      {},
      {
        headers: {
          Authorization: `Bearer ${jwt}`,
        },
      }
    );
    const data = response.data;
    dispatch(confirmedOrderSuccess(data));
  } catch (error) {
    console.error("Error confirming order:", error);
    dispatch(confirmedOrderFailure(error.message));
  }
};

export const shipOrder = (orderId) => async (dispatch) => {
  dispatch(shipOrderRequest());
  const jwt = localStorage.getItem("jwt");
  try {
    const { data } = await api.put(
      `/api/admin/orders/${orderId}/ship`,
      {},
      {
        headers: {
          Authorization: `Bearer ${jwt}`,
        },
      }
    );
    dispatch(shipOrderSuccess(data));
  } catch (error) {
    console.error("Error shipping order:", error);
    dispatch(shipOrderFailure(error.message));
  }
};

export const deliveredOrder = (orderId) => async (dispatch) => {
  dispatch(deliveredOrderRequest());
  const jwt = localStorage.getItem("jwt");
  try {
    const response = await api.put(
      `/api/admin/orders/${orderId}/deliver`,
      {},
      {
        headers: {
          Authorization: `Bearer ${jwt}`,
        },
      }
    );
    const data = response.data;
    dispatch(deliveredOrderSuccess(data));
  } catch (error) {
    console.error("Error delivering order:", error);
    dispatch(deliveredOrderFailure(error.message));
  }
};

export const cancelOrder = (orderId) => async (dispatch) => {
  dispatch(canceledOrderRequest());
  const jwt = localStorage.getItem("jwt");
  try {
    const response = await api.put(
      `/api/admin/orders/${orderId}/cancel`,
      {},
      {
        headers: {
          Authorization: `Bearer ${jwt}`,
        },
      }
    );
    const data = response.data;
    dispatch(canceledOrderSuccess(data));
  } catch (error) {
    console.error("Error canceling order:", error);
    dispatch(canceledOrderFailure(error.message));
  }
};

// Async action creator for deleting an order
export const deleteOrder = (orderId) => async (dispatch) => {
  dispatch(deleteOrderRequest());
  const jwt = localStorage.getItem("jwt");
  try {
    const { data } = await api.delete(
      `/api/admin/orders/${orderId}/delete`,
      {
        headers: {
          Authorization: `Bearer ${jwt}`,
        },
      }
    );
    dispatch(deleteOrderSuccess(orderId));
  } catch (error) {
    dispatch(deleteOrderFailure(error));
  }
};

// export const placeOrder = (order) => async (dispatch) => {
//   dispatch(placedOrderRequest());

//   try {
//     const response = await api.post(`/api/admin/orders/`, order);
//     const data = response.data;
//     dispatch(placedOrderSuccess(data));
//   } catch (error) {
//     dispatch(placedOrderFailure(error.message));
//   }
// };
