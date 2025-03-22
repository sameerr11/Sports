const RoleSalary = require('../models/RoleSalary');
const { validationResult } = require('express-validator');

// @desc    Get all role salaries
// @route   GET /api/role-salaries
// @access  Admin, Accounting
exports.getRoleSalaries = async (req, res) => {
  try {
    const roleSalaries = await RoleSalary.find().sort({ role: 1 });
    return res.json(roleSalaries);
  } catch (err) {
    console.error('Error fetching role salaries:', err.message);
    return res.status(500).json({ msg: 'Server error' });
  }
};

// @desc    Get role salary by role
// @route   GET /api/role-salaries/:role
// @access  Admin, Accounting
exports.getRoleSalaryByRole = async (req, res) => {
  try {
    const roleSalary = await RoleSalary.findOne({ role: req.params.role });
    
    if (!roleSalary) {
      return res.status(404).json({ msg: 'Role salary not found' });
    }
    
    return res.json(roleSalary);
  } catch (err) {
    console.error('Error fetching role salary:', err.message);
    return res.status(500).json({ msg: 'Server error' });
  }
};

// @desc    Create or update role salary
// @route   POST /api/role-salaries
// @access  Admin
exports.updateRoleSalary = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { role, amount, description } = req.body;

    // Find or create the role salary
    let roleSalary = await RoleSalary.findOne({ role });
    
    if (!roleSalary) {
      // Create new role salary
      roleSalary = new RoleSalary({
        role,
        amount,
        description,
        updatedBy: req.user.id,
        updatedAt: new Date()
      });
    } else {
      // Update existing role salary
      roleSalary.amount = amount;
      roleSalary.description = description || roleSalary.description;
      roleSalary.updatedBy = req.user.id;
      roleSalary.updatedAt = new Date();
    }

    await roleSalary.save();
    
    return res.json(roleSalary);
  } catch (err) {
    console.error('Error updating role salary:', err.message);
    return res.status(500).json({ msg: 'Server error' });
  }
};

// @desc    Delete role salary
// @route   DELETE /api/role-salaries/:role
// @access  Admin
exports.deleteRoleSalary = async (req, res) => {
  try {
    const roleSalary = await RoleSalary.findOne({ role: req.params.role });
    
    if (!roleSalary) {
      return res.status(404).json({ msg: 'Role salary not found' });
    }
    
    await roleSalary.deleteOne();
    
    return res.json({ msg: 'Role salary deleted' });
  } catch (err) {
    console.error('Error deleting role salary:', err.message);
    return res.status(500).json({ msg: 'Server error' });
  }
}; 