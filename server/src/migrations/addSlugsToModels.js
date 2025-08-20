const mongoose = require('mongoose');
const Product = require('../models/product.model');
const Category = require('../models/category.model');

const mongoDbUrl = process.env.MONGODB_URL || 'mongodb://localhost:27017/tweestbd';

// Function to generate slug from text
function generateSlug(text) {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

async function addSlugs() {
  try {
    // Connect to MongoDB
    await mongoose.connect(mongoDbUrl, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB');

    // Add slugs to products
    const products = await Product.find({ slug: { $exists: false } });
    console.log(`Found ${products.length} products without slugs`);
    
    for (const product of products) {
      // Prefer using SKU if available, otherwise use title
      let baseText = product.sku || product.title;
      let slug = generateSlug(baseText);
      let counter = 0;
      let uniqueSlug = slug;
      
      // Check if slug exists and make it unique if needed
      while (await Product.findOne({ slug: uniqueSlug, _id: { $ne: product._id } })) {
        counter++;
        uniqueSlug = `${slug}-${counter}`;
      }
      
      product.slug = uniqueSlug;
      await product.save();
      console.log(`Added slug "${uniqueSlug}" to product: ${product.title}`);
    }

    // Add slugs to categories
    const categories = await Category.find({ slug: { $exists: false } });
    console.log(`Found ${categories.length} categories without slugs`);
    
    for (const category of categories) {
      let slug = generateSlug(category.name);
      let counter = 0;
      let uniqueSlug = slug;
      
      // Check if slug exists and make it unique if needed
      while (await Category.findOne({ slug: uniqueSlug, _id: { $ne: category._id } })) {
        counter++;
        uniqueSlug = `${slug}-${counter}`;
      }
      
      category.slug = uniqueSlug;
      await category.save();
      console.log(`Added slug "${uniqueSlug}" to category: ${category.name}`);
    }

    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

addSlugs(); 