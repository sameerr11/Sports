# Email Notification System

This document explains how the email notification system works in the Sports Management Platform.

## Overview

The email notification system extends the existing in-app notification system to also send emails via Resend API for important notifications including:

1. New player registrations
2. Booking confirmations
3. Admin broadcast notifications
4. Other system notifications

## Technical Implementation

### Configuration

Email settings are configured in the `.env` file:

```env
# Email Settings (Resend API)
RESEND_API_KEY=your_resend_api_key_here
EMAIL_FROM="Sports Management <onboarding@resend.dev>"
```

**Important:** To set up Resend:
1. Sign up for an account at https://resend.com
2. Create an API key in your dashboard
3. For production, verify your domain to use custom email addresses
4. For testing, you can use the default onboarding@resend.dev sender

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
await notificationService.sendRegistrationNotification(userData);
```

#### Booking Confirmation

When a booking is confirmed:

```javascript
// In bookingController.js
await notificationService.sendBookingConfirmationNotification({
  userEmail: user.email,
  userName: `${user.firstName} ${user.lastName}`,
  date: formatDate(booking.date),
  time: `${booking.startTime} - ${booking.endTime}`,
  facility: facility.name,
  bookingId: booking._id,
  paymentMessage: booking.isPaid ? 'Payment has been completed.' : 'Payment is pending.'
});
```

#### Admin Broadcast

For broadcast messages from admin:

```javascript
// In adminController.js
await notificationService.sendAdminBroadcastNotification({
  recipients: users.map(user => user.email), 
  subject: 'Important Announcement',
  message: 'Our facility will be closed for maintenance next weekend.'
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
2. Verify Resend API key is correct
3. Check logs for error messages
4. Ensure your Resend account doesn't have restrictions on app access 