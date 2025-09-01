const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const singleSessionFeeController = require('../controllers/singleSessionFeeController');
const { auth } = require('../middleware/auth');
const roles = require('../middleware/roles');

// @route   GET /api/single-session-fees
// @desc    Get all single session fees
// @access  Admin, Accounting, Revenue Manager
router.get(
  '/',
  [auth, roles(['admin', 'accounting', 'revenue_manager'])],
  singleSessionFeeController.getSingleSessionFees
);

// @route   GET /api/single-session-fees/:sportType
// @desc    Get single session fee by sport type
// @access  Admin, Accounting, Revenue Manager
router.get(
  '/:sportType',
  [auth, roles(['admin', 'accounting', 'revenue_manager'])],
  singleSessionFeeController.getSingleSessionFeeBySport
);

// @route   POST /api/single-session-fees
// @desc    Create a single session fee
// @access  Admin
router.post(
  '/',
  [
    auth,
    roles(['admin']),
    check('sportType', 'Sport type is required').isIn(['Basketball', 'Football', 'Volleyball', 'Self Defense', 'Karate', 'Gymnastics', 'Gym', 'Zumba', 'Swimming', 'Ping Pong', 'Fitness', 'Crossfit']),
    check('amount', 'Amount is required and must be a positive number').isFloat({ min: 0 })
  ],
  singleSessionFeeController.createSingleSessionFee
);

// @route   PUT /api/single-session-fees/:sportType
// @desc    Update a single session fee
// @access  Admin
router.put(
  '/:sportType',
  [
    auth,
    roles(['admin']),
    check('amount', 'Amount must be a positive number if provided').optional().isFloat({ min: 0 })
  ],
  singleSessionFeeController.updateSingleSessionFee
);

// @route   DELETE /api/single-session-fees/:sportType
// @desc    Delete a single session fee
// @access  Admin
router.delete(
  '/:sportType',
  [auth, roles(['admin'])],
  singleSessionFeeController.deleteSingleSessionFee
);

module.exports = router; 