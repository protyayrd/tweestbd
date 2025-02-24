import {
  CREATE_CATEGORY_REQUEST,
  CREATE_CATEGORY_SUCCESS,
  CREATE_CATEGORY_FAILURE,
  UPDATE_CATEGORY_REQUEST,
  UPDATE_CATEGORY_SUCCESS,
  UPDATE_CATEGORY_FAILURE,
  DELETE_CATEGORY_REQUEST,
  DELETE_CATEGORY_SUCCESS,
  DELETE_CATEGORY_FAILURE,
  GET_CATEGORIES_REQUEST,
  GET_CATEGORIES_SUCCESS,
  GET_CATEGORIES_FAILURE,
} from './ActionType';

const initialState = {
  categories: [],
  loading: false,
  error: null,
};

export const bulkOrderCategoryReducer = (state = initialState, action) => {
  switch (action.type) {
    case CREATE_CATEGORY_REQUEST:
    case UPDATE_CATEGORY_REQUEST:
    case DELETE_CATEGORY_REQUEST:
    case GET_CATEGORIES_REQUEST:
      return {
        ...state,
        loading: true,
        error: null,
      };

    case CREATE_CATEGORY_SUCCESS:
      return {
        ...state,
        loading: false,
        categories: [...state.categories, action.payload],
      };

    case UPDATE_CATEGORY_SUCCESS:
      return {
        ...state,
        loading: false,
        categories: state.categories.map((category) =>
          category._id === action.payload._id ? action.payload : category
        ),
      };

    case DELETE_CATEGORY_SUCCESS:
      return {
        ...state,
        loading: false,
        categories: state.categories.filter(
          (category) => category._id !== action.payload
        ),
      };

    case GET_CATEGORIES_SUCCESS:
      return {
        ...state,
        loading: false,
        categories: action.payload,
      };

    case CREATE_CATEGORY_FAILURE:
    case UPDATE_CATEGORY_FAILURE:
    case DELETE_CATEGORY_FAILURE:
    case GET_CATEGORIES_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload,
      };

    default:
      return state;
  }
}; 