const paymentService = require('../services/payment.service.js');

const createPayment = async (req, res) => {
    try {
        console.log('=== Payment Creation Request ===');
        console.log('Order ID:', req.params.id);
        console.log('Request Body:', JSON.stringify(req.body, null, 2));
        console.log('User:', req.user?._id);

        // Validate required fields
        if (!req.body.paymentMethod || !req.body.transactionId || !req.body.paymentPhoneNumber) {
            console.log('Missing required fields');
            return res.status(400).json({
                success: false,
                error: 'Missing required fields',
                message: 'Please provide paymentMethod, transactionId, and paymentPhoneNumber'
            });
        }

        // Validate payment method
        const validPaymentMethods = ['bKash', 'Nagad', 'Rocket'];
        if (!validPaymentMethods.includes(req.body.paymentMethod)) {
            console.log('Invalid payment method:', req.body.paymentMethod);
            return res.status(400).json({
                success: false,
                error: 'Invalid payment method',
                message: `Payment method must be one of: ${validPaymentMethods.join(', ')}`
            });
        }

        const paymentData = {
            orderId: req.params.id,
            paymentMethod: req.body.paymentMethod,
            transactionId: req.body.transactionId,
            paymentPhoneNumber: req.body.paymentPhoneNumber
        };

        console.log('Creating payment with data:', JSON.stringify(paymentData, null, 2));
        const payment = await paymentService.createPayment(paymentData);
        console.log('Payment created successfully:', payment._id);
        
        return res.status(201).json({
            success: true,
            payment: payment,
            message: "Payment created successfully. Waiting for verification."
        });
    } catch (error) {
        console.error('=== Error in createPayment controller ===');
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        
        // Handle specific error cases
        if (error.message.includes('Order not found')) {
            return res.status(404).json({
                success: false,
                error: 'Order not found',
                message: 'The specified order does not exist'
            });
        }
        
        if (error.message.includes('Transaction ID already exists')) {
            return res.status(400).json({
                success: false,
                error: 'Duplicate transaction',
                message: 'This transaction ID has already been used'
            });
        }

        if (error.message.includes('Missing required payment fields')) {
            return res.status(400).json({
                success: false,
                error: 'Validation error',
                message: 'Please provide all required payment fields'
            });
        }

        // If it's a validation error from Mongoose
        if (error.name === 'ValidationError') {
            return res.status(400).json({
                success: false,
                error: 'Validation error',
                message: error.message
            });
        }

        return res.status(500).json({
            success: false,
            error: 'Payment creation failed',
            message: error.message
        });
    }
};

const verifyPayment = async (req, res) => {
    try {
        const payment = await paymentService.verifyPayment(req.params.paymentId);
        return res.status(200).json({
            success: true,
            payment: payment,
            message: "Payment verified successfully"
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

const getPaymentById = async (req, res) => {
    try {
        const payment = await paymentService.getPaymentById(req.params.paymentId);
        return res.status(200).json({
            success: true,
            payment: payment
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

const getAllPayments = async (req, res) => {
    try {
        const payments = await paymentService.getAllPayments();
        return res.status(200).json({
            success: true,
            payments: payments
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

module.exports = {
    createPayment,
    verifyPayment,
    getPaymentById,
    getAllPayments
};