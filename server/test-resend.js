require('dotenv').config();
const { Resend } = require('resend');

// Test direct Resend API implementation
async function testResend() {
  try {
    console.log('Testing Resend API directly...');
    
    // Check API key
    if (!process.env.RESEND_API_KEY) {
      console.error('ERROR: RESEND_API_KEY is not set in environment variables');
      process.exit(1);
    }
    
    // Check from email
    if (!process.env.EMAIL_FROM) {
      console.error('WARNING: EMAIL_FROM is not set in environment variables');
      console.log('Using default sender: onboarding@resend.dev');
    }
    
    // Initialize Resend
    const resend = new Resend(process.env.RESEND_API_KEY);
    
    // Send test email
    console.log('Sending test email...');
    const response = await resend.emails.send({
      from: 'Sports Management System <sms@ultrasnorthlebanon.com>',
      to: 'System.ultrasnorthlebanon@gmail.com', // Updated email
      subject: 'Resend API Test',
      html: `
        <h1>Resend API Test</h1>
        <p>This is a test email sent directly using the Resend API.</p>
        <p>Sent at: ${new Date().toISOString()}</p>
      `,
    });
    
    console.log('Email sent successfully!');
    console.log('Response:', response);
    
    // If successful, this ID will be present
    if (response.data && response.data.id) {
      console.log('✅ SUCCESS: Email sent with ID:', response.data.id);
    } else {
      console.log('⚠️ WARNING: Email may not have been sent correctly');
    }
    
  } catch (error) {
    console.error('❌ ERROR: Failed to send email:');
    console.error(error);
    process.exit(1);
  }
}

testResend(); 