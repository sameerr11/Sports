const { validationResult } = require('express-validator');
const Booking = require('../models/Booking');
const Court = require('../models/Court');
const User = require('../models/User');
const Team = require('../models/Team');

// @desc    Create a new booking
// @route   POST /api/bookings
// @access  Private
exports.createBooking = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { court, startTime, endTime, purpose, team, notes } = req.body;

    // Check if court exists
    const courtDoc = await Court.findById(court);
    if (!courtDoc) {
      return res.status(404).json({ msg: 'Court not found' });
    }

    // Check if court is active
    if (!courtDoc.isActive) {
      return res.status(400).json({ msg: 'Court is not available for booking' });
    }

    // Convert strings to Date objects
    const startDate = new Date(startTime);
    const endDate = new Date(endTime);

    // Validate dates
    if (startDate >= endDate) {
      return res.status(400).json({ msg: 'End time must be after start time' });
    }

    if (startDate < new Date()) {
      return res.status(400).json({ msg: 'Cannot book in the past' });
    }

    // Check for overlapping bookings
    const overlappingBookings = await Booking.find({
      court,
      status: { $ne: 'Cancelled' },
      $or: [
        { startTime: { $lt: endDate }, endTime: { $gt: startDate } }
      ]
    });

    if (overlappingBookings.length > 0) {
      return res.status(400).json({ msg: 'Court is already booked during this time' });
    }

    // Calculate duration in hours
    const durationHours = (endDate - startDate) / (1000 * 60 * 60);
    
    // Calculate total price
    const totalPrice = durationHours * courtDoc.hourlyRate;

    // Create new booking
    const newBooking = new Booking({
      court,
      user: req.user.id,
      team,
      startTime: startDate,
      endTime: endDate,
      purpose,
      totalPrice,
      notes
    });

    // If user is a guest, set status to pending
    // If user is admin, supervisor, or coach, set status to confirmed
    if (['admin', 'supervisor', 'coach'].includes(req.user.role)) {
      newBooking.status = 'Confirmed';
    }

    const booking = await newBooking.save();
    res.status(201).json(booking);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// @desc    Get all bookings
// @route   GET /api/bookings
// @access  Private (Admin, Supervisor)
exports.getBookings = async (req, res) => {
  try {
    // Build query based on request parameters
    const query = {};
    
    // Filter by team if provided
    if (req.query.team) {
      query.team = req.query.team;
    }
    
    // Allow players to see team bookings when team parameter is specified
    if (req.query.team && req.user.role === 'player') {
      // Verify the player is part of the requested team
      const team = await Team.findById(req.query.team);
      if (!team) {
        return res.status(404).json({ msg: 'Team not found' });
      }
      
      const isPlayerInTeam = team.players.some(p => p.player.toString() === req.user.id);
      if (!isPlayerInTeam) {
        return res.status(403).json({ msg: 'Access denied: You are not a member of this team' });
      }
    } else if (req.user.role !== 'admin' && req.user.role !== 'supervisor' && !req.query.team) {
      // If not admin/supervisor and no team filter, restrict access
      return res.status(403).json({ msg: 'Access denied' });
    }
    
    const bookings = await Booking.find(query)
      .populate('court', 'name location sportType')
      .populate('user', 'firstName lastName email')
      .populate('team', 'name')
      .sort({ startTime: 1 });
    
    res.json(bookings);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// @desc    Get user's bookings
// @route   GET /api/bookings/me
// @access  Private
exports.getUserBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user.id })
      .populate('court', 'name location sportType')
      .populate('team', 'name')
      .sort({ startTime: 1 });
    
    res.json(bookings);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// @desc    Get booking by ID
// @route   GET /api/bookings/:id
// @access  Private
exports.getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('court', 'name location sportType hourlyRate')
      .populate('user', 'firstName lastName email')
      .populate('team', 'name');
    
    if (!booking) {
      return res.status(404).json({ msg: 'Booking not found' });
    }

    // Check if user is authorized to view this booking
    if (
      booking.user._id.toString() !== req.user.id && 
      !['admin', 'supervisor', 'accounting'].includes(req.user.role)
    ) {
      return res.status(403).json({ msg: 'Not authorized to view this booking' });
    }

    res.json(booking);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Booking not found' });
    }
    res.status(500).send('Server Error');
  }
};

// @desc    Update booking status
// @route   PUT /api/bookings/:id/status
// @access  Private (Admin, Supervisor)
exports.updateBookingStatus = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { status } = req.body;

    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({ msg: 'Booking not found' });
    }

    booking.status = status;
    await booking.save();

    res.json(booking);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// @desc    Cancel booking
// @route   PUT /api/bookings/:id/cancel
// @access  Private
exports.cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({ msg: 'Booking not found' });
    }

    // Check if user is authorized to cancel this booking
    if (
      booking.user.toString() !== req.user.id && 
      !['admin', 'supervisor'].includes(req.user.role)
    ) {
      return res.status(403).json({ msg: 'Not authorized to cancel this booking' });
    }

    // Check if booking is already cancelled
    if (booking.status === 'Cancelled') {
      return res.status(400).json({ msg: 'Booking is already cancelled' });
    }

    // Check if booking is in the past
    if (new Date(booking.startTime) < new Date()) {
      return res.status(400).json({ msg: 'Cannot cancel past bookings' });
    }

    booking.status = 'Cancelled';
    await booking.save();

    res.json(booking);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
}; 