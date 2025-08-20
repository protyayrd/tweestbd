import { API_BASE_URL } from '../config/api';
import axios from 'axios';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  withCredentials: true
});

// Add authorization header if user is logged in
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('jwt');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const sendSMSToShippingAddress = async (orderId, message) => {
  try {
    const response = await api.post(`/api/orders/${orderId}/send-sms`, {
      message: message
    });
    return response.data;
  } catch (error) {
    console.error('Error sending SMS:', error);
    throw error;
  }
};

export default {
  sendSMSToShippingAddress
}; 