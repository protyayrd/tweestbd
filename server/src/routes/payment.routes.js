const express = require("express");
const authenticate = require("../middleware/authenticat.js");
const paymentController = require("../controllers/payment.controller.js");

// Create two separate routers
const router = express.Router();

// Public routes (no authentication) - SSLCommerz callback routes
// These must be registered FIRST to ensure they're not intercepted by other routes
router.post("/success", paymentController.handlePaymentSuccess);
router.get("/success", paymentController.handlePaymentSuccess);

router.post("/fail", paymentController.handlePaymentFail);
router.get("/fail", paymentController.handlePaymentFail);

router.post("/cancel", paymentController.handlePaymentCancel);
router.get("/cancel", paymentController.handlePaymentCancel);

router.post("/ipn", paymentController.handleIPN);

// Protected routes (require authentication)
router.post("/:id", authenticate, paymentController.createPayment);
router.put("/verify/:paymentId", authenticate, paymentController.verifyPayment);
router.get("/all", authenticate, paymentController.getAllPayments);
router.get("/details/:paymentId", authenticate, paymentController.getPaymentById);

module.exports = router;