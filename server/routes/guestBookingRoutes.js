const express = require('express');
const { check } = require('express-validator');
const router = express.Router();
const guestBookingController = require('../controllers/guestBookingController');

// @desc    Create a new guest booking
// @route   POST /api/guest-bookings
// @access  Public
router.post(
  '/',
  [
    check('court', 'Court is required').notEmpty(),
    check('startTime', 'Start time is required').notEmpty(),
    check('endTime', 'End time is required').notEmpty(),
    check('guestName', 'Guest name is required').notEmpty(),
    check('guestEmail', 'Please include a valid email').isEmail(),
    check('guestPhone', 'Phone number is required').notEmpty()
  ],
  guestBookingController.createGuestBooking
);

// @desc    Get a guest booking by reference
// @route   GET /api/guest-bookings/reference/:reference
// @access  Public
router.get('/reference/:reference', guestBookingController.getGuestBookingByReference);

// @desc    Update guest booking payment
// @route   PUT /api/guest-bookings/:id/payment
// @access  Public
router.put(
  '/:id/payment',
  [
    check('paymentMethod', 'Payment method is required').isIn(['Cash', 'Card', 'Mobile'])
  ],
  guestBookingController.updateGuestBookingPayment
);

// @desc    Cancel a guest booking
// @route   PUT /api/guest-bookings/:id/cancel
// @access  Public (with email verification)
router.put(
  '/:id/cancel',
  [
    check('email', 'Email is required').isEmail()
  ],
  guestBookingController.cancelGuestBooking
);

// @desc    Get available time slots for a court on a date
// @route   GET /api/guest-bookings/availability/:courtId/:date
// @access  Public
router.get('/availability/:courtId/:date', guestBookingController.getCourtAvailability);

// @desc    Get all available courts for a date
// @route   GET /api/guest-bookings/available-courts/:date
// @access  Public
router.get('/available-courts/:date', guestBookingController.getAvailableCourts);

module.exports = router; 