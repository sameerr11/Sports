const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const utilityController = require('../controllers/utilityController');
const { auth } = require('../middleware/auth');
const roles = require('../middleware/roles');

// @route   POST /api/utilities
// @desc    Create a new utility bill
// @access  Admin, Accounting
router.post(
  '/',
  [
    auth,
    roles(['admin', 'accounting']),
    check('billNumber', 'Bill number is required').notEmpty(),
    check('billType', 'Bill type is required').notEmpty(),
    check('amount', 'Amount is required').isNumeric(),
    check('vendor', 'Vendor is required').notEmpty(),
    check('dueDate', 'Due date is required').notEmpty()
  ],
  utilityController.createUtilityBill
);

// @route   GET /api/utilities
// @desc    Get all utility bills
// @access  Admin, Accounting
router.get(
  '/',
  [auth, roles(['admin', 'accounting'])],
  utilityController.getUtilityBills
);

// @route   GET /api/utilities/bill-types
// @desc    Get all bill types (default + custom)
// @access  Admin, Accounting
router.get(
  '/bill-types',
  [auth, roles(['admin', 'accounting'])],
  utilityController.getBillTypes
);

// @route   GET /api/utilities/:id
// @desc    Get utility bill by ID
// @access  Admin, Accounting
router.get(
  '/:id',
  [auth, roles(['admin', 'accounting'])],
  utilityController.getUtilityBillById
);

// @route   PUT /api/utilities/:id
// @desc    Update utility bill payment status
// @access  Admin, Accounting
router.put(
  '/:id',
  [
    auth,
    roles(['admin', 'accounting']),
    check('paymentStatus', 'Payment status is required').optional()
  ],
  utilityController.updateUtilityBill
);

// @route   DELETE /api/utilities/:id
// @desc    Delete a utility bill
// @access  Admin
router.delete(
  '/:id',
  [auth, roles(['admin'])],
  utilityController.deleteUtilityBill
);

module.exports = router; 