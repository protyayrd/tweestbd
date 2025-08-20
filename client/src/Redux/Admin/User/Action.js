import { GET_CUSTOMERS_FAILURE, GET_CUSTOMERS_REQUEST, GET_CUSTOMERS_SUCCESS } from "./ActionType";
import axios from "axios";
import { API_BASE_URL } from "../../../config/api";

// Action creator to fetch all customers
export const getAllCustomers = () => async (dispatch) => {
  try {
    dispatch({ type: GET_CUSTOMERS_REQUEST });
    
    // Get token from localStorage
    const token = localStorage.getItem('jwt');
    
    if (!token) {
      throw new Error("Authentication token not found. Please log in again.");
    }
    
    // The correct endpoint based on our server configuration
    const response = await axios.get(`${API_BASE_URL}/api/users/admin/customers`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    
    dispatch({
      type: GET_CUSTOMERS_SUCCESS,
      payload: response.data
    });
    
  } catch (error) {
    console.error("Error fetching customers:", error);
    
    // Enhanced error reporting
    let errorMessage = "Failed to fetch customers data";
    
    if (error.response) {
      // The request was made and the server responded with a status code outside of 2xx
      errorMessage = error.response.data?.message || `Server error: ${error.response.status}`;
      
      if (error.response.status === 401 || error.response.status === 403) {
        errorMessage = "Authentication required or access denied. Please log in again.";
      }
    } else if (error.request) {
      // The request was made but no response was received
      errorMessage = "No response from server. Please check your network connection.";
    } else {
      // Something happened in setting up the request
      errorMessage = error.message;
    }
    
    dispatch({
      type: GET_CUSTOMERS_FAILURE,
      payload: errorMessage
    });
  }
}; 