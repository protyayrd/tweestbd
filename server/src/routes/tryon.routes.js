const express = require('express');
const multer = require('multer');
const Replicate = require('replicate');
const axios = require('axios');
const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, and WebP image files are allowed'));
    }
  }
});

// Initialize Replicate client
const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;
let replicate;

if (REPLICATE_API_TOKEN) {
  replicate = new Replicate({
    auth: REPLICATE_API_TOKEN,
  });
}

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Virtual Try-On API',
    timestamp: new Date().toISOString(),
    tokenConfigured: !!REPLICATE_API_TOKEN
  });
});

// Helper function to convert file buffer to base64 data URL
const fileToBase64DataURL = (buffer, mimetype) => {
  const base64 = buffer.toString('base64');
  return `data:${mimetype};base64,${base64}`;
};

// Helper function to validate Replicate token
const validateReplicateToken = () => {
  if (!REPLICATE_API_TOKEN) {
    throw new Error('Replicate API token not configured on server. Please set REPLICATE_API_TOKEN environment variable.');
  }
  
  if (!REPLICATE_API_TOKEN.startsWith('r8_')) {
    throw new Error('Invalid Replicate API token format. Token should start with "r8_".');
  }
  
  if (!replicate) {
    throw new Error('Replicate client not initialized. Check your API token configuration.');
  }
};

// POST /api/tryon/predict - Create a new virtual try-on prediction
router.post('/predict', upload.fields([
  { name: 'personImage', maxCount: 1 },
  { name: 'clothingImage', maxCount: 1 }
]), async (req, res) => {
  try {
    console.log('=== Try-On Prediction Request ===');
    console.log('Files received:', req.files ? Object.keys(req.files) : 'none');
    console.log('Body:', req.body);

    validateReplicateToken();

    const { personImage, clothingImage } = req.files;
    const { garmentDescription } = req.body;

    if (!personImage || !clothingImage) {
      return res.status(400).json({
        success: false,
        error: 'Both person and clothing images are required'
      });
    }

    console.log('Person image:', {
      originalname: personImage[0].originalname,
      mimetype: personImage[0].mimetype,
      size: personImage[0].size
    });
    
    console.log('Clothing image:', {
      originalname: clothingImage[0].originalname,
      mimetype: clothingImage[0].mimetype,
      size: clothingImage[0].size
    });

    // Convert images to base64 data URLs
    const personImageBase64 = fileToBase64DataURL(personImage[0].buffer, personImage[0].mimetype);
    const clothingImageBase64 = fileToBase64DataURL(clothingImage[0].buffer, clothingImage[0].mimetype);

    console.log('Starting Replicate prediction...');

    // Create prediction using Replicate SDK
    const prediction = await replicate.predictions.create({
      model: "cuuupid/idm-vton",
      input: {
        human_img: personImageBase64,
        garm_img: clothingImageBase64,
        garment_des: garmentDescription || "clothing item"
      }
    });

    console.log('Prediction created:', {
      id: prediction.id,
      status: prediction.status
    });

    res.json({
      success: true,
      predictionId: prediction.id,
      status: prediction.status
    });

  } catch (error) {
    console.error('Error creating try-on prediction:', error);
    
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
});

// GET /api/tryon/status/:predictionId - Get prediction status
router.get('/status/:predictionId', async (req, res) => {
  try {
    console.log('=== Getting prediction status ===');
    console.log('Prediction ID:', req.params.predictionId);

    validateReplicateToken();

    const { predictionId } = req.params;

    if (!predictionId) {
      return res.status(400).json({
        success: false,
        error: 'Prediction ID is required'
      });
    }

    const prediction = await replicate.predictions.get(predictionId);

    console.log('Prediction status:', {
      id: predictionId,
      status: prediction.status,
      hasOutput: !!prediction.output
    });

    res.json({
      success: true,
      status: prediction.status,
      output: prediction.output,
      error: prediction.error,
      logs: prediction.logs
    });

  } catch (error) {
    console.error('Error getting prediction status:', error);
    
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get prediction status'
    });
  }
});

// POST /api/tryon/complete - Complete try-on process (create and wait for result)
router.post('/complete', upload.fields([
  { name: 'personImage', maxCount: 1 },
  { name: 'clothingImage', maxCount: 1 }
]), async (req, res) => {
  try {
    console.log('=== Complete Try-On Process ===');
    console.log('Files received:', req.files ? Object.keys(req.files) : 'none');

    validateReplicateToken();

    const { personImage, clothingImage } = req.files;
    const { garmentDescription } = req.body;

    if (!personImage || !clothingImage) {
      return res.status(400).json({
        success: false,
        error: 'Both person and clothing images are required'
      });
    }

    console.log('Processing images:', {
      person: { size: personImage[0].size, type: personImage[0].mimetype },
      clothing: { size: clothingImage[0].size, type: clothingImage[0].mimetype }
    });

    // Convert images to base64 data URLs
    const personImageBase64 = fileToBase64DataURL(personImage[0].buffer, personImage[0].mimetype);
    const clothingImageBase64 = fileToBase64DataURL(clothingImage[0].buffer, clothingImage[0].mimetype);

    console.log('Running IDM-VTON model...');

    // Use replicate.run() method with the correct model version
    const output = await replicate.run(
      "cuuupid/idm-vton:906425dbca90663ff5427624839572cc56ea7d380343d13e2a4c4b09d3f0c30f",
      {
        input: {
          human_img: personImageBase64,
          garm_img: clothingImageBase64,
          garment_des: garmentDescription || "clothing item"
        }
      }
    );

    console.log('Model completed successfully');
    console.log('Output type:', typeof output);
    console.log('Output value:', output);

    // Create a proxied URL to avoid CORS issues
    const API_BASE_URL = process.env.API_BASE_URL || `http://localhost:${process.env.PORT || 5454}`;
    const proxiedImageUrl = `${API_BASE_URL}/api/tryon/image-proxy?url=${encodeURIComponent(output)}`;

    res.json({
      success: true,
      resultImage: proxiedImageUrl,
      originalImageUrl: output,
      message: 'Virtual try-on completed successfully!'
    });

  } catch (error) {
    console.error('Error in complete try-on process:', error);
    
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
});

// GET /api/tryon/image-proxy - Proxy for serving Replicate images with proper CORS headers
router.get('/image-proxy', async (req, res) => {
  try {
    const { url } = req.query;
    
    if (!url) {
      return res.status(400).json({
        success: false,
        error: 'Image URL is required'
      });
    }

    console.log('Proxying image request for URL:', url);

    // Fetch the image from Replicate
    const response = await axios.get(url, {
      responseType: 'stream',
      timeout: 30000
    });

    // Set proper CORS and content headers
    res.set({
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Content-Type': response.headers['content-type'] || 'image/jpeg',
      'Content-Length': response.headers['content-length'],
      'Content-Disposition': 'inline',
      'Cache-Control': 'public, max-age=3600'
    });

    // Pipe the image data
    response.data.pipe(res);

  } catch (error) {
    console.error('Error proxying image:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load image'
    });
  }
});

// Error handling middleware for multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'File size too large. Please use images smaller than 10MB.'
      });
    }
    return res.status(400).json({
      success: false,
      error: `Upload error: ${error.message}`
    });
  } else if (error) {
    return res.status(400).json({
      success: false,
      error: error.message
    });
  }
  next();
});

module.exports = router; 