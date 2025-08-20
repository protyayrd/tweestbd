const PopupImage = require('../models/popupImage.model');
const fs = require('fs');
const path = require('path');

// Create a new popup image
exports.create = async (req, res) => {
  try {
    // Create a new popup image
    const popupImage = new PopupImage({
      title: req.body.title,
      description: req.body.description,
      imagePath: req.file ? `/uploads/popup/${req.file.filename}` : '',
      sequence: req.body.sequence,
      isActive: req.body.isActive === 'true' || req.body.isActive === true,
      link: req.body.link,
      startDate: req.body.startDate,
      endDate: req.body.endDate,
      createdBy: req.user._id
    });

    // Save the popup image
    const savedPopupImage = await popupImage.save();
    res.status(201).json(savedPopupImage);
  } catch (error) {
    res.status(500).json({ message: 'Error creating popup image', error: error.message });
  }
};

// Get all popup images
exports.findAll = async (req, res) => {
  try {
    const popupImages = await PopupImage.find().sort({ sequence: 1 });
    res.status(200).json(popupImages);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching popup images', error: error.message });
  }
};

// Get active popup images (for frontend)
exports.findActive = async (req, res) => {
  try {
    const currentDate = new Date();
    const popupImages = await PopupImage.find({
      isActive: true,
      $or: [
        { endDate: { $exists: false } },
        { endDate: null },
        { endDate: { $gte: currentDate } }
      ],
      $or: [
        { startDate: { $exists: false } },
        { startDate: null },
        { startDate: { $lte: currentDate } }
      ]
    }).sort({ sequence: 1 });
    
    res.status(200).json(popupImages);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching active popup images', error: error.message });
  }
};

// Get a single popup image by ID
exports.findOne = async (req, res) => {
  try {
    const popupImage = await PopupImage.findById(req.params.id);
    if (!popupImage) {
      return res.status(404).json({ message: 'Popup image not found' });
    }
    res.status(200).json(popupImage);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching popup image', error: error.message });
  }
};

// Update a popup image
exports.update = async (req, res) => {
  try {
    const updateData = {
      title: req.body.title,
      description: req.body.description,
      sequence: req.body.sequence,
      isActive: req.body.isActive === 'true' || req.body.isActive === true,
      link: req.body.link,
      startDate: req.body.startDate,
      endDate: req.body.endDate
    };

    // If a new file is uploaded, update the image path
    if (req.file) {
      // Get the old image to delete it later
      const oldPopupImage = await PopupImage.findById(req.params.id);
      if (oldPopupImage && oldPopupImage.imagePath) {
        const oldImagePath = path.join(__dirname, '../../public', oldPopupImage.imagePath);
        // Delete the old image if it exists
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      
      updateData.imagePath = `/uploads/popup/${req.file.filename}`;
    }

    const updatedPopupImage = await PopupImage.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    if (!updatedPopupImage) {
      return res.status(404).json({ message: 'Popup image not found' });
    }

    res.status(200).json(updatedPopupImage);
  } catch (error) {
    res.status(500).json({ message: 'Error updating popup image', error: error.message });
  }
};

// Delete a popup image
exports.delete = async (req, res) => {
  try {
    const popupImage = await PopupImage.findById(req.params.id);
    
    if (!popupImage) {
      return res.status(404).json({ message: 'Popup image not found' });
    }

    // Delete the image file if it exists
    if (popupImage.imagePath) {
      const imagePath = path.join(__dirname, '../../public', popupImage.imagePath);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    // Delete the popup image from database
    await PopupImage.findByIdAndDelete(req.params.id);
    
    res.status(200).json({ message: 'Popup image deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting popup image', error: error.message });
  }
};

// Update sequences of multiple popup images
exports.updateSequence = async (req, res) => {
  try {
    const sequenceData = req.body;
    
    if (!Array.isArray(sequenceData)) {
      return res.status(400).json({ message: 'Invalid input format. Expected array of objects.' });
    }
    
    const updatePromises = sequenceData.map(item => {
      return PopupImage.findByIdAndUpdate(
        item.id,
        { sequence: item.sequence },
        { new: true }
      );
    });
    
    const updatedImages = await Promise.all(updatePromises);
    
    res.status(200).json(updatedImages);
  } catch (error) {
    res.status(500).json({ message: 'Error updating sequence', error: error.message });
  }
}; 