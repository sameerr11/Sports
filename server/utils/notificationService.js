const Notification = require('../models/Notification');
const User = require('../models/User');

/**
 * Create a notification for a specific user
 * @param {Object} notificationData - Notification data
 * @param {String} notificationData.recipientId - Recipient user ID
 * @param {String} notificationData.senderId - Sender user ID (optional)
 * @param {String} notificationData.type - Notification type
 * @param {String} notificationData.title - Notification title
 * @param {String} notificationData.message - Notification message
 * @param {Object} notificationData.relatedTo - Related entity (optional)
 * @returns {Promise<Object>} Created notification
 */
const createNotification = async (notificationData) => {
  try {
    const notification = new Notification({
      recipient: notificationData.recipientId,
      sender: notificationData.senderId || null,
      type: notificationData.type,
      title: notificationData.title,
      message: notificationData.message,
      relatedTo: notificationData.relatedTo || null
    });

    await notification.save();
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

module.exports = {
  createNotification,
  createRoleNotifications,
  notifyCoachesAboutPlayer,
  notifyPlayerFromCoach,
  notifyTeamPlayers,
  createRegistrationExpiryNotifications
}; 