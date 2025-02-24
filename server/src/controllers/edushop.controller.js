const Edushop = require('../models/edushop.model');
const path = require('path');
const fs = require('fs');

// Create a new edushop category
const createEdushopCategory = async (req, res) => {
  try {
    const { name, parentCategory, level, description, displayOrder } = req.body;
    const files = req.files;
    
    // Debug log
    console.log('Received request body:', req.body);
    console.log('Received files:', files);
    
    // Validate required fields
    if (!name || !level) {
      return res.status(400).json({ message: 'Name and level are required' });
    }

    // Convert level to number for comparison
    const levelNum = parseInt(level);

    // Create category data
    const categoryData = {
      name,
      level: levelNum,
      description,
      displayOrder: displayOrder ? parseInt(displayOrder) : 0,
    };

    // Add parent category if provided
    if (parentCategory) {
      categoryData.parentCategory = parentCategory;
    }

    // Handle file paths based on level
    if (levelNum === 1) {
      // Level 1 requires both logo and image
      if (!files?.logo?.[0] || !files?.image?.[0]) {
        return res.status(400).json({ message: 'Both logo and category image are required for Level 1 categories' });
      }
      categoryData.logoUrl = `/uploads/edushop/${files.logo[0].filename}`;
      categoryData.imageUrl = `/uploads/edushop/${files.image[0].filename}`;
    } else if (levelNum === 2) {
      // Level 2 only requires image
      if (!files?.image?.[0]) {
        return res.status(400).json({ message: 'Category image is required for Level 2 categories' });
      }
      categoryData.imageUrl = `/uploads/edushop/${files.image[0].filename}`;
      // Set logoUrl to null for level 2 categories
      categoryData.logoUrl = null;
    }

    const edushopCategory = new Edushop(categoryData);
    const savedCategory = await edushopCategory.save();
    
    if (savedCategory.parentCategory) {
      await savedCategory.populate('parentCategory');
    }
    
    res.status(201).json(savedCategory);
  } catch (error) {
    console.error('Edushop category creation error:', error);
    res.status(400).json({ message: error.message });
  }
};

// Get all edushop categories
const getAllEdushopCategories = async (req, res) => {
  try {
    const categories = await Edushop.find({ isActive: true })
      .populate('parentCategory')
      .sort({ displayOrder: 1, createdAt: -1 });
    res.status(200).json(categories);
  } catch (error) {
    console.error('Get edushop categories error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get edushop category by ID
const getEdushopCategoryById = async (req, res) => {
  try {
    const category = await Edushop.findById(req.params.id)
      .populate('parentCategory');
    
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    
    res.status(200).json(category);
  } catch (error) {
    console.error('Get edushop category error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Update edushop category
const updateEdushopCategory = async (req, res) => {
  try {
    const { name, parentCategory, level, description, displayOrder, isActive } = req.body;
    const files = req.files;
    
    // Get existing category
    const existingCategory = await Edushop.findById(req.params.id);
    if (!existingCategory) {
      return res.status(404).json({ message: 'Category not found' });
    }

    // Update data object
    const updateData = {
      name: name || existingCategory.name,
      level: level || existingCategory.level,
      description: description || existingCategory.description,
      parentCategory: parentCategory || existingCategory.parentCategory,
      displayOrder: displayOrder !== undefined ? displayOrder : existingCategory.displayOrder,
      isActive: isActive !== undefined ? isActive : existingCategory.isActive
    };

    // Handle logo update
    if (files && files.logo) {
      // Delete old logo
      if (existingCategory.logoUrl) {
        const oldLogoPath = path.join(__dirname, '../../public', existingCategory.logoUrl);
        if (fs.existsSync(oldLogoPath)) {
          fs.unlinkSync(oldLogoPath);
        }
      }
      updateData.logoUrl = `/uploads/edushop/${path.basename(files.logo[0].path)}`;
    }

    // Handle image update
    if (files && files.image) {
      // Delete old image
      if (existingCategory.imageUrl) {
        const oldImagePath = path.join(__dirname, '../../public', existingCategory.imageUrl);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      updateData.imageUrl = `/uploads/edushop/${path.basename(files.image[0].path)}`;
    }

    // Update the category
    const updatedCategory = await Edushop.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate('parentCategory');

    res.status(200).json(updatedCategory);
  } catch (error) {
    console.error('Edushop category update error:', error);
    res.status(400).json({ message: error.message });
  }
};

// Delete edushop category
const deleteEdushopCategory = async (req, res) => {
  try {
    const category = await Edushop.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    // Delete associated images
    if (category.logoUrl) {
      const logoPath = path.join(__dirname, '../../public', category.logoUrl);
      if (fs.existsSync(logoPath)) {
        fs.unlinkSync(logoPath);
      }
    }

    if (category.imageUrl) {
      const imagePath = path.join(__dirname, '../../public', category.imageUrl);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    await Edushop.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Delete edushop category error:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createEdushopCategory,
  getAllEdushopCategories,
  getEdushopCategoryById,
  updateEdushopCategory,
  deleteEdushopCategory
}; 