const comboOfferService = require('../services/comboOffer.service');

// Create a new combo offer
const createComboOffer = async (req, res) => {
  try {
    const offerData = {
      ...req.body,
      createdBy: req.user.id // Assuming user authentication middleware provides user id
    };
    
    const comboOffer = await comboOfferService.createComboOffer(offerData);
    
    res.status(201).json({
      success: true,
      message: 'Combo offer created successfully',
      data: comboOffer
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to create combo offer'
    });
  }
};

// Get all combo offers
const getAllComboOffers = async (req, res) => {
  try {
    const comboOffers = await comboOfferService.getAllComboOffers();
    
    res.status(200).json({
      success: true,
      data: comboOffers
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch combo offers'
    });
  }
};

// Get combo offer by ID
const getComboOfferById = async (req, res) => {
  try {
    const { id } = req.params;
    const comboOffer = await comboOfferService.getComboOfferById(id);
    
    if (!comboOffer) {
      return res.status(404).json({
        success: false,
        message: 'Combo offer not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: comboOffer
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch combo offer'
    });
  }
};

// Get combo offer by category
const getComboOfferByCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const comboOffer = await comboOfferService.getComboOfferByCategory(categoryId);
    
    if (!comboOffer) {
      return res.status(404).json({
        success: false,
        message: 'No active combo offer found for this category'
      });
    }
    
    res.status(200).json({
      success: true,
      data: comboOffer
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch combo offer'
    });
  }
};

// Update combo offer
const updateComboOffer = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const updatedOffer = await comboOfferService.updateComboOffer(id, updateData);
    
    res.status(200).json({
      success: true,
      message: 'Combo offer updated successfully',
      data: updatedOffer
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to update combo offer'
    });
  }
};

// Delete combo offer
const deleteComboOffer = async (req, res) => {
  try {
    const { id } = req.params;
    
    await comboOfferService.deleteComboOffer(id);
    
    res.status(200).json({
      success: true,
      message: 'Combo offer deleted successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to delete combo offer'
    });
  }
};

// Toggle combo offer status
const toggleComboOfferStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;
    
    const updatedOffer = await comboOfferService.updateComboOffer(id, { isActive });
    
    res.status(200).json({
      success: true,
      message: `Combo offer ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: updatedOffer
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to update combo offer status'
    });
  }
};

// Get combo pricing for category and quantity
const getComboPricing = async (req, res) => {
  try {
    const { categoryId, quantity } = req.query;
    
    if (!categoryId || !quantity) {
      return res.status(400).json({
        success: false,
        message: 'Category ID and quantity are required'
      });
    }
    
    const pricing = await comboOfferService.getComboPricingForCategory(categoryId, parseInt(quantity));
    
    res.status(200).json({
      success: true,
      data: pricing
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to calculate combo pricing'
    });
  }
};

module.exports = {
  createComboOffer,
  getAllComboOffers,
  getComboOfferById,
  getComboOfferByCategory,
  updateComboOffer,
  deleteComboOffer,
  toggleComboOfferStatus,
  getComboPricing
}; 