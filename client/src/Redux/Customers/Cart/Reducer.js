import {
  ADD_ITEM_TO_CART_FAILURE,
  ADD_ITEM_TO_CART_REQUEST,
  ADD_ITEM_TO_CART_SUCCESS,
  GET_CART_FAILURE,
  GET_CART_REQUEST,
  GET_CART_SUCCESS,
  REMOVE_CART_ITEM_FAILURE,
  REMOVE_CART_ITEM_REQUEST,
  REMOVE_CART_ITEM_SUCCESS,
  UPDATE_CART_ITEM_FAILURE,
  UPDATE_CART_ITEM_REQUEST,
  UPDATE_CART_ITEM_SUCCESS,
} from "./ActionType";

const initialState = {
  cart: null,
  cartItems: [],
  loading: false,
  error: null,
  totalPrice: 0,
  totalItem: 0,
  totalDiscountedPrice: 0,
  discounte: 0
};

const cartReducer = (state = initialState, action) => {
  switch (action.type) {
    case GET_CART_REQUEST:
    case ADD_ITEM_TO_CART_REQUEST:
    case REMOVE_CART_ITEM_REQUEST:
    case UPDATE_CART_ITEM_REQUEST:
      return {
        ...state,
        loading: true,
        error: null
      };

    case GET_CART_SUCCESS:
      return {
        ...state,
        loading: false,
        error: null,
        cart: action.payload,
        cartItems: action.payload.cartItems || [],
        totalPrice: action.payload.totalPrice || 0,
        totalItem: action.payload.totalItem || 0,
        totalDiscountedPrice: action.payload.totalDiscountedPrice || 0,
        discounte: action.payload.discounte || 0
      };

    case ADD_ITEM_TO_CART_SUCCESS:
      return {
        ...state,
        loading: false,
        error: null,
        cart: action.payload,
        cartItems: action.payload.cartItems || [],
        totalPrice: action.payload.totalPrice || 0,
        totalItem: action.payload.totalItem || 0,
        totalDiscountedPrice: action.payload.totalDiscountedPrice || 0,
        discounte: action.payload.discounte || 0
      };

    case REMOVE_CART_ITEM_SUCCESS:
      return {
        ...state,
        loading: false,
        error: null,
        cartItems: state.cartItems.filter(item => item._id !== action.payload),
        totalItem: state.totalItem > 0 ? state.totalItem - 1 : 0
      };

    case UPDATE_CART_ITEM_SUCCESS:
      return {
        ...state,
        loading: false,
        error: null,
        cart: action.payload,
        cartItems: action.payload.cartItems || [],
        totalPrice: action.payload.totalPrice || 0,
        totalItem: action.payload.totalItem || 0,
        totalDiscountedPrice: action.payload.totalDiscountedPrice || 0,
        discounte: action.payload.discounte || 0
      };

    case GET_CART_FAILURE:
    case ADD_ITEM_TO_CART_FAILURE:
    case REMOVE_CART_ITEM_FAILURE:
    case UPDATE_CART_ITEM_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload,
        cart: null,
        cartItems: [],
        totalPrice: 0,
        totalItem: 0,
        totalDiscountedPrice: 0,
        discounte: 0
      };

    default:
      return state;
  }
};

export default cartReducer;
