// Explicitly load dotenv first
require('dotenv').config();

console.log('========== ENVIRONMENT VARIABLES TEST ==========');
console.log('Current directory:', process.cwd());
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT);
console.log('MONGODB_URI:', process.env.MONGODB_URI ? '(set)' : '(not set)');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? '(set)' : '(not set)');
console.log('RESEND_API_KEY exists:', !!process.env.RESEND_API_KEY);
console.log('RESEND_API_KEY first 5 chars:', process.env.RESEND_API_KEY ? process.env.RESEND_API_KEY.substring(0, 5) : 'N/A');
console.log('EMAIL_FROM:', process.env.EMAIL_FROM || '(not set)');
console.log('=================================================');

// Try to initialize Resend
try {
  const { Resend } = require('resend');
  const resend = new Resend(process.env.RESEND_API_KEY);
  console.log('Resend initialized successfully!');
  
  // Try a simple test send
  const testResend = async () => {
    try {
      console.log('Attempting to send test email...');
      const response = await resend.emails.send({
        from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
        to: 'sairmub@gmail.com',
        subject: 'Test from env checker',
        text: 'This is a test email from env checker.'
      });
      console.log('Email sent successfully!');
      console.log('Response:', response);
    } catch (error) {
      console.error('Error sending test email:', error);
    }
  };
  
  testResend();
} catch (error) {
  console.error('Error initializing Resend:', error);
} 