import axios from 'axios';
import { API_BASE_URL } from '../config/api';

// Always use backend proxy to avoid CORS issues
const USE_BACKEND_PROXY = true;

class TryOnService {
  constructor() {
    this.backendApiUrl = `${API_BASE_URL}/api/tryon`;
  }

  /**
   * Validate image files
   */
  validateImage(file) {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    
    if (!file) {
      throw new Error('No file provided');
    }
    
    if (file.size > maxSize) {
      throw new Error('Image size must be less than 10MB');
    }
    
    if (!allowedTypes.includes(file.type)) {
      throw new Error('Only JPEG, PNG, and WebP images are supported');
    }
    
    return true;
  }

  /**
   * Create FormData for backend API
   */
  createFormData(personImage, clothingImage, options = {}) {
    // Validate images before processing
    this.validateImage(personImage);
    this.validateImage(clothingImage);

    const formData = new FormData();
    formData.append('personImage', personImage);
    formData.append('clothingImage', clothingImage);
    formData.append('garmentDescription', options.garmentDescription || 'clothing item');
    return formData;
  }

  /**
   * Create a virtual try-on prediction using backend proxy
   */
  async createTryOnPredictionViaBackend(personImage, clothingImage, options = {}) {
    try {
      const formData = this.createFormData(personImage, clothingImage, options);

      console.log('Sending request to backend proxy...');
      const response = await axios.post(
        `${this.backendApiUrl}/complete`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          },
          timeout: 300000,
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            console.log(`Upload progress: ${percentCompleted}%`);
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error creating try-on prediction via backend:', error);
      
      if (error.response) {
        const errorMessage = error.response.data?.error || 'Backend processing failed';
        throw new Error(`Backend Error: ${errorMessage}`);
      } else if (error.request) {
        throw new Error('No response from backend server. Please check if the server is running.');
      } else {
        throw new Error(`Request setup error: ${error.message}`);
      }
    }
  }

  /**
   * Create a prediction and get status (for step-by-step processing)
   */
  async createPrediction(personImage, clothingImage, options = {}) {
    try {
      const formData = this.createFormData(personImage, clothingImage, options);

      console.log('Creating prediction...');
      const response = await axios.post(
        `${this.backendApiUrl}/predict`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          },
          timeout: 60000,
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            console.log(`Upload progress: ${percentCompleted}%`);
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error creating prediction:', error);
      
      if (error.response) {
        const errorMessage = error.response.data?.error || 'Failed to create prediction';
        throw new Error(`Backend Error: ${errorMessage}`);
      } else if (error.request) {
        throw new Error('No response from backend server. Please check if the server is running.');
      } else {
        throw new Error(`Request setup error: ${error.message}`);
      }
    }
  }

  /**
   * Get the status of a prediction
   */
  async getPredictionStatus(predictionId) {
    try {
      const response = await axios.get(
        `${this.backendApiUrl}/status/${predictionId}`,
        {
            timeout: 15000
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error getting prediction status:', error);
      
      if (error.response) {
        const errorMessage = error.response.data?.error || 'Failed to get prediction status';
        throw new Error(`Backend Error: ${errorMessage}`);
      } else {
        throw new Error('Failed to get prediction status');
      }
    }
  }

  async waitForPredictionCompletion(predictionId, maxAttempts = 60, interval = 5000) {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const result = await this.getPredictionStatus(predictionId);
        
        if (result.status === 'succeeded') {
          return {
            success: true,
            resultImage: result.output,
            predictionId: predictionId
          };
        } else if (result.status === 'failed') {
          throw new Error(result.error || 'Prediction failed');
        } else if (result.status === 'canceled') {
          throw new Error('Prediction was canceled');
        }
        
        await new Promise(resolve => setTimeout(resolve, interval));
      } catch (error) {
        if (attempt === maxAttempts - 1) {
          throw error;
        }
      }
    }
    
    throw new Error('Prediction timed out');
  }

  async performTryOn(personImage, clothingImage, options = {}) {
    try {
      if (!personImage || !clothingImage) {
        throw new Error('Both person and clothing images are required');
      }

      console.log('Using backend proxy for try-on request (recommended)');
      const result = await this.createTryOnPredictionViaBackend(personImage, clothingImage, options);
      return result;

    } catch (error) {
      console.error('Error in try-on process:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Step-by-step try-on process (for manual polling)
   */
  async performTryOnWithPolling(personImage, clothingImage, options = {}) {
    try {
      // Validate inputs
      if (!personImage || !clothingImage) {
        throw new Error('Both person and clothing images are required');
      }

      console.log('Creating prediction for step-by-step processing...');
      
      // Create prediction
      const predictionResult = await this.createPrediction(personImage, clothingImage, options);
      
      if (!predictionResult.success) {
        throw new Error(predictionResult.error || 'Failed to create prediction');
      }

      // Wait for completion
      const result = await this.waitForPredictionCompletion(predictionResult.predictionId);
      return result;

    } catch (error) {
      console.error('Error in step-by-step try-on process:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

export default new TryOnService(); 