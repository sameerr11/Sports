const { validationResult } = require('express-validator');
const crypto = require('crypto');
const GuestBooking = require('../models/GuestBooking');
const Booking = require('../models/Booking');
const Court = require('../models/Court');
const User = require('../models/User');
const notificationService = require('../utils/notificationService');

// @desc    Create a new guest booking
// @route   POST /api/guest-bookings
// @access  Public
exports.createGuestBooking = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { court, startTime, endTime, guestName, guestEmail, guestPhone, notes, courtType } = req.body;

  try {
    // Verify that the court exists
    const courtDoc = await Court.findById(court);
    
    if (!courtDoc) {
      return res.status(404).json({ msg: 'Court not found' });
    }
    
    // Parse dates ensuring they are treated as local time
    // This prevents timezone differences from affecting scheduling
    let startDate, endDate;
    
    try {
      // Extract the date and time parts from the ISO strings
      const [startDatePart, startTimePart] = startTime.split('T');
      const [endDatePart, endTimePart] = endTime.split('T');
      
      // Parse the date parts
      const startDateComponents = startDatePart.split('-').map(Number);
      const endDateComponents = endDatePart.split('-').map(Number);
      
      // Parse the time parts
      const startTimeComponents = startTimePart.split(':').map(Number);
      const endTimeComponents = endTimePart.split(':').map(Number);
      
      // Create new Date objects with the components (treating them as local)
      startDate = new Date(
        startDateComponents[0], // year
        startDateComponents[1] - 1, // month (0-based)
        startDateComponents[2], // day
        startTimeComponents[0], // hour
        startTimeComponents[1], // minute
        startTimeComponents[2] || 0 // second (default to 0 if not provided)
      );
      
      endDate = new Date(
        endDateComponents[0], // year
        endDateComponents[1] - 1, // month (0-based)
        endDateComponents[2], // day
        endTimeComponents[0], // hour
        endTimeComponents[1], // minute
        endTimeComponents[2] || 0 // second (default to 0 if not provided)
      );
    } catch (dateParseError) {
      // Fallback to default parsing if the custom parsing fails
      console.log('Custom date parsing failed, using default parser:', dateParseError);
      startDate = new Date(startTime);
      endDate = new Date(endTime);
    }
    
    // Get current date (without time) in local time
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Get tomorrow's date in local time
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Compare dates using local representation to ignore timezone issues
    const startDateStr = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-${String(startDate.getDate()).padStart(2, '0')}`;
    const tomorrowStr = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;
    
    // Verify booking is for tomorrow or later
    if (startDateStr < tomorrowStr) {
      return res.status(400).json({ msg: 'Bookings must be made at least one day in advance' });
    }
    
    // Verify end time is after start time
    if (endDate <= startDate) {
      return res.status(400).json({ msg: 'End time must be after start time' });
    }
    
    // Get day of week (0 = Sunday, 1 = Monday, etc.) in local time
    const dayOfWeek = startDate.getDay();
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = days[dayOfWeek];
    
    // Get court availability for this day
    const dayAvailability = courtDoc.availability[dayName] || [];
    
    if (dayAvailability.length === 0) {
      return res.status(400).json({ msg: `Court is not available on ${dayName}` });
    }
    
    // Convert booking time to HH:MM format for comparison (using local time values)
    const startHour = startDate.getHours();
    const startMinute = startDate.getMinutes();
    const bookingStartTime = `${startHour.toString().padStart(2, '0')}:${startMinute.toString().padStart(2, '0')}`;
    
    const endHour = endDate.getHours();
    const endMinute = endDate.getMinutes();
    const bookingEndTime = `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;
    
    console.log('Booking time (local):', {
      startHour, startMinute, endHour, endMinute,
      bookingStartTime, bookingEndTime,
      dayName
    });
    
    // Filter available slots for rentals only
    let availableSlots = dayAvailability.filter(slot => slot.type === 'Rental');
    
    console.log('Available slots for this day:', availableSlots);
    
    if (availableSlots.length === 0) {
      return res.status(400).json({ 
        msg: 'No Rental hours available for this court.',
        availableSlots: [] 
      });
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
      
      console.log('Comparing times:', {
        slot: { start: slot.start, end: slot.end, type: slot.type },
        slotMinutes: { start: slotStartMinutes, end: slotEndMinutes },
        bookingMinutes: { start: bookingStartMinutes, end: bookingEndMinutes }
      });
      
      // Check if booking falls completely within the slot
      return bookingStartMinutes >= slotStartMinutes && bookingEndMinutes <= slotEndMinutes;
    });
    
    if (!isWithinAvailableHours) {
      return res.status(400).json({ 
        msg: `Booking time is outside the court's available Rental hours for this day`,
        availableSlots: availableSlots 
      });
    }
    
    // Check if half-court booking is allowed for this sport type
    if (courtType === 'Half Court' && courtDoc.sportType !== 'Basketball') {
      return res.status(400).json({ 
        msg: 'Half court booking is only available for basketball courts'
      });
    }
    
    // Check if there's an overlap with existing bookings
    const overlappingRegularBookings = await Booking.find({
      court,
      status: { $ne: 'Cancelled' },
      $or: [
        { 
          startTime: { $lt: endDate },
          endTime: { $gt: startDate }
        }
      ]
    });

    if (overlappingRegularBookings.length > 0) {
      return res.status(400).json({ msg: 'Court is already booked for a regular booking during this time' });
    }

    // Half-court booking logic
    if (courtType === 'Half Court') {
      // For half court bookings, check if there's already a full-court booking or two half-court bookings
      
      // 1. Check for overlapping full court bookings
      const overlappingFullCourtBookings = await GuestBooking.find({
        court,
        status: { $ne: 'Cancelled' },
        courtType: 'Full Court',
        startTime: { $lt: endDate },
        endTime: { $gt: startDate }
      });

      if (overlappingFullCourtBookings.length > 0) {
        return res.status(400).json({ msg: 'There is already a full-court booking during this time' });
      }

      // 2. Count existing half-court bookings
      const existingHalfCourtBookings = await GuestBooking.countDocuments({
        court,
        status: { $ne: 'Cancelled' },
        courtType: 'Half Court',
        startTime: { $lt: endDate },
        endTime: { $gt: startDate }
      });
      
      if (existingHalfCourtBookings >= 2) {
        return res.status(400).json({ msg: 'Both half-courts are already booked during this time' });
      }
      
      // If we reach here, the half-court booking is valid
    } else {
      // For full court bookings, check if there are any half-court bookings
      const existingHalfCourtBookings = await GuestBooking.countDocuments({
        court,
        status: { $ne: 'Cancelled' },
        courtType: 'Half Court',
        startTime: { $lt: endDate },
        endTime: { $gt: startDate }
      });
      
      if (existingHalfCourtBookings > 0) {
        return res.status(400).json({ msg: 'There are half-court bookings during this time. Full court is not available.' });
      }
      
      // Check for overlapping full court bookings
      const overlappingFullCourtBookings = await GuestBooking.find({
        court,
        status: { $ne: 'Cancelled' },
        courtType: 'Full Court',
        startTime: { $lt: endDate },
        endTime: { $gt: startDate }
      });

      if (overlappingFullCourtBookings.length > 0) {
        return res.status(400).json({ msg: 'Court is already booked during this time' });
      }
    }

    // Calculate duration in hours
    const durationHours = (endDate - startDate) / (1000 * 60 * 60);
    
    // Calculate total price - half price for half court
    const priceMultiplier = courtType === 'Half Court' ? 0.5 : 1;
    
    // Calculate price based on half-hour increments
    const halfHourIncrements = Math.ceil(durationHours * 2); // Convert to half-hour increments
    const totalPrice = (courtDoc.hourlyRate / 2) * halfHourIncrements * priceMultiplier;

    // Generate a unique booking reference
    const bookingReference = 'GB-' + crypto.randomBytes(4).toString('hex').toUpperCase();

    // Create new guest booking
    const newBooking = new GuestBooking({
      court,
      courtType: courtType || 'Full Court',
      guestName,
      guestEmail,
      guestPhone,
      startTime: startDate,
      endTime: endDate,
      totalPrice,
      notes,
      bookingReference
    });

    const booking = await newBooking.save();
    
    // Send notification to admins about new guest booking
    try {
      const adminUsers = await User.find({ role: 'admin' });
      for (const admin of adminUsers) {
        await notificationService.createNotification({
          recipientId: admin._id,
          type: 'system',
          title: 'New Guest Booking',
          message: `New guest booking created by ${guestName} (${guestEmail}) for ${courtDoc.name} on ${startDate.toLocaleDateString()} at ${startDate.toLocaleTimeString()}`,
          relatedTo: {
            model: 'GuestBooking',
            id: booking._id
          },
          sendEmail: true
        });
      }
    } catch (notificationError) {
      console.error('Error sending admin notification:', notificationError);
      // Continue with booking process even if notification fails
    }
    
    // Return the newly created booking with populated court
    const populatedBooking = await GuestBooking.findById(booking._id)
      .populate('court', 'name location sportType hourlyRate');
      
    res.status(201).json({
      booking: populatedBooking,
      message: 'Your booking has been created. Please complete payment to confirm.'
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// @desc    Get a guest booking by reference
// @route   GET /api/guest-bookings/:reference
// @access  Public
exports.getGuestBookingByReference = async (req, res) => {
  try {
    const booking = await GuestBooking.findOne({ bookingReference: req.params.reference })
      .populate('court', 'name location sportType hourlyRate');

    if (!booking) {
      return res.status(404).json({ msg: 'Booking not found' });
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

// @desc    Update guest booking payment
// @route   PUT /api/guest-bookings/:id/payment
// @access  Public
exports.updateGuestBookingPayment = async (req, res) => {
  const { paymentMethod, paymentId, payLater, paymentStatus } = req.body;

  try {
    let booking = await GuestBooking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ msg: 'Booking not found' });
    }

    // Only allow updating payment for pending bookings
    if (booking.status !== 'Pending') {
      return res.status(400).json({ msg: 'Cannot update payment for bookings that are not pending' });
    }

    // Track previous payment status to detect changes
    const previousPaymentStatus = booking.paymentStatus;

    // Update payment info
    booking.paymentMethod = paymentMethod;
    booking.paymentId = paymentId || '';
    
    // Set payment status explicitly if provided
    if (paymentStatus) {
      booking.paymentStatus = paymentStatus;
    } else if (payLater) {
      // Handle pay later option as a fallback
      booking.paymentStatus = 'Unpaid';
      booking.status = 'Pending'; // Keep as pending until payment is received
    } else {
      // Default for online payments
      booking.paymentStatus = 'Paid';
      booking.status = 'Confirmed';
    }
    
    // Send booking confirmation email for all payment options
    try {
      await notificationService.sendBookingConfirmationNotification({
        userId: booking._id, // Using booking ID as a temporary user ID
        bookingId: booking._id.toString(),
        date: booking.startTime.toLocaleDateString(),
        time: `${booking.startTime.toLocaleTimeString()} - ${booking.endTime.toLocaleTimeString()}`,
        facility: booking.court ? booking.court.name : 'the facility',
        modelName: 'GuestBooking',
        guestEmail: booking.guestEmail,
        guestName: booking.guestName,
        paymentStatus: booking.paymentStatus,
        paymentMethod: booking.paymentMethod
      });
    } catch (notificationError) {
      console.error('Error sending booking confirmation notification:', notificationError);
      // Continue with booking process even if notification fails
    }
    
    // Set booking status based on payment status
    if (booking.paymentStatus === 'Paid') {
      booking.status = 'Confirmed';
    }
    
    await booking.save();
    
    // Create revenue transaction if payment status changed from 'Unpaid' to 'Paid'
    if (previousPaymentStatus === 'Unpaid' && booking.paymentStatus === 'Paid') {
      // Import RevenueTransaction model
      const RevenueTransaction = require('../models/revenue/RevenueTransaction');
      
      // Find default admin user for creating the transaction
      const admin = await User.findOne({ role: 'admin' });
      
      if (admin) {
        // Create new revenue transaction
        const revenueTransaction = new RevenueTransaction({
          amount: booking.totalPrice,
          sourceType: 'Rental',
          sourceId: booking._id,
          sourceModel: 'GuestBooking',
          description: `Guest court rental: ${booking.court ? booking.court.name : 'Unknown court'} - ${booking.guestName}`,
          date: new Date(), // Use current date as payment date
          createdBy: admin._id,
          notes: `Reference: ${booking.bookingReference}, ${new Date(booking.startTime).toLocaleString()} to ${new Date(booking.endTime).toLocaleString()}`
        });
        
        await revenueTransaction.save();
        console.log(`Created revenue transaction for guest booking paid at court: ${booking._id}`);
      }
    }
    
    // Return the updated booking with populated court
    const updatedBooking = await GuestBooking.findById(booking._id)
      .populate('court', 'name location sportType hourlyRate');
    
    const message = booking.paymentStatus === 'Unpaid'
      ? 'Booking confirmed. Please pay at the court before your scheduled time.'
      : 'Payment completed. Your booking is now confirmed.';
    
    res.json({
      booking: updatedBooking,
      message
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// @desc    Cancel a guest booking
// @route   PUT /api/guest-bookings/:id/cancel
// @access  Public (with email verification)
exports.cancelGuestBooking = async (req, res) => {
  const { email } = req.body;

  try {
    let booking = await GuestBooking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ msg: 'Booking not found' });
    }

    // Verify the email matches the booking
    if (booking.guestEmail !== email) {
      return res.status(403).json({ msg: 'Email verification failed' });
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
    
    res.json({ msg: 'Booking cancelled successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// @desc    Get available time slots for a court on a date
// @route   GET /api/guest-bookings/availability/:courtId/:date
// @access  Public
exports.getCourtAvailability = async (req, res) => {
  try {
    const { courtId, date } = req.params;

    // Verify that the court exists
    const court = await Court.findById(courtId);
    
    if (!court) {
      return res.status(404).json({ msg: 'Court not found' });
    }
    
    // Parse the date in local time without timezone conversion
    // This way 8am-6pm will always mean 8am-6pm in the user's local time
    const dateParts = date.split('-').map(Number);
    const checkDate = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]); // Year, Month (0-based), Day
    
    if (isNaN(checkDate.getTime())) {
      return res.status(400).json({ msg: 'Invalid date format' });
    }
    
    // Get current date (without time)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Get tomorrow's date
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Compare dates using local representation to ignore timezone issues
    const checkDateStr = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, '0')}-${String(checkDate.getDate()).padStart(2, '0')}`;
    const tomorrowStr = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;
    
    // Verify date is tomorrow or later
    if (checkDateStr < tomorrowStr) {
      return res.status(400).json({ msg: 'Availability can only be checked for dates starting from tomorrow' });
    }
    
    // Beginning and end of the requested date in local time
    const startOfDay = new Date(checkDate);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(checkDate);
    endOfDay.setHours(23, 59, 59, 999);
    
    // Get day of week using local time
    const dayOfWeek = checkDate.getDay(); // 0 = Sunday, 1 = Monday, ...
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = days[dayOfWeek];
    
    // Get the court's availability for the day
    const dayAvailability = court.availability[dayName] || [];
    
    if (dayAvailability.length === 0) {
      return res.status(400).json({ msg: `Court is not available on ${dayName}` });
    }
    
    // Filter available slots for rentals only
    const rentalSlots = dayAvailability.filter(slot => slot.type === 'Rental');
    
    if (rentalSlots.length === 0) {
      return res.status(400).json({ msg: 'No Rental hours available for this court on the selected day' });
    }
    
    // Get regular bookings for the day
    const regularBookings = await Booking.find({
      court: courtId,
      status: { $ne: 'Cancelled' },
      startTime: { $lt: endOfDay },
      endTime: { $gt: startOfDay }
    });

    // Get guest bookings for the day with court type info
    const guestBookings = await GuestBooking.find({
      court: courtId,
      status: { $ne: 'Cancelled' },
      startTime: { $lt: endOfDay },
      endTime: { $gt: startOfDay }
    }).select('startTime endTime courtType');
    
    // Process bookings with court type info
    const processedBookings = guestBookings.map(booking => ({
      startTime: booking.startTime,
      endTime: booking.endTime,
      courtType: booking.courtType || 'Full Court' // Default to Full Court if not specified
    }));

    // Add regular bookings (always full court)
    const allBookings = [
      ...regularBookings.map(booking => ({
        startTime: booking.startTime,
        endTime: booking.endTime,
        courtType: 'Full Court'
      })), 
      ...processedBookings
    ];
    
    // Transform rental slots into available time slots - ensuring time is treated as local
    const availableTimes = rentalSlots.map(slot => {
      const [startHour, startMinute] = slot.start.split(':').map(Number);
      const [endHour, endMinute] = slot.end.split(':').map(Number);
      
      const slotStart = new Date(checkDate);
      slotStart.setHours(startHour, startMinute, 0, 0);
      
      const slotEnd = new Date(checkDate);
      slotEnd.setHours(endHour, endMinute, 0, 0);
      
      return {
        start: slotStart,
        end: slotEnd,
        startString: slot.start,
        endString: slot.end,
        type: slot.type
      };
    });
    
    res.json({
      court: {
        id: court._id,
        name: court.name,
        location: court.location,
        sportType: court.sportType,
        hourlyRate: court.hourlyRate
      },
      date: checkDate,
      availableSlots: availableTimes,
      bookedSlots: allBookings,
      isBasketballCourt: court.sportType === 'Basketball'
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// @desc    Get all available courts for a date
// @route   GET /api/guest-bookings/available-courts/:date
// @access  Public
exports.getAvailableCourts = async (req, res) => {
  try {
    // Get all active courts
    const courts = await Court.find({ isActive: true });
    
    if (courts.length === 0) {
      return res.status(404).json({ msg: 'No courts available' });
    }
    
    const { date } = req.params;
    
    // Parse the date in local time without timezone conversion
    const dateParts = date.split('-').map(Number);
    const checkDate = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]); // Year, Month (0-based), Day
    
    if (isNaN(checkDate.getTime())) {
      return res.status(400).json({ msg: 'Invalid date format' });
    }
    
    // Get current date (without time)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Get tomorrow's date
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Compare dates using local representation to ignore timezone issues
    const checkDateStr = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, '0')}-${String(checkDate.getDate()).padStart(2, '0')}`;
    const tomorrowStr = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;
    
    // Verify date is tomorrow or later
    if (checkDateStr < tomorrowStr) {
      return res.status(400).json({ msg: 'Courts can only be checked for dates starting from tomorrow' });
    }
    
    // Get day of week in local time
    const dayOfWeek = checkDate.getDay();
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = days[dayOfWeek];
    
    // Filter courts with rental availability for this day
    const availableCourts = courts.filter(court => {
      const dayAvailability = court.availability[dayName] || [];
      return dayAvailability.some(slot => slot.type === 'Rental');
    });
    
    // Return simplified court info
    const courtList = availableCourts.map(court => ({
      id: court._id,
      name: court.name,
      location: court.location,
      sportType: court.sportType,
      hourlyRate: court.hourlyRate,
      image: court.image
    }));
    
    res.json({
      date: checkDate,
      courts: courtList
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
}; 