const mongoose = require('mongoose');
require('dotenv').config({ path: './.env' });

// Connect to MongoDB
const connectDb = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URL);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

// Delete EduShop collection
const deleteEdushopCollection = async () => {
  try {
    const conn = await connectDb();
    
    // Drop the edushop_categories collection
    await conn.connection.db.dropCollection('edushop_categories')
      .then(() => console.log('Successfully deleted edushop_categories collection'))
      .catch(err => {
        if (err.code === 26) {
          console.log('Collection edushop_categories does not exist');
        } else {
          console.error('Error dropping edushop_categories collection:', err);
        }
      });
    
    // Delete the uploads directory for edushop
    console.log('Note: You should manually delete the uploads/edushop directory');
    
    console.log('EduShop data deletion completed');
    process.exit(0);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

// Run the function
deleteEdushopCollection(); 