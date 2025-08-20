const mongoose = require('mongoose');
const { PRODUCT_IDS, REVIEWS_DATA, distributeReviews } = require('./upload_polo_reviews.js');

// MongoDB connection string
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://tweestdb:tweestbd2233@tweest.tx1jb4h.mongodb.net/';

// Review Schema (matching the existing model)
const reviewSchema = new mongoose.Schema({
  review: {
    type: String,
    required: true,
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'products',
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'users',
    required: true,
  },
  rating: {
    type: Number,
    required: true,
    default: 5,
  },
  verifiedPurchase: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Review = mongoose.model('reviews', reviewSchema);

// User Schema for creating review users
const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    default: '',
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  role: {
    type: String,
    default: 'CUSTOMER',
  },
  isReviewUser: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const User = mongoose.model('users', userSchema);

// Function to parse name into first and last name
function parseName(fullName) {
  const nameParts = fullName.trim().split(' ');
  if (nameParts.length === 1) {
    return { firstName: nameParts[0], lastName: '' };
  }
  const firstName = nameParts[0];
  const lastName = nameParts.slice(1).join(' ');
  return { firstName, lastName };
}

// Function to create a unique email
function createEmail(firstName, lastName) {
  const baseEmail = `${firstName.toLowerCase()}${lastName ? '.' + lastName.toLowerCase() : ''}`;
  return `${baseEmail}@example.com`;
}

// Function to create or find user
async function createOrFindUser(firstName, lastName, email) {
  try {
    // Try to find existing user by email
    let user = await User.findOne({ email });
    
    if (!user) {
      // Create a new user for the review
      user = new User({
        firstName,
        lastName,
        email,
        role: 'CUSTOMER',
        isReviewUser: true,
        createdAt: new Date()
      });
      
      await user.save();
      console.log(`Created new user: ${firstName} ${lastName} (${email})`);
    } else {
      console.log(`Found existing user: ${firstName} ${lastName} (${email})`);
    }
    
    return user;
  } catch (error) {
    console.error(`Error creating/finding user ${email}:`, error.message);
    throw error;
  }
}

// Function to create a review
async function createReview(productId, reviewData, user) {
  try {
    const review = new Review({
      user: user._id,
      product: productId,
      review: reviewData.review,
      rating: reviewData.rating,
      verifiedPurchase: true, // Admin-created reviews are always verified
      createdAt: new Date(reviewData.dateTime),
    });

    const savedReview = await review.save();
    console.log(`Created review for product ${productId}: ${reviewData.name} - ${reviewData.review.substring(0, 50)}...`);
    
    return savedReview;
  } catch (error) {
    console.error(`Error creating review for ${reviewData.name}:`, error.message);
    throw error;
  }
}

// Function to update product ratings
async function updateProductRatings(productId) {
  try {
    const reviews = await Review.find({ product: productId });
    
    if (reviews.length === 0) {
      return;
    }
    
    const totalRating = reviews.reduce((sum, review) => sum + (review.rating || 5), 0);
    const avgRating = totalRating / reviews.length;
    
    // Update the product's ratings
    const Product = mongoose.model('products');
    await Product.findByIdAndUpdate(productId, {
      ratings: avgRating,
      numRatings: reviews.length
    });
    
    console.log(`Updated product ${productId} ratings: ${avgRating.toFixed(2)} (${reviews.length} reviews)`);
  } catch (error) {
    console.error(`Error updating product ratings for ${productId}:`, error.message);
  }
}

// Function to upload all reviews
async function uploadAllReviews() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB successfully!');
    
    console.log('Starting review upload process...');
    console.log(`Total reviews to upload: ${REVIEWS_DATA.length}`);
    console.log(`Products to distribute across: ${PRODUCT_IDS.length}`);
    
    const distribution = distributeReviews();
    
    console.log('\nDistribution plan:');
    distribution.forEach((item, index) => {
      console.log(`Product ${index + 1}: ${item.reviews.length} reviews`);
    });
    
    const results = [];
    
    for (const item of distribution) {
      console.log(`\nProcessing product: ${item.productId}`);
      
      for (const review of item.reviews) {
        try {
          const { firstName, lastName } = parseName(review.name);
          const email = createEmail(firstName, lastName);
          
          // Create or find user
          const user = await createOrFindUser(firstName, lastName, email);
          
          // Create review
          const savedReview = await createReview(item.productId, review, user);
          
          results.push({ success: true, review: savedReview });
          
          // Add a small delay to avoid overwhelming the database
          await new Promise(resolve => setTimeout(resolve, 50));
          
        } catch (error) {
          console.error(`Failed to upload review for ${review.name}:`, error.message);
          results.push({ success: false, error: error.message });
        }
      }
      
      // Update product ratings after all reviews for this product
      await updateProductRatings(item.productId);
    }
    
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    
    console.log(`\nUpload completed!`);
    console.log(`Successful: ${successful}`);
    console.log(`Failed: ${failed}`);
    
    return results;
    
  } catch (error) {
    console.error('Error in upload process:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the script if called directly
if (require.main === module) {
  uploadAllReviews()
    .then(() => {
      console.log('Script completed successfully!');
      process.exit(0);
    })
    .catch(error => {
      console.error('Script failed:', error);
      process.exit(1);
    });
}

module.exports = {
  uploadAllReviews,
  createOrFindUser,
  createReview,
  updateProductRatings
};
