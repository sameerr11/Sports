const cron = require('node-cron');
const RecurringSchedule = require('../models/RecurringSchedule');
const { generateRecurringBookings } = require('../controllers/recurringScheduleController');
const { checkRegistrationExpiry, checkExpiredRegistrations } = require('./registrationExpiryChecker');

// Initialize the scheduler
const initScheduler = () => {
  console.log('Initializing scheduler for recurring bookings...');
  
  // Run weekly on Sunday at 1:00 AM to generate bookings for all active recurring schedules
  cron.schedule('0 1 * * 0', async () => {
    console.log('Running weekly job to generate bookings for recurring schedules...');
    
    try {
      // Find all active recurring schedules
      const activeSchedules = await RecurringSchedule.find({ isActive: true });
      console.log(`Found ${activeSchedules.length} active recurring schedules`);
      
      // Generate 4 weeks of bookings for each active schedule
      for (const schedule of activeSchedules) {
        try {
          const newBookings = await generateRecurringBookings(schedule, 4);
          console.log(`Generated ${newBookings.length} bookings for schedule ${schedule._id}`);
          
          // Update the schedule with the new booking IDs
          try {
            schedule.bookings = [
              ...schedule.bookings,
              ...newBookings.map(booking => booking._id)
            ];
            await schedule.save();
          } catch (err) {
            console.error(`Error updating schedule ${schedule._id} with new bookings:`, err);
          }
        } catch (err) {
          console.error(`Error generating bookings for schedule ${schedule._id}:`, err);
        }
      }
      
      console.log('Weekly booking generation completed');
    } catch (err) {
      console.error('Error in weekly booking generation job:', err);
    }
  }, {
    scheduled: true,
    timezone: "UTC"
  });
  
  // Run daily at 2:00 AM to check for recurring schedules with no upcoming bookings
  // and generate new bookings if needed
  cron.schedule('0 2 * * *', async () => {
    console.log('Running daily job to check for schedules with no upcoming bookings...');
    
    try {
      const activeSchedules = await RecurringSchedule.find({ isActive: true });
      console.log(`Found ${activeSchedules.length} active recurring schedules`);
      
      for (const schedule of activeSchedules) {
        try {
          // Check if there are any upcoming bookings for this schedule
          const hasUpcomingBookings = schedule.bookings.length > 0;
          
          if (!hasUpcomingBookings) {
            console.log(`Schedule ${schedule._id} has no upcoming bookings. Generating...`);
            const newBookings = await generateRecurringBookings(schedule, 4);
            
            // Update schedule with new bookings
            schedule.bookings = newBookings.map(booking => booking._id);
            await schedule.save();
            console.log(`Generated ${newBookings.length} bookings for schedule ${schedule._id}`);
          }
        } catch (err) {
          console.error(`Error checking bookings for schedule ${schedule._id}:`, err);
        }
      }
      
      console.log('Daily booking check completed');
    } catch (err) {
      console.error('Error in daily booking check job:', err);
    }
  }, {
    scheduled: true,
    timezone: "UTC"
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
  
  console.log('Scheduler initialized successfully');
};

module.exports = { initScheduler };