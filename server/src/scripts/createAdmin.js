const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('../models/user.model');
require('dotenv').config();

const createAdminUser = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URL);
    console.log('Connected to MongoDB');

    // Admin user data
    const adminData = {
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@tweestbd.com',
      password: 'admin123',  // This will be hashed
      role: 'ADMIN',
      mobile: '1234567890'
    };

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: adminData.email });
    if (existingAdmin) {
      console.log('Admin user already exists');
      process.exit(0);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(adminData.password, 8);
    adminData.password = hashedPassword;

    // Create admin user
    const admin = await User.create(adminData);
    console.log('Admin user created successfully:', admin);

    process.exit(0);
  } catch (error) {
    console.error('Error creating admin user:', error);
    process.exit(1);
  }
};

createAdminUser(); 