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
        required: true
    },
    paymentMethod: {
        type: String,
        required: true,
        enum: ['SSLCommerz']
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