const express = require("express");
const authenticate = require("../middleware/authenticat.js");
const isAdmin = require("../middleware/isAdmin.js");
const router = express.Router();
const reviewController = require("../controllers/review.controller.js");

// Customer routes
router.post("/create", authenticate, reviewController.createReview);
router.get("/product/:productId", reviewController.getAllReview);

// Admin routes - Add authentication first, then check if admin
router.get("/", authenticate, isAdmin, reviewController.getReviews);
router.post("/", authenticate, isAdmin, reviewController.addReviewByAdmin);
router.put("/:reviewId", authenticate, isAdmin, reviewController.updateReview);
router.delete("/:reviewId", authenticate, isAdmin, reviewController.deleteReview);

module.exports = router;