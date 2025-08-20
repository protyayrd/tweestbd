const predefinedDescriptionService = require('../services/predefinedDescription.service');

async function createPredefinedDescription(req, res) {
  try {
    const predefinedDescription = await predefinedDescriptionService.createPredefinedDescription(req.body, req.user._id);
    res.status(201).json(predefinedDescription);
  } catch (error) {
    console.error('Error creating predefined description:', error);
    res.status(400).json({ message: error.message });
  }
}

async function getPredefinedDescriptions(req, res) {
  try {
    const { type } = req.query;
    const predefinedDescriptions = await predefinedDescriptionService.getPredefinedDescriptions(type);
    res.json(predefinedDescriptions);
  } catch (error) {
    console.error('Error getting predefined descriptions:', error);
    res.status(500).json({ message: error.message });
  }
}

async function getPredefinedDescriptionById(req, res) {
  try {
    const predefinedDescription = await predefinedDescriptionService.getPredefinedDescriptionById(req.params.id);
    if (!predefinedDescription) {
      return res.status(404).json({ message: 'Predefined description not found' });
    }
    res.json(predefinedDescription);
  } catch (error) {
    console.error('Error getting predefined description:', error);
    res.status(500).json({ message: error.message });
  }
}

async function updatePredefinedDescription(req, res) {
  try {
    const predefinedDescription = await predefinedDescriptionService.updatePredefinedDescription(req.params.id, req.body);
    if (!predefinedDescription) {
      return res.status(404).json({ message: 'Predefined description not found' });
    }
    res.json(predefinedDescription);
  } catch (error) {
    console.error('Error updating predefined description:', error);
    res.status(400).json({ message: error.message });
  }
}

async function deletePredefinedDescription(req, res) {
  try {
    const predefinedDescription = await predefinedDescriptionService.deletePredefinedDescription(req.params.id);
    if (!predefinedDescription) {
      return res.status(404).json({ message: 'Predefined description not found' });
    }
    res.json({ message: 'Predefined description deleted successfully' });
  } catch (error) {
    console.error('Error deleting predefined description:', error);
    res.status(500).json({ message: error.message });
  }
}

module.exports = {
  createPredefinedDescription,
  getPredefinedDescriptions,
  getPredefinedDescriptionById,
  updatePredefinedDescription,
  deletePredefinedDescription
}; 