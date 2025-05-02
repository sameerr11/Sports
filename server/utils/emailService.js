const nodemailer = require('nodemailer');

/**
 * Email service for sending notifications via Gmail SMTP
 * Configuration should be set in environment variables:
 * - EMAIL_USER: Gmail email address
 * - EMAIL_PASS: Gmail app password (not regular password)
 * - EMAIL_FROM: Sender name <email> format
 */

// Create reusable transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

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
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: emailData.to,
      subject: emailData.subject,
      text: emailData.text,
      html: emailData.html || emailData.text
    };
    
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
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
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_FROM,
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
    
    return await transporter.sendMail(mailOptions);
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
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: broadcastData.recipients,
      subject: broadcastData.subject,
      text: broadcastData.message,
      html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>${broadcastData.subject}</h2>
        <div style="white-space: pre-line;">${broadcastData.message}</div>
        <p style="margin-top: 20px;">Best regards,<br>The Sports Management Team</p>
      </div>`
    };
    
    return await transporter.sendMail(mailOptions);
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
  const transporter = createTransporter();
  
  const mailOptions = {
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to: notificationData.email,
    subject: notificationData.title,
    text: notificationData.message,
    html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>${notificationData.title}</h2>
      <div style="white-space: pre-line;">${notificationData.message}</div>
      <p style="margin-top: 20px;">Best regards,<br>The Sports Management Team</p>
    </div>`
  };
  
  return await transporter.sendMail(mailOptions);
};

module.exports = {
  sendEmail,
  sendRegistrationEmail,
  sendBookingConfirmationEmail,
  sendAdminBroadcastEmail,
  sendNotificationEmail
}; 