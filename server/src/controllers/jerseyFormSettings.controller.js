const JerseyFormSettings = require('../models/jerseyFormSettings.model');

// Get jersey form settings
exports.getSettings = async (req, res) => {
  try {
    console.log('getSettings controller called');
    let settings = await JerseyFormSettings.findOne();
    console.log('Settings found:', settings ? 'Yes' : 'No');
    
    if (!settings) {
      console.log('No settings found, creating default');
      // Create default settings if none exist
      settings = await JerseyFormSettings.create({
        jerseyCategories: [
          {
            name: 'Half Sleeve',
            price: 10,
            image: '/images/half-sleeve.jpg',
            isActive: true
          },
          {
            name: 'Full Sleeve',
            price: 15,
            image: '/images/full-sleeve.jpg',
            isActive: true
          }
        ],
        jerseySizes: [
          { size: 'S', chest: '36-38"', length: '26"', shoulder: '17"', isActive: true },
          { size: 'M', chest: '38-40"', length: '27"', shoulder: '18"', isActive: true },
          { size: 'L', chest: '40-42"', length: '28"', shoulder: '19"', isActive: true },
          { size: 'XL', chest: '42-44"', length: '29"', shoulder: '20"', isActive: true },
          { size: 'XXL', chest: '44-46"', length: '30"', shoulder: '21"', isActive: true },
          { size: '3XL', chest: '46-48"', length: '31"', shoulder: '22"', isActive: true }
        ],
        sscBatchYears: [
          { year: '2015', isActive: true },
          { year: '2016', isActive: true },
          { year: '2017', isActive: true },
          { year: '2018', isActive: true },
          { year: '2019', isActive: true },
          { year: '2020', isActive: true },
          { year: '2021', isActive: true },
          { year: '2022', isActive: true },
          { year: '2023', isActive: true }
        ],
        defaultLocation: {
          zipCode: '5100',
          division: 'Rangpur',
          district: 'Thakurgaon'
        },
        isFormActive: true
      });
      console.log('Default settings created');
    }

    console.log('Sending settings response');
    
    // Ensure we're sending a proper JSON response
    return res.status(200).json({
      success: true,
      data: settings
    });
  } catch (error) {
    console.error('Error getting jersey form settings:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to get jersey form settings'
    });
  }
};

// Update jersey form settings
exports.updateSettings = async (req, res) => {
  try {
    const settings = await JerseyFormSettings.findOne();
    
    if (!settings) {
      return res.status(404).json({
        success: false,
        error: 'Settings not found'
      });
    }

    const updatedSettings = await JerseyFormSettings.findByIdAndUpdate(
      settings._id,
      req.body,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      data: updatedSettings
    });
  } catch (error) {
    console.error('Error updating jersey form settings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update jersey form settings'
    });
  }
};

// Toggle form active status
exports.toggleFormStatus = async (req, res) => {
  try {
    const settings = await JerseyFormSettings.findOne();
    
    if (!settings) {
      return res.status(404).json({
        success: false,
        error: 'Settings not found'
      });
    }

    settings.isFormActive = !settings.isFormActive;
    await settings.save();

    res.status(200).json({
      success: true,
      data: settings
    });
  } catch (error) {
    console.error('Error toggling form status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to toggle form status'
    });
  }
}; 