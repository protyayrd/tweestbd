const express = require('express');
const axios = require('axios');
const router = express.Router();

const PATHAO_BASE_URL = 'https://api-hermes.pathao.com';

// Token management
let accessToken = null;
let tokenExpiry = null;

const isTokenExpired = () => {
    return !tokenExpiry || Date.now() >= tokenExpiry;
};

const getToken = async () => {
    try {
        const response = await axios.post(`${PATHAO_BASE_URL}/aladdin/api/v1/issue-token`, {
            client_id: process.env.PATHAO_CLIENT_ID || 'LDdw05Xe1Y',
            client_secret: process.env.PATHAO_CLIENT_SECRET || 'NYqVTn3tjExZnX43ayzBx48N5oRT5nSqZQ3g4IKP',
            grant_type: 'password',
            username: process.env.PATHAO_USERNAME || 'tweestbd@gmail.com',
            password: process.env.PATHAO_PASSWORD || '0DTRfu@?'
        }, {
            headers: {
                'Content-Type': 'application/json'
            }
        });

        accessToken = response.data.access_token;
        tokenExpiry = Date.now() + (response.data.expires_in * 1000);
        return accessToken;
    } catch (error) {
        console.error('Error getting Pathao token:', error.response?.data || error.message);
        throw error;
    }
};

const ensureToken = async () => {
    if (isTokenExpired()) {
        await getToken();
    }
    return accessToken;
};

// Proxy routes
router.get('/city-list', async (req, res) => {
    try {
        const token = await ensureToken();
        const response = await axios.get(`${PATHAO_BASE_URL}/aladdin/api/v1/city-list`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        res.json(response.data);
    } catch (error) {
        console.error('Error fetching cities:', error.response?.data || error.message);
        res.status(error.response?.status || 500).json({
            error: error.response?.data || 'Failed to fetch cities'
        });
    }
});

router.get('/cities/:cityId/zone-list', async (req, res) => {
    try {
        const token = await ensureToken();
        const response = await axios.get(`${PATHAO_BASE_URL}/aladdin/api/v1/cities/${req.params.cityId}/zone-list`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        res.json(response.data);
    } catch (error) {
        console.error('Error fetching zones:', error.response?.data || error.message);
        res.status(error.response?.status || 500).json({
            error: error.response?.data || 'Failed to fetch zones'
        });
    }
});

router.get('/zones/:zoneId/area-list', async (req, res) => {
    try {
        const token = await ensureToken();
        const response = await axios.get(`${PATHAO_BASE_URL}/aladdin/api/v1/zones/${req.params.zoneId}/area-list`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        res.json(response.data);
    } catch (error) {
        console.error('Error fetching areas:', error.response?.data || error.message);
        res.status(error.response?.status || 500).json({
            error: error.response?.data || 'Failed to fetch areas'
        });
    }
});

module.exports = router; 