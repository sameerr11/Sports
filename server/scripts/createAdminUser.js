const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import the User model
const User = require('../models/User');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected'))
.catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

// Admin user data
const adminUser = {
  firstName: 'Admin',
  lastName: 'User',
  email: 'admin@example.com',
  password: 'admin123',
  role: 'admin',
  isActive: true
};

// Create admin user
const createAdminUser = async () => {
  try {
    // Check if admin user already exists
    const existingUser = await User.findOne({ email: adminUser.email });
    
    if (existingUser) {
      console.log('Admin user already exists');
      process.exit(0);
    }
    
    // Create new admin user
    const user = new User(adminUser);
    
    await user.save();
    
    console.log('Admin user created successfully');
    process.exit(0);
  } catch (err) {
    console.error('Error creating admin user:', err);
    process.exit(1);
  }
};

// Run the function
createAdminUser(); 