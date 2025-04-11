const PlayerRegistration = require('../models/PlayerRegistration');
const User = require('../models/User');
const { createRegistrationExpiryNotifications } = require('./notificationService');
const Notification = require('../models/Notification');

/**
 * Check for player registrations that are about to expire and send notifications
 * This checks for registrations that will expire in:
 * - One week (7 days)
 * - One day (1 day)
 */
const checkRegistrationExpiry = async () => {
  try {
    console.log('Checking for player registrations about to expire...');
    
    const now = new Date();
    
    // Calculate dates for notifications: 7 days and 1 day before expiry
    const oneWeekLater = new Date(now);
    oneWeekLater.setDate(oneWeekLater.getDate() + 7);
    
    const oneDayLater = new Date(now);
    oneDayLater.setDate(oneDayLater.getDate() + 1);
    
    // Format dates for query (start and end of day)
    const startOfOneWeekLater = new Date(oneWeekLater.setHours(0, 0, 0, 0));
    const endOfOneWeekLater = new Date(oneWeekLater.setHours(23, 59, 59, 999));
    
    const startOfOneDayLater = new Date(oneDayLater.setHours(0, 0, 0, 0));
    const endOfOneDayLater = new Date(oneDayLater.setHours(23, 59, 59, 999));
    
    // Find registrations expiring in one week
    const registrationsExpiringInOneWeek = await PlayerRegistration.find({
      endDate: {
        $gte: startOfOneWeekLater,
        $lte: endOfOneWeekLater
      },
      status: { $nin: ['Cancelled', 'Completed'] }
    });
    
    // Find registrations expiring in one day
    const registrationsExpiringInOneDay = await PlayerRegistration.find({
      endDate: {
        $gte: startOfOneDayLater,
        $lte: endOfOneDayLater
      },
      status: { $nin: ['Cancelled', 'Completed'] }
    });
    
    // Process one week notifications
    let oneWeekNotificationsSent = 0;
    for (const registration of registrationsExpiringInOneWeek) {
      // We need to map registration.player (which contains player info)
      // to an actual User document to send the notification
      try {
        const user = await User.findOne({ email: registration.player.email });
        
        if (user) {
          // Send notification to player and parent
          await createRegistrationExpiryNotifications({
            playerId: user._id,
            registrationId: registration._id,
            type: 'registration_expiry',
            title: 'Registration Expires in One Week',
            message: `Your registration for ${registration.sports.join(', ')} will expire in one week. Please renew to continue enjoying our services.`
          });
          
          oneWeekNotificationsSent++;
        }
      } catch (error) {
        console.error(`Error processing one week notification for registration ${registration._id}:`, error);
      }
    }
    
    // Process one day notifications
    let oneDayNotificationsSent = 0;
    for (const registration of registrationsExpiringInOneDay) {
      try {
        const user = await User.findOne({ email: registration.player.email });
        
        if (user) {
          // Send notification to player and parent
          await createRegistrationExpiryNotifications({
            playerId: user._id,
            registrationId: registration._id,
            type: 'registration_expiry',
            title: 'Registration Expires Tomorrow',
            message: `Your registration for ${registration.sports.join(', ')} will expire tomorrow. Please renew immediately to avoid service interruption.`
          });
          
          oneDayNotificationsSent++;
        }
      } catch (error) {
        console.error(`Error processing one day notification for registration ${registration._id}:`, error);
      }
    }
    
    console.log(`Registration expiry check completed. Sent ${oneWeekNotificationsSent} one-week notifications and ${oneDayNotificationsSent} one-day notifications.`);
    
    return {
      oneWeekNotifications: oneWeekNotificationsSent,
      oneDayNotifications: oneDayNotificationsSent
    };
  } catch (error) {
    console.error('Error checking for registration expiry:', error);
    throw error;
  }
};

/**
 * Check for player registrations that have already expired and notify admins
 */
const checkExpiredRegistrations = async () => {
  try {
    console.log('Checking for expired player registrations...');
    
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // Format dates for query (start and end of yesterday)
    const startOfYesterday = new Date(yesterday.setHours(0, 0, 0, 0));
    const endOfYesterday = new Date(yesterday.setHours(23, 59, 59, 999));
    
    // Find registrations that expired yesterday
    const expiredRegistrations = await PlayerRegistration.find({
      endDate: {
        $gte: startOfYesterday,
        $lte: endOfYesterday
      },
      status: { $nin: ['Cancelled', 'Completed'] }
    });
    
    console.log(`Found ${expiredRegistrations.length} registrations that expired yesterday`);
    
    // Get all admin users to notify
    const adminUsers = await User.find({ role: 'admin', isActive: true });
    
    if (adminUsers.length === 0) {
      console.log('No admin users found to notify about expired registrations');
      return { expiredNotifications: 0 };
    }
    
    let expiredNotificationsToAdminsSent = 0;
    
    // Process expired registrations
    for (const registration of expiredRegistrations) {
      try {
        const playerName = `${registration.player.firstName} ${registration.player.lastName}`;
        const playerEmail = registration.player.email;
        const sports = registration.sports.join(', ');
        
        // Create notification for each admin
        for (const admin of adminUsers) {
          const notification = new Notification({
            recipient: admin._id,
            type: 'registration_expiry',
            title: 'Player Registration Expired',
            message: `${playerName}'s (${playerEmail}) registration for ${sports} has expired. Please follow up for renewal.`,
            relatedTo: {
              model: 'PlayerRegistration',
              id: registration._id
            }
          });
          
          await notification.save();
          expiredNotificationsToAdminsSent++;
        }
      } catch (error) {
        console.error(`Error processing expired registration notification for registration ${registration._id}:`, error);
      }
    }
    
    console.log(`Sent ${expiredNotificationsToAdminsSent} expired registration notifications to admins`);
    
    return {
      expiredNotifications: expiredNotificationsToAdminsSent
    };
  } catch (error) {
    console.error('Error checking for expired registrations:', error);
    throw error;
  }
};

module.exports = {
  checkRegistrationExpiry,
  checkExpiredRegistrations
}; 