const sizeGuideService = require('../services/sizeGuide.service');

async function createSizeGuide(req, res) {
  try {
    const sizeGuide = await sizeGuideService.createSizeGuide(req.body, req.user._id);
    res.status(201).json(sizeGuide);
  } catch (error) {
    console.error('Error creating size guide:', error);
    res.status(400).json({ message: error.message });
  }
}

async function getSizeGuides(req, res) {
  try {
    const { categoryId } = req.query;
    const sizeGuides = await sizeGuideService.getSizeGuides(categoryId);
    res.json(sizeGuides);
  } catch (error) {
    console.error('Error getting size guides:', error);
    res.status(500).json({ message: error.message });
  }
}

async function getSizeGuideById(req, res) {
  try {
    const sizeGuide = await sizeGuideService.getSizeGuideById(req.params.id);
    if (!sizeGuide) {
      return res.status(404).json({ message: 'Size guide not found' });
    }
    res.json(sizeGuide);
  } catch (error) {
    console.error('Error getting size guide:', error);
    res.status(500).json({ message: error.message });
  }
}

async function updateSizeGuide(req, res) {
  try {
    const sizeGuide = await sizeGuideService.updateSizeGuide(req.params.id, req.body);
    if (!sizeGuide) {
      return res.status(404).json({ message: 'Size guide not found' });
    }
    res.json(sizeGuide);
  } catch (error) {
    console.error('Error updating size guide:', error);
    res.status(400).json({ message: error.message });
  }
}

async function deleteSizeGuide(req, res) {
  try {
    const sizeGuide = await sizeGuideService.deleteSizeGuide(req.params.id);
    if (!sizeGuide) {
      return res.status(404).json({ message: 'Size guide not found' });
    }
    res.json({ message: 'Size guide deleted successfully' });
  } catch (error) {
    console.error('Error deleting size guide:', error);
    res.status(500).json({ message: error.message });
  }
}

module.exports = {
  createSizeGuide,
  getSizeGuides,
  getSizeGuideById,
  updateSizeGuide,
  deleteSizeGuide
}; 