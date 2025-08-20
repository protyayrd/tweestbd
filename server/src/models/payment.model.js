const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    order: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'orders',
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        required: false
    },
    paymentMethod: {
        type: String,
        required: true,
        enum: ['SSLCommerz', 'bKash', 'COD', 'Outlet']
    },
    paymentOption: {
        type: String,
        required: false,
        enum: ['sslcommerz', 'bkash', 'cod', 'outlet', 'online']
    },
    transactionId: {
        type: String,
        required: true,
        unique: true
    },
    amount: {
        type: Number,
        required: true
    },
    dueAmount: {
        type: Number,
        default: 0
    },
    dueStatus: {
        type: String,
        enum: ['NONE', 'PENDING', 'PAID'],
        default: 'NONE'
    },
    paymentPhoneNumber: {
        type: String,
        required: false
    },
    status: {
        type: String,
        required: true,
        default: 'PENDING',
        enum: ['PENDING', 'COMPLETED', 'VERIFIED', 'FAILED', 'CANCELLED']
    },
    paymentDetails: {
        type: Object
    },
    sslDetails: {
        type: Object
    },
    validationId: {
        type: String
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Payment = mongoose.model('payments', paymentSchema);

module.exports = Payment; 