const mongoose = require('mongoose');
const Product = require('../models/product.model');

const mongoDbUrl = 'mongodb://127.0.0.1:27017/tweestbd';

async function migrateProducts() {
  try {
    // Connect to MongoDB
    await mongoose.connect(mongoDbUrl, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB');

    // Find all products with old schema
    const products = await Product.find({
      imageUrl: { $exists: true },
      'colors.0': { $exists: false }
    });

    console.log(`Found ${products.length} products to migrate`);

    // Update each product
    for (const product of products) {
      const colors = [{
        name: product.color || 'Default',
        images: [product.imageUrl],
        quantity: product.quantity || 0
      }];

      // Update the product with new schema
      await Product.findByIdAndUpdate(product._id, {
        $set: { colors },
        $unset: { 
          imageUrl: "",
          color: "",
          brand: ""
        }
      });

      console.log(`Migrated product: ${product.title}`);
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
migrateProducts(); 