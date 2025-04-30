const mongoose = require('mongoose');
const SingleSessionFee = require('../models/SingleSessionFee');
const User = require('../models/User');
require('dotenv').config();

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

// Define initial single session fees for different sports
const initialFees = [
  {
    sportType: 'Basketball',
    amount: 15,
    currency: 'USD',
    isActive: true
  },
  {
    sportType: 'Football',
    amount: 12,
    currency: 'USD',
    isActive: true
  },
  {
    sportType: 'Volleyball',
    amount: 10,
    currency: 'USD',
    isActive: true
  },
  {
    sportType: 'Swimming',
    amount: 20,
    currency: 'USD',
    isActive: true
  },
  {
    sportType: 'Gym',
    amount: 8,
    currency: 'USD',
    isActive: true
  },
  {
    sportType: 'Ping Pong',
    amount: 5,
    currency: 'USD',
    isActive: true
  }
];

// Create single session fees
const createSingleSessionFees = async () => {
  try {
    // Find an admin user to set as creator
    const adminUser = await User.findOne({ role: 'admin' });
    
    if (!adminUser) {
      console.error('No admin user found. Please run createAdminUser.js script first.');
      process.exit(1);
    }
    
    let createdCount = 0;
    let updatedCount = 0;
    
    for (const feeData of initialFees) {
      // Check if fee already exists for this sport
      const existingFee = await SingleSessionFee.findOne({ sportType: feeData.sportType });
      
      if (existingFee) {
        // Update existing fee
        existingFee.amount = feeData.amount;
        existingFee.currency = feeData.currency;
        existingFee.isActive = feeData.isActive;
        existingFee.updatedBy = adminUser._id;
        
        await existingFee.save();
        console.log(`Updated single session fee for ${feeData.sportType}: $${feeData.amount}`);
        updatedCount++;
      } else {
        // Create new fee
        const fee = new SingleSessionFee({
          ...feeData,
          createdBy: adminUser._id
        });
        
        await fee.save();
        console.log(`Created single session fee for ${feeData.sportType}: $${feeData.amount}`);
        createdCount++;
      }
    }
    
    console.log(`Created ${createdCount} new fees and updated ${updatedCount} existing fees.`);
    process.exit(0);
  } catch (err) {
    console.error('Error creating single session fees:', err);
    process.exit(1);
  }
};

// Run the function
createSingleSessionFees(); 