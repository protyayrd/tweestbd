// Add bulk order action types
import {
  CREATE_BULK_ORDER_REQUEST,
  CREATE_BULK_ORDER_SUCCESS,
  CREATE_BULK_ORDER_FAILURE,
  GET_ALL_BULK_ORDERS_REQUEST,
  GET_ALL_BULK_ORDERS_SUCCESS,
  GET_ALL_BULK_ORDERS_FAILURE,
  UPDATE_BULK_ORDER_STATUS_REQUEST,
  UPDATE_BULK_ORDER_STATUS_SUCCESS,
  UPDATE_BULK_ORDER_STATUS_FAILURE,
  DELETE_BULK_ORDER_REQUEST,
  DELETE_BULK_ORDER_SUCCESS,
  DELETE_BULK_ORDER_FAILURE,
} from './Action';

const initialState = {
  // ... existing state ...
  bulkOrders: [],
  loading: false,
  error: null,
};

const orderReducer = (state = initialState, action) => {
  switch (action.type) {
    // ... existing cases ...

    // Create Bulk Order
    case CREATE_BULK_ORDER_REQUEST:
      return {
        ...state,
        loading: true,
        error: null,
      };
    case CREATE_BULK_ORDER_SUCCESS:
      return {
        ...state,
        loading: false,
        bulkOrders: [action.payload, ...state.bulkOrders],
      };
    case CREATE_BULK_ORDER_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload,
      };

    // Get All Bulk Orders
    case GET_ALL_BULK_ORDERS_REQUEST:
      return {
        ...state,
        loading: true,
        error: null,
      };
    case GET_ALL_BULK_ORDERS_SUCCESS:
      return {
        ...state,
        loading: false,
        bulkOrders: action.payload,
      };
    case GET_ALL_BULK_ORDERS_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload,
      };

    // Update Bulk Order Status
    case UPDATE_BULK_ORDER_STATUS_REQUEST:
      return {
        ...state,
        loading: true,
        error: null,
      };
    case UPDATE_BULK_ORDER_STATUS_SUCCESS:
      return {
        ...state,
        loading: false,
        bulkOrders: state.bulkOrders.map((order) =>
          order._id === action.payload._id ? action.payload : order
        ),
      };
    case UPDATE_BULK_ORDER_STATUS_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload,
      };

    // Delete Bulk Order
    case DELETE_BULK_ORDER_REQUEST:
      return {
        ...state,
        loading: true,
        error: null,
      };
    case DELETE_BULK_ORDER_SUCCESS:
      return {
        ...state,
        loading: false,
        bulkOrders: state.bulkOrders.filter(
          (order) => order._id !== action.payload
        ),
      };
    case DELETE_BULK_ORDER_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload,
      };

    default:
      return state;
  }
};

export default orderReducer; 