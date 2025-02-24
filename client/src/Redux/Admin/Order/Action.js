import api from '../../../config/api';

// Bulk Order Actions
export const CREATE_BULK_ORDER_REQUEST = 'CREATE_BULK_ORDER_REQUEST';
export const CREATE_BULK_ORDER_SUCCESS = 'CREATE_BULK_ORDER_SUCCESS';
export const CREATE_BULK_ORDER_FAILURE = 'CREATE_BULK_ORDER_FAILURE';

export const GET_ALL_BULK_ORDERS_REQUEST = 'GET_ALL_BULK_ORDERS_REQUEST';
export const GET_ALL_BULK_ORDERS_SUCCESS = 'GET_ALL_BULK_ORDERS_SUCCESS';
export const GET_ALL_BULK_ORDERS_FAILURE = 'GET_ALL_BULK_ORDERS_FAILURE';

export const UPDATE_BULK_ORDER_STATUS_REQUEST = 'UPDATE_BULK_ORDER_STATUS_REQUEST';
export const UPDATE_BULK_ORDER_STATUS_SUCCESS = 'UPDATE_BULK_ORDER_STATUS_SUCCESS';
export const UPDATE_BULK_ORDER_STATUS_FAILURE = 'UPDATE_BULK_ORDER_STATUS_FAILURE';

export const DELETE_BULK_ORDER_REQUEST = 'DELETE_BULK_ORDER_REQUEST';
export const DELETE_BULK_ORDER_SUCCESS = 'DELETE_BULK_ORDER_SUCCESS';
export const DELETE_BULK_ORDER_FAILURE = 'DELETE_BULK_ORDER_FAILURE';

// Create Bulk Order
export const createBulkOrder = (orderData) => async (dispatch) => {
  try {
    dispatch({ type: CREATE_BULK_ORDER_REQUEST });

    const response = await api.post('/api/bulk-orders', orderData);

    dispatch({
      type: CREATE_BULK_ORDER_SUCCESS,
      payload: response.data,
    });

    return response.data;
  } catch (error) {
    dispatch({
      type: CREATE_BULK_ORDER_FAILURE,
      payload: error.response?.data?.message || 'Something went wrong',
    });
    throw error;
  }
};

// Get All Bulk Orders
export const getAllBulkOrders = (filters = {}) => async (dispatch) => {
  try {
    dispatch({ type: GET_ALL_BULK_ORDERS_REQUEST });

    const queryParams = new URLSearchParams(filters).toString();
    const response = await api.get(`/api/bulk-orders/admin/all?${queryParams}`);

    dispatch({
      type: GET_ALL_BULK_ORDERS_SUCCESS,
      payload: response.data,
    });

    return response.data;
  } catch (error) {
    dispatch({
      type: GET_ALL_BULK_ORDERS_FAILURE,
      payload: error.response?.data?.message || 'Something went wrong',
    });
    throw error;
  }
};

// Update Bulk Order Status
export const updateBulkOrderStatus = (orderId, status) => async (dispatch) => {
  try {
    dispatch({ type: UPDATE_BULK_ORDER_STATUS_REQUEST });

    const response = await api.patch(`/api/bulk-orders/${orderId}/status`, {
      status,
    });

    dispatch({
      type: UPDATE_BULK_ORDER_STATUS_SUCCESS,
      payload: response.data,
    });

    return response.data;
  } catch (error) {
    dispatch({
      type: UPDATE_BULK_ORDER_STATUS_FAILURE,
      payload: error.response?.data?.message || 'Something went wrong',
    });
    throw error;
  }
};

// Delete Bulk Order
export const deleteBulkOrder = (orderId) => async (dispatch) => {
  try {
    dispatch({ type: DELETE_BULK_ORDER_REQUEST });

    const response = await api.delete(`/api/bulk-orders/${orderId}`);

    dispatch({
      type: DELETE_BULK_ORDER_SUCCESS,
      payload: orderId,
    });

    return response.data;
  } catch (error) {
    dispatch({
      type: DELETE_BULK_ORDER_FAILURE,
      payload: error.response?.data?.message || 'Something went wrong',
    });
    throw error;
  }
}; 