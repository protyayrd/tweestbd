const orderService=require("../services/order.service.js");
const Payment = require('../models/payment.model.js');
const Order = require('../models/order.model.js');

const createPayment = async (paymentData) => {
    try {
        console.log('Creating payment with data:', JSON.stringify(paymentData, null, 2));
        
        // Find the order
        const order = await Order.findById(paymentData.orderId);
        if (!order) {
            throw new Error('Order not found');
        }
        console.log('Found order:', order._id);

        // Validate payment data
        if (!paymentData.paymentMethod || !paymentData.transactionId || !paymentData.paymentPhoneNumber) {
            throw new Error('Missing required payment fields');
        }

        // Check if payment with this transactionId already exists
        const existingPayment = await Payment.findOne({ transactionId: paymentData.transactionId });
        if (existingPayment) {
            throw new Error('Transaction ID already exists');
        }

        // Create new payment
        const payment = new Payment({
            order: order._id,
            paymentMethod: paymentData.paymentMethod,
            transactionId: paymentData.transactionId,
            amount: order.totalDiscountedPrice,
            paymentPhoneNumber: paymentData.paymentPhoneNumber,
        });

        console.log('Created payment object:', JSON.stringify(payment, null, 2));

        // Save the payment
        const savedPayment = await payment.save();
        console.log('Saved payment:', savedPayment._id);

        // Update order payment status
        order.orderStatus = 'CONFIRMED';
        order.paymentDetails = {
            paymentId: savedPayment._id,
            status: 'COMPLETED'
        };
        await order.save();

        return savedPayment;
    } catch (error) {
        console.error('Error in createPayment:', error);
        throw new Error(error.message || 'Failed to create payment');
    }
};

const verifyPayment = async (paymentId) => {
    try {
        const payment = await Payment.findById(paymentId);
        if (!payment) {
            throw new Error('Payment not found');
        }

        // Update payment status
        payment.status = 'VERIFIED';
        await payment.save();

        // Update order payment status
        const order = await Order.findById(payment.order);
        if (order) {
            order.orderStatus = 'PLACED';
            order.paymentDetails = {
                paymentId: payment._id,
                status: 'COMPLETED'
            };
            await order.save();
        }

        return payment;
    } catch (error) {
        throw new Error(error.message);
    }
};

const getPaymentById = async (paymentId) => {
    try {
        const payment = await Payment.findById(paymentId).populate('order');
        if (!payment) {
            throw new Error('Payment not found');
        }
        return payment;
    } catch (error) {
        throw new Error(error.message);
    }
};

const getAllPayments = async () => {
    try {
        const payments = await Payment.find().populate('order');
        return payments;
    } catch (error) {
        throw new Error(error.message);
    }
};

module.exports={createPayment,verifyPayment,getPaymentById,getAllPayments}