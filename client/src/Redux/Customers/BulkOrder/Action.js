import api from '../../../config/api';
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

// Create Category
export const createCategory = (categoryData) => async (dispatch) => {
  try {
    dispatch({ type: CREATE_CATEGORY_REQUEST });
    const { data } = await api.post('/api/admin/bulk-orders/categories', categoryData);
    dispatch({
      type: CREATE_CATEGORY_SUCCESS,
      payload: data,
    });
    return data;
  } catch (error) {
    dispatch({
      type: CREATE_CATEGORY_FAILURE,
      payload: error.response?.data?.message || 'Something went wrong',
    });
    throw error;
  }
};

// Update Category
export const updateCategory = (categoryId, categoryData) => async (dispatch) => {
  try {
    dispatch({ type: UPDATE_CATEGORY_REQUEST });
    const { data } = await api.put(`/api/admin/bulk-orders/categories/${categoryId}`, categoryData);
    dispatch({
      type: UPDATE_CATEGORY_SUCCESS,
      payload: data,
    });
    return data;
  } catch (error) {
    dispatch({
      type: UPDATE_CATEGORY_FAILURE,
      payload: error.response?.data?.message || 'Something went wrong',
    });
    throw error;
  }
};

// Delete Category
export const deleteCategory = (categoryId) => async (dispatch) => {
  try {
    dispatch({ type: DELETE_CATEGORY_REQUEST });
    const { data } = await api.delete(`/api/admin/bulk-orders/categories/${categoryId}`);
    dispatch({
      type: DELETE_CATEGORY_SUCCESS,
      payload: categoryId,
    });
    return data;
  } catch (error) {
    dispatch({
      type: DELETE_CATEGORY_FAILURE,
      payload: error.response?.data?.message || 'Something went wrong',
    });
    throw error;
  }
};

// Get All Categories
export const getAllCategories = () => async (dispatch) => {
  try {
    dispatch({ type: GET_CATEGORIES_REQUEST });
    const { data } = await api.get('/api/admin/bulk-orders/categories');
    dispatch({
      type: GET_CATEGORIES_SUCCESS,
      payload: data,
    });
    return data;
  } catch (error) {
    dispatch({
      type: GET_CATEGORIES_FAILURE,
      payload: error.response?.data?.message || 'Something went wrong',
    });
    throw error;
  }
}; 