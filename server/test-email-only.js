require('dotenv').config();
const nodemailer = require('nodemailer');

// Test email using direct nodemailer configuration
async function testEmail() {
  console.log('Testing email with nodemailer...');
  console.log('Email configuration:', {
    user: process.env.EMAIL_USER, 
    from: process.env.EMAIL_FROM,
    // Don't log the password
    passwordConfigured: !!process.env.EMAIL_PASS
  });
  
  try {
    // Create transporter manually
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
    
    // Send test email
    console.log('Sending test email...');
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: 'sms.ultrasnorthlebanon@gmail.com',
      subject: 'Test Email from Sports Management',
      text: 'This is a test email to verify the SMTP configuration.',
      html: '<h1>Test Email</h1><p>This is a test email to verify the SMTP configuration.</p>'
    });
    
    console.log('Email sent successfully!');
    console.log('Message ID:', info.messageId);
    console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
    
  } catch (error) {
    console.error('Error sending email:');
    console.error(error);
    process.exit(1);
  }
}

testEmail(); 