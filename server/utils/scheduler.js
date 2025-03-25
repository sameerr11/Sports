const cron = require('node-cron');
const RecurringSchedule = require('../models/RecurringSchedule');
const { generateRecurringBookings } = require('../controllers/recurringScheduleController');

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
          if (newBookings.length > 0) {
            schedule.bookings = [
              ...schedule.bookings,
              ...newBookings.map(booking => booking._id)
            ];
            await schedule.save();
          }
        } catch (err) {
          console.error(`Error generating bookings for schedule ${schedule._id}:`, err);
        }
      }
      
      console.log('Completed weekly booking generation job');
    } catch (err) {
      console.error('Error running booking generation job:', err);
    }
  }, {
    scheduled: true,
    timezone: "UTC"
  });
  
  // Run daily at 2:00 AM to check for recurring schedules with no upcoming bookings
  // This handles situations where the weekly job might have been missed
  cron.schedule('0 2 * * *', async () => {
    console.log('Running daily check for upcoming bookings...');
    
    try {
      const activeSchedules = await RecurringSchedule.find({ isActive: true });
      const now = new Date();
      const twoWeeksFromNow = new Date(now);
      twoWeeksFromNow.setDate(twoWeeksFromNow.getDate() + 14);
      
      for (const schedule of activeSchedules) {
        try {
          // Check if there are any upcoming bookings for this schedule
          const hasUpcomingBookings = schedule.bookings.length > 0;
          
          if (!hasUpcomingBookings) {
            console.log(`Schedule ${schedule._id} has no upcoming bookings. Generating...`);
            const newBookings = await generateRecurringBookings(schedule, 4);
            
            if (newBookings.length > 0) {
              schedule.bookings = newBookings.map(booking => booking._id);
              await schedule.save();
              console.log(`Generated ${newBookings.length} bookings for schedule ${schedule._id}`);
            }
          }
        } catch (err) {
          console.error(`Error checking bookings for schedule ${schedule._id}:`, err);
        }
      }
      
      console.log('Completed daily booking check');
    } catch (err) {
      console.error('Error running daily booking check:', err);
    }
  }, {
    scheduled: true,
    timezone: "UTC"
  });
  
  console.log('Scheduler initialized successfully');
};

module.exports = { initScheduler };