# Email Notification System

This document explains how the email notification system works in the Sports Management Platform.

## Overview

The email notification system extends the existing in-app notification system to also send emails via Gmail SMTP for important notifications including:

1. New player registrations
2. Booking confirmations
3. Admin broadcast notifications
4. Other system notifications

## Technical Implementation

### Configuration

Email settings are configured in the `.env` file:

```env
# Email Settings (Gmail SMTP)
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-gmail-app-password
EMAIL_FROM="Sports Management <your-email@gmail.com>"
```

**Important:** For security, you should use an app password for Gmail, not your regular password:
1. Enable 2-step verification on your Google account
2. Go to https://myaccount.google.com/apppasswords
3. Generate an app password for "Mail" and "Other (Custom name)"
4. Use the generated 16-character password as EMAIL_PASS

### Services

#### Email Service

The email service (`emailService.js`) provides utility functions to send various types of emails:

1. `sendEmail(emailData)`: Generic email sending function
2. `sendRegistrationEmail(userData)`: Welcome email for new users
3. `sendBookingConfirmationEmail(bookingData)`: Booking confirmation emails
4. `sendAdminBroadcastEmail(broadcastData)`: Admin broadcast messages
5. `sendNotificationEmail(notificationData)`: Generic notification emails

#### Notification Service Integration

The notification service (`notificationService.js`) has been updated to:

1. Add email sending capability to existing notification functions
2. Add new functions that handle both in-app and email notifications:
   - `sendRegistrationNotification(userData)`
   - `sendBookingConfirmationNotification(bookingData)`
   - `sendAdminBroadcastNotification(broadcastData)`

### Usage Examples

#### Registration Notification

When a new user is registered:

```javascript
// In userController.js
await notificationService.sendRegistrationNotification({
  email: user.email,
  firstName: user.firstName,
  lastName: user.lastName,
  role: user.role
});
```

#### Booking Confirmation

When a booking is confirmed:

```javascript
// In bookingController.js
await notificationService.sendBookingConfirmationNotification({
  userId: user.id,
  bookingId: booking._id.toString(),
  date: startDate.toLocaleDateString(),
  time: `${startDate.toLocaleTimeString()} - ${endDate.toLocaleTimeString()}`,
  facility: courtName,
  modelName: 'Booking'
});
```

#### Admin Broadcast

Admin can send broadcast messages:

```javascript
// In notificationController.js
await notificationService.sendAdminBroadcastNotification({
  adminId: req.user.id,
  title: 'Important Announcement',
  message: 'Our facility will be closed for maintenance...',
  role: 'player', // Optional, can target specific roles
  sendEmail: true // Whether to also send as email
});
```

## Client Integration

A new component has been added for admin broadcasts:

- `NotificationBroadcast.jsx`: Admin UI for sending broadcasts with email option

## Email Templates

All emails use simple HTML templates with:
- Clean, responsive design
- Platform branding
- Clear messaging
- Fallback plain text version

## Customization

To customize email templates:
1. Modify the template strings in `emailService.js`
2. For more complex templates, consider moving them to separate template files
3. HTML can be styled with inline CSS for better email client compatibility

## Troubleshooting

If emails are not being sent:
1. Check your `.env` file configuration
2. Verify Gmail app password is correct
3. Check logs for error messages
4. Ensure your Gmail account doesn't have restrictions on app access 