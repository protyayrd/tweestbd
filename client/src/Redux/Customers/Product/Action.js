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
import api, { API_BASE_URL } from '../../../config/api';

// Selectors
export const selectCustomerProducts = state => state.customersProduct;
export const selectCategories = state => state.category;

export const findProducts = (reqData) => async (dispatch) => {
  dispatch({ type: FIND_PRODUCTS_BY_CATEGORY_REQUEST });
  
  try {
    // Build query parameters
    const params = new URLSearchParams();
    
    // Add category and subcategories parameters
    if (reqData.category) {
      params.append("category", reqData.category);
    }
    if (reqData.subcategories && Array.isArray(reqData.subcategories)) {
      reqData.subcategories.forEach(subcat => {
        if (subcat) params.append("subcategories", subcat);
      });
    }
    
    // Add pagination parameters
    if (reqData.pageNumber) params.append("pageNumber", reqData.pageNumber);
    if (reqData.pageSize) params.append("pageSize", reqData.pageSize);
    
    // Add sorting parameter
    if (reqData.sort) params.append("sort", reqData.sort);
    
    // Add filter parameters
    if (reqData.minPrice) params.append("minPrice", reqData.minPrice);
    if (reqData.maxPrice) params.append("maxPrice", reqData.maxPrice);
    if (reqData.colors && reqData.colors.length > 0) params.append("colors", reqData.colors.join(','));
    if (reqData.sizes && reqData.sizes.length > 0) params.append("sizes", reqData.sizes.join(','));
    if (reqData.minDiscount) params.append("minDiscount", reqData.minDiscount);
    if (reqData.rating) params.append("rating", reqData.rating);
    if (reqData.stock) params.append("stock", reqData.stock);
    if (reqData.isNewArrival) params.append("isNewArrival", reqData.isNewArrival);
    if (reqData.isFeatured) params.append("isFeatured", reqData.isFeatured);
    if (reqData.search) params.append("search", reqData.search);


    const requestUrl = `${API_BASE_URL}/api/products?${params.toString()}`;
    
    const response = await axios.get(requestUrl);
    
    if (!response.data) {
      throw new Error('No data received from API');
    }

    // Extract available filters from the response
    // The API should return an object with available filter options
    const availableFilters = response.data.availableFilters || {
      colors: [],
      sizes: []
    };

    // If the API doesn't provide available filters, try to extract them from the products
    if (!response.data.availableFilters && response.data.content && response.data.content.length > 0) {
      const products = response.data.content;
      
      // Extract unique colors
      const uniqueColors = new Set();
      products.forEach(product => {
        if (product.color) {
          // Color might be a string or an array
          if (Array.isArray(product.color)) {
            product.color.forEach(c => uniqueColors.add(c));
          } else {
            uniqueColors.add(product.color);
          }
        }
      });
      
      // Extract unique sizes
      const uniqueSizes = new Set();
      products.forEach(product => {
        if (product.size) {
          // Size might be a string or an array
          if (Array.isArray(product.size)) {
            product.size.forEach(s => uniqueSizes.add(s));
          } else {
            uniqueSizes.add(product.size);
          }
        }
      });
      
      availableFilters.colors = Array.from(uniqueColors);
      availableFilters.sizes = Array.from(uniqueSizes);
    }

    dispatch({
      type: FIND_PRODUCTS_BY_CATEGORY_SUCCESS,
      payload: {
        content: response.data.content || [],
        totalPages: response.data.totalPages || 1,
        currentPage: response.data.currentPage || 0,
        totalProducts: response.data.totalProducts || 0,
        availableFilters: availableFilters
      }
    });

    return response.data;
  } catch (error) {
    console.error("Error fetching products:", error);
    dispatch({
      type: FIND_PRODUCTS_BY_CATEGORY_FAILURE,
      payload: error.response?.data?.message || error.message
    });
    throw error;
  }
};

export const findProductById = (reqData) => async (dispatch) => {
  try {
    dispatch({ type: FIND_PRODUCT_BY_ID_REQUEST });

    // Remove any auth headers for product viewing
    const { data } = await axios.get(`${API_BASE_URL}/api/products/id/${reqData.productId}`);

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

export const findProductBySlug = (slug) => async (dispatch) => {
  try {
    console.log('findProductBySlug called with slug:', slug);
    dispatch({ type: FIND_PRODUCT_BY_ID_REQUEST });

    // Remove any auth headers for product viewing
    const { data } = await axios.get(`${API_BASE_URL}/api/products/slug/${slug}`);
    console.log('findProductBySlug API response:', data);

    dispatch({
      type: FIND_PRODUCT_BY_ID_SUCCESS,
      payload: data,
    });
    console.log('findProductBySlug SUCCESS dispatched');
  } catch (error) {
    console.error('findProductBySlug ERROR:', error);
    console.error('Error response:', error.response);
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


    const { data } = await api.post(
      `/api/admin/products`,
      product,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );


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
    
    
    const { data } = await api.put(
      `/api/admin/products/${productId}`,
      updateData
    );
    
    
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
  try {
    dispatch({ type: DELETE_PRODUCT_REQUEST });

    let {data} = await api.delete(`/api/admin/products/${productId}`);


    dispatch({
      type: DELETE_PRODUCT_SUCCESS,
      payload: productId,
    });

  } catch (error) {
    dispatch({
      type: DELETE_PRODUCT_FAILURE,
      payload:
        error.response && error.response.data.message
          ? error.response.data.message
          : error.message,
    });
  }
};
