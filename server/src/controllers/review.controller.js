const reviewService = require('../services/review.service.js');

const createReview = async (req, res) => {
  const user = req.user
  const reqBody = req.body;
  
  console.log(`product id ${reqBody.productId} - ${reqBody.review}`);

  try {
    
    const review = await reviewService.createReview(reqBody, user);
        
    return res.status(201).send(review);
  } catch (error) {
    console.log("error --- ", error.message)
    return res.status(500).json({ error: 'Failed to add review', message: error.message });
  }
};

const getAllReview = async (req, res) => {
  const productId = req.params.productId;
  console.log("product id ",productId)
  try {
   
    const reviews = await reviewService.getAllReview(productId);
    return res.status(200).send(reviews);
  } catch (error) {
    console.log("error --- ", error.message)
    return res.status(500).json({ error: 'Failed to fetch reviews', message: error.message });
  }
};

// Admin functionality to get all reviews with filters and pagination
const getReviews = async (req, res) => {
  try {
    const { page = 1, limit = 10, productId, search } = req.query;
    
    const filters = {};
    
    if (productId) {
      filters.productId = productId;
    }
    
    if (search) {
      filters.review = { $regex: search, $options: 'i' };
    }
    
    const reviews = await reviewService.getReviews(filters, page, limit);
    return res.status(200).json(reviews);
  } catch (error) {
    console.log("error fetching reviews:", error.message);
    return res.status(500).json({ error: 'Failed to fetch reviews', message: error.message });
  }
};

// Admin functionality to update a review
const updateReview = async (req, res) => {
  try {
    const reviewId = req.params.reviewId;
    const updateData = req.body;
    
    const updatedReview = await reviewService.updateReview(reviewId, updateData);
    
    if (!updatedReview) {
      return res.status(404).json({ error: 'Review not found' });
    }
    
    return res.status(200).json({ 
      message: 'Review updated successfully', 
      review: updatedReview 
    });
  } catch (error) {
    console.log("error updating review:", error.message);
    return res.status(500).json({ error: 'Failed to update review', message: error.message });
  }
};

// Admin functionality to delete a review
const deleteReview = async (req, res) => {
  try {
    const reviewId = req.params.reviewId;
    
    const result = await reviewService.deleteReview(reviewId);
    
    if (!result) {
      return res.status(404).json({ error: 'Review not found' });
    }
    
    return res.status(200).json({ message: 'Review deleted successfully' });
  } catch (error) {
    console.log("error deleting review:", error.message);
    return res.status(500).json({ error: 'Failed to delete review', message: error.message });
  }
};

// Admin functionality to add a review manually
const addReviewByAdmin = async (req, res) => {
  try {
    const reviewData = req.body;
    
    // Create a review without requiring user authentication
    const review = await reviewService.createReviewByAdmin(reviewData);
    
    return res.status(201).json({
      message: 'Review added successfully',
      review: review
    });
  } catch (error) {
    console.log("error adding review by admin:", error.message);
    return res.status(500).json({ 
      error: 'Failed to add review', 
      message: error.message || 'An unknown error occurred'
    });
  }
};

module.exports = {
  createReview,
  getAllReview,
  getReviews,
  updateReview,
  deleteReview,
  addReviewByAdmin
}
