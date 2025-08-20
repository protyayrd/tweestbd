const mongoose = require('mongoose');
const Product = require('../models/product.model');

const mongoDbUrl = 'mongodb://127.0.0.1:27017/tweestbd';

// Separator used between description sections
const SECTION_SEPARATOR = '**********';

/**
 * This script extracts data from the description field of existing products
 * and populates the new fields: features, perfectFor, and additionalInfo
 */
async function migrateProductDescriptions() {
  try {
    // Connect to MongoDB
    await mongoose.connect(mongoDbUrl, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB');

    // Find all products that need migration (features field is empty or doesn't exist)
    const products = await Product.find({
      $or: [
        { features: { $exists: false } },
        { features: "" },
        { features: null }
      ]
    });

    console.log(`Found ${products.length} products to migrate`);

    // Process each product
    for (const product of products) {
      console.log(`Processing product: ${product.title} (${product._id})`);
      
      // Skip if the description doesn't contain any separators
      if (!product.description || !product.description.includes(SECTION_SEPARATOR)) {
        console.log(`Skipping product ${product._id}: No section separators found`);
        continue;
      }

      try {
        // Extract sections from the description
        const sections = product.description.split(SECTION_SEPARATOR);
        
        // Initialize update object with default values
        const updateObj = {
          features: '',
          perfectFor: '',
          additionalInfo: ''
        };

        // Main description is the first section
        updateObj.description = sections[0].trim();
        
        // Extract other sections based on their titles
        for (let i = 1; i < sections.length; i++) {
          const section = sections[i].trim();
          
          if (section.startsWith('PRODUCT FEATURES')) {
            updateObj.features = sections[i + 1]?.trim() || '';
            i++; // Skip the next section since we've processed it
          } else if (section.startsWith('PERFECT FOR')) {
            updateObj.perfectFor = sections[i + 1]?.trim() || '';
            i++; // Skip the next section
          } else if (section.startsWith('ADDITIONAL INFORMATION')) {
            updateObj.additionalInfo = sections[i + 1]?.trim() || '';
            i++; // Skip the next section
          }
        }

        // Update the product with the extracted fields
        await Product.findByIdAndUpdate(product._id, updateObj);
        console.log(`Updated product ${product._id} successfully`);
      } catch (error) {
        console.error(`Error processing product ${product._id}:`, error);
      }
    }

    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the migration
migrateProductDescriptions().then(() => {
  console.log('Script finished');
}).catch(err => {
  console.error('Script encountered an error:', err);
}); 