#!/bin/bash

# Set production environment variables
export REACT_APP_API_URL=https://tweestbd.com
export NODE_ENV=production

# Install dependencies if needed
npm install

# Build the application
npm run build

echo "Build completed with REACT_APP_API_URL=$REACT_APP_API_URL" 