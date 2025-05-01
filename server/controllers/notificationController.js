const Notification = require('../models/Notification');
const User = require('../models/User');
const Team = require('../models/Team');
const Court = require('../models/Court');
const PlayerRegistration = require('../models/PlayerRegistration');
const TrainingPlan = require('../models/TrainingPlan');
const PlayerStats = require('../models/PlayerStats');
const notificationService = require('../utils/notificationService');

/**
 * Helper function to check if a notification is relevant to a sports supervisor
 * @param {Object} notification - The notification object
 * @param {Array} supervisorSportTypes - Array of sport types the supervisor manages
 * @returns {Promise<boolean>} - Whether the notification is relevant
 */
const isRelevantToSportsSupervisor = async (notification, supervisorSportTypes) => {
  // If notification doesn't have related model info, include it (system messages, etc.)
  if (!notification.relatedTo || !notification.relatedTo.model || !notification.relatedTo.id) {
    return true;
  }
  
  let include = false;
  let sportType = null;
  
  // Check different models to determine the sport type
  if (notification.relatedTo.model === 'Team') {
    // Get team sport type
    const team = await Team.findById(notification.relatedTo.id).select('sportType');
    if (team) {
      sportType = team.sportType;
    }
  }
  else if (notification.relatedTo.model === 'Court') {
    // Get court sport type
    const court = await Court.findById(notification.relatedTo.id).select('sportType');
    if (court) {
      sportType = court.sportType;
    }
  }
  else if (notification.relatedTo.model === 'TrainingPlan') {
    // Get training plan's team sport type
    const trainingPlan = await TrainingPlan.findById(notification.relatedTo.id).populate('team', 'sportType');
    if (trainingPlan && trainingPlan.team) {
      sportType = trainingPlan.team.sportType;
    }
  }
  else if (notification.relatedTo.model === 'PlayerStats') {
    // Get player stats sport type
    const playerStats = await PlayerStats.findById(notification.relatedTo.id).select('sport');
    if (playerStats) {
      sportType = playerStats.sport;
    }
  }
  else if (notification.relatedTo.model === 'PlayerRegistration') {
    // Player registration might have multiple sports, check if any match
    const registration = await PlayerRegistration.findById(notification.relatedTo.id).select('sports');
    if (registration && Array.isArray(registration.sports)) {
      // Include if any sport in the registration matches supervisor's sports
      include = registration.sports.some(sport => supervisorSportTypes.includes(sport));
    }
  }
  
  // Check if the notification's sport type matches any of the supervisor's sport types
  if (sportType && supervisorSportTypes.includes(sportType)) {
    include = true;
  }
  
  // Include if it matches or if we couldn't determine a sport type
  return include || sportType === null;
};

// @desc    Get notifications for a user
// @route   GET /api/notifications
// @access  Private
exports.getUserNotifications = async (req, res) => {
  try {
    // First, check if user is a sports supervisor
    const user = await User.findById(req.user.id);
    const isSportsSupervisor = user.role === 'supervisor' && user.supervisorType === 'sports';
    
    // Get all notifications for the user
    let notifications = await Notification.find({ recipient: req.user.id })
      .sort({ createdAt: -1 })
      .populate('sender', 'firstName lastName profilePicture');
    
    // Filter notifications for sports supervisors based on their assigned sport types
    if (isSportsSupervisor && Array.isArray(user.supervisorSportTypes) && user.supervisorSportTypes.length > 0) {
      // Create an array to store filtered notifications
      let filteredNotifications = [];
      
      // Process each notification
      for (const notification of notifications) {
        // Check if the notification is relevant to this sports supervisor
        if (await isRelevantToSportsSupervisor(notification, user.supervisorSportTypes)) {
          filteredNotifications.push(notification);
        }
      }
      
      // Return the filtered notifications
      return res.json(filteredNotifications);
    }
    
    // For non-sports supervisors, return all notifications
    res.json(notifications);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error' });
  }
};

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id
// @access  Private
exports.markAsRead = async (req, res) => {
  try {
    let notification = await Notification.findById(req.params.id);
    
    if (!notification) {
      return res.status(404).json({ msg: 'Notification not found' });
    }
    
    // Check if notification belongs to user
    if (notification.recipient.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }
    
    notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { $set: { isRead: true } },
      { new: true }
    );
    
    res.json(notification);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Notification not found' });
    }
    res.status(500).json({ msg: 'Server error' });
  }
};

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
exports.markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.user.id, isRead: false },
      { $set: { isRead: true } }
    );
    
    res.json({ msg: 'All notifications marked as read' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error' });
  }
};

// @desc    Delete notification
// @route   DELETE /api/notifications/:id
// @access  Private
exports.deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    
    if (!notification) {
      return res.status(404).json({ msg: 'Notification not found' });
    }
    
    // Check if notification belongs to user
    if (notification.recipient.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }
    
    await Notification.findByIdAndRemove(req.params.id);
    
    res.json({ msg: 'Notification removed' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Notification not found' });
    }
    res.status(500).json({ msg: 'Server error' });
  }
};

// @desc    Get unread notification count
// @route   GET /api/notifications/unread-count
// @access  Private
exports.getUnreadCount = async (req, res) => {
  try {
    // First, check if user is a sports supervisor
    const user = await User.findById(req.user.id);
    const isSportsSupervisor = user.role === 'supervisor' && user.supervisorType === 'sports';
    
    // If not a sports supervisor, simply count all unread notifications
    if (!isSportsSupervisor || !Array.isArray(user.supervisorSportTypes) || user.supervisorSportTypes.length === 0) {
      const count = await Notification.countDocuments({ 
        recipient: req.user.id,
        isRead: false
      });
      
      return res.json({ count });
    }
    
    // For sports supervisors, we need to filter notifications first
    const unreadNotifications = await Notification.find({ 
      recipient: req.user.id,
      isRead: false
    });
    
    // Count filtered notifications using our helper function
    let filteredCount = 0;
    
    for (const notification of unreadNotifications) {
      if (await isRelevantToSportsSupervisor(notification, user.supervisorSportTypes)) {
        filteredCount++;
      }
    }
    
    res.json({ count: filteredCount });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error' });
  }
};

// @desc    Create a new notification (admin/system only)
// @route   POST /api/notifications
// @access  Private/Admin
exports.createNotification = async (req, res) => {
  try {
    const { recipientId, type, title, message, relatedTo } = req.body;
    
    if (!recipientId || !type || !title || !message) {
      return res.status(400).json({ msg: 'Please include all required fields' });
    }

    const notification = new Notification({
      recipient: recipientId,
      sender: req.user.id, // The current user is the sender
      type,
      title,
      message,
      relatedTo: relatedTo || null
    });

    await notification.save();
    
    res.status(201).json(notification);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error' });
  }
};

// @desc    Send broadcast notification to users (with email)
// @route   POST /api/notifications/broadcast
// @access  Private/Admin
exports.sendBroadcastNotification = async (req, res) => {
  try {
    const { title, message, role, sendEmail } = req.body;
    
    if (!title || !message) {
      return res.status(400).json({ msg: 'Please include title and message' });
    }

    // Use the notification service to send broadcast
    const result = await notificationService.sendAdminBroadcastNotification({
      adminId: req.user.id,
      title,
      message,
      role, // Optional: if specified, only send to users with this role
      sendEmail: sendEmail !== false // Default to true if not specified
    });
    
    res.status(201).json({
      success: true,
      notificationCount: result.notifications.length,
      emailSent: result.emailSent,
      emailRecipients: result.emailRecipients
    });
  } catch (err) {
    console.error('Error sending broadcast notification:', err.message);
    res.status(500).json({ msg: 'Server error' });
  }
}; 