const mongoose = require('mongoose');
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

// List all users
const listUsers = async () => {
  try {
    // Find all users but don't return the password field
    const users = await User.find().select('-password');
    
    console.log('Users in database:');
    console.log(JSON.stringify(users, null, 2));
    console.log(`Total users: ${users.length}`);
    
    process.exit(0);
  } catch (err) {
    console.error('Error listing users:', err);
    process.exit(1);
  }
};

// Run the function
listUsers(); 