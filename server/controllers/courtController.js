const { validationResult } = require('express-validator');
const Court = require('../models/Court');
const Booking = require('../models/Booking');

// @desc    Create a new court
// @route   POST /api/courts
// @access  Private (Supervisor only)
exports.createCourt = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { name, sportType, location, description, capacity, hourlyRate, availability, image } = req.body;

    const newCourt = new Court({
      name,
      sportType,
      location,
      description,
      capacity,
      hourlyRate,
      availability,
      image,
      createdBy: req.user.id
    });

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
    const courts = await Court.find({ isActive: true }).sort({ createdAt: -1 });
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

    // Check if there are any future bookings for this court
    const futureBookings = await Booking.find({
      court: req.params.id,
      startTime: { $gt: new Date() }
    });

    if (futureBookings.length > 0) {
      return res.status(400).json({ msg: 'Cannot delete court with future bookings' });
    }

    await court.remove();
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
    const date = req.query.date ? new Date(req.query.date) : new Date();
    
    // Set time to beginning of day
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    // Set time to end of day
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // Get all bookings for this court on the specified date
    const bookings = await Booking.find({
      court: req.params.id,
      startTime: { $gte: startOfDay },
      endTime: { $lte: endOfDay },
      status: { $ne: 'Cancelled' }
    }).sort({ startTime: 1 });

    // Get day of week
    const dayOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][date.getDay()];
    
    // Get court availability for this day
    const courtAvailability = court.availability[dayOfWeek] || [];

    // Format response
    const response = {
      date: date,
      dayOfWeek,
      courtAvailability,
      bookings: bookings.map(booking => ({
        id: booking._id,
        startTime: booking.startTime,
        endTime: booking.endTime,
        status: booking.status
      }))
    };

    res.json(response);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
}; 