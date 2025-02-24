import api from '../../../config/api';
import {
  CREATE_CATEGORY_REQUEST,
  CREATE_CATEGORY_SUCCESS,
  CREATE_CATEGORY_FAILURE,
  GET_CATEGORIES_REQUEST,
  GET_CATEGORIES_SUCCESS,
  GET_CATEGORIES_FAILURE,
  UPDATE_CATEGORY_REQUEST,
  UPDATE_CATEGORY_SUCCESS,
  UPDATE_CATEGORY_FAILURE,
} from './ActionType';

// Delete Category Action Types
export const DELETE_CATEGORY_REQUEST = 'DELETE_CATEGORY_REQUEST';
export const DELETE_CATEGORY_SUCCESS = 'DELETE_CATEGORY_SUCCESS';
export const DELETE_CATEGORY_FAILURE = 'DELETE_CATEGORY_FAILURE';

export const createCategory = ({ data, jwt }) => async (dispatch) => {
  try {
    dispatch({ type: CREATE_CATEGORY_REQUEST });

    const response = await api.post('/api/categories', data, {
      headers: {
        'Authorization': `Bearer ${jwt}`,
        'Content-Type': 'multipart/form-data'
      }
    });

    dispatch({
      type: CREATE_CATEGORY_SUCCESS,
      payload: response.data,
    });

    // Fetch updated categories list
    dispatch(getCategories());

  } catch (error) {
    console.error('Error creating category:', error);
    dispatch({
      type: CREATE_CATEGORY_FAILURE,
      payload: error.response?.data?.message || error.message,
    });
  }
};

export const getCategories = () => async (dispatch) => {
  try {
    dispatch({ type: GET_CATEGORIES_REQUEST });

    const response = await api.get('/api/categories');
    console.log('Categories API Response:', response);

    if (!response.data) {
      throw new Error('No data received from categories API');
    }

    dispatch({
      type: GET_CATEGORIES_SUCCESS,
      payload: response.data,
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    dispatch({
      type: GET_CATEGORIES_FAILURE,
      payload: error.response?.data?.message || error.message,
    });
  }
};

export const updateCategory = ({ categoryId, data, jwt }) => async (dispatch) => {
  dispatch({ type: UPDATE_CATEGORY_REQUEST });

  try {
    console.log('Updating category:', {
      categoryId,
      data
    });
    
    const response = await api.put(`/api/categories/${categoryId}`, data, {
      headers: {
        'Authorization': `Bearer ${jwt}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('Category update response:', response.data);

    dispatch({
      type: UPDATE_CATEGORY_SUCCESS,
      payload: response.data
    });

    // Fetch updated categories
    dispatch(getCategories());
  } catch (error) {
    console.error('Error updating category:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      headers: error.response?.headers
    });
    dispatch({
      type: UPDATE_CATEGORY_FAILURE,
      payload: error.response?.data?.message || error.message
    });
  }
};

export const deleteCategory = ({ categoryId, jwt }) => async (dispatch) => {
  dispatch({ type: DELETE_CATEGORY_REQUEST });

  try {
    await api.delete(`/api/categories/${categoryId}`, {
      headers: {
        'Authorization': `Bearer ${jwt}`
      }
    });

    dispatch({
      type: DELETE_CATEGORY_SUCCESS,
      payload: categoryId
    });

    // Fetch updated categories
    dispatch(getCategories());
  } catch (error) {
    console.error('Error deleting category:', error);
    dispatch({
      type: DELETE_CATEGORY_FAILURE,
      payload: error.response?.data?.message || error.message
    });
  }
}; 