const mongoose = require('mongoose');
const Category = require('../models/category.model');
require('dotenv').config();

const MONGODB_URL = process.env.MONGODB_URL || 'mongodb://localhost:27017/tweestbd';

const migrateFeaturedInCarousel = async () => {
  try {
    console.log('Starting migration: Adding featuredInCarousel field to categories');
    
    // Update all categories that don't have featuredInCarousel field
    const result = await Category.updateMany(
      { featuredInCarousel: { $exists: false } },
      { $set: { featuredInCarousel: false } }
    );

    console.log('Migration completed successfully');
    console.log(`Updated ${result.modifiedCount} categories`);
    
    // Verify the update
    const categoriesWithoutField = await Category.countDocuments({
      featuredInCarousel: { $exists: false }
    });
    
    console.log(`Categories without featuredInCarousel field: ${categoriesWithoutField}`);
    
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

// Connect to MongoDB
mongoose.connect(MONGODB_URL)
  .then(() => {
    console.log('Connected to MongoDB');
    migrateFeaturedInCarousel();
  })
  .catch((error) => {
    console.error('MongoDB connection failed:', error);
    process.exit(1);
  }); 