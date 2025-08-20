const mongoose = require('mongoose');
const Cart = require('./models/cart.model.js');
require('dotenv').config();

const MONGODB_URL = process.env.MONGODB_URL || 'mongodb://localhost:27017/tweestbd';

// Connect to MongoDB
mongoose.connect(MONGODB_URL)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

async function fixCart() {
  try {
    // Find all carts
    const carts = await Cart.find({});
    console.log(`Found ${carts.length} carts`);

    // Update each cart
    for (const cart of carts) {
      console.log(`Fixing cart ${cart._id} for user ${cart.user}`);
      
      // Set proper promoDetails
      cart.promoDetails = {
        code: undefined,
        discountType: 'FIXED',
        discountAmount: 0,
        maxDiscountAmount: undefined
      };
      
      // Save with validation disabled
      await cart.save({ validateBeforeSave: false });
      console.log(`Cart ${cart._id} fixed successfully`);
    }

    console.log('All carts fixed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error fixing carts:', error);
    process.exit(1);
  }
}

// Run the fix
fixCart(); 