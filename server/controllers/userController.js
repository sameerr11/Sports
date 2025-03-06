const User = require('../models/User');
const Notification = require('../models/Notification');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');

// @desc    Register a new user
// @route   POST /api/users
// @access  Admin
exports.registerUser = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { firstName, lastName, email, password, role, phoneNumber, address } = req.body;

  try {
    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ msg: 'User already exists' });
    }

    // Create new user
    user = new User({
      firstName,
      lastName,
      email,
      password,
      role,
      phoneNumber,
      address
    });

    await user.save();

    // Create notification for supervisors if new player registration
    if (role === 'player') {
      const supervisors = await User.find({ role: 'supervisor' });
      
      for (const supervisor of supervisors) {
        const notification = new Notification({
          recipient: supervisor._id,
          type: 'new_registration',
          title: 'New Player Registration',
          message: `${firstName} ${lastName} has registered as a new player.`,
          relatedTo: {
            model: 'User',
            id: user._id
          }
        });
        
        await notification.save();
      }
    }

    // Return user without password
    const userResponse = { ...user.toObject() };
    delete userResponse.password;

    res.status(201).json(userResponse);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error' });
  }
};

// @desc    Get all users
// @route   GET /api/users
// @access  Admin
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error' });
  }
};

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Admin
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    
    res.json(user);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'User not found' });
    }
    res.status(500).json({ msg: 'Server error' });
  }
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Admin
exports.updateUser = async (req, res) => {
  const { firstName, lastName, email, role, phoneNumber, address, isActive } = req.body;

  // Build user object
  const userFields = {};
  if (firstName) userFields.firstName = firstName;
  if (lastName) userFields.lastName = lastName;
  if (email) userFields.email = email;
  if (role) userFields.role = role;
  if (phoneNumber) userFields.phoneNumber = phoneNumber;
  if (address) userFields.address = address;
  if (isActive !== undefined) userFields.isActive = isActive;
  userFields.updatedAt = Date.now();

  try {
    let user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // Check if role is being changed
    const roleChanged = role && user.role !== role;
    
    // Update user
    user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: userFields },
      { new: true }
    ).select('-password');

    // Create notification for role change
    if (roleChanged) {
      const notification = new Notification({
        recipient: user._id,
        type: 'role_change',
        title: 'Role Updated',
        message: `Your role has been updated to ${role}.`,
        relatedTo: {
          model: 'User',
          id: user._id
        }
      });
      
      await notification.save();
    }

    res.json(user);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'User not found' });
    }
    res.status(500).json({ msg: 'Server error' });
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Admin
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    
    await User.findByIdAndRemove(req.params.id);
    
    res.json({ msg: 'User removed' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'User not found' });
    }
    res.status(500).json({ msg: 'Server error' });
  }
};

// @desc    Change user password
// @route   PUT /api/users/:id/password
// @access  Admin
exports.changePassword = async (req, res) => {
  const { password } = req.body;

  try {
    let user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Update password
    user = await User.findByIdAndUpdate(
      req.params.id,
      { 
        $set: { 
          password: hashedPassword,
          updatedAt: Date.now()
        } 
      },
      { new: true }
    ).select('-password');
    
    res.json(user);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'User not found' });
    }
    res.status(500).json({ msg: 'Server error' });
  }
}; 