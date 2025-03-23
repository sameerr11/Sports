const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const revenueController = require('../controllers/revenueController');
const { auth } = require('../middleware/auth');
const roles = require('../middleware/roles');

// Revenue Manager Dashboard
// @route   GET /api/revenue/dashboard
// @desc    Get revenue dashboard data
// @access  Revenue Manager, Admin
router.get(
  '/dashboard',
  [auth, roles(['revenue_manager', 'admin'])],
  revenueController.getDashboardData
);

// Revenue Transactions
// @route   GET /api/revenue/transactions
// @desc    Get revenue transactions with pagination and filters
// @access  Revenue Manager, Admin
router.get(
  '/transactions',
  [auth, roles(['revenue_manager', 'admin'])],
  revenueController.getRevenueTransactions
);

// @route   POST /api/revenue/transactions
// @desc    Add custom revenue transaction
// @access  Revenue Manager, Admin
router.post(
  '/transactions',
  [
    auth,
    roles(['revenue_manager', 'admin']),
    check('amount', 'Amount is required and must be a positive number').isFloat({ min: 0 }),
    check('sourceType', 'Source type is required').isIn(['Registration', 'Cafeteria', 'Rental', 'Other']),
    check('description', 'Description is required').notEmpty()
  ],
  revenueController.addRevenueTransaction
);

// Expense Transactions
// @route   GET /api/revenue/expenses
// @desc    Get expense transactions with pagination and filters
// @access  Revenue Manager, Admin
router.get(
  '/expenses',
  [auth, roles(['revenue_manager', 'admin'])],
  revenueController.getExpenseTransactions
);

// @route   POST /api/revenue/expenses
// @desc    Add custom expense transaction
// @access  Revenue Manager, Admin
router.post(
  '/expenses',
  [
    auth,
    roles(['revenue_manager', 'admin']),
    check('amount', 'Amount is required and must be a positive number').isFloat({ min: 0 }),
    check('expenseType', 'Expense type is required').isIn(['Salary', 'Utility', 'Maintenance', 'Equipment', 'Other']),
    check('description', 'Description is required').notEmpty()
  ],
  revenueController.addExpenseTransaction
);

// @route   PUT /api/revenue/expenses/:id/status
// @desc    Update expense payment status
// @access  Revenue Manager, Admin
router.put(
  '/expenses/:id/status',
  [
    auth,
    roles(['revenue_manager', 'admin']),
    check('paymentStatus', 'Payment status is required').isIn(['Pending', 'Paid'])
  ],
  revenueController.updateExpenseStatus
);

module.exports = router; 