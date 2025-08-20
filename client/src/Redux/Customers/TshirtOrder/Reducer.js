import {
  CREATE_TSHIRT_ORDER_REQUEST,
  CREATE_TSHIRT_ORDER_SUCCESS,
  CREATE_TSHIRT_ORDER_FAILURE,
  GET_TSHIRT_ORDERS_REQUEST,
  GET_TSHIRT_ORDERS_SUCCESS,
  GET_TSHIRT_ORDERS_FAILURE,
  UPDATE_TSHIRT_ORDER_REQUEST,
  UPDATE_TSHIRT_ORDER_SUCCESS,
  UPDATE_TSHIRT_ORDER_FAILURE,
  DELETE_TSHIRT_ORDER_REQUEST,
  DELETE_TSHIRT_ORDER_SUCCESS,
  DELETE_TSHIRT_ORDER_FAILURE
} from './ActionType';

const initialState = {
  loading: false,
  error: null,
  orders: [],
  selectedOrder: null
};

const tshirtOrderReducer = (state = initialState, action) => {
  switch (action.type) {
    case CREATE_TSHIRT_ORDER_REQUEST:
    case GET_TSHIRT_ORDERS_REQUEST:
    case UPDATE_TSHIRT_ORDER_REQUEST:
    case DELETE_TSHIRT_ORDER_REQUEST:
      return {
        ...state,
        loading: true,
        error: null
      };

    case CREATE_TSHIRT_ORDER_SUCCESS:
      return {
        ...state,
        loading: false,
        orders: [...state.orders, action.payload]
      };

    case GET_TSHIRT_ORDERS_SUCCESS:
      return {
        ...state,
        loading: false,
        orders: action.payload
      };

    case UPDATE_TSHIRT_ORDER_SUCCESS:
      return {
        ...state,
        loading: false,
        orders: state.orders.map(order => 
          order._id === action.payload._id ? action.payload : order
        )
      };

    case DELETE_TSHIRT_ORDER_SUCCESS:
      return {
        ...state,
        loading: false,
        orders: state.orders.filter(order => order._id !== action.payload)
      };

    case CREATE_TSHIRT_ORDER_FAILURE:
    case GET_TSHIRT_ORDERS_FAILURE:
    case UPDATE_TSHIRT_ORDER_FAILURE:
    case DELETE_TSHIRT_ORDER_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload
      };

    default:
      return state;
  }
}; 

export default tshirtOrderReducer; 