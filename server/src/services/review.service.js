const Review = require("../models/review.model.js");
const productService = require("../services/product.service.js");
const User = require("../models/user.model.js");
const Order = require("../models/order.model.js");

async function createReview(reqData, user) {
  // console.log("req data ",reqData)
  const product = await productService.findProductById(reqData.productId);

  if(!product){
    throw new Error("product not found with id ", reqData.productId)
  }
  
  // Check if user has purchased this product
  const userOrders = await Order.find({
    user: user._id,
    orderStatus: "DELIVERED", // Only count delivered orders
    "orderItems.product": product._id // Look for this product in order items
  });
  
  // Set verifiedPurchase to true if user has purchased this product
  const verifiedPurchase = userOrders.length > 0;
  
  const review = new Review({
    user: user._id,
    product: product._id,
    review: reqData.review,
    rating: reqData.rating || 5,
    verifiedPurchase,
    createdAt: new Date(),
  });

  const savedReview = await review.save();
  
  // Update product ratings
  await updateProductRatings(product._id);
  
  return savedReview;
}

async function getAllReview(productId) {
  const product = await productService.findProductById(productId);

  if(!product){
    throw new Error("product not found with id ", productId)
  }
  
  const reviews = await Review.find({ product: productId }).populate("user");
  console.log("reviews ", reviews);
  return reviews;
}

// Get reviews with pagination and filters for admin
async function getReviews(filters, page, limit) {
  const skip = (page - 1) * limit;
  
  const reviews = await Review.find(filters)
    .populate("user", "firstName lastName email profilePicture")
    .populate("product", "title images")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));
  
  const totalReviews = await Review.countDocuments(filters);
  
  return {
    reviews,
    totalReviews,
    currentPage: page,
    totalPages: Math.ceil(totalReviews / limit)
  };
}

// Update a review
async function updateReview(reviewId, updateData) {
  const review = await Review.findById(reviewId);
  
  if (!review) {
    return null;
  }
  
  if (updateData.productId && updateData.productId !== review.product.toString()) {
    const product = await productService.findProductById(updateData.productId);
    if (!product) {
      throw new Error("Product not found");
    }
    review.product = product._id;
  }
  
  if (updateData.rating) {
    review.rating = updateData.rating;
  }
  
  if (updateData.review) {
    review.review = updateData.review;
  }
  
  if (updateData.verifiedPurchase !== undefined) {
    review.verifiedPurchase = updateData.verifiedPurchase;
  }
  
  const updatedReview = await review.save();
  
  // Update product ratings if the rating changed
  if (updateData.rating) {
    await updateProductRatings(review.product);
  }
  
  return updatedReview;
}

// Delete a review
async function deleteReview(reviewId) {
  const review = await Review.findById(reviewId);
  
  if (!review) {
    return null;
  }
  
  const productId = review.product;
  
  const result = await Review.findByIdAndDelete(reviewId);
  
  // Update product ratings after deletion
  await updateProductRatings(productId);
  
  return result;
}

// Create a review by admin
async function createReviewByAdmin(reviewData) {
  const product = await productService.findProductById(reviewData.productId);
  
  if (!product) {
    throw new Error("Product not found");
  }
  
  // Create or find a user based on the provided info
  let user;
  
  if (reviewData.user && reviewData.user.email) {
    // Try to find existing user by email
    user = await User.findOne({ email: reviewData.user.email });
    
    if (!user && reviewData.user.firstName) {
      // Create a temporary user for the review
      user = new User({
        firstName: reviewData.user.firstName,
        lastName: reviewData.user.lastName || '',
        email: reviewData.user.email,
        role: 'CUSTOMER',
        isReviewUser: true,
        createdAt: new Date()
      });
      
      await user.save();
    }
  }
  
  // If no user is provided, create an anonymous user
  if (!user) {
    user = new User({
      firstName: 'Anonymous',
      lastName: 'User',
      email: `anonymous-${Date.now()}@example.com`,
      role: 'CUSTOMER',
      isReviewUser: true,
      createdAt: new Date()
    });
    
    await user.save();
  }
  
  const review = new Review({
    user: user._id,
    product: product._id,
    review: reviewData.review,
    rating: reviewData.rating || 5,
    verifiedPurchase: true, // Admin-created reviews are always verified
    createdAt: new Date(),
  });
  
  const savedReview = await review.save();
  
  // Update product ratings
  await updateProductRatings(product._id);
  
  return savedReview;
}

// Helper function to update product ratings
async function updateProductRatings(productId) {
  const reviews = await Review.find({ product: productId });
  
  if (reviews.length === 0) {
    await productService.updateProductRating(productId, 0, 0);
    return;
  }
  
  // Use default rating of 5 when rating is missing
  const totalRating = reviews.reduce((sum, review) => sum + (review.rating || 5), 0);
  const avgRating = totalRating / reviews.length;
  
  await productService.updateProductRating(productId, avgRating, reviews.length);
}

module.exports = {
  createReview,
  getAllReview,
  getReviews,
  updateReview,
  deleteReview,
  createReviewByAdmin,
};
