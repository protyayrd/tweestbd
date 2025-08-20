import axios from 'axios';
import { API_URL } from '../config/api';

const API_ENDPOINT = `${API_URL}/popup-images`;

class PopupImageService {
  // Helper method to get auth headers
  getAuthHeaders() {
    const token = localStorage.getItem('jwt');
    return {
      headers: {
        Authorization: token ? `Bearer ${token}` : ''
      }
    };
  }

  // Get active popup images for the frontend
  getActiveImages() {
    return axios.get(`${API_ENDPOINT}/active`);
  }

  // Admin methods
  getAllImages() {
    return axios.get(API_ENDPOINT, this.getAuthHeaders());
  }

  getImage(id) {
    return axios.get(`${API_ENDPOINT}/${id}`, this.getAuthHeaders());
  }

  createImage(imageData) {
    const formData = new FormData();
    
    // Append all fields to the form data
    Object.keys(imageData).forEach(key => {
      if (key === 'image' && imageData[key] instanceof File) {
        formData.append('image', imageData[key]);
      } else if (key !== 'image') {
        formData.append(key, imageData[key]);
      }
    });

    const token = localStorage.getItem('jwt');
    return axios.post(API_ENDPOINT, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        Authorization: token ? `Bearer ${token}` : ''
      }
    });
  }

  updateImage(id, imageData) {
    const formData = new FormData();
    
    // Append all fields to the form data
    Object.keys(imageData).forEach(key => {
      if (key === 'image' && imageData[key] instanceof File) {
        formData.append('image', imageData[key]);
      } else if (key !== 'image') {
        formData.append(key, imageData[key]);
      }
    });

    const token = localStorage.getItem('jwt');
    return axios.put(`${API_ENDPOINT}/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        Authorization: token ? `Bearer ${token}` : ''
      }
    });
  }

  deleteImage(id) {
    return axios.delete(`${API_ENDPOINT}/${id}`, this.getAuthHeaders());
  }

  updateSequence(sequenceData) {
    return axios.post(`${API_ENDPOINT}/sequence`, sequenceData, this.getAuthHeaders());
  }
}

export default new PopupImageService(); 