const express = require('express');
const router = express.Router();
const userSalaryController = require('../controllers/userSalaryController');
const { auth } = require('../middleware/auth');
const roles = require('../middleware/roles');
const { check } = require('express-validator');

// @route   GET /api/user-salaries
// @desc    Get all user salaries
// @access  Admin
router.get(
  '/',
  [auth, roles(['admin'])],
  userSalaryController.getUserSalaries
);

// @route   GET /api/user-salaries/:id
// @desc    Get user salary by user ID
// @access  Admin
router.get(
  '/:id',
  [auth, roles(['admin'])],
  userSalaryController.getUserSalaryByUserId
);

// @route   POST /api/user-salaries
// @desc    Create or update user salary
// @access  Admin
router.post(
  '/',
  [
    auth,
    roles(['admin']),
    check('userId', 'User ID is required').notEmpty(),
    check('amount', 'Amount is required and must be a number').isNumeric()
  ],
  userSalaryController.updateUserSalary
);

// @route   DELETE /api/user-salaries/:id
// @desc    Delete user salary
// @access  Admin
router.delete(
  '/:id',
  [auth, roles(['admin'])],
  userSalaryController.deleteUserSalary
);

module.exports = router; 