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

  const { court, startTime, endTime, purpose, team, notes } = req.body;

  try {
    const user = req.user.id;
    
    // Verify that the court exists
    const courtDoc = await Court.findById(court);
    
    if (!courtDoc) {
      return res.status(404).json({ msg: 'Court not found' });
    }
    
    // Parse dates
    const startDate = new Date(startTime);
    const endDate = new Date(endTime);
    
    // Verify end time is after start time
    if (endDate <= startDate) {
      return res.status(400).json({ msg: 'End time must be after start time' });
    }
    
    // Get day of week (0 = Sunday, 1 = Monday, etc.)
    const dayOfWeek = startDate.getDay();
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = days[dayOfWeek];
    
    // Get court availability for this day
    const dayAvailability = courtDoc.availability[dayName] || [];
    
    if (dayAvailability.length === 0) {
      return res.status(400).json({ msg: `Court is not available on ${dayName}` });
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
      
      // Check if booking falls completely within the slot
      return bookingStartMinutes >= slotStartMinutes && bookingEndMinutes <= slotEndMinutes;
    });
    
    if (!isWithinAvailableHours) {
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
      totalPrice = durationHours * courtDoc.hourlyRate;
    }

    // Create new booking
    const newBooking = new Booking({
      court,
      user: req.user.id,
      team,
      startTime: startDate,
      endTime: endDate,
      purpose,
      totalPrice,
      notes,
      isRecurring: false,
      recurringDay: null
    });

    // If user is a guest, set status to pending
    // If user is admin, supervisor, or coach, set status to confirmed
    if (['admin', 'supervisor', 'coach'].includes(req.user.role)) {
      newBooking.status = 'Confirmed';
    }

    const booking = await newBooking.save();
    
    // Return the newly created booking with populated fields
    const populatedBooking = await Booking.findById(booking._id)
      .populate('court', 'name location sportType hourlyRate')
      .populate('user', 'firstName lastName email')
      .populate('team', 'name sportType');
      
    res.status(201).json(populatedBooking);
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