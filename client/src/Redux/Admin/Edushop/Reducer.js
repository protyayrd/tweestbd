import {
  CREATE_EDUSHOP_CATEGORY_REQUEST,
  CREATE_EDUSHOP_CATEGORY_SUCCESS,
  CREATE_EDUSHOP_CATEGORY_FAILURE,
  GET_EDUSHOP_CATEGORIES_REQUEST,
  GET_EDUSHOP_CATEGORIES_SUCCESS,
  GET_EDUSHOP_CATEGORIES_FAILURE,
  UPDATE_EDUSHOP_CATEGORY_REQUEST,
  UPDATE_EDUSHOP_CATEGORY_SUCCESS,
  UPDATE_EDUSHOP_CATEGORY_FAILURE,
  DELETE_EDUSHOP_CATEGORY_REQUEST,
  DELETE_EDUSHOP_CATEGORY_SUCCESS,
  DELETE_EDUSHOP_CATEGORY_FAILURE
} from './ActionType';

const initialState = {
  categories: [],
  loading: false,
  error: null,
  success: false,
};

const edushopReducer = (state = initialState, action) => {
  switch (action.type) {
    case CREATE_EDUSHOP_CATEGORY_REQUEST:
    case GET_EDUSHOP_CATEGORIES_REQUEST:
    case UPDATE_EDUSHOP_CATEGORY_REQUEST:
    case DELETE_EDUSHOP_CATEGORY_REQUEST:
      return {
        ...state,
        loading: true,
        error: null,
        success: false,
      };

    case CREATE_EDUSHOP_CATEGORY_SUCCESS:
      return {
        ...state,
        loading: false,
        success: true,
        categories: [...state.categories, action.payload],
      };

    case GET_EDUSHOP_CATEGORIES_SUCCESS:
      return {
        ...state,
        loading: false,
        error: null,
        categories: Array.isArray(action.payload) ? action.payload : [],
      };

    case UPDATE_EDUSHOP_CATEGORY_SUCCESS:
      return {
        ...state,
        loading: false,
        success: true,
        error: null,
        categories: state.categories.map(category =>
          category._id === action.payload._id ? action.payload : category
        ),
      };

    case DELETE_EDUSHOP_CATEGORY_SUCCESS:
      return {
        ...state,
        loading: false,
        success: true,
        categories: state.categories.filter(category => category._id !== action.payload),
      };

    case CREATE_EDUSHOP_CATEGORY_FAILURE:
    case GET_EDUSHOP_CATEGORIES_FAILURE:
    case UPDATE_EDUSHOP_CATEGORY_FAILURE:
    case DELETE_EDUSHOP_CATEGORY_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload,
        success: false,
      };

    default:
      return state;
  }
};

export default edushopReducer; 