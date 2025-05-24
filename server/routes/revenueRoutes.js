const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const revenueController = require('../controllers/revenueController');
const { auth } = require('../middleware/auth');
const roles = require('../middleware/roles');

// Revenue Manager Dashboard
// @route   GET /api/revenue/dashboard
// @desc    Get revenue dashboard data
// @access  Revenue Manager, Admin, Accounting
router.get(
  '/dashboard',
  [auth, roles(['revenue_manager', 'admin', 'accounting'])],
  revenueController.getDashboardData
);

// Revenue Transactions
// @route   GET /api/revenue/transactions
// @desc    Get revenue transactions with pagination and filters
// @access  Revenue Manager, Admin, Accounting
router.get(
  '/transactions',
  [auth, roles(['revenue_manager', 'admin', 'accounting'])],
  revenueController.getRevenueTransactions
);

// @route   POST /api/revenue/transactions
// @desc    Add custom revenue transaction
// @access  Revenue Manager, Admin, Accounting
router.post(
  '/transactions',
  [
    auth,
    roles(['revenue_manager', 'admin', 'accounting']),
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

// @route   GET /api/revenue/cleanup-expenses
// @desc    Clean up orphaned expense transactions
// @access  Admin
router.get('/cleanup-expenses', auth, roles(['Admin']), async (req, res) => {
  try {
    const ExpenseTransaction = require('../models/revenue/ExpenseTransaction');
    const UtilityBill = require('../models/UtilityBill');
    
    // Get all expense transactions for utility bills
    const transactions = await ExpenseTransaction.find({ expenseModel: 'UtilityBill' });
    console.log(`Found ${transactions.length} utility bill expense transactions`);
    
    let removedCount = 0;
    let deletedItems = [];
    
    for (const transaction of transactions) {
      // Skip transactions with no expenseId
      if (!transaction.expenseId) {
        continue;
      }
      
      // Check if the utility bill exists
      const utilityBillExists = await UtilityBill.exists({ _id: transaction.expenseId });
      
      // If utility bill doesn't exist, remove the transaction
      if (!utilityBillExists) {
        console.log(`Removing orphaned expense transaction ${transaction._id} for utility bill ${transaction.expenseId}`);
        await ExpenseTransaction.deleteOne({ _id: transaction._id });
        deletedItems.push({
          transactionId: transaction._id,
          description: transaction.description,
          amount: transaction.amount
        });
        removedCount++;
      }
    }
    
    return res.json({
      msg: `Cleanup completed. Removed ${removedCount} orphaned expense transactions.`,
      deletedItems
    });
  } catch (error) {
    console.error('Error cleaning orphaned expense transactions:', error);
    return res.status(500).json({ msg: 'Server error during cleanup' });
  }
});

module.exports = router; 