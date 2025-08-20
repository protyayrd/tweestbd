const axios = require('axios');

const PATHAO_BASE_URL = process.env.PATHAO_BASE_URL || 'https://api-hermes.pathao.com';
let accessToken = null;
let tokenExpiry = null;

console.log('Pathao Service Configuration:', {
    BASE_URL: PATHAO_BASE_URL,
    CLIENT_ID: process.env.PATHAO_CLIENT_ID,
    USERNAME: process.env.PATHAO_USERNAME,
    HAS_CLIENT_SECRET: !!process.env.PATHAO_CLIENT_SECRET,
    HAS_PASSWORD: !!process.env.PATHAO_PASSWORD
});

const pathaoApi = axios.create({
    baseURL: PATHAO_BASE_URL,
    headers: {
        'Content-Type': 'application/json; charset=UTF-8'
    }
});

// Add token to requests if available
pathaoApi.interceptors.request.use(
    async (config) => {
        if (accessToken) {
            config.headers.Authorization = `Bearer ${accessToken}`;
        }
        console.log('Pathao API Request:', {
            method: config.method,
            url: config.url,
            hasToken: !!accessToken
        });
        return config;
    },
    (error) => {
        console.error('Pathao API Request Error:', error);
        return Promise.reject(error);
    }
);

const issueToken = async () => {
    try {
        console.log('Attempting to issue Pathao token...');
        const response = await pathaoApi.post('/aladdin/api/v1/issue-token', {
            client_id: process.env.PATHAO_CLIENT_ID,
            client_secret: process.env.PATHAO_CLIENT_SECRET,
            grant_type: 'password',
            username: process.env.PATHAO_USERNAME,
            password: process.env.PATHAO_PASSWORD
        });

        if (response.data && response.data.access_token) {
            accessToken = response.data.access_token;
            tokenExpiry = Date.now() + (response.data.expires_in * 1000);
            console.log('Successfully obtained Pathao token');
        }

        return response.data;
    } catch (error) {
        console.error('Error issuing Pathao token:', error.response?.data || error.message);
        throw error;
    }
};

const ensureValidToken = async () => {
    try {
        const currentTime = Date.now();
        // If token is expired or will expire in the next 5 minutes
        if (!tokenExpiry || currentTime > (tokenExpiry - 300000)) {
            await issueToken();
        }
        return accessToken;
    } catch (error) {
        console.error('Error ensuring valid token:', error);
        throw error;
    }
};

const getCities = async () => {
    try {
        const token = await ensureValidToken();
        const response = await pathaoApi.get('/aladdin/api/v1/city-list', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        return response.data.data.data;
    } catch (error) {
        console.error('Error fetching cities:', error.response?.data || error.message);
        throw error;
    }
};

const getZones = async (cityId) => {
    try {
        const token = await ensureValidToken();
        const response = await pathaoApi.get(`/aladdin/api/v1/cities/${cityId}/zone-list`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        return response.data.data.data;
    } catch (error) {
        console.error('Error fetching zones:', error.response?.data || error.message);
        throw error;
    }
};

const getAreas = async (zoneId) => {
    try {
        const token = await ensureValidToken();
        const response = await pathaoApi.get(`/aladdin/api/v1/zones/${zoneId}/area-list`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        return response.data.data.data;
    } catch (error) {
        console.error('Error fetching areas:', error.response?.data || error.message);
        throw error;
    }
};

const refreshToken = async () => {
    try {
        console.log('Refreshing Pathao token...');
        accessToken = null;
        tokenExpiry = null;
        await issueToken();
    } catch (error) {
        console.error('Error refreshing token:', error);
        throw error;
    }
};

// Fixed delivery charges
const DELIVERY_CHARGES = {
  DHAKA: 60,
  DHAKA_SUB_AREAS: 90,
  OUTSIDE_DHAKA: 120,
  OUTLET_PICKUP: 0,
  COD: 0  
};

const calculatePrice = async (priceData) => {
  try {
    console.log('Delivery charge calculation - Input data:', priceData);

    if (priceData.deliveryMethod === 'outlet_pickup') {
      console.log('Outlet pickup selected - No delivery charge');
      return {
        price: DELIVERY_CHARGES.OUTLET_PICKUP,
        discount: 0,
        promo_discount: 0,
        plan_id: 1,
        cod_enabled: 0,
        cod_percentage: 0,
        additional_charge: 0,
        final_price: DELIVERY_CHARGES.OUTLET_PICKUP
      };
    }

    if (priceData.deliveryMethod === 'cod') {
      console.log('Cash on Delivery selected - Delivery charge will be added to due');
      return {
        price: DELIVERY_CHARGES.COD,
        discount: 0,
        promo_discount: 0,
        plan_id: 1,
        cod_enabled: 1,
        cod_percentage: 0.01,
        additional_charge: 0,
        final_price: DELIVERY_CHARGES.COD,
        due_amount: priceData.cityName?.toLowerCase().includes('dhaka') ? DELIVERY_CHARGES.DHAKA : DELIVERY_CHARGES.OUTSIDE_DHAKA
      };
    }

    if (!priceData.recipient_city && !priceData.city && !priceData.deliveryAddress) {
      console.log('No delivery address provided, using default outside Dhaka rate');
      return {
        price: DELIVERY_CHARGES.OUTSIDE_DHAKA,
        discount: 0,
        promo_discount: 0,
        plan_id: 1,
        cod_enabled: 0,
        cod_percentage: 0,
        additional_charge: 0,
        final_price: DELIVERY_CHARGES.OUTSIDE_DHAKA
      };
    }

    const cityName = (
      priceData.recipient_city || 
      priceData.city || 
      (priceData.deliveryAddress && priceData.deliveryAddress.city) || 
      ''
    ).toString().toLowerCase();

    // Check if it's Dhaka main city (ID 1 or city name exactly "dhaka")
    const isDhakaMain = 
      cityName === 'dhaka' || 
      cityName === '1' || 
      (priceData.recipient_city === 1);
      
    // Check if it's Dhaka sub areas (contains "dhaka" but not main city)
    const isDhakaSubArea = !isDhakaMain && cityName.includes('dhaka');
    
    let basePrice;
    if (isDhakaMain) {
      basePrice = DELIVERY_CHARGES.DHAKA;
    } else if (isDhakaSubArea) {
      basePrice = DELIVERY_CHARGES.DHAKA_SUB_AREAS;
    } else {
      basePrice = DELIVERY_CHARGES.OUTSIDE_DHAKA;
    }
    
    console.log('Delivery charge calculation:', {
      cityName,
      isDhaka,
      basePrice,
      deliveryMethod: priceData.deliveryMethod,
      location: {
        providedCity: priceData.recipient_city || priceData.city || (priceData.deliveryAddress && priceData.deliveryAddress.city)
      }
    });
    
    return {
      price: basePrice,
      discount: 0,
      promo_discount: 0,
      plan_id: 1,
      cod_enabled: 0,
      cod_percentage: 0,
      additional_charge: 0,
      final_price: basePrice
    };
  } catch (error) {
    console.error('Error in delivery price calculation:', {
      error: error.message,
      input: priceData
    });
    return {
      price: DELIVERY_CHARGES.OUTSIDE_DHAKA,
      discount: 0,
      promo_discount: 0,
      plan_id: 1,
      cod_enabled: 0,
      cod_percentage: 0,
      additional_charge: 0,
      final_price: DELIVERY_CHARGES.OUTSIDE_DHAKA
    };
  }
};

module.exports = {
    issueToken,
    getCities,
    getZones,
    getAreas,
    calculatePrice
}; 