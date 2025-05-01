require('dotenv').config();
const emailService = require('./utils/emailService');

async function testEmail() {
  try {
    console.log('Testing email service...');
    console.log('Email configuration:', {
      user: process.env.EMAIL_USER, 
      from: process.env.EMAIL_FROM,
      // Don't log the password
      passwordConfigured: !!process.env.EMAIL_PASS
    });
    
    const result = await emailService.sendEmail({
      to: 'sms.ultrasnorthlebanon@gmail.com',
      subject: 'Test Email from Sports Management',
      text: 'This is a test email to verify the SMTP configuration.',
      html: '<h1>Test Email</h1><p>This is a test email to verify the SMTP configuration.</p>'
    });
    
    console.log('Email sent successfully!');
    console.log('Message ID:', result.messageId);
  } catch (error) {
    console.error('Error sending email:');
    console.error(error);
  }
}

testEmail(); 