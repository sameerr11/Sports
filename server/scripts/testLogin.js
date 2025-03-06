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

// Test login function
const testLogin = async (email, password) => {
  try {
    console.log(`Testing login for ${email}...`);
    
    // Find user by email
    const user = await User.findOne({ email });
    
    if (!user) {
      console.log('User not found');
      process.exit(1);
    }
    
    console.log('User found:', {
      id: user._id,
      name: `${user.firstName} ${user.lastName}`,
      email: user.email,
      role: user.role,
      isActive: user.isActive
    });
    
    // Test password comparison
    const isMatch = await user.comparePassword(password);
    
    if (isMatch) {
      console.log('Password match: SUCCESS');
    } else {
      console.log('Password match: FAILED');
      
      // For debugging purposes, let's check the stored password hash
      console.log('Stored password hash:', user.password);
      
      // Generate a new hash for the provided password to compare
      const salt = await bcrypt.genSalt(10);
      const newHash = await bcrypt.hash(password, salt);
      console.log('New hash for provided password:', newHash);
    }
    
    process.exit(0);
  } catch (err) {
    console.error('Error testing login:', err);
    process.exit(1);
  }
};

// Get email and password from command line arguments
const email = process.argv[2] || 'admin@example.com';
const password = process.argv[3] || 'admin123';

// Run the function
testLogin(email, password); 