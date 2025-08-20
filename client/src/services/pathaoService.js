import api from '../config/api';

const retryApiCall = async (apiFunction, retryCount = 1, delay = 500) => {
    let lastError;
    
    for (let attempt = 0; attempt <= retryCount; attempt++) {
        try {
            return await apiFunction();
        } catch (error) {
            console.log(`API attempt ${attempt + 1}/${retryCount + 1} failed: ${error.message}`);
            lastError = error;
            
            if (attempt < retryCount) {
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }
    
    throw lastError;
};

const cache = {
    cities: null,
    zones: {},
    areas: {},
    timestamp: 0
};

const CACHE_EXPIRY = 10 * 60 * 1000; 

export const getCities = async () => {
    try {
        const now = Date.now();
        if (cache.cities && (now - cache.timestamp) < CACHE_EXPIRY) {
            console.log('Using cached cities data:', cache.cities.length);
            return cache.cities;
        }
        
        const response = await retryApiCall(() => 
            api.get('/api/pathao/cities', { 
                timeout: 3000, 
                headers: { 'Cache-Control': 'no-cache' } // Bypass cache
            })
        );
        
        if (response && response.data && response.data.data && Array.isArray(response.data.data) && response.data.data.length > 0) {
            console.log('Successfully loaded cities from API:', response.data.data.length);
            cache.cities = response.data.data;
            cache.timestamp = now;
            return response.data.data;
        } else {
            console.error('Invalid cities data from API');
            throw new Error('Invalid data received from API');
        }
    } catch (error) {
        console.error('Error fetching cities:', error);
        throw error; 
    }
};

export const getZones = async (cityId) => {
    try {
        if (!cityId) {
            throw new Error('No cityId provided for zones');
        }
        
        const now = Date.now();
        if (cache.zones[cityId] && (now - cache.timestamp) < CACHE_EXPIRY) {
            console.log(`Using cached zones data for city ${cityId}:`, cache.zones[cityId].length);
            return cache.zones[cityId];
        }
        
        const response = await retryApiCall(() => 
            api.get(`/api/pathao/zones/${cityId}`, { 
                timeout: 3000,
                headers: { 'Cache-Control': 'no-cache' }
            })
        );
        
        if (response && response.data && response.data.data && Array.isArray(response.data.data) && response.data.data.length > 0) {
            console.log(`Successfully loaded zones for city ${cityId} from API:`, response.data.data.length);   
            cache.zones[cityId] = response.data.data;
            cache.timestamp = now;
            return response.data.data;
        } else {
            console.error(`Invalid zones data from API for city ${cityId}`);
            throw new Error('Invalid data received from API');
        }
    } catch (error) {
        console.error(`Error fetching zones for city ${cityId}:`, error);
        throw error; 
    }
};

export const getAreas = async (zoneId) => {
    try {
        if (!zoneId) {
            throw new Error('No zoneId provided for areas');
        }
        
        const now = Date.now();
        if (cache.areas[zoneId] && (now - cache.timestamp) < CACHE_EXPIRY) {
            console.log(`Using cached areas data for zone ${zoneId}:`, cache.areas[zoneId].length);
            return cache.areas[zoneId];
        }
        
        const response = await retryApiCall(() => 
            api.get(`/api/pathao/areas/${zoneId}`, { 
                timeout: 3000,
                headers: { 'Cache-Control': 'no-cache' }
            })
        );
        
        if (response && response.data && response.data.data && Array.isArray(response.data.data) && response.data.data.length > 0) {
            console.log(`Successfully loaded areas for zone ${zoneId} from API:`, response.data.data.length);
            cache.areas[zoneId] = response.data.data;
            cache.timestamp = now;
            return response.data.data;
        } else {
            console.error(`Invalid areas data from API for zone ${zoneId}`);
            throw new Error('Invalid data received from API');
        }
    } catch (error) {
        console.error(`Error fetching areas for zone ${zoneId}:`, error);
        throw error; 
    }
};

export const calculateDeliveryCharge = async (data) => {
    try {
        if (!data.recipient_city || !data.recipient_zone) {
            throw new Error('Missing required fields: recipient_city and/or recipient_zone');
        }
        
        const deliveryData = {
            store_id: data.store_id || process.env.REACT_APP_PATHAO_STORE_ID || '278782',
            item_type: data.item_type || 2,
            delivery_type: data.delivery_type || 48,
            item_weight: data.item_weight || 0.5,
            recipient_city: data.recipient_city,
            recipient_zone: data.recipient_zone
        };
        
        const response = await retryApiCall(() => 
            api.post('/api/pathao/calculate-price', deliveryData, {
                timeout: 3000,
                headers: { 'Cache-Control': 'no-cache' }
            })
        );
        
        if (response.data && response.data.data) {
            console.log('Successfully calculated delivery charge from API:', response.data.data);
            return response.data.data;
        } else {
            console.warn('Invalid response structure from API:', response.data);
            throw new Error('Invalid API response structure');
        }
    } catch (error) {
        console.error('Error calculating delivery charge:', error);
        
        let fallbackPrice = 120; // Default for outside Dhaka
        
        if (data.recipient_city) {
            if (data.recipient_city === 1 || data.recipient_city === '1') {
                fallbackPrice = 60; // Dhaka main city
            } else {
                // For other cities, we need to check if it's a Dhaka sub area
                // This would require additional logic if we have city name available
                fallbackPrice = 120; // Outside Dhaka 
            }
        }
        
        return {
            price: fallbackPrice,
            discount: 0,
            final_price: fallbackPrice,
            error: 'Using fallback pricing due to API unavailability'
        };
    }
};

export const clearCache = () => {
    cache.cities = null;
    cache.zones = {};
    cache.areas = {};
    cache.timestamp = 0;
    console.log('Pathao service cache cleared');
};

export default {
    getCities,
    getZones,
    getAreas,
    calculateDeliveryCharge,
    clearCache
}; 