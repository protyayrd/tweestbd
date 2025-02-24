import axios from 'axios';
const DEPLOYED='http://localhost:5454'
const LOCALHOST='http://localhost:5454'

export const API_BASE_URL = LOCALHOST;

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000, // 10 second timeout
});

// Add a request interceptor to set the token before each request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('jwt');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      // Ensure content type is set for non-FormData requests
      if (!(config.data instanceof FormData)) {
        config.headers['Content-Type'] = 'application/json';
      }
    } else {
      // If no token is present and the request requires authentication,
      // redirect to login page
      const requiresAuth = [
        '/api/cart',
        '/api/cart/add',
        '/api/cart/remove',
        '/api/cart/update',
        '/api/orders',
        '/api/users/profile'
      ];
      
      const path = config.url?.replace(API_BASE_URL, '');
      if (requiresAuth.some(authPath => path?.startsWith(authPath))) {
        window.location.href = '/login';
        throw new Error('Authentication required');
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    // For cart endpoints, ensure the response has the expected structure
    const path = response.config.url?.replace(API_BASE_URL, '');
    if (path?.startsWith('/api/cart')) {
      const data = response.data;
      if (!data) {
        throw new Error('Invalid cart response: No data received');
      }
      
      // Ensure cartItems is always an array
      if (!Array.isArray(data.cartItems)) {
        data.cartItems = [];
      }
      
      // Ensure all required fields are present
      data.totalPrice = data.totalPrice || 0;
      data.totalItem = data.totalItem || 0;
      data.totalDiscountedPrice = data.totalDiscountedPrice || 0;
      data.discounte = data.discounte || 0;
      
      response.data = data;
    }
    return response;
  },
  (error) => {
    // Handle network errors
    if (!error.response) {
      console.error('Network error:', error);
      return Promise.reject({
        response: {
          status: 0,
          data: { message: 'Network error. Please check your connection.' }
        }
      });
    }

    // Handle authentication errors
    if (error.response.status === 401) {
      localStorage.removeItem('jwt');
      window.location.href = '/login';
      return Promise.reject({
        response: {
          status: 401,
          data: { message: 'Please login to continue.' }
        }
      });
    }

    // Handle cart-specific errors
    const path = error.config.url?.replace(API_BASE_URL, '');
    if (path?.startsWith('/api/cart')) {
      if (error.response.status === 404) {
        return Promise.reject({
          response: {
            status: 404,
            data: { message: 'Cart not found. Please try refreshing the page.' }
          }
        });
      }
      if (error.response.status === 400) {
        return Promise.reject({
          response: {
            status: 400,
            data: { message: error.response.data?.message || 'Invalid cart operation. Please check your input.' }
          }
        });
      }
    }

    // Handle server errors
    if (error.response.status >= 500) {
      console.error('Server error:', error);
      return Promise.reject({
        response: {
          status: error.response.status,
          data: { message: 'Server error. Please try again later.' }
        }
      });
    }

    return Promise.reject(error);
  }
);

// Utility function to get full image URL
export const getImageUrl = (imageUrl) => {
  if (!imageUrl) return 'https://via.placeholder.com/400';
  if (imageUrl.startsWith('http') || imageUrl.startsWith('data:')) return imageUrl;
  return `${API_BASE_URL}/${imageUrl.startsWith('/') ? imageUrl.slice(1) : imageUrl}`;
};

export default api;
