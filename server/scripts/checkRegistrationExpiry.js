/**
 * Script to manually check for player registrations that are about to expire
 * and send notifications to players and their parents.
 * 
 * This can be run with:
 * node scripts/checkRegistrationExpiry.js
 */

const mongoose = require('mongoose');
const { checkRegistrationExpiry, checkExpiredRegistrations } = require('../utils/registrationExpiryChecker');

// MongoDB connection string (copied from db.js)
const MONGODB_URI = process.env.MONGODB_URI || "MONGODB_URI=mongodb://10.0.1.1:27017/sports";


// Connect to MongoDB
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(async () => {
  console.log('MongoDB Connected');
  
  try {
    // Check for registrations about to expire
    console.log('Starting manual registration expiry check...');
    const result = await checkRegistrationExpiry();
    console.log('Registration expiry check completed successfully.');
    console.log(`Sent ${result.oneWeekNotifications} one-week notifications and ${result.oneDayNotifications} one-day notifications.`);
    
    // Check for expired registrations and notify admins
    console.log('\nStarting manual expired registration check...');
    const expiredResult = await checkExpiredRegistrations();
    console.log('Expired registration check completed successfully.');
    console.log(`Sent ${expiredResult.expiredNotifications} notifications to admins about expired registrations.`);
  } catch (error) {
    console.error('Error running registration checks:', error);
  } finally {
    // Disconnect from database
    mongoose.disconnect();
    console.log('MongoDB Disconnected');
  }
}).catch(err => {
  console.error('Database connection error:', err);
  process.exit(1);
}); 