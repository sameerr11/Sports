const { validationResult } = require('express-validator');
const Booking = require('../models/Booking');
const Court = require('../models/Court');
const User = require('../models/User');
const Team = require('../models/Team');
const notificationService = require('../utils/notificationService');

// @desc    Create a new booking
// @route   POST /api/bookings
// @access  Private
exports.createBooking = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { court, startTime, endTime, purpose, team, notes, isRecurring, recurringDay } = req.body;
  console.log('Creating booking with data:', { court, startTime, endTime, purpose, team, notes, isRecurring, recurringDay });

  try {
    const user = req.user.id;
    
    // Verify that the court exists
    const courtDoc = await Court.findById(court);
    
    if (!courtDoc) {
      console.log('Court not found:', court);
      return res.status(404).json({ msg: 'Court not found' });
    }
    
    // Parse dates
    const startDate = new Date(startTime);
    const endDate = new Date(endTime);
    console.log('Parsed dates:', { startDate, endDate });
    
    // Verify end time is after start time
    if (endDate <= startDate) {
      console.log('Invalid time range:', { startDate, endDate });
      return res.status(400).json({ msg: 'End time must be after start time' });
    }
    
    // Get day of week (0 = Sunday, 1 = Monday, etc.)
    const dayOfWeek = startDate.getDay();
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = days[dayOfWeek];
    
    // For recurring booking, use the specified recurringDay instead
    const effectiveDayName = recurringDay || dayName;
    console.log('Day information:', { dayOfWeek, dayName, effectiveDayName });
    
    // Get court availability for this day
    const dayAvailability = courtDoc.availability[effectiveDayName] || [];
    console.log('Court availability for day:', dayAvailability);
    
    if (dayAvailability.length === 0) {
      console.log('No availability for this day');
      return res.status(400).json({ msg: `Court is not available on ${effectiveDayName}` });
    }
    
    // Convert booking time to HH:MM format for comparison
    const startHour = startDate.getHours();
    const startMinute = startDate.getMinutes();
    const bookingStartTime = `${startHour.toString().padStart(2, '0')}:${startMinute.toString().padStart(2, '0')}`;
    
    const endHour = endDate.getHours();
    const endMinute = endDate.getMinutes();
    const bookingEndTime = `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;
    
    // Filter available slots based on booking purpose
    let availableSlots = dayAvailability;
    
    // If purpose is Training or Match, only allow booking during Academy hours
    if (purpose === 'Training' || purpose === 'Match') {
      availableSlots = dayAvailability.filter(slot => slot.type === 'Academy');
      
      if (availableSlots.length === 0) {
        return res.status(400).json({ 
          msg: 'No Academy hours available for this court. Training and matches can only be scheduled during Academy hours.',
          availableSlots: [] 
        });
      }
    } else if (purpose === 'Rental') {
      // For rentals, only allow booking during Rental hours
      availableSlots = dayAvailability.filter(slot => slot.type === 'Rental');
      
      if (availableSlots.length === 0) {
        return res.status(400).json({ 
          msg: 'No Rental hours available for this court.',
          availableSlots: [] 
        });
      }
    }
    
    console.log('Available slots after filtering by purpose:', availableSlots);
    
    // Check if booking time falls within any of the available time slots
    const isWithinAvailableHours = availableSlots.some(slot => {
      // Convert slot times to comparable format (minutes since midnight)
      const slotStart = slot.start.split(':').map(Number);
      const slotEnd = slot.end.split(':').map(Number);
      const slotStartMinutes = slotStart[0] * 60 + slotStart[1];
      const slotEndMinutes = slotEnd[0] * 60 + slotEnd[1];
      
      // Convert booking times to minutes since midnight
      const bookingStartMinutes = startHour * 60 + startMinute;
      const bookingEndMinutes = endHour * 60 + endMinute;
      
      console.log('Comparing times:', {
        slot: { start: slot.start, end: slot.end, type: slot.type },
        slotMinutes: { start: slotStartMinutes, end: slotEndMinutes },
        bookingMinutes: { start: bookingStartMinutes, end: bookingEndMinutes }
      });
      
      // Check if booking falls completely within the slot
      return bookingStartMinutes >= slotStartMinutes && bookingEndMinutes <= slotEndMinutes;
    });
    
    if (!isWithinAvailableHours) {
      console.log('Booking outside available hours');
      return res.status(400).json({ 
        msg: `Booking time is outside the court's available ${purpose === 'Training' || purpose === 'Match' ? 'Academy' : 'Rental'} hours for this day`,
        availableSlots: availableSlots 
      });
    }
    
    // Check if there's an overlap with existing bookings
    const overlappingBookings = await Booking.find({
      court,
      status: { $ne: 'Cancelled' },
      $or: [
        { 
          startTime: { $lt: endDate },
          endTime: { $gt: startDate }
        }
      ]
    });

    if (overlappingBookings.length > 0) {
      return res.status(400).json({ msg: 'Court is already booked during this time' });
    }

    // Calculate duration in hours
    const durationHours = (endDate - startDate) / (1000 * 60 * 60);
    
    // Calculate total price - free for Training and Match bookings
    let totalPrice = 0;
    if (purpose === 'Rental') {
      // Calculate price based on half-hour increments (hourly rate / 2 * number of half hours)
      const halfHourIncrements = Math.ceil(durationHours * 2); // Convert to half-hour increments
      totalPrice = (courtDoc.hourlyRate / 2) * halfHourIncrements;
    }

    // Create a new booking
    const newBooking = new Booking({
      court,
      user,
      startTime: startDate,
      endTime: endDate,
      purpose,
      team,
      notes,
      duration: durationHours,
      status: 'Confirmed',
      isRecurring,
      recurringDay: isRecurring ? effectiveDayName : null,
      paymentStatus: 'Unpaid',
      hourlyRate: courtDoc.hourlyRate,
      totalCost: totalPrice
    });

    const booking = await newBooking.save();
    
    // Populate the court details for the response
    await booking.populate('court', 'name location sportType hourlyRate');
    
    // Send booking confirmation notification with email
    try {
      // Get court name for the notification message
      const courtName = courtDoc ? courtDoc.name : 'the facility';
      
      await notificationService.sendBookingConfirmationNotification({
        userId: user,
        bookingId: booking._id.toString(),
        date: startDate.toLocaleDateString(),
        time: `${startDate.toLocaleTimeString()} - ${endDate.toLocaleTimeString()}`,
        facility: courtName,
        modelName: 'Booking'
      });
    } catch (notificationError) {
      console.error('Error sending booking confirmation notification:', notificationError);
      // Continue with booking process even if notification fails
    }
    
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

    // Get supervisor details if the user is a supervisor
    let supervisor = null;
    if (req.user.role === 'supervisor') {
      // Get the supervisor details
      supervisor = await User.findById(req.user.id);
      
      // Cafeteria supervisors shouldn't see bookings
      if (supervisor.supervisorType === 'cafeteria') {
        return res.status(403).json({ msg: 'Access denied: Cafeteria supervisors cannot view bookings' });
      }
      
      // Sports supervisors can only see bookings for their assigned sports
      if (supervisor.supervisorType === 'sports') {
        if (Array.isArray(supervisor.supervisorSportTypes) && supervisor.supervisorSportTypes.length > 0) {
          // We need to join with courts and teams to filter by sport type
          const sportTypes = supervisor.supervisorSportTypes;
          
          // First, find courts with the supervisor's sport types
          const courts = await Court.find({ sportType: { $in: sportTypes } });
          const courtIds = courts.map(court => court._id);
          
          // Then, find teams with the supervisor's sport types
          const teams = await Team.find({ sportType: { $in: sportTypes } });
          const teamIds = teams.map(team => team._id);
          
          // Build a query that includes either:
          // 1. Bookings for courts with the supervisor's sport types
          // 2. Bookings for teams with the supervisor's sport types
          query.$or = [
            { court: { $in: courtIds } },
            { team: { $in: teamIds } }
          ];
        } else {
          // If they don't have any assigned sport types, they shouldn't see any bookings
          return res.status(403).json({ msg: 'Access denied: No sport types assigned to your profile' });
        }
      }
      // General supervisors can see all bookings (no additional filtering needed)
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
    } else if (req.user.role === 'coach') {
      // For coaches, if no specific team is requested, get all teams they coach
      if (!req.query.team) {
        const coachTeams = await Team.find({ 'coaches.coach': req.user.id });
        if (coachTeams.length > 0) {
          const teamIds = coachTeams.map(team => team._id);
          query.team = { $in: teamIds };
        }
      } else {
        // If a specific team is requested, verify coach permission
        const team = await Team.findById(req.query.team);
        if (!team) {
          return res.status(404).json({ msg: 'Team not found' });
        }
        
        const isCoachOfTeam = team.coaches.some(c => c.coach.toString() === req.user.id);
        if (!isCoachOfTeam) {
          return res.status(403).json({ msg: 'Access denied: You are not a coach of this team' });
        }
      }
    } else if (req.user.role !== 'admin' && req.user.role !== 'supervisor' && !req.query.team) {
      // If not admin/supervisor/coach and no team filter, restrict access
      return res.status(403).json({ msg: 'Access denied' });
    }
    
    // Fetch regular bookings
    const regularBookings = await Booking.find(query)
      .populate('court', 'name location sportType hourlyRate')
      .populate('user', 'firstName lastName email')
      .populate('team', 'name sportType')
      .sort({ startTime: 1 });
    
    // Update status to Completed for past bookings that aren't cancelled
    const currentTime = new Date();
    const bookingsToUpdate = [];
    
    for (const booking of regularBookings) {
      if (new Date(booking.endTime) < currentTime && 
          booking.status !== 'Cancelled' && 
          booking.status !== 'Completed') {
        booking.status = 'Completed';
        bookingsToUpdate.push(booking.save());
      }
    }
    
    // Process updates in parallel if any bookings need updating
    if (bookingsToUpdate.length > 0) {
      await Promise.all(bookingsToUpdate);
    }
    
    // Determine if the user should see guest bookings
    const canSeeGuestBookings = 
      req.user.role === 'admin' || 
      (req.user.role === 'supervisor' && 
       supervisor && 
       (supervisor.supervisorType === 'general' || supervisor.supervisorType === 'booking'));
    
    // Prepare empty array for guest bookings
    let formattedGuestBookings = [];
    
    // Only fetch guest bookings if the user has permission
    if (canSeeGuestBookings) {
      // Fetch guest bookings
      const GuestBooking = require('../models/GuestBooking');
      const guestBookings = await GuestBooking.find({})
        .populate('court', 'name location sportType hourlyRate')
        .sort({ startTime: 1 });
      
      // Update guest bookings status to Completed if time has passed
      const guestBookingsToUpdate = [];
      
      for (const booking of guestBookings) {
        if (new Date(booking.endTime) < currentTime && 
            booking.status !== 'Cancelled' && 
            booking.status !== 'Completed') {
          booking.status = 'Completed';
          guestBookingsToUpdate.push(booking.save());
        }
      }
      
      // Process updates in parallel if any guest bookings need updating
      if (guestBookingsToUpdate.length > 0) {
        await Promise.all(guestBookingsToUpdate);
      }
      
      // Transform guest bookings to match regular booking format
      formattedGuestBookings = guestBookings.map(booking => {
        return {
          _id: booking._id,
          court: booking.court,
          user: {
            _id: 'guest',
            firstName: booking.guestName,
            lastName: '',
            email: booking.guestEmail
          },
          startTime: booking.startTime,
          endTime: booking.endTime,
          purpose: 'Rental',
          status: booking.status,
          totalPrice: booking.totalPrice,
          paymentStatus: booking.paymentStatus,
          notes: booking.notes,
          createdAt: booking.createdAt,
          updatedAt: booking.updatedAt,
          isGuestBooking: true,
          bookingReference: booking.bookingReference,
          guestPhone: booking.guestPhone
        };
      });
    }
    
    // Combine and sort all bookings by start time
    const allBookings = [...regularBookings, ...formattedGuestBookings]
      .sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
    
    res.json(allBookings);
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
    let query = { user: req.user.id };
    
    // For coaches, also include bookings for teams they coach
    if (req.user.role === 'coach') {
      const coachTeams = await Team.find({ 'coaches.coach': req.user.id });
      if (coachTeams.length > 0) {
        const teamIds = coachTeams.map(team => team._id);
        // Use $or to include both personal bookings and team bookings
        query = {
          $or: [
            { user: req.user.id },
            { team: { $in: teamIds } }
          ]
        };
      }
    }
    
    const bookings = await Booking.find(query)
      .populate('court', 'name location sportType hourlyRate')
      .populate('user', 'firstName lastName email')
      .populate('team', 'name sportType')
      .sort({ startTime: 1 });
    
    // Update status to Completed for past bookings that aren't cancelled
    const currentTime = new Date();
    const bookingsToUpdate = [];
    
    for (const booking of bookings) {
      if (new Date(booking.endTime) < currentTime && 
          booking.status !== 'Cancelled' && 
          booking.status !== 'Completed') {
        booking.status = 'Completed';
        bookingsToUpdate.push(booking.save());
      }
    }
    
    // Process updates in parallel if any bookings need updating
    if (bookingsToUpdate.length > 0) {
      await Promise.all(bookingsToUpdate);
    }
    
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
      .populate('team', 'name sportType');
    
    if (!booking) {
      return res.status(404).json({ msg: 'Booking not found' });
    }

    // Check if user is authorized to view this booking
    if (req.user.role === 'supervisor') {
      const supervisor = await User.findById(req.user.id);
      
      // Cafeteria supervisors can't view bookings
      if (supervisor.supervisorType === 'cafeteria') {
        return res.status(403).json({ msg: 'Access denied: Cafeteria supervisors cannot view bookings' });
      }
      
      // Sports supervisors can only view bookings for their assigned sports
      if (supervisor.supervisorType === 'sports') {
        if (Array.isArray(supervisor.supervisorSportTypes) && supervisor.supervisorSportTypes.length > 0) {
          // Check if the booking's court or team has a sport type matching the supervisor's assigned types
          const courtSportType = booking.court ? booking.court.sportType : null;
          const teamSportType = booking.team ? booking.team.sportType : null;
          
          // If neither court nor team sport type matches supervisor's assigned types
          if ((!courtSportType || !supervisor.supervisorSportTypes.includes(courtSportType)) && 
              (!teamSportType || !supervisor.supervisorSportTypes.includes(teamSportType))) {
            return res.status(403).json({ msg: 'Not authorized to view this booking' });
          }
        } else {
          return res.status(403).json({ msg: 'Access denied: No sport types assigned to your profile' });
        }
      }
      // General supervisors can view all bookings
    } else if (req.user.role === 'parent') {
      // Check if this booking is for one of the parent's children's teams
      const children = await User.find({ parentId: req.user.id });
      const childrenIds = children.map(child => child._id.toString());
      
      // If the booking has a team, check if any of the parent's children are in the team
      if (booking.team) {
        const team = await Team.findById(booking.team._id);
        if (team) {
          const isChildInTeam = team.players.some(p => 
            childrenIds.includes(p.player.toString())
          );
          
          if (isChildInTeam) {
            // Child is in this team, allow access
            return res.json(booking);
          }
        }
      }
      
      // If we get here, parent is not authorized
      return res.status(403).json({ msg: 'Not authorized to view this booking' });
    } else if (booking.user._id.toString() !== req.user.id && !['admin', 'accounting'].includes(req.user.role)) {
      return res.status(403).json({ msg: 'Not authorized to view this booking' });
    }

    // Update status to Completed if the booking time has passed and it's not cancelled or already completed
    const currentTime = new Date();
    if (new Date(booking.endTime) < currentTime && 
        booking.status !== 'Cancelled' && 
        booking.status !== 'Completed') {
      booking.status = 'Completed';
      await booking.save();
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

    const booking = await Booking.findById(req.params.id)
      .populate('court', 'sportType')
      .populate('team', 'sportType');
    
    if (!booking) {
      return res.status(404).json({ msg: 'Booking not found' });
    }

    // Check supervisor permissions
    if (req.user.role === 'supervisor') {
      const supervisor = await User.findById(req.user.id);
      
      // Cafeteria supervisors can't update bookings
      if (supervisor.supervisorType === 'cafeteria') {
        return res.status(403).json({ msg: 'Access denied: Cafeteria supervisors cannot update bookings' });
      }
      
      // Sports supervisors can only update bookings for their assigned sports
      if (supervisor.supervisorType === 'sports') {
        if (Array.isArray(supervisor.supervisorSportTypes) && supervisor.supervisorSportTypes.length > 0) {
          // Check if the booking's court or team has a sport type matching the supervisor's assigned types
          const courtSportType = booking.court ? booking.court.sportType : null;
          const teamSportType = booking.team ? booking.team.sportType : null;
          
          // If neither court nor team sport type matches supervisor's assigned types
          if ((!courtSportType || !supervisor.supervisorSportTypes.includes(courtSportType)) && 
              (!teamSportType || !supervisor.supervisorSportTypes.includes(teamSportType))) {
            return res.status(403).json({ msg: 'Not authorized to update this booking' });
          }
        } else {
          return res.status(403).json({ msg: 'Access denied: No sport types assigned to your profile' });
        }
      }
      // General supervisors can update all bookings
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
    const booking = await Booking.findById(req.params.id)
      .populate('court', 'sportType')
      .populate('team', 'sportType');
    
    if (!booking) {
      return res.status(404).json({ msg: 'Booking not found' });
    }

    // Check if user is authorized to cancel this booking
    if (booking.user.toString() === req.user.id) {
      // User can cancel their own booking
    } else if (req.user.role === 'supervisor') {
      const supervisor = await User.findById(req.user.id);
      
      // Cafeteria supervisors can't cancel bookings
      if (supervisor.supervisorType === 'cafeteria') {
        return res.status(403).json({ msg: 'Access denied: Cafeteria supervisors cannot cancel bookings' });
      }
      
      // Sports supervisors can only cancel bookings for their assigned sports
      if (supervisor.supervisorType === 'sports') {
        if (Array.isArray(supervisor.supervisorSportTypes) && supervisor.supervisorSportTypes.length > 0) {
          // Check if the booking's court or team has a sport type matching the supervisor's assigned types
          const courtSportType = booking.court ? booking.court.sportType : null;
          const teamSportType = booking.team ? booking.team.sportType : null;
          
          // If neither court nor team sport type matches supervisor's assigned types
          if ((!courtSportType || !supervisor.supervisorSportTypes.includes(courtSportType)) && 
              (!teamSportType || !supervisor.supervisorSportTypes.includes(teamSportType))) {
            return res.status(403).json({ msg: 'Not authorized to cancel this booking' });
          }
        } else {
          return res.status(403).json({ msg: 'Access denied: No sport types assigned to your profile' });
        }
      }
      // General supervisors can cancel all bookings
    } else if (req.user.role !== 'admin') {
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

// @desc    Update guest booking status (admin/supervisor only)
// @route   PUT /api/bookings/guest/:id/status
// @access  Private (Admin, Supervisor)
exports.updateGuestBookingStatus = async (req, res) => {
  const { status } = req.body;

  // Check if status is valid
  if (!['Pending', 'Confirmed', 'Cancelled', 'Completed'].includes(status)) {
    return res.status(400).json({ msg: 'Invalid status value' });
  }

  try {
    // Check if user is authorized (admin or supervisor)
    if (req.user.role !== 'admin' && req.user.role !== 'supervisor') {
      return res.status(403).json({ msg: 'Access denied: Not authorized to update booking status' });
    }

    // If supervisor, check supervisor type
    if (req.user.role === 'supervisor') {
      const supervisor = await User.findById(req.user.id);
      
      // Cafeteria supervisors can't manage bookings
      if (supervisor.supervisorType === 'cafeteria') {
        return res.status(403).json({ msg: 'Access denied: Cafeteria supervisors cannot manage bookings' });
      }
      
      // Sports supervisors need to check if they manage this sport type
      if (supervisor.supervisorType === 'sports') {
        const GuestBooking = require('../models/GuestBooking');
        const booking = await GuestBooking.findById(req.params.id).populate('court');
        
        if (!booking) {
          return res.status(404).json({ msg: 'Guest booking not found' });
        }
        
        if (!Array.isArray(supervisor.supervisorSportTypes) || 
            !supervisor.supervisorSportTypes.includes(booking.court.sportType)) {
          return res.status(403).json({ 
            msg: `Access denied: You are not authorized to manage ${booking.court.sportType} bookings` 
          });
        }
      }
    }

    // Update the booking status
    const GuestBooking = require('../models/GuestBooking');
    const booking = await GuestBooking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({ msg: 'Guest booking not found' });
    }
    
    // If cancelling a booking that was previously confirmed or pending
    if (status === 'Cancelled' && ['Confirmed', 'Pending'].includes(booking.status)) {
      if (booking.paymentStatus === 'Paid') {
        booking.paymentStatus = 'Refunded';
      }
    }
    
    // If confirming a booking that was previously pending and had unpaid status
    // This handles the case when cash payment is received at the court
    if (status === 'Confirmed' && booking.status === 'Pending' && booking.paymentStatus === 'Unpaid') {
      booking.paymentStatus = 'Paid';
    }
    
    booking.status = status;
    await booking.save();
    
    res.json({ msg: 'Guest booking status updated successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// @desc    Cancel guest booking (admin/supervisor only)
// @route   PUT /api/bookings/guest/:id/cancel
// @access  Private (Admin, Supervisor)
exports.cancelGuestBooking = async (req, res) => {
  try {
    // Check if user is authorized (admin or supervisor)
    if (req.user.role !== 'admin' && req.user.role !== 'supervisor') {
      return res.status(403).json({ msg: 'Access denied: Not authorized to cancel booking' });
    }

    // If supervisor, check supervisor type
    if (req.user.role === 'supervisor') {
      const supervisor = await User.findById(req.user.id);
      
      // Cafeteria supervisors can't manage bookings
      if (supervisor.supervisorType === 'cafeteria') {
        return res.status(403).json({ msg: 'Access denied: Cafeteria supervisors cannot manage bookings' });
      }
      
      // Sports supervisors need to check if they manage this sport type
      if (supervisor.supervisorType === 'sports') {
        const GuestBooking = require('../models/GuestBooking');
        const booking = await GuestBooking.findById(req.params.id).populate('court');
        
        if (!booking) {
          return res.status(404).json({ msg: 'Guest booking not found' });
        }
        
        if (!Array.isArray(supervisor.supervisorSportTypes) || 
            !supervisor.supervisorSportTypes.includes(booking.court.sportType)) {
          return res.status(403).json({ 
            msg: `Access denied: You are not authorized to manage ${booking.court.sportType} bookings` 
          });
        }
      }
    }

    const GuestBooking = require('../models/GuestBooking');
    const booking = await GuestBooking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({ msg: 'Guest booking not found' });
    }
    
    // Only allow cancelling confirmed or pending bookings
    if (!['Confirmed', 'Pending'].includes(booking.status)) {
      return res.status(400).json({ msg: 'This booking cannot be cancelled' });
    }
    
    booking.status = 'Cancelled';
    
    // If payment was made, set to refunded
    if (booking.paymentStatus === 'Paid') {
      booking.paymentStatus = 'Refunded';
    }
    
    await booking.save();
    
    res.json({ msg: 'Guest booking cancelled successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// @desc    Update booking payment status
// @route   PUT /api/bookings/:id/payment
// @access  Private (Admin, Supervisor, Accounting)
exports.updateBookingPaymentStatus = async (req, res) => {
  const { paymentStatus } = req.body;

  // Check if paymentStatus is valid
  if (!['Unpaid', 'Paid', 'Refunded'].includes(paymentStatus)) {
    return res.status(400).json({ msg: 'Invalid payment status value' });
  }

  try {
    // Only admin, supervisor and accounting can update payment status
    if (!['admin', 'supervisor', 'accounting'].includes(req.user.role)) {
      return res.status(403).json({ msg: 'Not authorized to update payment status' });
    }

    // Find the booking
    const booking = await Booking.findById(req.params.id)
      .populate('court', 'name location sportType hourlyRate')
      .populate('user', 'firstName lastName email');
    
    if (!booking) {
      return res.status(404).json({ msg: 'Booking not found' });
    }

    // Store previous payment status to detect changes
    const previousPaymentStatus = booking.paymentStatus;
    
    // Update payment status
    booking.paymentStatus = paymentStatus;
    
    // If marking as paid, also update status to Confirmed if it was pending
    if (paymentStatus === 'Paid' && booking.status === 'Pending') {
      booking.status = 'Confirmed';
    }
    
    await booking.save();
    
    // Create revenue transaction if payment status changed from 'Unpaid' to 'Paid'
    // and this is a rental booking (not training or other free booking)
    if (previousPaymentStatus === 'Unpaid' && paymentStatus === 'Paid' && booking.purpose === 'Rental' && booking.totalPrice > 0) {
      // Import RevenueTransaction model
      const RevenueTransaction = require('../models/revenue/RevenueTransaction');
      
      // Create new revenue transaction
      const revenueTransaction = new RevenueTransaction({
        amount: booking.totalPrice,
        sourceType: 'Rental',
        sourceId: booking._id,
        sourceModel: 'Booking',
        description: `Court rental: ${booking.court ? booking.court.name : 'Unknown court'} - ${booking.user ? `${booking.user.firstName} ${booking.user.lastName}` : 'Unknown user'}`,
        date: new Date(), // Use current date as payment date
        createdBy: req.user.id, // Use the current user who marked it as paid
        notes: `${new Date(booking.startTime).toLocaleString()} to ${new Date(booking.endTime).toLocaleString()}`
      });
      
      await revenueTransaction.save();
      console.log(`Created revenue transaction for booking paid at court: ${booking._id}`);
    }
    
    res.json({ 
      msg: `Payment status updated to ${paymentStatus}`,
      booking
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
}; 