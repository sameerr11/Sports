const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const registrationController = require('../controllers/registrationController');
const { auth } = require('../middleware/auth');
const roles = require('../middleware/roles');

// Registration Fee routes - these need to come BEFORE /:id routes to avoid conflicts
// @route   GET /api/registrations/fees
// @desc    Get all registration fees
// @access  Admin, Accounting
router.get(
  '/fees',
  [auth, roles(['admin', 'accounting'])],
  registrationController.getRegistrationFees
);

// @route   POST /api/registrations/fees
// @desc    Create/update registration fee
// @access  Admin
router.post(
  '/fees',
  [
    auth,
    roles(['admin']),
    check('sportType', 'Sport type is required').notEmpty(),
    check('period', 'Period is required').notEmpty(),
    check('amount', 'Amount is required').isNumeric()
  ],
  registrationController.createRegistrationFee
);

// @route   PUT /api/registrations/fees/:id
// @desc    Update registration fee
// @access  Admin
router.put(
  '/fees/:id',
  [
    auth,
    roles(['admin'])
  ],
  registrationController.updateRegistrationFee
);

// @route   POST /api/registrations/salary
// @desc    Create a salary invoice
// @access  Admin, Accounting
router.post(
  '/salary',
  [
    auth,
    roles(['admin', 'accounting']),
    check('userId', 'User ID is required').notEmpty(),
    check('amount', 'Amount is required').isNumeric(),
    check('invoiceNumber', 'Invoice number is required').notEmpty()
  ],
  registrationController.createSalaryInvoice
);

// @route   GET /api/registrations/salary
// @desc    Get all salary invoices
// @access  Admin, Accounting
router.get(
  '/salary',
  [auth, roles(['admin', 'accounting'])],
  registrationController.getSalaryInvoices
);

// @route   PUT /api/registrations/salary/:id
// @desc    Update salary invoice payment status
// @access  Admin, Accounting
router.put(
  '/salary/:id',
  [
    auth,
    roles(['admin', 'accounting']),
    check('paymentStatus', 'Payment status is required').notEmpty()
  ],
  registrationController.updateSalaryInvoice
);

// Registration routes
// @route   POST /api/registrations
// @desc    Create a new registration
// @access  Accounting
router.post(
  '/',
  [
    auth,
    roles(['accounting']),
    check('player.firstName', 'First name is required').notEmpty(),
    check('player.lastName', 'Last name is required').notEmpty(),
    check('player.email', 'Valid email is required').isEmail(),
    check('player.phoneNumber', 'Phone number is required').notEmpty(),
    check('sports', 'At least one sport must be selected').isArray({ min: 1 }),
    check('registrationPeriod', 'Registration period is required').notEmpty(),
    check('startDate', 'Start date is required').notEmpty(),
    check('fee.amount', 'Fee amount is required').isNumeric(),
    check('fee.paymentMethod', 'Payment method is required').notEmpty()
  ],
  registrationController.createRegistration
);

// @route   GET /api/registrations
// @desc    Get all registrations
// @access  Admin, Accounting, Support
router.get(
  '/',
  [auth, roles(['admin', 'accounting', 'support'])],
  registrationController.getRegistrations
);

// @route   GET /api/registrations/:id
// @desc    Get registration by ID
// @access  Admin, Accounting, Support
router.get(
  '/:id',
  [auth, roles(['admin', 'accounting', 'support'])],
  registrationController.getRegistrationById
);

// @route   PUT /api/registrations/:id/approve
// @desc    Approve/reject registration
// @access  Admin, Support
router.put(
  '/:id/approve',
  [
    auth,
    roles(['admin', 'support']),
    check('approved', 'Approved status is required').isBoolean()
  ],
  registrationController.approveRegistration
);

// @route   POST /api/registrations/:id/create-account
// @desc    Create user account from registration
// @access  Admin, Support
router.post(
  '/:id/create-account',
  [
    auth,
    roles(['admin', 'support']),
    check('password', 'Password with 6 or more characters is required').optional().isLength({ min: 6 })
  ],
  registrationController.createUserAccount
);

module.exports = router; 