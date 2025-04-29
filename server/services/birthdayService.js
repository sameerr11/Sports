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

    // Find a system admin to use as sender
    const systemAdmin = await User.findOne({ role: 'admin' });
    if (!systemAdmin) {
      throw new Error('No admin user found to send birthday notifications');
    }

    // Send notifications for each birthday user
    for (const user of birthdayUsers) {
      // Create notification for the birthday person
      await createNotification({
        recipientId: user._id,
        senderId: systemAdmin._id,
        type: 'specific',
        message: `Happy Birthday to you 🎉🎂`,
        relatedTo: {
          model: 'User',
          id: user._id
        }
      });

      // Get all users except the birthday person
      const allUsers = await User.find({ _id: { $ne: user._id } });
      
      // Create notifications for all other users
      for (const recipient of allUsers) {
        await createNotification({
          recipientId: recipient._id,
          senderId: systemAdmin._id,
          type: 'specific',
          message: `Today is ${user.firstName} ${user.lastName}'s birthday! 🎉`,
          relatedTo: {
            model: 'User',
            id: user._id
          }
        });
      }
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