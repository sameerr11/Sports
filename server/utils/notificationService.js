const Notification = require('../models/Notification');
const User = require('../models/User');
const emailService = require('./emailService');

/**
 * Create a notification for a specific user
 * @param {Object} notificationData - Notification data
 * @param {String} notificationData.recipientId - Recipient user ID
 * @param {String} notificationData.senderId - Sender user ID (optional)
 * @param {String} notificationData.type - Notification type
 * @param {String} notificationData.title - Notification title
 * @param {String} notificationData.message - Notification message
 * @param {Object} notificationData.relatedTo - Related entity (optional)
 * @param {Boolean} notificationData.sendEmail - Whether to send email notification (default: true)
 * @returns {Promise<Object>} Created notification
 */
const createNotification = async (notificationData) => {
  try {
    // If sender is not provided but required, try to find a default admin user
    if (!notificationData.senderId) {
      // Try to find an admin user to use as a default sender
      try {
        const admin = await User.findOne({ role: 'admin' });
        if (admin) {
          notificationData.senderId = admin._id;
        }
      } catch (err) {
        console.log('Could not find admin user for default sender');
      }
    }

    const notification = new Notification({
      recipient: notificationData.recipientId,
      sender: notificationData.senderId || null,
      type: notificationData.type || 'system', // Default to 'system' if not provided
      title: notificationData.title,
      message: notificationData.message,
      relatedTo: notificationData.relatedTo || null
    });

    await notification.save();
    
    // Send email notification if enabled
    const sendEmail = notificationData.sendEmail !== false; // Default to true if not specified
    if (sendEmail) {
      try {
        // Get recipient user to get their email
        const recipient = await User.findById(notificationData.recipientId);
        if (recipient && recipient.email) {
          await emailService.sendNotificationEmail({
            email: recipient.email,
            title: notificationData.title,
            message: notificationData.message
          });
        }
      } catch (emailError) {
        console.error('Error sending notification email:', emailError);
        // Don't throw error here, we still created the in-app notification
      }
    }
    
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

/**
 * Create notifications for all users with a specific role
 * @param {Object} notificationData - Notification data
 * @param {String} notificationData.role - User role (e.g., 'coach', 'player')
 * @param {String} notificationData.senderId - Sender user ID (optional)
 * @param {String} notificationData.type - Notification type
 * @param {String} notificationData.title - Notification title
 * @param {String} notificationData.message - Notification message
 * @param {Object} notificationData.relatedTo - Related entity (optional)
 * @returns {Promise<Array>} Created notifications
 */
const createRoleNotifications = async (notificationData) => {
  try {
    const { role, ...notificationInfo } = notificationData;
    
    // Find all users with the specified role
    const users = await User.find({ role, isActive: true }).select('_id');
    
    const notificationPromises = users.map(user => 
      createNotification({
        recipientId: user._id,
        ...notificationInfo
      })
    );
    
    return Promise.all(notificationPromises);
  } catch (error) {
    console.error('Error creating role notifications:', error);
    throw error;
  }
};

/**
 * Create notifications for coaches about player activities
 * @param {Object} notificationData - Notification data
 * @param {String} notificationData.playerId - Player user ID
 * @param {String} notificationData.type - Notification type
 * @param {String} notificationData.title - Notification title
 * @param {String} notificationData.message - Notification message
 * @param {Object} notificationData.relatedTo - Related entity (optional)
 * @returns {Promise<Array>} Created notifications
 */
const notifyCoachesAboutPlayer = async (notificationData) => {
  try {
    const { playerId, ...notificationInfo } = notificationData;
    
    // Find the player to include their name in the notification
    const player = await User.findById(playerId);
    if (!player) {
      throw new Error('Player not found');
    }
    
    // Update message to include player name if not already included
    const playerName = `${player.firstName} ${player.lastName}`;
    if (!notificationInfo.message.includes(playerName)) {
      notificationInfo.message = `${playerName}: ${notificationInfo.message}`;
    }
    
    // Create notifications for all coaches
    return createRoleNotifications({
      role: 'coach',
      senderId: playerId,
      ...notificationInfo
    });
  } catch (error) {
    console.error('Error notifying coaches about player:', error);
    throw error;
  }
};

/**
 * Notify a player about coach-related activities
 * @param {Object} notificationData - Notification data
 * @param {String} notificationData.playerId - Player user ID to notify
 * @param {String} notificationData.coachId - Coach user ID
 * @param {String} notificationData.type - Notification type
 * @param {String} notificationData.title - Notification title
 * @param {String} notificationData.message - Notification message
 * @param {Object} notificationData.relatedTo - Related entity (optional)
 * @returns {Promise<Object>} Created notification
 */
const notifyPlayerFromCoach = async (notificationData) => {
  try {
    const { playerId, coachId, ...notificationInfo } = notificationData;
    
    // Find the coach to include their name in the notification if needed
    const coach = await User.findById(coachId);
    if (!coach) {
      throw new Error('Coach not found');
    }
    
    // Create notification for the player
    return createNotification({
      recipientId: playerId,
      senderId: coachId,
      ...notificationInfo
    });
  } catch (error) {
    console.error('Error notifying player from coach:', error);
    throw error;
  }
};

/**
 * Create notifications for all players in a specific team
 * @param {Object} notificationData - Notification data
 * @param {String} notificationData.teamId - Team ID
 * @param {String} notificationData.senderId - Sender user ID (optional)
 * @param {String} notificationData.type - Notification type
 * @param {String} notificationData.title - Notification title
 * @param {String} notificationData.message - Notification message
 * @param {Object} notificationData.relatedTo - Related entity (optional)
 * @returns {Promise<Array>} Created notifications
 */
const notifyTeamPlayers = async (notificationData) => {
  try {
    const { teamId, ...notificationInfo } = notificationData;
    
    // Find the team and players associated with it
    const Team = require('../models/Team');
    const team = await Team.findById(teamId).populate('players', '_id');
    
    if (!team) {
      throw new Error('Team not found');
    }
    
    const notificationPromises = team.players.map(player => 
      createNotification({
        recipientId: player._id,
        ...notificationInfo,
        relatedTo: {
          ...notificationInfo.relatedTo,
          model: 'Team',
          id: teamId
        }
      })
    );
    
    return Promise.all(notificationPromises);
  } catch (error) {
    console.error('Error notifying team players:', error);
    throw error;
  }
};

/**
 * Create a registration expiry notification for both a player and their parent
 * @param {Object} data - Notification data
 * @param {String} data.playerId - Player user ID
 * @param {String} data.registrationId - Registration ID
 * @param {String} data.title - Notification title
 * @param {String} data.message - Notification message
 * @param {String} data.type - Notification type
 * @returns {Promise<Array>} Created notifications
 */
const createRegistrationExpiryNotifications = async (data) => {
  try {
    const notifications = [];
    
    // First, create notification for the player
    const playerNotification = await createNotification({
      recipientId: data.playerId,
      type: data.type || 'payment_reminder',
      title: data.title,
      message: data.message,
      relatedTo: {
        model: 'PlayerRegistration',
        id: data.registrationId
      }
    });
    
    notifications.push(playerNotification);
    
    // Check if player has a parent
    const player = await User.findById(data.playerId);
    
    if (player && player.parentId) {
      // Also notify the parent
      const parentNotification = await createNotification({
        recipientId: player.parentId,
        type: data.type || 'payment_reminder',
        title: `${data.title} (${player.firstName} ${player.lastName})`,
        message: `${data.message} for ${player.firstName} ${player.lastName}`,
        relatedTo: {
          model: 'PlayerRegistration',
          id: data.registrationId
        }
      });
      
      notifications.push(parentNotification);
    }
    
    return notifications;
  } catch (error) {
    console.error('Error creating registration expiry notifications:', error);
    throw error;
  }
};

/**
 * Send notification for new user registration
 * @param {Object} userData - User data
 * @returns {Promise<Object>} Notification and email result
 */
const sendRegistrationNotification = async (userData) => {
  try {
    // Find a system admin to use as sender
    const admin = await User.findOne({ role: 'admin' });
    const senderId = admin ? admin._id : undefined;
    
    if (!senderId) {
      console.log('Warning: No admin user found for sender. Email will still be sent.');
    }
    
    // Create in-app notification for admins
    const adminNotifications = await createRoleNotifications({
      role: 'admin',
      senderId: senderId, // Use admin as sender
      type: 'system', // Use 'system' which should be in the enum
      title: 'New User Registration',
      message: `New ${userData.role} registered: ${userData.firstName} ${userData.lastName} (${userData.email})`,
      sendEmail: true
    });
    
    // Send welcome email to the new user
    const emailResult = await emailService.sendRegistrationEmail(userData);
    
    return {
      notifications: adminNotifications,
      emailSent: true,
      emailResult
    };
  } catch (error) {
    console.error('Error in registration notification:', error);
    // Still send email even if in-app notification fails
    try {
      const emailResult = await emailService.sendRegistrationEmail(userData);
      return {
        notifications: [],
        emailSent: true,
        emailResult
      };
    } catch (emailError) {
      console.error('Email also failed:', emailError);
      throw error;
    }
  }
};

/**
 * Send notification for booking confirmation
 * @param {Object} bookingData - Booking data
 * @returns {Promise<Object>} Notification and email result
 */
const sendBookingConfirmationNotification = async (bookingData) => {
  try {
    // For guest bookings, we don't create an in-app notification
    // since guests don't have user accounts
    let notification = null;
    
    // Determine payment message based on payment status
    let paymentMessage = '';
    if (bookingData.paymentStatus === 'Paid') {
      paymentMessage = 'Your payment has been received and your booking is confirmed.';
    } else if (bookingData.paymentStatus === 'Unpaid') {
      paymentMessage = `Your booking is pending. Please complete payment at the court before your scheduled time using ${bookingData.paymentMethod || 'your preferred payment method'}.`;
    }
    
    // Send booking confirmation email to the guest
    const emailResult = await emailService.sendBookingConfirmationEmail({
      userEmail: bookingData.guestEmail || bookingData.userEmail,
      userName: bookingData.guestName || bookingData.userName,
      date: bookingData.date,
      time: bookingData.time,
      facility: bookingData.facility,
      bookingId: bookingData.bookingId,
      paymentMessage
    });
    
    // Send notification to admin users
    try {
      const adminUsers = await User.find({ role: 'admin' });
      for (const admin of adminUsers) {
        // Prepare an admin-specific email with booking details
        await emailService.sendNotificationEmail({
          email: admin.email,
          title: 'New Guest Booking Confirmation',
          message: `A guest booking has been ${bookingData.paymentStatus === 'Paid' ? 'confirmed and paid' : 'created with payment pending'}:
          
Guest: ${bookingData.guestName} (${bookingData.guestEmail})
Facility: ${bookingData.facility}
Date: ${bookingData.date}
Time: ${bookingData.time}
Payment Status: ${bookingData.paymentStatus}
Payment Method: ${bookingData.paymentMethod || 'Not specified'}
Booking ID: ${bookingData.bookingId}`
        });
      }
    } catch (adminNotifyError) {
      console.error('Error sending admin notification for booking:', adminNotifyError);
      // Continue even if admin notification fails
    }
    
    return {
      notification,
      emailSent: true,
      emailResult
    };
  } catch (error) {
    console.error('Error in booking confirmation notification:', error);
    throw error;
  }
};

/**
 * Send admin broadcast notification
 * @param {Object} broadcastData - Broadcast data
 * @param {String} broadcastData.adminId - Admin user ID
 * @param {String} broadcastData.title - Notification title
 * @param {String} broadcastData.message - Notification message
 * @param {String} broadcastData.role - Target role (optional, if not specified, send to all users)
 * @param {Boolean} broadcastData.sendEmail - Whether to send email notification
 * @returns {Promise<Object>} Notification and email result
 */
const sendAdminBroadcastNotification = async (broadcastData) => {
  try {
    let notifications = [];
    let recipients = [];
    
    // Determine target users
    if (broadcastData.role) {
      // Send to specific role
      notifications = await createRoleNotifications({
        role: broadcastData.role,
        senderId: broadcastData.adminId,
        type: 'system',
        title: broadcastData.title,
        message: broadcastData.message,
        sendEmail: false // We'll handle email separately
      });
      
      // Get user emails for this role
      const users = await User.find({ role: broadcastData.role, isActive: true }).select('email');
      recipients = users.map(user => user.email).filter(email => email);
    } else {
      // Send to all users
      const users = await User.find({ isActive: true }).select('_id email');
      
      // Create in-app notifications
      const notificationPromises = users.map(user => 
        createNotification({
          recipientId: user._id,
          senderId: broadcastData.adminId,
          type: 'system',
          title: broadcastData.title,
          message: broadcastData.message,
          sendEmail: false // We'll handle email separately
        })
      );
      
      notifications = await Promise.all(notificationPromises);
      recipients = users.map(user => user.email).filter(email => email);
    }
    
    // Send email broadcast if enabled
    let emailResult = null;
    let emailSent = false;
    
    if (broadcastData.sendEmail && recipients.length > 0) {
      try {
        console.log(`Sending broadcast email to ${recipients.length} recipients`);
        emailResult = await emailService.sendAdminBroadcastEmail({
          recipients,
          subject: broadcastData.title,
          message: broadcastData.message
        });
        emailSent = true;
        console.log('Broadcast email sent successfully');
      } catch (emailError) {
        console.error('Error sending broadcast email:', emailError);
        // Log detailed error info for debugging
        console.error('Email error details:', {
          name: emailError.name,
          message: emailError.message,
          stack: emailError.stack
        });
        // Don't throw error, we still created the in-app notifications
      }
    } else {
      console.log('Email broadcast skipped: ', 
        !broadcastData.sendEmail ? 'Email sending not requested' : 'No recipients with email addresses');
    }
    
    return {
      notifications,
      emailSent,
      emailRecipients: recipients.length,
      emailResult
    };
  } catch (error) {
    console.error('Error in admin broadcast notification:', error);
    throw error;
  }
};

module.exports = {
  createNotification,
  createRoleNotifications,
  notifyCoachesAboutPlayer,
  notifyPlayerFromCoach,
  notifyTeamPlayers,
  createRegistrationExpiryNotifications,
  sendRegistrationNotification,
  sendBookingConfirmationNotification,
  sendAdminBroadcastNotification
}; 