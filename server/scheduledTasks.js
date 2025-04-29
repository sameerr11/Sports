const cron = require('node-cron');
const { checkBirthdays } = require('./services/birthdayService');

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

module.exports = {
  startScheduledTasks: () => {
    console.log('Scheduled tasks started');
  }
}; 