const cron = require('node-cron');
const { checkBirthdays } = require('./services/birthdayService');
const { checkRegistrationExpiry, checkExpiredRegistrations } = require('./utils/registrationExpiryChecker');

// Schedule birthday check to run at midnight every day
cron.schedule('0 0 * * *', async () => {
  try {
    console.log('Checking for birthdays...');
    const birthdayUsers = await checkBirthdays();
    if (birthdayUsers.length > 0) {
      console.log(`Found ${birthdayUsers.length} birthdays today!`);
    }
  } catch (error) {
    console.error('Error in birthday check scheduled task:', error);
  }
});

// Run daily at 9:00 AM to check for player registrations that are about to expire
// and send notifications to players and parents
cron.schedule('0 9 * * *', async () => {
  console.log('Running daily job to check for player registrations about to expire...');
  
  try {
    const notificationStats = await checkRegistrationExpiry();
    console.log(`Expiry check completed: Sent ${notificationStats.oneWeekNotifications} one-week notifications and ${notificationStats.oneDayNotifications} one-day notifications`);
  } catch (err) {
    console.error('Error in registration expiry check job:', err);
  }
}, {
  scheduled: true,
  timezone: "UTC"
});

// Run daily at 10:00 AM to check for player registrations that have expired yesterday
// and send notifications to admins
cron.schedule('0 10 * * *', async () => {
  console.log('Running daily job to check for expired player registrations...');
  
  try {
    const notificationStats = await checkExpiredRegistrations();
    console.log(`Expired registration check completed: Sent ${notificationStats.expiredNotifications} notifications to admins`);
  } catch (err) {
    console.error('Error in expired registration check job:', err);
  }
}, {
  scheduled: true,
  timezone: "UTC"
});

module.exports = {
  startScheduledTasks: () => {
    console.log('Scheduled tasks started - including birthday checks and registration expiry notifications');
  }
}; 