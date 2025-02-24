import api from '../../../config/api';
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

// Create Edushop Category
export const createEdushopCategory = (formData, jwt) => async (dispatch) => {
  try {
    dispatch({ type: CREATE_EDUSHOP_CATEGORY_REQUEST });

    const response = await api.post('/api/edushop', formData, {
      headers: {
        'Authorization': `Bearer ${jwt}`
      }
    });

    dispatch({
      type: CREATE_EDUSHOP_CATEGORY_SUCCESS,
      payload: response.data,
    });

    dispatch(getEdushopCategories());
  } catch (error) {
    console.error('Error creating edushop category:', error.response || error);
    dispatch({
      type: CREATE_EDUSHOP_CATEGORY_FAILURE,
      payload: error.response?.data?.message || error.message,
    });
  }
};

// Get All Edushop Categories
export const getEdushopCategories = () => async (dispatch) => {
  try {
    dispatch({ type: GET_EDUSHOP_CATEGORIES_REQUEST });

    const response = await api.get('/api/edushop');

    dispatch({
      type: GET_EDUSHOP_CATEGORIES_SUCCESS,
      payload: response.data,
    });
  } catch (error) {
    console.error('Error getting edushop categories:', error);
    dispatch({
      type: GET_EDUSHOP_CATEGORIES_FAILURE,
      payload: error.response?.data?.message || error.message,
    });
  }
};

// Update Edushop Category
export const updateEdushopCategory = (categoryId, data, jwt) => async (dispatch) => {
  try {
    dispatch({ type: UPDATE_EDUSHOP_CATEGORY_REQUEST });

    const formData = new FormData();
    Object.keys(data).forEach(key => {
      if (key !== 'logo' && key !== 'image') {
        formData.append(key, data[key]);
      }
    });
    if (data.logo) formData.append('logo', data.logo);
    if (data.image) formData.append('image', data.image);

    const response = await api.put(`/api/edushop/${categoryId}`, formData, {
      headers: {
        'Authorization': `Bearer ${jwt}`,
        'Content-Type': 'multipart/form-data'
      }
    });

    dispatch({
      type: UPDATE_EDUSHOP_CATEGORY_SUCCESS,
      payload: response.data,
    });

    dispatch(getEdushopCategories());
  } catch (error) {
    console.error('Error updating edushop category:', error);
    dispatch({
      type: UPDATE_EDUSHOP_CATEGORY_FAILURE,
      payload: error.response?.data?.message || error.message,
    });
  }
};

// Delete Edushop Category
export const deleteEdushopCategory = (categoryId, jwt) => async (dispatch) => {
  try {
    dispatch({ type: DELETE_EDUSHOP_CATEGORY_REQUEST });

    await api.delete(`/api/edushop/${categoryId}`, {
      headers: {
        'Authorization': `Bearer ${jwt}`
      }
    });

    dispatch({
      type: DELETE_EDUSHOP_CATEGORY_SUCCESS,
      payload: categoryId,
    });

    dispatch(getEdushopCategories());
  } catch (error) {
    console.error('Error deleting edushop category:', error);
    dispatch({
      type: DELETE_EDUSHOP_CATEGORY_FAILURE,
      payload: error.response?.data?.message || error.message,
    });
  }
}; 