const Category = require('../models/category.model.js');
const path = require('path');
const fs = require('fs');

// Create a new category
const createCategory = async (req, res) => {
  try {
    const { name, parentCategory, level, description, featuredInCarousel } = req.body;
    
    // req.filePath is set by the upload middleware
    const imageUrl = `/uploads/categories/${path.basename(req.file.path)}`;
    console.log('Image URL to be saved:', imageUrl);

    const category = new Category({
      name,
      parentCategory,
      level,
      imageUrl,
      description,
      featuredInCarousel: featuredInCarousel === 'true' || featuredInCarousel === true
    });
    
    const savedCategory = await category.save();
    console.log('Category saved:', savedCategory);
    res.status(201).json(savedCategory);
  } catch (error) {
    console.error('Category creation error:', error);
    res.status(400).json({ message: error.message });
  }
};

// Get all categories
const getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find().populate('parentCategory', 'name');
    res.status(200).json(categories);
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get category by ID
const getCategoryById = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id).populate('parentCategory', 'name');
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    res.status(200).json(category);
  } catch (error) {
    console.error('Get category error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Update category
const updateCategory = async (req, res) => {
  try {
    console.log('Update request body:', req.body);
    console.log('Update request file:', req.file);

    // Get the existing category first
    const existingCategory = await Category.findById(req.params.id);
    if (!existingCategory) {
      return res.status(404).json({ message: 'Category not found' });
    }

    // If we're only updating featuredInCarousel
    if (req.body.featuredInCarousel !== undefined && !req.file && Object.keys(req.body).length === 1) {
      console.log('Updating only featuredInCarousel to:', req.body.featuredInCarousel);
      
      // Parse the featuredInCarousel value to ensure it's a boolean
      const featuredValue = req.body.featuredInCarousel === true || req.body.featuredInCarousel === 'true';
      console.log('Parsed featuredInCarousel value:', featuredValue);

      // Update the existing category
      existingCategory.featuredInCarousel = featuredValue;
      
      // Save the document to trigger schema defaults
      const updatedCategory = await existingCategory.save();
      await updatedCategory.populate('parentCategory');

      console.log('Updated category:', updatedCategory);
      return res.status(200).json(updatedCategory);
    }

    // For other updates, handle all fields
    const updateData = {
      name: req.body.name || existingCategory.name,
      level: req.body.level || existingCategory.level,
      description: req.body.description || existingCategory.description,
      parentCategory: req.body.parentCategory || existingCategory.parentCategory,
      featuredInCarousel: req.body.featuredInCarousel !== undefined 
        ? (req.body.featuredInCarousel === true || req.body.featuredInCarousel === 'true')
        : existingCategory.featuredInCarousel
    };

    if (req.file) {
      // Delete old image if it exists
      if (existingCategory.imageUrl) {
        const oldImagePath = path.join(__dirname, '../../public', existingCategory.imageUrl);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
          console.log('Deleted old category image:', oldImagePath);
        }
      }
      updateData.imageUrl = `/uploads/categories/${path.basename(req.file.path)}`;
    }

    console.log('Final update data:', updateData);

    // Update the existing category
    Object.assign(existingCategory, updateData);

    // Save the document
    const updatedCategory = await existingCategory.save();
    await updatedCategory.populate('parentCategory');

    console.log('Updated category:', updatedCategory);
    res.status(200).json(updatedCategory);
  } catch (error) {
    console.error('Category update error:', error);
    res.status(400).json({ message: error.message });
  }
};

// Get featured categories
const getFeaturedCategories = async (req, res) => {
  try {
    const categories = await Category.find({ 
      level: 3,
      featuredInCarousel: true 
    }).populate('parentCategory');
    res.status(200).json(categories);
  } catch (error) {
    console.error('Get featured categories error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Delete category
const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    // Delete associated image
    if (category.imageUrl) {
      const imagePath = path.join(__dirname, '../../public', category.imageUrl);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
        console.log('Deleted category image:', imagePath);
      }
    }

    await Category.findByIdAndDelete(req.params.id);
    console.log('Category deleted:', req.params.id);
    res.status(200).json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
  getFeaturedCategories
}; 