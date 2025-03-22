const express = require('express');
const router = express.Router();
const roleSalaryController = require('../controllers/roleSalaryController');
const { auth } = require('../middleware/auth');
const roles = require('../middleware/roles');
const { check } = require('express-validator');

// @route   GET /api/role-salaries
// @desc    Get all role salaries
// @access  Admin, Accounting
router.get(
  '/',
  [auth, roles(['admin', 'accounting'])],
  roleSalaryController.getRoleSalaries
);

// @route   GET /api/role-salaries/:role
// @desc    Get role salary by role
// @access  Admin, Accounting
router.get(
  '/:role',
  [auth, roles(['admin', 'accounting'])],
  roleSalaryController.getRoleSalaryByRole
);

// @route   POST /api/role-salaries
// @desc    Create or update role salary
// @access  Admin
router.post(
  '/',
  [
    auth,
    roles(['admin']),
    check('role', 'Role is required').notEmpty(),
    check('amount', 'Amount is required and must be a number').isNumeric()
  ],
  roleSalaryController.updateRoleSalary
);

// @route   DELETE /api/role-salaries/:role
// @desc    Delete role salary
// @access  Admin
router.delete(
  '/:role',
  [auth, roles(['admin'])],
  roleSalaryController.deleteRoleSalary
);

module.exports = router; 