const { validationResult } = require('express-validator');
const RecurringSchedule = require('../models/RecurringSchedule');
const Booking = require('../models/Booking');
const Court = require('../models/Court');
const User = require('../models/User');
const Team = require('../models/Team');

// Helper function to calculate minutes from HH:MM format
const getMinutesFromTimeString = (timeString) => {
  const [hours, minutes] = timeString.split(':').map(Number);
  return hours * 60 + minutes;
};

// Helper function to calculate duration in minutes
const calculateDuration = (startTime, endTime) => {
  const startMinutes = getMinutesFromTimeString(startTime);
  const endMinutes = getMinutesFromTimeString(endTime);
  
  // Handle cases where end time is on the next day
  return endMinutes < startMinutes ? (24 * 60 - startMinutes) + endMinutes : endMinutes - startMinutes;
};

// @desc    Create a new recurring schedule
// @route   POST /api/recurring-schedules
// @access  Private (Supervisor only)
exports.createRecurringSchedule = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { 
    team, 
    court, 
    dayOfWeek, 
    startTime, 
    endTime, 
    purpose, 
    startDate,
    endDate,
    notes 
  } = req.body;

  try {
    // Verify that the court exists
    const courtDoc = await Court.findById(court);
    if (!courtDoc) {
      return res.status(404).json({ msg: 'Court not found' });
    }
    
    // Verify that the team exists
    const teamDoc = await Team.findById(team);
    if (!teamDoc) {
      return res.status(404).json({ msg: 'Team not found' });
    }
    
    // Validate time format
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
      return res.status(400).json({ msg: 'Times must be in HH:MM format' });
    }
    
    // Calculate duration in minutes
    const duration = calculateDuration(startTime, endTime);
    if (duration <= 0) {
      return res.status(400).json({ msg: 'End time must be after start time' });
    }
    
    // Verify court availability for the selected day
    const dayAvailability = courtDoc.availability[dayOfWeek] || [];
    if (dayAvailability.length === 0) {
      return res.status(400).json({ msg: `Court is not available on ${dayOfWeek}` });
    }
    
    // Convert time to comparable format (minutes since midnight)
    const scheduleStartMinutes = getMinutesFromTimeString(startTime);
    const scheduleEndMinutes = getMinutesFromTimeString(endTime);
    
    // Check if the schedule falls within court availability
    const isWithinAvailableHours = dayAvailability.some(slot => {
      const slotStart = slot.start.split(':').map(Number);
      const slotEnd = slot.end.split(':').map(Number);
      const slotStartMinutes = slotStart[0] * 60 + slotStart[1];
      const slotEndMinutes = slotEnd[0] * 60 + slotEnd[1];
      
      return scheduleStartMinutes >= slotStartMinutes && scheduleEndMinutes <= slotEndMinutes;
    });
    
    if (!isWithinAvailableHours) {
      return res.status(400).json({ 
        msg: `Schedule time is outside the court's available hours for ${dayOfWeek}`,
        availableSlots: dayAvailability 
      });
    }
    
    // Create new recurring schedule
    const recurringSchedule = new RecurringSchedule({
      team,
      court,
      createdBy: req.user.id,
      dayOfWeek,
      startTime,
      endTime,
      duration,
      purpose: purpose || 'Training',
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : null,
      notes
    });
    
    await recurringSchedule.save();
    
    // Create the first few occurrences as bookings (next 4 weeks)
    const generatedBookings = await generateRecurringBookings(recurringSchedule, 4);
    
    // Add generated booking IDs to the recurring schedule
    recurringSchedule.bookings = generatedBookings.map(booking => booking._id);
    await recurringSchedule.save();
    
    // Return the recurring schedule with populated fields
    const populatedSchedule = await RecurringSchedule.findById(recurringSchedule._id)
      .populate('team', 'name sportType')
      .populate('court', 'name location sportType')
      .populate('createdBy', 'firstName lastName')
      .populate('bookings');
    
    res.status(201).json(populatedSchedule);
  } catch (err) {
    console.error('Error creating recurring schedule:', err.message);
    res.status(500).send('Server Error');
  }
};

// @desc    Get all recurring schedules
// @route   GET /api/recurring-schedules
// @access  Private
exports.getRecurringSchedules = async (req, res) => {
  try {
    const { team, court, active } = req.query;
    
    // Build query
    const query = {};
    
    if (team) {
      query.team = team;
    }
    
    if (court) {
      query.court = court;
    }
    
    if (active !== undefined) {
      query.isActive = active === 'true';
    }
    
    const recurringSchedules = await RecurringSchedule.find(query)
      .populate('team', 'name sportType')
      .populate('court', 'name location sportType')
      .populate('createdBy', 'firstName lastName')
      .sort({ dayOfWeek: 1, startTime: 1 });
    
    res.json(recurringSchedules);
  } catch (err) {
    console.error('Error fetching recurring schedules:', err.message);
    res.status(500).send('Server Error');
  }
};

// @desc    Get recurring schedule by ID
// @route   GET /api/recurring-schedules/:id
// @access  Private
exports.getRecurringScheduleById = async (req, res) => {
  try {
    const recurringSchedule = await RecurringSchedule.findById(req.params.id)
      .populate('team', 'name sportType')
      .populate('court', 'name location sportType')
      .populate('createdBy', 'firstName lastName')
      .populate('bookings');
    
    if (!recurringSchedule) {
      return res.status(404).json({ msg: 'Recurring schedule not found' });
    }
    
    res.json(recurringSchedule);
  } catch (err) {
    console.error('Error fetching recurring schedule:', err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Recurring schedule not found' });
    }
    res.status(500).send('Server Error');
  }
};

// @desc    Update recurring schedule
// @route   PUT /api/recurring-schedules/:id
// @access  Private (Supervisor only)
exports.updateRecurringSchedule = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { 
    team, 
    court, 
    dayOfWeek, 
    startTime, 
    endTime, 
    purpose, 
    startDate,
    endDate,
    notes,
    isActive 
  } = req.body;

  try {
    // Find recurring schedule
    const recurringSchedule = await RecurringSchedule.findById(req.params.id);
    
    if (!recurringSchedule) {
      return res.status(404).json({ msg: 'Recurring schedule not found' });
    }
    
    // Check if court is being updated
    if (court && court !== recurringSchedule.court.toString()) {
      const courtDoc = await Court.findById(court);
      if (!courtDoc) {
        return res.status(404).json({ msg: 'Court not found' });
      }
      
      // Verify availability on the specified day
      const dayToCheck = dayOfWeek || recurringSchedule.dayOfWeek;
      const dayAvailability = courtDoc.availability[dayToCheck] || [];
      
      if (dayAvailability.length === 0) {
        return res.status(400).json({ msg: `New court is not available on ${dayToCheck}` });
      }
    }
    
    // Check if team is being updated
    if (team && team !== recurringSchedule.team.toString()) {
      const teamDoc = await Team.findById(team);
      if (!teamDoc) {
        return res.status(404).json({ msg: 'Team not found' });
      }
    }
    
    // If times are being updated, validate and calculate duration
    let duration = recurringSchedule.duration;
    if ((startTime && startTime !== recurringSchedule.startTime) || 
        (endTime && endTime !== recurringSchedule.endTime)) {
      
      const newStartTime = startTime || recurringSchedule.startTime;
      const newEndTime = endTime || recurringSchedule.endTime;
      
      // Validate time format
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(newStartTime) || !timeRegex.test(newEndTime)) {
        return res.status(400).json({ msg: 'Times must be in HH:MM format' });
      }
      
      duration = calculateDuration(newStartTime, newEndTime);
      if (duration <= 0) {
        return res.status(400).json({ msg: 'End time must be after start time' });
      }
    }
    
    // Update fields
    if (team) recurringSchedule.team = team;
    if (court) recurringSchedule.court = court;
    if (dayOfWeek) recurringSchedule.dayOfWeek = dayOfWeek;
    if (startTime) recurringSchedule.startTime = startTime;
    if (endTime) recurringSchedule.endTime = endTime;
    if (purpose) recurringSchedule.purpose = purpose;
    if (startDate) recurringSchedule.startDate = new Date(startDate);
    if (endDate !== undefined) recurringSchedule.endDate = endDate ? new Date(endDate) : null;
    if (notes !== undefined) recurringSchedule.notes = notes;
    if (isActive !== undefined) recurringSchedule.isActive = isActive;
    
    // Update duration if times changed
    if ((startTime && startTime !== recurringSchedule.startTime) || 
        (endTime && endTime !== recurringSchedule.endTime)) {
      recurringSchedule.duration = duration;
    }
    
    await recurringSchedule.save();
    
    // Return updated schedule with populated fields
    const updatedSchedule = await RecurringSchedule.findById(req.params.id)
      .populate('team', 'name sportType')
      .populate('court', 'name location sportType')
      .populate('createdBy', 'firstName lastName')
      .populate('bookings');
    
    res.json(updatedSchedule);
  } catch (err) {
    console.error('Error updating recurring schedule:', err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Recurring schedule not found' });
    }
    res.status(500).send('Server Error');
  }
};

// @desc    Delete recurring schedule
// @route   DELETE /api/recurring-schedules/:id
// @access  Private (Supervisor only)
exports.deleteRecurringSchedule = async (req, res) => {
  try {
    const recurringSchedule = await RecurringSchedule.findById(req.params.id);
    
    if (!recurringSchedule) {
      return res.status(404).json({ msg: 'Recurring schedule not found' });
    }
    
    // Option to delete all future bookings or just the recurring pattern
    const { deleteBookings } = req.query;
    
    if (deleteBookings === 'true' && recurringSchedule.bookings.length > 0) {
      // Delete all bookings associated with this recurring schedule
      await Booking.deleteMany({ _id: { $in: recurringSchedule.bookings } });
    }
    
    await recurringSchedule.remove();
    
    res.json({ msg: 'Recurring schedule deleted' });
  } catch (err) {
    console.error('Error deleting recurring schedule:', err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Recurring schedule not found' });
    }
    res.status(500).send('Server Error');
  }
};

// @desc    Add exception date to recurring schedule
// @route   POST /api/recurring-schedules/:id/exceptions
// @access  Private (Supervisor only)
exports.addException = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { date, reason } = req.body;

  try {
    const recurringSchedule = await RecurringSchedule.findById(req.params.id);
    
    if (!recurringSchedule) {
      return res.status(404).json({ msg: 'Recurring schedule not found' });
    }
    
    // Check if date is already an exception
    const exceptionDate = new Date(date);
    const existingException = recurringSchedule.exceptions.find(ex => 
      new Date(ex.date).toDateString() === exceptionDate.toDateString()
    );
    
    if (existingException) {
      return res.status(400).json({ msg: 'This date is already an exception' });
    }
    
    // Add exception
    recurringSchedule.exceptions.push({
      date: exceptionDate,
      reason: reason || 'Manual exception'
    });
    
    await recurringSchedule.save();
    
    // Find and cancel any bookings on this date
    const dateStart = new Date(exceptionDate);
    dateStart.setHours(0, 0, 0, 0);
    
    const dateEnd = new Date(exceptionDate);
    dateEnd.setHours(23, 59, 59, 999);
    
    const bookingsOnDate = await Booking.find({
      _id: { $in: recurringSchedule.bookings },
      startTime: { $gte: dateStart, $lte: dateEnd }
    });
    
    // Cancel found bookings
    for (const booking of bookingsOnDate) {
      booking.status = 'Cancelled';
      booking.notes = booking.notes 
        ? `${booking.notes}\nCancelled due to exception: ${reason || 'Manual exception'}`
        : `Cancelled due to exception: ${reason || 'Manual exception'}`;
      
      await booking.save();
    }
    
    // Return updated schedule
    const updatedSchedule = await RecurringSchedule.findById(req.params.id)
      .populate('team', 'name sportType')
      .populate('court', 'name location sportType')
      .populate('createdBy', 'firstName lastName')
      .populate('bookings');
    
    res.json(updatedSchedule);
  } catch (err) {
    console.error('Error adding exception:', err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Recurring schedule not found' });
    }
    res.status(500).send('Server Error');
  }
};

// @desc    Remove exception date from recurring schedule
// @route   DELETE /api/recurring-schedules/:id/exceptions/:exceptionId
// @access  Private (Supervisor only)
exports.removeException = async (req, res) => {
  try {
    const recurringSchedule = await RecurringSchedule.findById(req.params.id);
    
    if (!recurringSchedule) {
      return res.status(404).json({ msg: 'Recurring schedule not found' });
    }
    
    // Find exception by ID
    const exceptionIndex = recurringSchedule.exceptions.findIndex(
      ex => ex._id.toString() === req.params.exceptionId
    );
    
    if (exceptionIndex === -1) {
      return res.status(404).json({ msg: 'Exception not found' });
    }
    
    // Remove exception
    recurringSchedule.exceptions.splice(exceptionIndex, 1);
    await recurringSchedule.save();
    
    // Return updated schedule
    const updatedSchedule = await RecurringSchedule.findById(req.params.id)
      .populate('team', 'name sportType')
      .populate('court', 'name location sportType')
      .populate('createdBy', 'firstName lastName')
      .populate('bookings');
    
    res.json(updatedSchedule);
  } catch (err) {
    console.error('Error removing exception:', err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Recurring schedule not found or exception not found' });
    }
    res.status(500).send('Server Error');
  }
};

// @desc    Generate new bookings for recurring schedule
// @route   POST /api/recurring-schedules/:id/generate
// @access  Private (Supervisor only)
exports.generateBookings = async (req, res) => {
  const { weeks } = req.body;
  
  try {
    const recurringSchedule = await RecurringSchedule.findById(req.params.id);
    
    if (!recurringSchedule) {
      return res.status(404).json({ msg: 'Recurring schedule not found' });
    }
    
    // Generate bookings for specified number of weeks (default: 4)
    const newBookings = await generateRecurringBookings(recurringSchedule, weeks || 4);
    
    // Add new booking IDs to the recurring schedule
    recurringSchedule.bookings = [
      ...recurringSchedule.bookings,
      ...newBookings.map(booking => booking._id)
    ];
    
    await recurringSchedule.save();
    
    // Return updated schedule with newly generated bookings
    const updatedSchedule = await RecurringSchedule.findById(req.params.id)
      .populate('team', 'name sportType')
      .populate('court', 'name location sportType')
      .populate('createdBy', 'firstName lastName')
      .populate('bookings');
    
    res.json({
      schedule: updatedSchedule,
      generatedBookings: newBookings
    });
  } catch (err) {
    console.error('Error generating bookings:', err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Recurring schedule not found' });
    }
    res.status(500).send('Server Error');
  }
};

// Helper function to generate bookings for a recurring schedule
// This is used internally by the controller and also exported for the scheduler
async function generateRecurringBookings(recurringSchedule, weekCount = 4) {
  try {
    // Determine the date range to generate bookings for
    const now = new Date();
    const latestBooking = await Booking.findOne({
      _id: { $in: recurringSchedule.bookings }
    }).sort({ startTime: -1 });
    
    // Start generating from the latest booking date or now, whichever is later
    let startDate;
    if (latestBooking) {
      startDate = new Date(latestBooking.startTime);
      // Move to next week
      startDate.setDate(startDate.getDate() + 7);
    } else {
      // Start from the recurring schedule's start date or now, whichever is later
      startDate = new Date(Math.max(recurringSchedule.startDate, now));
    }
    
    // Calculate end date (start date + weekCount weeks)
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + (weekCount * 7));
    
    // If recurring schedule has an end date, respect it
    if (recurringSchedule.endDate && recurringSchedule.endDate < endDate) {
      endDate.setTime(recurringSchedule.endDate.getTime());
    }
    
    // Get day of week index (0 = Sunday, 1 = Monday, etc.)
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayIndex = days.indexOf(recurringSchedule.dayOfWeek);
    
    if (dayIndex === -1) {
      throw new Error(`Invalid day of week: ${recurringSchedule.dayOfWeek}`);
    }
    
    // Parse start and end times
    const [startHours, startMinutes] = recurringSchedule.startTime.split(':').map(Number);
    const [endHours, endMinutes] = recurringSchedule.endTime.split(':').map(Number);
    
    const generatedBookings = [];
    
    // Generate bookings for each occurrence in the date range
    let currentDate = new Date(startDate);
    while (currentDate < endDate) {
      // Find the next occurrence of the day of week
      const daysUntilNext = (dayIndex - currentDate.getDay() + 7) % 7;
      currentDate.setDate(currentDate.getDate() + daysUntilNext);
      
      // Skip if we've gone beyond the end date
      if (currentDate > endDate) break;
      
      // Check if this date is an exception
      const isException = recurringSchedule.exceptions.some(ex => 
        new Date(ex.date).toDateString() === currentDate.toDateString()
      );
      
      if (!isException) {
        // Create start and end times for this occurrence
        const bookingStartTime = new Date(currentDate);
        bookingStartTime.setHours(startHours, startMinutes, 0, 0);
        
        const bookingEndTime = new Date(currentDate);
        bookingEndTime.setHours(endHours, endMinutes, 0, 0);
        
        // Handle case where end time is on the next day
        if (endHours < startHours || (endHours === startHours && endMinutes < startMinutes)) {
          bookingEndTime.setDate(bookingEndTime.getDate() + 1);
        }
        
        // Check if there's an overlapping booking for this court
        const existingBooking = await Booking.findOne({
          court: recurringSchedule.court,
          status: { $ne: 'Cancelled' },
          $or: [
            { 
              startTime: { $lt: bookingEndTime },
              endTime: { $gt: bookingStartTime }
            }
          ]
        });
        
        if (!existingBooking) {
          // Create new booking
          const newBooking = new Booking({
            court: recurringSchedule.court,
            user: recurringSchedule.createdBy,
            team: recurringSchedule.team,
            startTime: bookingStartTime,
            endTime: bookingEndTime,
            purpose: recurringSchedule.purpose,
            status: 'Confirmed',
            totalPrice: 0, // Training sessions are free
            notes: `Generated from recurring schedule: ${recurringSchedule._id}`,
            isRecurring: true,
            recurringDay: recurringSchedule.dayOfWeek
          });
          
          await newBooking.save();
          generatedBookings.push(newBooking);
        }
      }
      
      // Move to next week
      currentDate.setDate(currentDate.getDate() + 7);
    }
    
    return generatedBookings;
  } catch (err) {
    console.error('Error generating recurring bookings:', err);
    throw err;
  }
}

// Export the generator function for use by the scheduler
exports.generateRecurringBookings = generateRecurringBookings;