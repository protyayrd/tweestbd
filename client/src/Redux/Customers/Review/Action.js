import {
    CREATE_REVIEW_SUCCESS,
    CREATE_REVIEW_FAILURE,
    GET_ALL_REVIEWS_SUCCESS,
    GET_ALL_REVIEWS_FAILURE,
    CREATE_RATING_SUCCESS,
    CREATE_RATING_FAILURE,
    GET_ALL_RATINGS_SUCCESS,
    GET_ALL_RATINGS_FAILURE
  } from './ActionTyp';
import { API_BASE_URL } from '../../../config/api';
import axios from 'axios';

export const createReview = (reqData) => async (dispatch) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/reviews/create`, 
      reqData);

    dispatch({
      type: CREATE_REVIEW_SUCCESS,
      payload: response.data
    });
  } catch (error) {
    dispatch({
      type: CREATE_REVIEW_FAILURE,
      payload: error.message
    });
  }
};

export const getAllReviews = (productId) => {
  return async (dispatch) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/reviews/product/${productId}`);

      dispatch({
        type: GET_ALL_REVIEWS_SUCCESS,
        payload: response.data
      });
    } catch (error) {
      dispatch({
        type: GET_ALL_REVIEWS_FAILURE,
        payload: error.message
      });
    }
  };
};

export const createRating = (resData) => {
  return async (dispatch) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/ratings/create`, 
        resData);

      dispatch({
        type: CREATE_RATING_SUCCESS,
        payload: response.data
      });
    } catch (error) {
      dispatch({
        type: CREATE_RATING_FAILURE,
        payload: error.message
      });
    }
  };
};

export const getAllRatings = (productId) => {
  return async (dispatch) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/ratings/product/${productId}`, {
       
      });

      dispatch({
        type: GET_ALL_RATINGS_SUCCESS,
        payload: response.data
      });
    } catch (error) {
      dispatch({
        type: GET_ALL_RATINGS_FAILURE,
        payload: error.message
      });
    }
  };
};
