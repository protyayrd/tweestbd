const PredefinedDescription = require('../models/predefinedDescription.model');

async function createPredefinedDescription(data, userId) {
  try {
    const predefinedDescription = new PredefinedDescription({
      ...data,
      createdBy: userId
    });
    return await predefinedDescription.save();
  } catch (error) {
    throw error;
  }
}

async function getPredefinedDescriptions(type = null) {
  try {
    const query = { isActive: true };
    if (type) {
      query.type = type;
    }
    return await PredefinedDescription.find(query)
      .populate('createdBy', 'firstName lastName');
  } catch (error) {
    throw error;
  }
}

async function getPredefinedDescriptionById(id) {
  try {
    return await PredefinedDescription.findById(id)
      .populate('createdBy', 'firstName lastName');
  } catch (error) {
    throw error;
  }
}

async function updatePredefinedDescription(id, data) {
  try {
    return await PredefinedDescription.findByIdAndUpdate(
      id,
      { ...data },
      { new: true, runValidators: true }
    );
  } catch (error) {
    throw error;
  }
}

async function deletePredefinedDescription(id) {
  try {
    return await PredefinedDescription.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );
  } catch (error) {
    throw error;
  }
}

module.exports = {
  createPredefinedDescription,
  getPredefinedDescriptions,
  getPredefinedDescriptionById,
  updatePredefinedDescription,
  deletePredefinedDescription
}; 