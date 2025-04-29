const User = require('../models/User');
const Notification = require('../models/Notification');
const { createNotification } = require('../utils/notificationService');

const checkBirthdays = async () => {
  try {
    // Get current date
    const today = new Date();
    const currentMonth = today.getMonth() + 1; // JavaScript months are 0-based
    const currentDay = today.getDate();

    // Find users whose birthday is today and have a birth date set
    const birthdayUsers = await User.find({
      birthDate: { $ne: null },
      $expr: {
        $and: [
          { $eq: [{ $month: '$birthDate' }, currentMonth] },
          { $eq: [{ $dayOfMonth: '$birthDate' }, currentDay] }
        ]
      }
    });

    // Send notifications for each birthday user
    for (const user of birthdayUsers) {
      const message = `Happy Birthday to you 🎉🎂`;
      
      // Create notification for the birthday person
      await createNotification({
        title: 'Happy Birthday!',
        message,
        type: 'birthday',
        recipients: [user._id],
        role: user.role
      });

      // Create notification for all users
      await createNotification({
        title: 'Birthday Celebration!',
        message: `Today is ${user.firstName} ${user.lastName}'s birthday! 🎉`,
        type: 'birthday',
        recipients: 'all',
        role: 'all'
      });
    }

    return birthdayUsers;
  } catch (error) {
    console.error('Error checking birthdays:', error);
    throw error;
  }
};

module.exports = {
  checkBirthdays
}; 