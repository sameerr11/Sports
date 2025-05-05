require('dotenv').config();
const emailService = require('./utils/emailService');

async function testEmail() {
  try {
    console.log('Testing email service with Resend...');
    console.log('Email configuration:', {
      resendApiKey: process.env.RESEND_API_KEY ? '******' : undefined,
      from: process.env.EMAIL_FROM,
    });
    
    const result = await emailService.sendEmail({
      to: 'sairmub@gmail.com',
      subject: 'Test Email from Sports Management via Resend',
      text: 'This is a test email to verify the Resend API configuration.',
      html: '<h1>Test Email</h1><p>This is a test email to verify the Resend API configuration.</p>'
    });
    
    console.log('Email sent successfully!');
    console.log('Message ID:', result.id);
  } catch (error) {
    console.error('Error sending email:');
    console.error(error);
  }
}

testEmail(); 