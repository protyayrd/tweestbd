const axios = require('axios');

class BkashService {
  constructor() {
    this.baseURL = process.env.BKASH_BASE_URL;
    this.username = process.env.BKASH_CHECKOUT_URL_USER_NAME;
    this.password = process.env.BKASH_CHECKOUT_URL_PASSWORD;
    this.appKey = process.env.BKASH_CHECKOUT_URL_APP_KEY;
    this.appSecret = process.env.BKASH_CHECKOUT_URL_APP_SECRET;
    
    this.token = null;
    this.tokenExpiry = null;
  }

  async storeToken(token, expiresIn) {
    try {
      const TokenCache = require('../models/tokenCache.model.js'); 
      
      const expiryTime = new Date(Date.now() + (expiresIn * 1000));
      
      await TokenCache.findOneAndUpdate(
        { service: 'bkash' },
        { 
          service: 'bkash',
          token: token,
          expiresAt: expiryTime,
          updatedAt: new Date()
        },
        { upsert: true, new: true }
      );
      
      console.log('bKash token stored in database');
    } catch (error) {
      console.error('Error storing bKash token:', error);
    }
  }

  async getStoredToken() {
    try {
      const TokenCache = require('../models/tokenCache.model.js');
      
      const tokenData = await TokenCache.findOne({ 
        service: 'bkash',
        expiresAt: { $gt: new Date(Date.now() + 60000) } 
      });
      
      if (tokenData) {
        console.log('Using stored bKash token from database');
        return tokenData.token;
      }
      
      return null;
    } catch (error) {
      console.error('Error retrieving stored bKash token:', error);
      return null;
    }
  }

  async generateToken() {
    try {
      console.log('Generating new bKash token...');
      
      const response = await axios.post(`${this.baseURL}/tokenized/checkout/token/grant`, {
        app_key: this.appKey,
        app_secret: this.appSecret
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'username': this.username,
          'password': this.password
        }
      });

      console.log('bKash token response:', response.data);

      if (response.data && response.data.statusCode === "0000" && response.data.id_token) {
        const token = response.data.id_token;
        const expiresIn = response.data.expires_in || 3600; 
        
        await this.storeToken(token, expiresIn);
        
        this.token = token;
        this.tokenExpiry = Date.now() + (expiresIn * 1000);
        
        console.log('bKash token generated and stored successfully');
        return token;
      } else {
        const errorMsg = `Token generation failed - StatusCode: ${response.data?.statusCode}, StatusMessage: ${response.data?.statusMessage}`;
        console.error(errorMsg);
        throw new Error(errorMsg);
      }
    } catch (error) {
      console.error('Error generating bKash token:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      const statusCode = error.response?.data?.statusCode || 'NETWORK_ERROR';
      const statusMessage = error.response?.data?.statusMessage || error.message;
      throw new Error(`Token generation failed - StatusCode: ${statusCode}, StatusMessage: ${statusMessage}`);
    }
  }

  async getValidToken() {
    const storedToken = await this.getStoredToken();
    if (storedToken) {
      this.token = storedToken;
      return storedToken;
    }
    
    console.log('No valid token found in cache, generating new token...');
    return await this.generateToken();
  }

  async createPayment(paymentData) {
    try {
      const token = await this.getValidToken();
      console.log('Creating bKash payment with data:', paymentData);

      const requestBody = {
        mode: '0011',
        payerReference: paymentData.payerReference,
        callbackURL: paymentData.callbackURL,
        amount: paymentData.amount.toString(),
        currency: 'BDT',
        intent: 'sale',
        merchantInvoiceNumber: paymentData.merchantInvoiceNumber
      };

      console.log('bKash payment request body:', requestBody);

      const response = await axios.post(`${this.baseURL}/tokenized/checkout/create`, requestBody, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'authorization': token,
          'x-app-key': this.appKey
        }
      });

      console.log('bKash payment creation response:', response.data);
      
      if (response.data && response.data.statusCode === "0000") {
        return response.data;
      } else {
        const errorMsg = `Payment creation failed - StatusCode: ${response.data?.statusCode}, StatusMessage: ${response.data?.statusMessage}`;
        console.error(errorMsg);
        throw new Error(errorMsg);
      }
    } catch (error) {
      console.error('Error creating bKash payment:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        url: `${this.baseURL}/tokenized/checkout/create`
      });
      
      const statusCode = error.response?.data?.statusCode || 'NETWORK_ERROR';
      const statusMessage = error.response?.data?.statusMessage || error.message;
      throw new Error(`Payment creation failed - StatusCode: ${statusCode}, StatusMessage: ${statusMessage}`);
    }
  }

  async executePayment(paymentID) {
    try {
      const token = await this.getValidToken();
      console.log('Executing bKash payment:', paymentID);

      const requestBody = {
        paymentID: paymentID
      };

      const response = await axios.post(`${this.baseURL}/tokenized/checkout/execute`, requestBody, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'authorization': token,
          'x-app-key': this.appKey
        },
        timeout: 30000 
      });

      console.log('bKash payment execution response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error executing bKash payment:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        return {
          statusCode: 'TIMEOUT_ERROR',
          statusMessage: 'Execute API timeout - payment status unknown',
          transactionStatus: 'Unknown',
          timeout: true
        };
      }
      
      const statusCode = error.response?.data?.statusCode || 'NETWORK_ERROR';
      const statusMessage = error.response?.data?.statusMessage || error.message;
      
      return {
        statusCode: statusCode,
        statusMessage: statusMessage,
        transactionStatus: 'Failed',
        error: true
      };
    }
  }

  async queryPayment(paymentID) {
    try {
      const token = await this.getValidToken();
      console.log('Querying bKash payment status (fallback for timeout/unknown status):', paymentID);

      const requestBody = {
        paymentID: paymentID
      };

      const response = await axios.post(`${this.baseURL}/tokenized/checkout/payment/status`, requestBody, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'authorization': token,
          'x-app-key': this.appKey
        }
      });

      console.log('bKash payment query response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error querying bKash payment:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      const statusCode = error.response?.data?.statusCode || 'NETWORK_ERROR';
      const statusMessage = error.response?.data?.statusMessage || error.message;
      
      return {
        statusCode: statusCode,
        statusMessage: statusMessage,
        transactionStatus: 'Failed',
        error: true
      };
    }
  }

  async searchTransaction(trxID) {
    try {
      const token = await this.getValidToken();
      console.log('Searching bKash transaction:', trxID);

      const requestBody = {
        trxID: trxID
      };

      const response = await axios.post(`${this.baseURL}/tokenized/checkout/general/searchTran`, requestBody, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'authorization': token,
          'x-app-key': this.appKey
        }
      });

      console.log('bKash transaction search response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error searching bKash transaction:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      const statusCode = error.response?.data?.statusCode || 'NETWORK_ERROR';
      const statusMessage = error.response?.data?.statusMessage || error.message;
      
      return {
        statusCode: statusCode,
        statusMessage: statusMessage,
        error: true
      };
    }
  }
}

module.exports = new BkashService(); 