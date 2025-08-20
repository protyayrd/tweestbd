const express = require('express');
const router = express.Router();
const { getSettings, updateSettings, toggleFormStatus } = require('../controllers/jerseyFormSettings.controller');
const authenticate = require('../middleware/authenticate');
const JerseyFormSettings = require('../models/jerseyFormSettings.model');
const mongoose = require('mongoose');

// Debug route
router.get('/debug', (req, res) => {
  console.log('Debug route for jersey form settings hit');
  res.status(200).json({
    message: 'Jersey form settings debug route is working',
    timestamp: new Date().toISOString()
  });
});

// Database connection debug route
router.get('/debug/db', async (req, res) => {
  try {
    console.log('DB connection state:', mongoose.connection.readyState);
    const connectionState = mongoose.connection.readyState;
    
    // Check connection state
    const connectionStateMap = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };
    
    const dbInfo = {
      state: connectionStateMap[connectionState] || 'unknown',
      dbName: mongoose.connection.name,
      host: mongoose.connection.host,
      port: mongoose.connection.port,
      models: Object.keys(mongoose.models),
      collections: await mongoose.connection.db.listCollections().toArray()
    };
    
    res.status(200).json({
      success: true,
      dbInfo,
      message: 'Database connection information'
    });
  } catch (error) {
    console.error('Error checking database connection:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to check database connection'
    });
  }
});

// Debug route to check model data directly
router.get('/debug/data', async (req, res) => {
  try {
    const count = await JerseyFormSettings.countDocuments();
    const firstRecord = await JerseyFormSettings.findOne();
    
    res.status(200).json({
      success: true,
      count,
      firstRecord,
      message: 'Jersey form settings data debug information'
    });
  } catch (error) {
    console.error('Error checking jersey form settings data:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to check jersey form settings data'
    });
  }
});

// Public route to get settings
router.get('/', getSettings);

// Protected routes for admin
router.put('/', authenticate, updateSettings);
router.put('/toggle-status', authenticate, toggleFormStatus);

module.exports = router; 