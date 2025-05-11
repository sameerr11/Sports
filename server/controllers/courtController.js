const { validationResult } = require('express-validator');
const Court = require('../models/Court');
const Booking = require('../models/Booking');
const User = require('../models/User');
const GuestBooking = require('../models/GuestBooking');

// Helper function to ensure court has default availability
const ensureCourtAvailability = (court) => {
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  
  // Check if the court has availability settings
  if (!court.availability) {
    court.availability = {};
  }
  
  // Set default availability for each day if not present
  days.forEach(day => {
    if (!court.availability[day] || court.availability[day].length === 0) {
      // Default availability: 9 AM to 9 PM for both Academy and Rental
      court.availability[day] = [
        { start: '09:00', end: '21:00', type: 'Academy' },
        { start: '09:00', end: '21:00', type: 'Rental' }
      ];
    }
  });
  
  return court;
};

// @desc    Create a new court
// @route   POST /api/courts
// @access  Private (Supervisor only)
exports.createCourt = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { name, sportType, location, capacity, hourlyRate, availability, image } = req.body;

    // Check if sports supervisor is trying to create a court for a sport they're not assigned to
    if (req.user.role === 'supervisor') {
      const supervisor = await User.findById(req.user.id);
      
      // Allow booking supervisors full court management access
      if (supervisor.supervisorType === 'booking') {
        // Booking supervisors can create courts for any sport type
      }
      else if (supervisor.supervisorType === 'sports' && 
          Array.isArray(supervisor.supervisorSportTypes) && 
          supervisor.supervisorSportTypes.length > 0) {
        
        // If the requested sport type is not in the supervisor's assigned types
        if (!supervisor.supervisorSportTypes.includes(sportType)) {
          return res.status(403).json({ 
            msg: 'Not authorized to create courts for this sport type' 
          });
        }
      }
    }

    const newCourt = new Court({
      name,
      sportType,
      location,
      capacity,
      hourlyRate,
      availability,
      image,
      createdBy: req.user.id
    });
    
    // Ensure the court has default availability
    ensureCourtAvailability(newCourt);
    
    const court = await newCourt.save();
    res.status(201).json(court);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// @desc    Get all courts
// @route   GET /api/courts
// @access  Public
exports.getCourts = async (req, res) => {
  try {
    let query = { isActive: true };
    
    // Filter courts by sport type for sports supervisors
    if (req.user && req.user.role === 'supervisor') {
      // Get the supervisor details
      const supervisor = await User.findById(req.user.id);
      
      // If supervisor is a sports supervisor, filter by their assigned sport types
      if (supervisor.supervisorType === 'sports' && 
          Array.isArray(supervisor.supervisorSportTypes) && 
          supervisor.supervisorSportTypes.length > 0) {
        
        query.sportType = { $in: supervisor.supervisorSportTypes };
      }
      // General supervisors and cafeteria supervisors see all courts (or none for cafeteria)
    }
    
    const courts = await Court.find(query).sort({ createdAt: -1 });
    res.json(courts);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// @desc    Get court by ID
// @route   GET /api/courts/:id
// @access  Public
exports.getCourtById = async (req, res) => {
  try {
    const court = await Court.findById(req.params.id);
    
    if (!court) {
      return res.status(404).json({ msg: 'Court not found' });
    }

    res.json(court);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Court not found' });
    }
    res.status(500).send('Server Error');
  }
};

// @desc    Update court
// @route   PUT /api/courts/:id
// @access  Private (Supervisor only)
exports.updateCourt = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { name, sportType, location, description, capacity, hourlyRate, availability, image, isActive } = req.body;

    let court = await Court.findById(req.params.id);
    
    if (!court) {
      return res.status(404).json({ msg: 'Court not found' });
    }

    // Check if sports supervisor is trying to update a court for a sport they're not assigned to
    if (req.user.role === 'supervisor' && sportType) {
      const supervisor = await User.findById(req.user.id);
      
      // Allow booking supervisors full court management access
      if (supervisor.supervisorType === 'booking') {
        // Booking supervisors can update courts for any sport type
      }
      else if (supervisor.supervisorType === 'sports' && 
          Array.isArray(supervisor.supervisorSportTypes) && 
          supervisor.supervisorSportTypes.length > 0) {
        
        // If the court's current sport type is not in supervisor's assigned types
        if (!supervisor.supervisorSportTypes.includes(court.sportType)) {
          return res.status(403).json({ 
            msg: 'Not authorized to update courts for this sport type' 
          });
        }
        
        // If the new sport type is not in supervisor's assigned types
        if (!supervisor.supervisorSportTypes.includes(sportType)) {
          return res.status(403).json({ 
            msg: 'Not authorized to update courts to this sport type' 
          });
        }
      }
    }

    // Build court object
    const courtFields = {};
    if (name) courtFields.name = name;
    if (sportType) courtFields.sportType = sportType;
    if (location) courtFields.location = location;
    if (description) courtFields.description = description;
    if (capacity) courtFields.capacity = capacity;
    if (hourlyRate) courtFields.hourlyRate = hourlyRate;
    if (availability) courtFields.availability = availability;
    if (image) courtFields.image = image;
    if (isActive !== undefined) courtFields.isActive = isActive;

    // If court has no availability settings after update, ensure defaults
    if (!courtFields.availability || Object.keys(courtFields.availability).length === 0) {
      court = ensureCourtAvailability(court);
      await court.save();
      return res.json(court);
    }

    court = await Court.findByIdAndUpdate(
      req.params.id,
      { $set: courtFields },
      { new: true }
    );

    res.json(court);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// @desc    Delete court
// @route   DELETE /api/courts/:id
// @access  Private (Supervisor only)
exports.deleteCourt = async (req, res) => {
  try {
    const court = await Court.findById(req.params.id);
    
    if (!court) {
      return res.status(404).json({ msg: 'Court not found' });
    }
    
    // Check if sports supervisor is trying to delete a court for a sport they're not assigned to
    if (req.user.role === 'supervisor') {
      const supervisor = await User.findById(req.user.id);
      
      if (supervisor.supervisorType === 'sports' && 
          Array.isArray(supervisor.supervisorSportTypes) && 
          supervisor.supervisorSportTypes.length > 0) {
        
        // If the court's sport type is not in the supervisor's assigned types
        if (!supervisor.supervisorSportTypes.includes(court.sportType)) {
          return res.status(403).json({ 
            msg: 'Not authorized to delete courts for this sport type' 
          });
        }
      }
    }

    // Check if there are any future bookings for this court
    const futureBookings = await Booking.find({
      court: req.params.id,
      startTime: { $gt: new Date() }
    });

    if (futureBookings.length > 0) {
      return res.status(400).json({ msg: 'Cannot delete court with future bookings' });
    }

    // Use findByIdAndDelete instead of remove()
    await Court.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Court removed' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Court not found' });
    }
    res.status(500).send('Server Error');
  }
};

// @desc    Get available court slots
// @route   GET /api/courts/:id/availability
// @access  Public
exports.getCourtAvailability = async (req, res) => {
  try {
    const court = await Court.findById(req.params.id);
    
    if (!court) {
      return res.status(404).json({ msg: 'Court not found' });
    }

    // Get date from query params or use today
    // IMPORTANT: When creating a date from a string, we need to ensure it's treated as local time
    let date;
    if (req.query.date) {
      // Parse the date in local time without timezone conversion
      const parts = req.query.date.split('-').map(Number);
      date = new Date(parts[0], parts[1] - 1, parts[2]); // Year, Month (0-based), Day
    } else {
      date = new Date();
    }
    
    // Set time to beginning of day in local time
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    // Set time to end of day in local time
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // Get all bookings for this court on the specified date
    const bookings = await Booking.find({
      court: req.params.id,
      startTime: { $gte: startOfDay },
      endTime: { $lte: endOfDay },
      status: { $ne: 'Cancelled' }
    }).sort({ startTime: 1 });

    // Get all guest bookings for this court on the specified date
    const guestBookings = await GuestBooking.find({
      court: req.params.id,
      startTime: { $gte: startOfDay },
      endTime: { $lte: endOfDay },
      status: { $ne: 'Cancelled' }
    }).sort({ startTime: 1 });

    // Get day of week (in local time - critical for correct scheduling)
    const dayOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][date.getDay()];
    
    // Get court availability for this day
    const courtAvailability = court.availability[dayOfWeek] || [];

    // Make sure we're sending all slot types in the response
    console.log('Court availability slots for day:', courtAvailability);

    // Format response
    const response = {
      date: date,
      dayOfWeek,
      courtAvailability,
      bookings: [
        ...bookings.map(booking => ({
          id: booking._id,
          startTime: booking.startTime,
          endTime: booking.endTime,
          status: booking.status,
          purpose: booking.purpose, // Add booking purpose for filtering on client
          isGuestBooking: false
        })),
        ...guestBookings.map(booking => ({
          id: booking._id,
          startTime: booking.startTime,
          endTime: booking.endTime,
          status: booking.status,
          isGuestBooking: true,
          bookingReference: booking.bookingReference,
          guestName: booking.user ? `${booking.user.firstName}` : 'Guest'
        }))
      ].sort((a, b) => new Date(a.startTime) - new Date(b.startTime))
    };

    res.json(response);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// @desc    Fix court availability - admin utility
// @route   POST /api/courts/fix-availability
// @access  Private (Admin only)
exports.fixCourtAvailability = async (req, res) => {
  try {
    const courts = await Court.find({});
    let fixedCount = 0;
    
    for (const court of courts) {
      const originalAvailabilityStr = JSON.stringify(court.availability || {});
      ensureCourtAvailability(court);
      const newAvailabilityStr = JSON.stringify(court.availability);
      
      // Only save if changes were made
      if (originalAvailabilityStr !== newAvailabilityStr) {
        await court.save();
        fixedCount++;
      }
    }
    
    res.json({ 
      message: `Court availability fixed for ${fixedCount} courts`,
      totalCourts: courts.length
    });
  } catch (err) {
    console.error('Error fixing court availability:', err.message);
    res.status(500).send('Server Error');
  }
}; 