const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    order: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'orders',
        required: true
    },
    paymentMethod: {
        type: String,
        required: true,
        enum: ['bKash', 'Nagad', 'Rocket']
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
        required: true
    },
    status: {
        type: String,
        required: true,
        default: 'PENDING',
        enum: ['PENDING', 'VERIFIED', 'FAILED']
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Payment = mongoose.model('payments', paymentSchema);

module.exports = Payment; 