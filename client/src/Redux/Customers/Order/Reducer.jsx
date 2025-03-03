import {
    CREATE_ORDER_REQUEST,
    CREATE_ORDER_SUCCESS,
    CREATE_ORDER_FAILURE,
    GET_ORDER_BY_ID_REQUEST,
    GET_ORDER_BY_ID_SUCCESS,
    GET_ORDER_BY_ID_FAILURE,
    GET_ORDER_HISTORY_REQUEST,
    GET_ORDER_HISTORY_SUCCESS,
    GET_ORDER_HISTORY_FAILURE,
  } from './ActionType';

  const initialState={
    orders:[],
    order:null,
    error:null,
    loading:false,
    orderCreated: false,
    stats: null
  }
  
  export const orderReducer = (state = initialState, action) => {
    switch (action.type) {
      case CREATE_ORDER_REQUEST:
        return {
          ...state,
          loading: true,
          error: null,
          orderCreated: false,
        };
      case CREATE_ORDER_SUCCESS:
        return {
          ...state,
          loading: false,
          order: action.payload,
          error: null,
          orderCreated: true,
        };
      case CREATE_ORDER_FAILURE:
        return {
          ...state,
          loading: false,
          error: action.payload,
          orderCreated: false,
        };
        case GET_ORDER_BY_ID_REQUEST:
        return {
          ...state,
          loading: true,
          error: null,
        };
      case GET_ORDER_BY_ID_SUCCESS:
        return {
          ...state,
          loading: false,
          order: action.payload,
          error: null,
        };
      case GET_ORDER_BY_ID_FAILURE:
        return {
          ...state,
          loading: false,
          error: action.payload,
        };
        case GET_ORDER_HISTORY_REQUEST:
            return {
              ...state,
              loading: true,
              error: null,
              orders: [],
              stats: null
            };
          case GET_ORDER_HISTORY_SUCCESS:
            return {
              ...state,
              loading: false,
              orders: action.payload.orders || [],
              error: null,
              stats: action.payload.stats || null
            };
          case GET_ORDER_HISTORY_FAILURE:
            return {
              ...state,
              loading: false,
              error: action.payload,
              orders: [],
              stats: null
            };
      default:
        return state;
    }
  };
  
 
  