const mongoose = require('mongoose');
const Edushop = require('../models/edushop.model');
require('dotenv').config();

const createSampleEdushopCategories = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URL);
    console.log('Connected to MongoDB');

    // Sample categories data
    const categories = [
      {
        name: 'Study Materials',
        description: 'High-quality study materials for all subjects',
        logoUrl: '/uploads/edushop/study-materials-logo.png',
        imageUrl: '/uploads/edushop/study-materials.jpg',
        level: 1,
        displayOrder: 1
      },
      {
        name: 'Online Courses',
        description: 'Interactive online courses from top educators',
        logoUrl: '/uploads/edushop/online-courses-logo.png',
        imageUrl: '/uploads/edushop/online-courses.jpg',
        level: 1,
        displayOrder: 2
      },
      {
        name: 'Educational Tools',
        description: 'Essential tools for effective learning',
        logoUrl: '/uploads/edushop/educational-tools-logo.png',
        imageUrl: '/uploads/edushop/educational-tools.jpg',
        level: 1,
        displayOrder: 3
      }
    ];

    // Insert categories
    await Edushop.insertMany(categories);
    console.log('Created sample Edushop categories successfully');

    process.exit(0);
  } catch (error) {
    console.error('Error creating sample categories:', error);
    process.exit(1);
  }
};

createSampleEdushopCategories(); 