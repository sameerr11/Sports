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

// Test users data
const testUsers = [
  {
    firstName: 'Admin',
    lastName: 'User',
    email: 'admin@example.com',
    password: 'admin123',
    role: 'admin',
    isActive: true
  },
  {
    firstName: 'Supervisor',
    lastName: 'User',
    email: 'supervisor@example.com',
    password: 'supervisor123',
    role: 'supervisor',
    isActive: true
  },
  {
    firstName: 'Coach',
    lastName: 'User',
    email: 'coach@example.com',
    password: 'coach123',
    role: 'coach',
    isActive: true
  },
  {
    firstName: 'Player',
    lastName: 'User',
    email: 'player@example.com',
    password: 'player123',
    role: 'player',
    isActive: true
  }
];

// Create test users
const createTestUsers = async () => {
  try {
    let createdCount = 0;
    
    for (const userData of testUsers) {
      // Check if user already exists
      const existingUser = await User.findOne({ email: userData.email });
      
      if (existingUser) {
        console.log(`User ${userData.email} already exists`);
        continue;
      }
      
      // Create new user
      const user = new User(userData);
      
      await user.save();
      
      console.log(`User ${userData.email} created successfully`);
      createdCount++;
    }
    
    console.log(`Created ${createdCount} new users`);
    process.exit(0);
  } catch (err) {
    console.error('Error creating test users:', err);
    process.exit(1);
  }
};

// Run the function
createTestUsers(); 