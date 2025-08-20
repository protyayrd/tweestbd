# Virtual Try-On Setup Guide

## Overview
This guide explains how to set up and use the Virtual Try-On feature on tweestbd.com/tryon using the Replicate IDM-VTON API with the official Replicate SDK.

## Features
- AI-powered virtual try-on using IDM-VTON model
- Official Replicate SDK integration for reliability
- Backend proxy to avoid CORS issues
- Real-time progress tracking
- Mobile responsive design
- File upload validation and error handling

## Prerequisites
1. Node.js and npm installed
2. Replicate API account and token
3. Backend server running
4. Frontend React application

## Setup Instructions

### 1. Backend Configuration

Create a `.env` file in the `server/` directory:

```env
# Virtual Try-On Configuration
REPLICATE_API_TOKEN=r8_your_actual_token_here

# Other environment variables...
PORT=5454
MONGO_URI=mongodb://localhost:27017/tweest
JWT_SECRET=your_jwt_secret_key_here
```

**Get your Replicate API token:**
1. Visit https://replicate.com/account/api-tokens
2. Create a new token
3. Copy the token (starts with `r8_`)

### 2. Frontend Configuration (Optional)

Create a `.env` file in the `client/` directory:

```env
# Enable backend proxy (recommended - set to false only for debugging)
REACT_APP_USE_TRYON_BACKEND=true

# Optional: Direct API token (not recommended due to CORS)
# REACT_APP_REPLICATE_API_TOKEN=r8_your_actual_token_here
```

### 3. Install Dependencies

The required dependencies are already included in package.json files:

**Server dependencies:**
- `replicate` (official Replicate SDK)
- `multer` (for file uploads) 
- `express` (web framework)

**Client dependencies:**
- `axios` (for API requests)
- `@mui/material` (UI components)
- `react-hot-toast` (notifications)

If the `replicate` package is not installed, run:
```bash
cd server
npm install replicate
```

### 4. Start the Applications

**Start the backend server:**
```bash
cd server
npm start
# Server should start on port 5454
```

**Start the frontend client:**
```bash
cd client  
npm start
# Client should start on port 3000
```

### 5. Test the Setup

**Health Check:**
```bash
curl http://localhost:5454/api/tryon/health
```

Expected response:
```json
{
  "status": "ok",
  "service": "Virtual Try-On API", 
  "timestamp": "2025-06-28T08:21:48.913Z",
  "tokenConfigured": true
}
```

## Usage

### Web Interface
1. Visit http://localhost:3000/tryon
2. Upload a person image (clear photo of someone)
3. Upload a clothing image (shirt, dress, etc.)
4. Add an optional garment description
5. Click "Try On" and wait 30-90 seconds

### API Usage

**Complete Try-On (Recommended):**
```bash
curl -X POST http://localhost:5454/api/tryon/complete \
  -F "personImage=@path/to/person.jpg" \
  -F "clothingImage=@path/to/clothing.jpg" \
  -F "garmentDescription=blue t-shirt"
```

**Step-by-step processing:**
```bash
# Create prediction
curl -X POST http://localhost:5454/api/tryon/predict \
  -F "personImage=@path/to/person.jpg" \
  -F "clothingImage=@path/to/clothing.jpg"

# Check status (replace with actual prediction ID)
curl http://localhost:5454/api/tryon/status/PREDICTION_ID
```

## Technical Details

### Architecture
- **Frontend**: React with Material-UI, handles file uploads and progress tracking
- **Backend**: Express.js with official Replicate SDK
- **AI Model**: IDM-VTON via Replicate API (cuuupid/idm-vton:906425dbca90663ff5427624839572cc56ea7d380343d13e2a4c4b09d3f0c30f)

### API Endpoints
- `GET /api/tryon/health` - Health check
- `POST /api/tryon/predict` - Create prediction (returns prediction ID)
- `GET /api/tryon/status/:id` - Get prediction status  
- `POST /api/tryon/complete` - Create and wait for completion (recommended)

### Model Details
- **Model**: `cuuupid/idm-vton:906425dbca90663ff5427624839572cc56ea7d380343d13e2a4c4b09d3f0c30f`
- **Method**: `replicate.run()` for direct completion, `replicate.predictions.create()` for step-by-step
- **Input parameters**: `human_img`, `garm_img`, `garment_des`

### CORS Handling
The implementation uses a backend proxy to avoid CORS issues that occur when calling Replicate API directly from browsers.

## Recent Updates & Fixes

### ✅ Latest Updates (2025-06-28)

**1. Fixed "The specified version does not exist" Error (422)**
- **Root Cause**: Using incorrect model version identifier
- **Solution**: Updated to use correct model with version hash: `cuuupid/idm-vton:906425dbca90663ff5427624839572cc56ea7d380343d13e2a4c4b09d3f0c30f`

**2. Implemented Official Replicate SDK**
- **Replaced**: Manual axios API calls
- **With**: Official `replicate` npm package
- **Benefits**: More reliable, better error handling, automatic retries

**3. Simplified Frontend Service**
- **Removed**: Direct API calls (CORS-prone)
- **Focused**: Backend proxy approach exclusively
- **Added**: Step-by-step processing option

## Troubleshooting

### Common Issues

#### 1. ✅ "The specified version does not exist" Error (422) - FIXED
**Fixed**: Updated to use correct model identifier with version hash.

**Previous**: `model: "cuuupid/idm-vton"`  
**Current**: `"cuuupid/idm-vton:906425dbca90663ff5427624839572cc56ea7d380343d13e2a4c4b09d3f0c30f"`

#### 2. Token not configured
If `tokenConfigured` is `false`, check your `REPLICATE_API_TOKEN` in the server's `.env` file.

✅ **Solution**: Add `REPLICATE_API_TOKEN=r8_your_token` to your server's `.env` file and restart the server.

#### 3. CORS Errors
If you see CORS errors, the backend proxy should handle this automatically.

✅ **Solution**: The frontend now uses backend proxy exclusively.

#### 4. File Upload Errors
- Maximum file size: 10MB
- Supported formats: JPEG, PNG, WebP
- Both person and clothing images are required

#### 5. Timeout Errors
- Processing typically takes 30-90 seconds
- Maximum timeout is 5 minutes for complete endpoint
- If timing out, the model may be busy - try again later

#### 6. Replicate SDK Issues
If you get errors related to the Replicate SDK:

```bash
# Reinstall the package
cd server
npm uninstall replicate
npm install replicate

# Check Node.js version (recommended: Node 18+)
node --version
```

### Debugging

**Check server logs:**
```bash
# Backend logs will show detailed Replicate SDK communication
# Look for "Running IDM-VTON model..." entries
```

**Check frontend console:**
```javascript
// Browser console will show upload progress and errors
// Look for "Using backend proxy for try-on request" messages
```

**Test API token:**
```bash
echo $REPLICATE_API_TOKEN
# Should start with "r8_"
```

**Verify endpoints:**
```bash
curl http://localhost:5454/api/tryon/health
curl http://localhost:3000  # Frontend should load
```

## Cost Information

- **Model**: IDM-VTON (non-commercial use only)
- **Cost**: ~$0.026 per try-on (38 requests per $1)
- **Processing time**: 20-90 seconds typically
- **Hardware**: Nvidia A100 (80GB) GPU

## Production Deployment

### Environment Setup
- Set `NODE_ENV=production` 
- Use environment-specific `.env` files
- Configure proper CORS origins
- Set up SSL certificates
- Use process managers (PM2, etc.)

### Security Considerations
- Keep API tokens secure and rotate regularly
- Implement rate limiting for API endpoints
- Validate file uploads thoroughly  
- Monitor usage and costs on Replicate dashboard
- Consider implementing user authentication

### Performance Optimization
- Official Replicate SDK handles retries and timeouts
- Frontend is configured to use backend proxy exclusively
- File validation happens before upload
- Progress tracking provides user feedback
- Proper error handling at all levels

## API Response Format

**Successful Response (Complete endpoint):**
```json
{
  "success": true,
  "resultImage": "https://replicate.delivery/czjl/.../output.jpg",
  "message": "Virtual try-on completed successfully!"
}
```

**Successful Response (Predict endpoint):**
```json
{
  "success": true,
  "predictionId": "prediction_id_here",
  "status": "starting"
}
```

**Status Response:**
```json
{
  "success": true,
  "status": "succeeded",
  "output": "https://replicate.delivery/czjl/.../output.jpg",
  "error": null,
  "logs": "..."
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Error message here"
}
```

## License and Usage

- IDM-VTON model: CC BY-NC-SA 4.0 license (non-commercial use only)
- Created by Korea Advanced Institute of Science & Technology (KAIST)
- Research paper: "Improving Diffusion Models for Authentic Virtual Try-on in the Wild"

## Configuration Reference

**Environment Variables:**

Server (.env):
```env
REPLICATE_API_TOKEN=r8_your_actual_token
PORT=5454
NODE_ENV=development
```

Client (.env):
```env
# Optional - frontend now uses backend proxy exclusively
REACT_APP_USE_TRYON_BACKEND=true
```

---

## Change Log

**2025-06-28 - Major Update:**
1. ✅ Fixed 422 "version does not exist" error
2. ✅ Implemented official Replicate SDK (`replicate` npm package)
3. ✅ Updated to correct model version with hash
4. ✅ Simplified frontend to use backend proxy exclusively
5. ✅ Improved error handling and logging
6. ✅ Added step-by-step processing option

**Key Changes:**
- **Backend**: Now uses `replicate.run()` and `replicate.predictions.create()`
- **Model**: `cuuupid/idm-vton:906425dbca90663ff5427624839572cc56ea7d380343d13e2a4c4b09d3f0c30f`
- **Frontend**: Simplified service focused on backend proxy
- **Dependencies**: Added `replicate` npm package

For questions or issues, check the server logs and browser console for detailed error messages. 