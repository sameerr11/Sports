require('dotenv').config();
const mongoose = require('mongoose');
const notificationService = require('./utils/notificationService');

// Define a default MongoDB connection if environment variable is not set
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/sports';

// Connect to MongoDB
console.log(`Connecting to MongoDB: ${MONGODB_URI}`);
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => {
    console.log('MongoDB connected');
    testNotification();
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

async function testNotification() {
  try {
    console.log('Testing notification system...');
    
    // Find a sender user (any user will do)
    const User = require('./models/User');
    const sender = await User.findOne({});
    
    if (!sender) {
      console.error('No users found in the database! Create a user first.');
      process.exit(1);
    }
    
    console.log(`Using sender: ${sender.firstName} ${sender.lastName} (${sender.email})`);
    
    // Test email directly
    console.log('Testing direct email with Resend...');
    const emailService = require('./utils/emailService');
    await emailService.sendEmail({
      to: 'System.ultrasnorthlebanon@gmail.com',
      subject: 'Test Direct Email via Resend',
      from: 'Sports Management System <sms@ultrasnorthlebanon.com>',
      text: 'This is a test email sent directly using emailService with Resend.',
      html: '<h1>Test Direct Email</h1><p>This is a test email sent directly using emailService with Resend.</p>'
    });
    console.log('Direct email sent successfully!');
    
    // Send a test notification with email
    console.log('Testing notification with email...');
    const notification = await notificationService.createNotification({
      recipientId: sender._id, // Send to the same user
      senderId: sender._id,
      type: 'system',
      title: 'Test Notification',
      message: 'This is a test notification with email from the system.',
      sendEmail: true
    });
    
    console.log('Notification created successfully!');
    console.log('Notification:', notification);
    
    // Close connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
    console.log('Test completed successfully!');
  } catch (error) {
    console.error('Error during test:');
    console.error(error);
    
    try {
      await mongoose.connection.close();
      console.log('MongoDB connection closed');
    } catch (err) {
      // Ignore error
    }
    
    process.exit(1);
  }
} 