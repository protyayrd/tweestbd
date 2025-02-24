const mongoose = require('mongoose');
const Category = require('../models/category.model');
require('dotenv').config();

const createEdushopCategories = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URL);
    console.log('Connected to MongoDB');

    // Create main Edushop category
    const edushop = await Category.create({
      name: 'Edushop',
      level: 1,
      description: 'Educational resources and materials',
      imageUrl: '/uploads/categories/edushop-main.jpg',
      featuredInCarousel: false
    });

    // Create subcategories
    const subcategories = [
      {
        name: 'Study Materials',
        description: 'Books, notes, and study guides',
        imageUrl: '/uploads/categories/study-materials.jpg',
        level: 2,
        parentCategory: edushop._id
      },
      {
        name: 'Online Courses',
        description: 'Digital learning resources and courses',
        imageUrl: '/uploads/categories/online-courses.jpg',
        level: 2,
        parentCategory: edushop._id
      },
      {
        name: 'Educational Tools',
        description: 'Learning aids and educational equipment',
        imageUrl: '/uploads/categories/educational-tools.jpg',
        level: 2,
        parentCategory: edushop._id
      }
    ];

    // Insert subcategories
    const createdSubcategories = await Category.insertMany(subcategories);
    console.log('Created Edushop categories successfully');

    // Create level 3 categories under each subcategory
    const level3Categories = [
      // Study Materials subcategories
      {
        name: 'Textbooks',
        description: 'Academic and reference books',
        imageUrl: '/uploads/categories/textbooks.jpg',
        level: 3,
        parentCategory: createdSubcategories[0]._id
      },
      {
        name: 'Study Guides',
        description: 'Exam preparation and study guides',
        imageUrl: '/uploads/categories/study-guides.jpg',
        level: 3,
        parentCategory: createdSubcategories[0]._id
      },
      // Online Courses subcategories
      {
        name: 'Programming',
        description: 'Coding and software development courses',
        imageUrl: '/uploads/categories/programming.jpg',
        level: 3,
        parentCategory: createdSubcategories[1]._id
      },
      {
        name: 'Language Learning',
        description: 'Language courses and materials',
        imageUrl: '/uploads/categories/language-learning.jpg',
        level: 3,
        parentCategory: createdSubcategories[1]._id
      },
      // Educational Tools subcategories
      {
        name: 'Lab Equipment',
        description: 'Scientific and laboratory equipment',
        imageUrl: '/uploads/categories/lab-equipment.jpg',
        level: 3,
        parentCategory: createdSubcategories[2]._id
      },
      {
        name: 'Learning Aids',
        description: 'Educational aids and tools',
        imageUrl: '/uploads/categories/learning-aids.jpg',
        level: 3,
        parentCategory: createdSubcategories[2]._id
      }
    ];

    await Category.insertMany(level3Categories);
    console.log('Created level 3 categories successfully');

    console.log('All categories created successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error creating categories:', error);
    process.exit(1);
  }
};

createEdushopCategories(); 