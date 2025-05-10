require('dotenv').config();
const { Resend } = require('resend');

// Test email using Resend API
async function testEmail() {
  console.log('Testing email with Resend API...');
  console.log('Email configuration:', {
    from: process.env.EMAIL_FROM,
    apiKeyConfigured: !!process.env.RESEND_API_KEY
  });
  
  try {
    // Initialize Resend client
    const resend = new Resend(process.env.RESEND_API_KEY);
    
    // Send test email
    console.log('Sending test email...');
    const response = await resend.emails.send({
      from: 'Sports Management System <sms@ultrasnorthlebanon.com>',
      to: 'System.ultrasnorthlebanon@gmail.com',
      subject: 'Test Email from Sports Management',
      text: 'This is a test email to verify the Resend API configuration.',
      html: '<h1>Test Email</h1><p>This is a test email to verify the Resend API configuration.</p>'
    });
    
    console.log('Email sent successfully!');
    console.log('Message ID:', response.id);
    
  } catch (error) {
    console.error('Error sending email:');
    console.error(error);
    process.exit(1);
  }
}

testEmail(); 