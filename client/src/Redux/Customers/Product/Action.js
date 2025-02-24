import axios from "axios";

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
  DELETE_PRODUCT_SUCCESS,
  DELETE_PRODUCT_FAILURE,
} from "./ActionType";
import api, { API_BASE_URL } from "../../../config/api";

// Selectors
export const selectCustomerProducts = state => state.customersProduct;
export const selectCategories = state => state.category;

export const findProducts = (reqData) => async (dispatch) => {
  dispatch({ type: FIND_PRODUCTS_BY_CATEGORY_REQUEST });
  
  try {
    // Build query parameters
    const params = new URLSearchParams();
    
    // Add all possible filter parameters
    if (reqData.category) params.append("category", reqData.category);
    if (reqData.pageNumber) params.append("pageNumber", reqData.pageNumber);
    if (reqData.pageSize) params.append("pageSize", reqData.pageSize);
    if (reqData.sort) params.append("sort", reqData.sort);
    if (reqData.minPrice) params.append("minPrice", reqData.minPrice);
    if (reqData.maxPrice) params.append("maxPrice", reqData.maxPrice);
    if (reqData.colors && reqData.colors.length > 0) params.append("colors", reqData.colors.join(','));
    if (reqData.sizes && reqData.sizes.length > 0) params.append("sizes", reqData.sizes.join(','));

    console.log("Filter params:", Object.fromEntries(params.entries()));

    const requestUrl = `/api/products?${params.toString()}`;
    console.log("Fetching products with URL:", requestUrl);
    
    const response = await api.get(requestUrl);
    console.log("Products API response:", response.data);
    
    if (!response.data) {
      console.error("Invalid API response:", response);
      throw new Error('No data received from API');
    }

    dispatch({
      type: FIND_PRODUCTS_BY_CATEGORY_SUCCESS,
      payload: {
        content: response.data.content || [],
        totalPages: response.data.totalPages || 1,
        currentPage: response.data.currentPage || 0,
        totalProducts: response.data.totalProducts || 0,
        availableFilters: response.data.availableFilters || {
          colors: [],
          sizes: []
        }
      }
    });

    return response.data;
  } catch (error) {
    console.error("Error fetching products:", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      config: error.config
    });
    
    const errorMessage = error.response?.data?.message 
      || error.response?.data?.error 
      || error.message 
      || 'Failed to fetch products';
      
    dispatch({
      type: FIND_PRODUCTS_BY_CATEGORY_FAILURE,
      payload: errorMessage
    });

    throw error;
  }
};

export const findProductById = (reqData) => async (dispatch) => {
  try {
    dispatch({ type: FIND_PRODUCT_BY_ID_REQUEST });

    // Remove any auth headers for product viewing
    const { data } = await axios.get(`${API_BASE_URL}/api/products/id/${reqData.productId}`);

    console.log("products by id : ", data);
    dispatch({
      type: FIND_PRODUCT_BY_ID_SUCCESS,
      payload: data,
    });
  } catch (error) {
    dispatch({
      type: FIND_PRODUCT_BY_ID_FAILURE,
      payload:
        error.response && error.response.data.message
          ? error.response.data.message
          : error.message,
    });
  }
};

export const createProduct = (product) => async (dispatch) => {
  try {
    dispatch({ type: CREATE_PRODUCT_REQUEST });

    console.log('Creating product with data:', product);

    const { data } = await api.post(
      '/api/admin/products',
      product,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    console.log('Product created successfully:', data);

    dispatch({
      type: CREATE_PRODUCT_SUCCESS,
      payload: data,
    });

    return data;
  } catch (error) {
    console.error('Error creating product:', error);
    const errorMessage = error.response?.data?.message 
      || error.response?.data?.error 
      || error.message 
      || 'Failed to create product';
      
    dispatch({
      type: CREATE_PRODUCT_FAILURE,
      payload: errorMessage
    });
    throw error;
  }
};

export const updateProduct = (productData) => async (dispatch) => {
  try {
    dispatch({ type: UPDATE_PRODUCT_REQUEST });

    const { productId, ...updateData } = productData;
    
    console.log("Updating product:", { productId, updateData });
    
    const { data } = await api.put(
      `/api/admin/products/${productId}`,
      updateData
    );
    
    console.log("Product updated successfully:", data);
    
    dispatch({
      type: UPDATE_PRODUCT_SUCCESS,
      payload: data,
    });

    return data;
  } catch (error) {
    console.error("Error updating product:", error);
    dispatch({
      type: UPDATE_PRODUCT_FAILURE,
      payload:
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        'Failed to update product'
    });
    throw error;
  }
};

export const deleteProduct = (productId) => async (dispatch) => {
  console.log("delete product action",productId)
  try {
    dispatch({ type: DELETE_PRODUCT_REQUEST });

    let {data}=await api.delete(`/api/admin/products/${productId}`);

    console.log("delete product ",data)

    dispatch({
      type: DELETE_PRODUCT_SUCCESS,
      payload: productId,
    });

    console.log("product delte ",data)
  } catch (error) {
    console.log("catch error ",error)
    dispatch({
      type: DELETE_PRODUCT_FAILURE,
      payload:
        error.response && error.response.data.message
          ? error.response.data.message
          : error.message,
    });
  }
};
