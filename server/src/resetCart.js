const mongoose = require('mongoose');
const Cart = require('./models/cart.model.js');
const CartItem = require('./models/cartItem.model.js');
require('dotenv').config();

const MONGODB_URL = process.env.MONGODB_URL || 'mongodb://localhost:27017/tweestbd';

// Connect to MongoDB
mongoose.connect(MONGODB_URL)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

async function resetCarts() {
  try {
    // Delete all cart items
    const cartItemResult = await CartItem.deleteMany({});
    console.log(`Deleted ${cartItemResult.deletedCount} cart items`);

    // Delete all carts
    const cartResult = await Cart.deleteMany({});
    console.log(`Deleted ${cartResult.deletedCount} carts`);

    console.log('All carts and cart items have been reset successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error resetting carts:', error);
    process.exit(1);
  }
}

// Run the reset
resetCarts(); 