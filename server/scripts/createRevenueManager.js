const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const createRevenueManager = async () => {
  try {
    // Check if revenue manager already exists
    const existingUser = await User.findOne({ email: 'revenue@sportscenter.com' });
    
    if (existingUser) {
      console.log('Revenue manager user already exists.');
      return;
    }
    
    // Create a new revenue manager user
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('revenue123', salt);
    
    const revenueManager = new User({
      firstName: 'Revenue',
      lastName: 'Manager',
      email: 'revenue@sportscenter.com',
      password: hashedPassword,
      role: 'revenue_manager'
    });
    
    await revenueManager.save();
    console.log('Revenue manager user created successfully.');
  } catch (error) {
    console.error('Error creating revenue manager user:', error);
  } finally {
    // Disconnect from MongoDB
    mongoose.disconnect();
  }
};

// Run the script
createRevenueManager(); 