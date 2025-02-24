const express = require("express");
const authenticate = require("../middleware/authenticat.js");
const router = express.Router();
const paymentController = require("../controllers/payment.controller.js");

// Create payment for an order
router.post("/:id", authenticate, paymentController.createPayment);

// Verify payment (admin only)
router.put("/verify/:paymentId", authenticate, paymentController.verifyPayment);

// Get payment by ID
router.get("/:paymentId", authenticate, paymentController.getPaymentById);

// Get all payments (admin only)
router.get("/", authenticate, paymentController.getAllPayments);

module.exports = router;