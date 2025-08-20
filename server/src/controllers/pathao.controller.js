const pathaoService = require('../services/pathao.service');

exports.getCities = async (req, res) => {
    try {
        const cities = await pathaoService.getCities();
        res.json({
            status: true,
            data: cities
        });
    } catch (error) {
        console.error('Error in getCities controller:', error);
        res.status(500).json({
            status: false,
            message: error.response?.data?.message || 'Failed to fetch cities'
        });
    }
};

exports.getZones = async (req, res) => {
    try {
        const { cityId } = req.params;
        const zones = await pathaoService.getZones(cityId);
        res.json({
            status: true,
            data: zones
        });
    } catch (error) {
        console.error('Error in getZones controller:', error);
        res.status(500).json({
            status: false,
            message: error.response?.data?.message || 'Failed to fetch zones'
        });
    }
};

exports.getAreas = async (req, res) => {
    try {
        const { zoneId } = req.params;
        const areas = await pathaoService.getAreas(zoneId);
        res.json({
            status: true,
            data: areas
        });
    } catch (error) {
        console.error('Error in getAreas controller:', error);
        res.status(500).json({
            status: false,
            message: error.response?.data?.message || 'Failed to fetch areas'
        });
    }
}; 

exports.calculateDeliveryPrice = async (req, res) => {
    try {
        const priceData = req.body;
        
        // Validate required fields
        const requiredFields = ['store_id', 'item_type', 'delivery_type', 'item_weight', 'recipient_city', 'recipient_zone'];
        const missingFields = requiredFields.filter(field => !priceData[field]);
        
        if (missingFields.length > 0) {
            return res.status(400).json({
                status: false,
                message: `Missing required fields: ${missingFields.join(', ')}`
            });
        }
        
        try {
            const priceCalculation = await pathaoService.calculatePrice(priceData);
            
            return res.json({
                status: true,
                data: priceCalculation
            });
        } catch (serviceError) {
            console.error('Error from price calculation service:', serviceError);
            
            // Return error to client so it can handle fallback
            return res.status(500).json({
                status: false,
                message: serviceError.message || 'Failed to calculate delivery price',
                error: serviceError.response?.data || serviceError.message
            });
        }
    } catch (error) {
        console.error('Error in calculateDeliveryPrice controller:', error);
        res.status(500).json({
            status: false,
            message: error.message || 'Failed to calculate delivery price'
        });
    }
}; 