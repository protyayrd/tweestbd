import {
  FIND_PRODUCTS_BY_CATEGORY_REQUEST,
  FIND_PRODUCTS_BY_CATEGORY_SUCCESS,
  FIND_PRODUCTS_BY_CATEGORY_FAILURE,
  FIND_PRODUCT_BY_ID_REQUEST,
  FIND_PRODUCT_BY_ID_SUCCESS,
  FIND_PRODUCT_BY_ID_FAILURE,
  CREATE_PRODUCT_REQUEST,
  CREATE_PRODUCT_SUCCESS,
  CREATE_PRODUCT_FAILURE,
  UPDATE_PRODUCT_REQUEST,
  UPDATE_PRODUCT_SUCCESS,
  UPDATE_PRODUCT_FAILURE,
  DELETE_PRODUCT_REQUEST,
  DELETE_PRODUCT_FAILURE,
  DELETE_PRODUCT_SUCCESS,
} from "./ActionType";

const initialState = {
  products: {
    content: [],
    totalPages: 1,
    currentPage: 0,
    totalProducts: 0,
    availableFilters: {
      colors: [],
      sizes: []
    }
  },
  loading: false,
  error: null,
  product: null,
};

const customerProductReducer = (state = initialState, action) => {
  switch (action.type) {
    case FIND_PRODUCTS_BY_CATEGORY_REQUEST:
      return { 
        ...state, 
        loading: true, 
        error: null,
        products: {
          ...state.products,
          content: []
        }
      };

    case FIND_PRODUCTS_BY_CATEGORY_SUCCESS:
      console.log("Products received in reducer:", action.payload);
      return { 
        ...state, 
        loading: false,
        error: null,
        products: {
          content: action.payload.content || [],
          totalPages: action.payload.totalPages || 1,
          currentPage: action.payload.currentPage || 0,
          totalProducts: action.payload.totalProducts || 0,
          availableFilters: action.payload.availableFilters || {
            colors: [],
            sizes: []
          }
        }
      };

    case FIND_PRODUCTS_BY_CATEGORY_FAILURE:
      return { 
        ...state, 
        loading: false, 
        error: action.payload,
        products: {
          ...initialState.products
        }
      };

    case FIND_PRODUCT_BY_ID_REQUEST:
      return { 
        ...state, 
        loading: true, 
        error: null 
      };

    case FIND_PRODUCT_BY_ID_SUCCESS:
      return { 
        ...state, 
        product: action.payload, 
        loading: false 
      };

    case FIND_PRODUCT_BY_ID_FAILURE:
      return { 
        ...state, 
        loading: false, 
        error: action.payload,
        product: null
      };

    case CREATE_PRODUCT_REQUEST:
      return {
        ...state,
        loading: true,
        error: null,
      };

    case CREATE_PRODUCT_SUCCESS:
      // Add the new product to its category's content if it exists
      if (action.payload.category) {
        const categoryId = action.payload.category;
        return {
          ...state,
          loading: false,
          products: {
            ...state.products,
            [categoryId]: {
              ...state.products[categoryId],
              content: [
                ...(state.products[categoryId]?.content || []),
                action.payload
              ]
            }
          }
        };
      }
      return {
        ...state,
        loading: false
      };

    case CREATE_PRODUCT_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload,
      };

    case UPDATE_PRODUCT_REQUEST:
      return {
        ...state,
        loading: true,
        error: null,
      };

    case UPDATE_PRODUCT_SUCCESS:
      // Update the product in its category's content if it exists
      if (action.payload.category) {
        const categoryId = action.payload.category;
        return {
          ...state,
          loading: false,
          products: {
            ...state.products,
            [categoryId]: {
              ...state.products[categoryId],
              content: state.products[categoryId]?.content.map(
                product => product._id === action.payload._id ? action.payload : product
              )
            }
          }
        };
      }
      return {
        ...state,
        loading: false
      };

    case UPDATE_PRODUCT_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload,
      };

    case DELETE_PRODUCT_REQUEST:
      return {
        ...state,
        loading: true,
        error: null,
      };

    case DELETE_PRODUCT_SUCCESS:
      return {
        ...state,
        loading: false,
        products: {
          ...state.products,
          content: state.products.content.filter(
            product => product._id !== action.payload
          )
        }
      };

    case DELETE_PRODUCT_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload,
      };

    default:
      return state;
  }
};

export default customerProductReducer;
