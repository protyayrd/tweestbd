import axios from 'axios';

// API Configuration
const getBaseUrl = () => {
  const hostname = window.location.hostname;
  const protocol = window.location.protocol;
  
  // For development
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:5454';
  }
  
  // For production
  return `${protocol}//${hostname}`;
};

export const API_BASE_URL = getBaseUrl();
export const API_URL = `${API_BASE_URL}/api`;
export const BASE_URL = API_BASE_URL;

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000, // 10 second timeout
  withCredentials: true // Important for CORS with credentials
});

// Add a request interceptor to set the token before each request
api.interceptors.request.use(
  (config) => {
    console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`);
    console.log(`[API Request] Current path: ${window.location.pathname}${window.location.search}`);
    
    // Don't add auth headers or redirect for Google auth URLs
    if (config.url?.includes('auth/google') || 
        config.url?.includes('/auth/google/callback') ||
        window.location.pathname.includes('/auth/google/callback')) {
      console.log('[API Request] Google auth URL detected, skipping auth check');
      return config;
    }
    
    // Check if this is a guest checkout request
    const isGuestCheckout = window.location.search.includes('guest=true');
    console.log(`[API Request] Guest checkout: ${isGuestCheckout}`);
    
    // These API paths don't require authentication when in guest checkout mode
    const guestSupportedPaths = [
      '/api/pathao/',
      '/api/cart',
      '/api/orders/',
      '/api/checkout',
      '/api/payment'
    ];
    
    const token = localStorage.getItem('jwt');
    console.log(`[API Request] Token exists: ${!!token}`);
    
    // Skip auth check for all auth-related paths and guest checkout paths
    const isAuthPath = config.url?.includes('/auth/') || 
                        config.url?.includes('/api/auth/');
                        
    // Check if we're on the order confirmation page
    const isOrderConfirmation = window.location.pathname.includes('/order-confirmation');
    console.log(`[API Request] Is order confirmation page: ${isOrderConfirmation}`);
    
    // Check if this is an API call for order details
    const isOrderDetailsCall = config.url?.includes('/api/orders/') && !config.url?.endsWith('/api/orders/');
    console.log(`[API Request] Is order details call: ${isOrderDetailsCall}`);
    
    // Check if we're on a payment success or guest order tracking page
    const isPaymentSuccessPage = window.location.pathname.includes('/payment/success');
    const isGuestOrderTrackingPage = window.location.pathname.includes('/order/guest/track/');
    const isOrderTrackingPage = window.location.pathname.includes('/order/') && 
                               (window.location.pathname.includes('/guest/track/') || 
                                window.location.search.includes('paymentId=') || 
                                window.location.search.includes('transactionId='));
    
    // Expand guest supported path detection
    const isGuestSupportedPath = isGuestCheckout && 
                                (guestSupportedPaths.some(path => config.url?.includes(path)) || 
                                 isOrderConfirmation || 
                                 isOrderDetailsCall) ||
                                // Allow order tracking requests on payment success pages 
                                (isPaymentSuccessPage && isOrderDetailsCall) ||
                                // Allow guest order tracking pages
                                (isGuestOrderTrackingPage && isOrderDetailsCall) ||
                                // Allow order tracking pages that have payment details
                                (isOrderTrackingPage && isOrderDetailsCall) ||
                                // Allow guest order tracking API endpoints
                                config.url?.includes('/api/orders/guest/track/');
    
    console.log(`[API Request] Is guest supported path: ${isGuestSupportedPath}`);
    
    if (token && !isAuthPath) {
      console.log('[API Request] Adding auth token to request');
      config.headers.Authorization = `Bearer ${token}`;
      // Ensure content type is set for non-FormData requests
      if (!(config.data instanceof FormData)) {
        config.headers['Content-Type'] = 'application/json';
      }
    } else if (!isAuthPath && !isGuestSupportedPath) {
      // If no token is present and the request requires authentication,
      // redirect to login page - but only if not in the auth flow and not a guest-supported path
      const requiresAuth = [
        '/api/cart',
        '/api/cart/add',
        '/api/cart/remove',
        '/api/cart/update',
        '/api/orders',
        '/api/users/profile'
      ];
      
      // Don't redirect if we're on auth-related pages or checkout pages with guest=true
      const isAuthPage = window.location.pathname.includes('/login') || 
                         window.location.pathname.includes('/register') ||
                         window.location.pathname.includes('/auth/google/callback');
                         
      const isCheckoutPage = window.location.pathname.includes('/checkout') ||
                             window.location.pathname.includes('/cart') ||
                             window.location.pathname.includes('/order-confirmation');
      
      const path = config.url?.replace(API_BASE_URL, '');
      console.log(`[API Request] Path: ${path}`);
      console.log(`[API Request] Is auth page: ${isAuthPage}`);
      console.log(`[API Request] Is checkout page: ${isCheckoutPage}`);
      
      if (!isAuthPage && !isCheckoutPage && !isGuestCheckout && 
          requiresAuth.some(authPath => path?.startsWith(authPath))) {
        console.log('[API Request] Authentication required, throwing error');
        // Don't redirect immediately with window.location.replace - instead let the UI handle this
        // This prevents UI flashing during auth checks
        throw new Error('Authentication required');
      }
    }
    
    // Special handling for order detail requests in guest checkout mode
    if (isGuestCheckout && isOrderDetailsCall && !token) {
      console.log('[API Request] Guest checkout order details request detected');
      // For guest checkout, we'll handle the 401 response in the response interceptor
      // This is just to mark that we expect this request to possibly fail with 401
      config.headers['X-Guest-Checkout'] = 'true';
    }
    
    return config;
  },
  (error) => {
    console.log('[API Request Error]', error);
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    console.log(`[API Response] ${response.config.method?.toUpperCase()} ${response.config.url} - Status: ${response.status}`);
    
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
    console.log('[API Response Error]', error);
    console.log(`[API Response Error] URL: ${error.config?.url}`);
    console.log(`[API Response Error] Status: ${error.response?.status}`);
    console.log(`[API Response Error] Headers:`, error.config?.headers);
    
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

    // Check if this is a guest checkout request
    const isGuestCheckout = window.location.search.includes('guest=true');
    const isCheckoutPath = window.location.pathname.includes('/checkout') || 
                          window.location.pathname.includes('/cart') ||
                          window.location.pathname.includes('/order-confirmation');
    
    // Check if this is a guest checkout order details request
    const isOrderDetailsCall = error.config?.url?.includes('/api/orders/') && 
                              !error.config?.url?.endsWith('/api/orders/');
    const isGuestOrderDetailsRequest = isGuestCheckout && isOrderDetailsCall && 
                                      error.config?.headers['X-Guest-Checkout'] === 'true';
    
    console.log(`[API Response Error] Guest checkout: ${isGuestCheckout}`);
    console.log(`[API Response Error] Is checkout path: ${isCheckoutPath}`);
    console.log(`[API Response Error] Is order details call: ${isOrderDetailsCall}`);
    console.log(`[API Response Error] Is guest order details request: ${isGuestOrderDetailsRequest}`);

    // Special handling for guest checkout order details requests
    if (isGuestOrderDetailsRequest && error.response.status === 401) {
      console.log('[API Response Error] Handling guest checkout order details 401');
      // For guest checkout order details, we'll return a special error that can be handled
      // in the getOrderById function
      return Promise.reject({
        response: {
          status: 401,
          data: { 
            message: 'Guest order details request',
            isGuestOrderDetails: true
          }
        }
      });
    }

    // Handle authentication errors - but don't redirect for guest checkout
    if (error.response.status === 401) {
      // If we're in guest checkout mode, don't redirect to login
      if (isGuestCheckout || isCheckoutPath) {
        console.log('[API Response Error] 401 in guest checkout or checkout path');
        return Promise.reject({
          response: {
            status: 401,
            data: { 
              message: 'Guest checkout enabled. Continuing without login.',
              isGuestCheckout: true
            }
          }
        });
      }
      
      // Otherwise, handle normally
      console.log('[API Response Error] 401 - Redirecting to login');
      localStorage.removeItem('jwt');
      window.location.href = '/login';
      return Promise.reject({
        response: {
          status: 401,
          data: { message: 'Please login to continue.' }
        }
      });
    }

    // Handle cart and promo code errors
    const path = error.config.url?.replace(API_BASE_URL, '');
    if (path?.startsWith('/api/cart')) {
      // Special handling for promo code errors
      if (path.includes('apply-promo')) {
        // For promo code errors, we want to stay on the current page and show a snackbar
        let errorMessage = error.response.data?.message || 'Invalid promo code';
        
        // Format specific error messages to be more user-friendly
        if (errorMessage.includes('Minimum order amount')) {
          errorMessage = error.response.data?.message || 'Minimum order amount required';
        } else if (errorMessage.includes('Invalid or expired')) {
          errorMessage = error.response.data?.message || 'Invalid or expired promo code';
        }
        
        return Promise.reject({
          response: {
            status: error.response.status,
            data: { 
              message: errorMessage
            }
          }
        });
      }

      // Handle other cart errors
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
            data: { 
              message: error.response.data?.message || 'Invalid cart operation. Please check your input.'
            }
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
          data: { message: 'An error occurred. Please try again later.' }
        }
      });
    }

    return Promise.reject(error);
  }
);

// Helper function to get full image URL
export const getImageUrl = (path) => {
  if (!path) {
    return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2VlZWVlZSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZm9udC1zaXplPSIyNHB4IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSIgZmlsbD0iIzY2NjY2NiI+Tm8gSW1hZ2U8L3RleHQ+PC9zdmc+';
  }

  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  // Always use https://tweestbd.com for image URLs
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  const fullUrl = `https://tweestbd.com/${cleanPath}`;
  
  return fullUrl;
};

export default api;
