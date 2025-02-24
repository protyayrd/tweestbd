import axios from 'axios';
import { mockCartResponses } from '../mocks/cartApi';

// Create a new instance of axios for mock API
const mockApi = axios.create({
  baseURL: 'http://localhost:5454',
  timeout: 10000,
});

// Mock size guide data
const mockSizeGuide = {
  sizes: [
    { name: 'S', chest: '36-38"', length: '27"', shoulder: '17"' },
    { name: 'M', chest: '38-40"', length: '28"', shoulder: '18"' },
    { name: 'L', chest: '40-42"', length: '29"', shoulder: '19"' },
    { name: 'XL', chest: '42-44"', length: '30"', shoulder: '20"' }
  ]
};

// Helper function to safely parse JSON data
const safeJSONParse = (data) => {
  if (!data) return null;
  try {
    return typeof data === 'string' ? JSON.parse(data) : data;
  } catch (error) {
    console.error('Error parsing JSON:', error);
    return data;
  }
};

// Add request interceptor to handle authorization and mock responses
mockApi.interceptors.request.use(
  async (config) => {
    // Get token from localStorage or use a mock token for development
    const token = localStorage.getItem('jwt') || 'mock-jwt-token-for-development';
    config.headers.Authorization = `Bearer ${token}`;

    // Extract path and method
    const path = config.url?.replace(mockApi.defaults.baseURL, '') || '';
    const method = config.method?.toLowerCase() || 'get';

    try {
      // Parse request data if present
      const requestData = safeJSONParse(config.data);

      // Handle cart endpoints
      let mockResponse;
      if (path === '/api/carts/user' && method === 'get') {
        mockResponse = mockCartResponses.getCart();
      } else if (path === '/api/carts/create' && method === 'post') {
        mockResponse = mockCartResponses.createCart();
      } else if (path === '/api/carts/add' && method === 'put') {
        mockResponse = mockCartResponses.addToCart(requestData);
      } else if (path.startsWith('/api/carts/items/') && method === 'delete') {
        const cartItemId = path.split('/').pop();
        mockResponse = mockCartResponses.removeFromCart(cartItemId);
      } else if (path.startsWith('/api/carts/items/') && method === 'put') {
        const cartItemId = path.split('/').pop();
        mockResponse = mockCartResponses.updateCartItem(cartItemId, requestData);
      } else if (path.match(/\/api\/products\/.*\/size-guide/) && method === 'get') {
        mockResponse = {
          status: 200,
          data: mockSizeGuide
        };
      }

      // If we have a mock response, resolve with it
      if (mockResponse) {
        return Promise.resolve({
          status: mockResponse.status || 200,
          data: mockResponse.data,
          headers: config.headers,
          config: { ...config, __isMockResponse: true }
        });
      }

      // For unhandled endpoints, let it pass through
      return config;
    } catch (error) {
      console.error('Error in mock API:', error);
      return Promise.reject({
        response: {
          status: 500,
          data: { message: 'Internal mock API error', error: error.message },
          headers: config.headers,
          config: config
        }
      });
    }
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle mock responses
mockApi.interceptors.response.use(
  (response) => {
    // If this is our mock response (has our special flag), return it directly
    if (response.config?.__isMockResponse) {
      return response;
    }
    return response;
  },
  (error) => {
    // If this is our mock error, format it properly
    if (error.response?.status === 404) {
      const path = error.config?.url?.replace(mockApi.defaults.baseURL, '') || 'unknown path';
      const method = error.config?.method ? error.config.method.toUpperCase() : 'UNKNOWN';
      return Promise.reject({
        response: {
          status: 404,
          data: { message: `No mock handler for ${method} ${path}` },
          headers: error.config?.headers,
          config: error.config
        }
      });
    }
    return Promise.reject(error);
  }
);

export default mockApi; 
