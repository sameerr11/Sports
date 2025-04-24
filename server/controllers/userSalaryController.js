const UserSalary = require('../models/UserSalary');
const User = require('../models/User');

// @desc    Get all user salaries with user details
// @route   GET /api/user-salaries
exports.getUserSalaries = async (req, res) => {
  try {
    const userSalaries = await UserSalary.find()
      .populate('userId', 'firstName lastName email role supervisorType')
      .sort({ 'userId.lastName': 1, 'userId.firstName': 1 });
    
    return res.json(userSalaries);
  } catch (err) {
    console.error('Error fetching user salaries:', err.message);
    return res.status(500).json({ msg: 'Server error' });
  }
};

// @desc    Get user salary by user ID
// @route   GET /api/user-salaries/:id
exports.getUserSalaryByUserId = async (req, res) => {
  try {
    const userSalary = await UserSalary.findOne({ userId: req.params.id })
      .populate('userId', 'firstName lastName email role supervisorType');
    
    if (!userSalary) {
      return res.status(404).json({ msg: 'User salary not found' });
    }
    
    return res.json(userSalary);
  } catch (err) {
    console.error('Error fetching user salary:', err.message);
    return res.status(500).json({ msg: 'Server error' });
  }
};

// @desc    Create or update user salary
// @route   POST /api/user-salaries
exports.updateUserSalary = async (req, res) => {
  try {
    const { userId, amount, description } = req.body;
    
    if (!userId || !amount) {
      return res.status(400).json({ msg: 'User ID and amount are required' });
    }
    
    // Get the user to store their role
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    
    // Get the role string that includes supervisor type if applicable
    let role = user.role;
    if (user.role === 'supervisor' && user.supervisorType) {
      role = `${user.role} (${user.supervisorType})`;
    }
    
    // Find or create the user salary
    let userSalary = await UserSalary.findOne({ userId });
    
    if (!userSalary) {
      // Create new user salary
      userSalary = new UserSalary({
        userId,
        amount,
        description,
        role,
        updatedBy: req.user.id,
        updatedAt: new Date()
      });
    } else {
      // Update existing user salary
      userSalary.amount = amount;
      userSalary.description = description || userSalary.description;
      userSalary.role = role;
      userSalary.updatedBy = req.user.id;
      userSalary.updatedAt = new Date();
    }
    
    await userSalary.save();
    
    return res.json(userSalary);
  } catch (err) {
    console.error('Error updating user salary:', err.message);
    return res.status(500).json({ msg: 'Server error' });
  }
};

// @desc    Delete user salary
// @route   DELETE /api/user-salaries/:id
exports.deleteUserSalary = async (req, res) => {
  try {
    const userSalary = await UserSalary.findOne({ userId: req.params.id });
    
    if (!userSalary) {
      return res.status(404).json({ msg: 'User salary not found' });
    }
    
    await userSalary.deleteOne();
    
    return res.json({ msg: 'User salary deleted' });
  } catch (err) {
    console.error('Error deleting user salary:', err.message);
    return res.status(500).json({ msg: 'Server error' });
  }
}; 