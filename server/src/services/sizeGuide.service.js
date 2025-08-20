const SizeGuide = require('../models/sizeGuide.model');

async function createSizeGuide(data, userId) {
  try {
    const sizeGuide = new SizeGuide({
      ...data,
      createdBy: userId
    });
    return await sizeGuide.save();
  } catch (error) {
    throw error;
  }
}

async function getSizeGuides(categoryId = null) {
  try {
    const query = { isActive: true };
    if (categoryId) {
      query.category = categoryId;
    }
    return await SizeGuide.find(query)
      .populate('category', 'name')
      .populate('createdBy', 'firstName lastName');
  } catch (error) {
    throw error;
  }
}

async function getSizeGuideById(id) {
  try {
    return await SizeGuide.findById(id)
      .populate('category', 'name')
      .populate('createdBy', 'firstName lastName');
  } catch (error) {
    throw error;
  }
}

async function updateSizeGuide(id, data) {
  try {
    return await SizeGuide.findByIdAndUpdate(
      id,
      { ...data },
      { new: true, runValidators: true }
    );
  } catch (error) {
    throw error;
  }
}

async function deleteSizeGuide(id) {
  try {
    return await SizeGuide.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );
  } catch (error) {
    throw error;
  }
}

module.exports = {
  createSizeGuide,
  getSizeGuides,
  getSizeGuideById,
  updateSizeGuide,
  deleteSizeGuide
}; 