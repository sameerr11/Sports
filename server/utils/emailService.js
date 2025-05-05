const nodemailer = require('nodemailer');
const { Resend } = require('resend');

/**
 * Email service for sending notifications via Resend API
 * Configuration should be set in environment variables:
 * - RESEND_API_KEY: Your Resend API key
 * - EMAIL_FROM: Sender name <email> format
 */

// Check if API key is available
const apiKey = process.env.RESEND_API_KEY;
console.log('Email configuration status:', {
  apiKeyExists: !!apiKey, 
  apiKeyFirstChars: apiKey ? `${apiKey.substring(0, 5)}...` : 'not set',
  fromEmail: process.env.EMAIL_FROM || 'not set'
});

if (!apiKey) {
  console.warn('WARNING: RESEND_API_KEY is not set in environment variables. Email sending will not work.');
  console.warn('Please add RESEND_API_KEY to your .env file or environment variables.');
}

// Initialize Resend client if API key is available
const resend = apiKey ? new Resend(apiKey) : null;

/**
 * Send email notification
 * @param {Object} emailData - Email data
 * @param {String|Array} emailData.to - Recipient email(s)
 * @param {String} emailData.subject - Email subject
 * @param {String} emailData.text - Plain text content
 * @param {String} emailData.html - HTML content (optional)
 * @returns {Promise<Object>} Send result
 */
const sendEmail = async (emailData) => {
  try {
    // Fix any typos in email addresses
    let recipients = Array.isArray(emailData.to) ? emailData.to : [emailData.to];
    recipients = recipients.map(email => {
      // Fix common typos
      return email.replace('gmil.com', 'gmail.com');
    });
    
    // If Resend client is not initialized, log warning and return
    if (!resend) {
      console.error('Cannot send email: RESEND_API_KEY is not configured');
      return { error: 'Email service not configured' };
    }
    
    console.log(`Attempting to send email to: ${recipients.join(', ')}`);
    
    const response = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
      to: recipients,
      subject: emailData.subject,
      text: emailData.text,
      html: emailData.html || emailData.text
    });
    
    console.log('Email sent successfully:', response.data?.id);
    return response;
  } catch (error) {
    console.error('Error sending email:', error);
    return { error: error.message };
  }
};

/**
 * Send registration notification email
 * @param {Object} userData - User data
 * @param {String} userData.email - User email
 * @param {String} userData.firstName - User first name
 * @param {String} userData.lastName - User last name
 * @param {String} userData.role - User role
 * @param {String} userData.password - User password (optional)
 * @returns {Promise<Object>} Send result
 */
const sendRegistrationEmail = async (userData) => {
  const subject = 'Welcome to Sports Management Platform';
  const passwordText = userData.password 
    ? `\nYour password: ${userData.password}\n\nPlease keep this information secure and change your password after your first login.` 
    : '';
  
  const text = `Hello ${userData.firstName} ${userData.lastName},
  
Welcome to our Sports Management Platform! Your account has been created successfully.

Role: ${userData.role}${passwordText}

Thank you for joining us!

Best regards,
The Sports Management Team`;

  const passwordHtml = userData.password 
    ? `<p><strong>Your password:</strong> ${userData.password}</p><p>Please keep this information secure and change your password after your first login.</p>` 
    : '';

  const html = `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <h2>Welcome to Sports Management Platform!</h2>
    <p>Hello ${userData.firstName} ${userData.lastName},</p>
    <p>Your account has been created successfully.</p>
    <p><strong>Role:</strong> ${userData.role}</p>
    ${passwordHtml}
    <p>Thank you for joining us!</p>
    <p>Best regards,<br>The Sports Management Team</p>
  </div>
  `;

  return sendEmail({
    to: userData.email,
    subject,
    text,
    html
  });
};

/**
 * Send booking confirmation email
 * @param {Object} data - Email data
 * @returns {Promise<Object>} Email result
 */
const sendBookingConfirmationEmail = async (data) => {
  try {
    const { userEmail, userName, date, time, facility, bookingId, paymentMessage } = data;
    
    const emailContent = {
      to: userEmail,
      subject: 'Booking Confirmation',
      html: `
        <h2>Booking Confirmation</h2>
        <p>Dear ${userName},</p>
        <p>Your booking has been confirmed with the following details:</p>
        <ul>
          <li>Booking ID: ${bookingId}</li>
          <li>Date: ${date}</li>
          <li>Time: ${time}</li>
          <li>Facility: ${facility}</li>
        </ul>
        <p>${paymentMessage}</p>
        <p>Thank you for choosing our facility. We look forward to seeing you!</p>
        <p>Best regards,<br>The Sports Management System Team</p>
      `
    };
    
    return await sendEmail(emailContent);
  } catch (error) {
    console.error('Error sending booking confirmation email:', error);
    throw error;
  }
};

/**
 * Send admin broadcast email
 * @param {Object} broadcastData - Broadcast data
 * @param {Array} broadcastData.recipients - Array of recipient emails
 * @param {String} broadcastData.subject - Email subject
 * @param {String} broadcastData.message - Email message
 * @returns {Promise<Object>} Send result
 */
const sendAdminBroadcastEmail = async (broadcastData) => {
  try {
    const emailContent = {
      to: broadcastData.recipients,
      subject: broadcastData.subject,
      text: broadcastData.message,
      html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>${broadcastData.subject}</h2>
        <div style="white-space: pre-line;">${broadcastData.message}</div>
        <p style="margin-top: 20px;">Best regards,<br>The Sports Management Team</p>
      </div>`
    };
    
    return await sendEmail(emailContent);
  } catch (error) {
    console.error('Error sending broadcast email:', error);
    throw error;
  }
};

/**
 * Send generic notification email
 * @param {Object} notificationData - Notification data
 * @param {String} notificationData.email - Recipient email
 * @param {String} notificationData.title - Email subject/title
 * @param {String} notificationData.message - Email message
 * @returns {Promise<Object>} Send result
 */
const sendNotificationEmail = async (notificationData) => {
  const emailContent = {
    to: notificationData.email,
    subject: notificationData.title,
    text: notificationData.message,
    html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>${notificationData.title}</h2>
      <div style="white-space: pre-line;">${notificationData.message}</div>
      <p style="margin-top: 20px;">Best regards,<br>The Sports Management Team</p>
    </div>`
  };
  
  return await sendEmail(emailContent);
};

module.exports = {
  sendEmail,
  sendRegistrationEmail,
  sendBookingConfirmationEmail,
  sendAdminBroadcastEmail,
  sendNotificationEmail
}; 