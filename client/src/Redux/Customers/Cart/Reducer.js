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
  APPLY_PROMO_CODE_REQUEST,
  APPLY_PROMO_CODE_SUCCESS,
  APPLY_PROMO_CODE_FAILURE,
  REMOVE_PROMO_CODE_REQUEST,
  REMOVE_PROMO_CODE_SUCCESS,
  REMOVE_PROMO_CODE_FAILURE,
  CLEAR_CART_REQUEST,
  CLEAR_CART_SUCCESS,
  CLEAR_CART_FAILURE
} from "./ActionType";

const initialState = {
  cart: null,
  cartItems: [],
  loading: false,
  error: null,
  totalPrice: 0,
  totalItem: 0,
  totalDiscountedPrice: 0,
  discount: 0,
  promoCodeDiscount: 0,
  promoDetails: null
};

const cartReducer = (state = initialState, action) => {
  switch (action.type) {
    case GET_CART_REQUEST:
    case ADD_ITEM_TO_CART_REQUEST:
    case REMOVE_CART_ITEM_REQUEST:
    case UPDATE_CART_ITEM_REQUEST:
    case APPLY_PROMO_CODE_REQUEST:
    case REMOVE_PROMO_CODE_REQUEST:
    case CLEAR_CART_REQUEST:
      return {
        ...state,
        loading: true,
        error: null
      };

    case GET_CART_SUCCESS:
    case ADD_ITEM_TO_CART_SUCCESS:
    case UPDATE_CART_ITEM_SUCCESS:
    case APPLY_PROMO_CODE_SUCCESS:
    case CLEAR_CART_SUCCESS:
      return {
        ...state,
        loading: false,
        error: null,
        cart: action.payload,
        cartItems: action.payload.cartItems || [],
        totalPrice: action.payload.totalPrice || 0,
        totalItem: action.payload.totalItem || 0,
        totalDiscountedPrice: action.payload.totalDiscountedPrice || 0,
        discount: action.payload.discount || 0,
        promoCodeDiscount: action.payload.promoCodeDiscount || 0,
        promoDetails: action.payload.promoDetails || null
      };
      
    case REMOVE_PROMO_CODE_SUCCESS:
      return {
        ...state,
        loading: false,
        error: null,
        cart: action.payload,
        cartItems: action.payload.cartItems || [],
        totalPrice: action.payload.totalPrice || 0,
        totalItem: action.payload.totalItem || 0,
        totalDiscountedPrice: action.payload.totalDiscountedPrice || 0,
        discount: action.payload.discount || 0,
        promoCodeDiscount: 0,
        promoDetails: null
      };

    case REMOVE_CART_ITEM_SUCCESS:
      return {
        ...state,
        loading: false,
        error: null,
        cartItems: state.cartItems.filter(item => item._id !== action.payload),
        totalItem: state.totalItem > 0 ? state.totalItem - 1 : 0
      };

    case GET_CART_FAILURE:
    case ADD_ITEM_TO_CART_FAILURE:
    case REMOVE_CART_ITEM_FAILURE:
    case UPDATE_CART_ITEM_FAILURE:
    case APPLY_PROMO_CODE_FAILURE:
    case REMOVE_PROMO_CODE_FAILURE:
    case CLEAR_CART_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload
      };

    default:
      return state;
  }
};

export default cartReducer;
