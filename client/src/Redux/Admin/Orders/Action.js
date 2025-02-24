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
    const response = await api.get(`/api/admin/orders`, {
      headers: {
        Authorization: `Bearer ${reqData.jwt}`,
      },
    });
    console.log("orders from api: ", response.data);
    dispatch(getOrdersSuccess(response.data));
  } catch (error) {
    console.log("catch error: ", error);
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
    console.log("confirm_order ", data);
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
    console.log("shipped order", data);
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
    console.log("delivered order ", data);
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
    console.log("delete order ", data);
    dispatch(deleteOrderSuccess(orderId));
  } catch (error) {
    console.log("catch error ", error);
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
