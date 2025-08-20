const axios = require('axios');
require('dotenv').config();

const SMS_API_URL = 'https://gpcmp.grameenphone.com/ecmapigw/webresources/ecmapigw.v2';

const sendOrderConfirmationSMS = async (phoneNumber, orderId) => {
  try {
    const message = `Thanks for shopping with TWEEST! Your order has been confirmed and is being processed. We'll notify you with shipping details once your order is on its way.`;
    
    const payload = {
      username: process.env.GP_SMS_USERNAME,
      password: process.env.GP_SMS_PASSWORD,
      apicode: "1",
      msisdn: phoneNumber,
      countrycode: "880",
      cli: process.env.GP_SMS_CLI,
      messagetype: "1",
      message: message,
      messageid: "0"
    };

    const response = await axios.post(SMS_API_URL, payload);
    
    if (response.status === 200) {
      console.log('SMS sent successfully:', response.data);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error sending SMS:', error);
    return false;
  }
};

const sendCustomSMS = async (phoneNumber, customMessage) => {
  try {
    const payload = {
      username: process.env.GP_SMS_USERNAME,
      password: process.env.GP_SMS_PASSWORD,
      apicode: "1",
      msisdn: phoneNumber,
      countrycode: "880",
      cli: process.env.GP_SMS_CLI,
      messagetype: "1",
      message: customMessage,
      messageid: "0"
    };

    const response = await axios.post(SMS_API_URL, payload);
    
    if (response.status === 200) {
      console.log('Custom SMS sent successfully:', response.data);
      return { success: true, data: response.data };
    }
    
    return { success: false, error: 'Failed to send SMS' };
  } catch (error) {
    console.error('Error sending custom SMS:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendOrderConfirmationSMS,
  sendCustomSMS
}; 