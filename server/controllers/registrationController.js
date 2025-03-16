const PlayerRegistration = require('../models/PlayerRegistration');
const RegistrationFee = require('../models/RegistrationFee');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { validationResult } = require('express-validator');
const mongoose = require('mongoose');

// @desc    Create a new player registration
// @route   POST /api/registrations
// @access  Accounting
exports.createRegistration = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const {
    player,
    sports,
    registrationPeriod,
    startDate,
    fee,
    notes
  } = req.body;

  try {
    // Calculate end date based on registration period
    const endDate = new Date(startDate);
    switch (registrationPeriod) {
      case '1 Month':
        endDate.setMonth(endDate.getMonth() + 1);
        break;
      case '3 Months':
        endDate.setMonth(endDate.getMonth() + 3);
        break;
      case '6 Months':
        endDate.setMonth(endDate.getMonth() + 6);
        break;
      case '1 Year':
        endDate.setFullYear(endDate.getFullYear() + 1);
        break;
      default:
        endDate.setMonth(endDate.getMonth() + 1);
    }

    // Check if the player email already exists in the User model
    const existingUser = await User.findOne({ email: player.email });
    if (existingUser) {
      return res.status(400).json({ msg: 'A user with this email already exists' });
    }

    // Create new registration
    const registration = new PlayerRegistration({
      player,
      sports,
      registrationPeriod,
      startDate: new Date(startDate),
      endDate,
      fee,
      registeredBy: req.user.id,
      notes
    });

    await registration.save();

    // Create notifications for all admin users
    const admins = await User.find({ role: 'admin' });
    
    const notificationPromises = admins.map(admin => {
      const notification = new Notification({
        recipient: admin._id,
        sender: req.user.id,
        type: 'new_registration',
        title: 'New Player Registration',
        message: `${player.firstName} ${player.lastName} has been registered for ${sports.join(', ')} by the accounting department.`,
        relatedTo: {
          model: 'PlayerRegistration',
          id: registration._id
        }
      });
      
      return notification.save();
    });
    
    await Promise.all(notificationPromises);

    res.status(201).json(registration);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error' });
  }
};

// @desc    Get all registrations
// @route   GET /api/registrations
// @access  Admin, Accounting
exports.getRegistrations = async (req, res) => {
  try {
    const { status, sport } = req.query;
    let query = {};
    
    // Filter by status if provided
    if (status) {
      query.status = status;
    }
    
    // Filter by sport if provided
    if (sport) {
      query.sports = sport;
    }
    
    const registrations = await PlayerRegistration.find(query)
      .sort({ createdAt: -1 })
      .populate('registeredBy', 'firstName lastName email')
      .populate('adminApproval.approvedBy', 'firstName lastName email');
    
    res.json(registrations);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error' });
  }
};

// @desc    Get registration by ID
// @route   GET /api/registrations/:id
// @access  Admin, Accounting
exports.getRegistrationById = async (req, res) => {
  try {
    const registration = await PlayerRegistration.findById(req.params.id)
      .populate('registeredBy', 'firstName lastName email')
      .populate('adminApproval.approvedBy', 'firstName lastName email')
      .populate('userId', 'firstName lastName email');
    
    if (!registration) {
      return res.status(404).json({ msg: 'Registration not found' });
    }
    
    res.json(registration);
  } catch (err) {
    console.error(err.message);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Registration not found' });
    }
    
    res.status(500).json({ msg: 'Server error' });
  }
};

// @desc    Approve/reject registration
// @route   PUT /api/registrations/:id/approve
// @access  Admin
exports.approveRegistration = async (req, res) => {
  const { approved, notes } = req.body;
  
  try {
    const registration = await PlayerRegistration.findById(req.params.id);
    
    if (!registration) {
      return res.status(404).json({ msg: 'Registration not found' });
    }
    
    registration.adminApproval = {
      approved,
      approvedBy: req.user.id,
      approvedAt: Date.now(),
      notes
    };
    
    registration.status = approved ? 'Approved' : 'Rejected';
    
    await registration.save();
    
    // If approved, notify the accounting user
    if (approved) {
      const notification = new Notification({
        recipient: registration.registeredBy,
        sender: req.user.id,
        type: 'system',
        title: 'Registration Approved',
        message: `The registration for ${registration.player.firstName} ${registration.player.lastName} has been approved.`,
        relatedTo: {
          model: 'PlayerRegistration',
          id: registration._id
        }
      });
      
      await notification.save();
    }
    
    res.json(registration);
  } catch (err) {
    console.error(err.message);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Registration not found' });
    }
    
    res.status(500).json({ msg: 'Server error' });
  }
};

// @desc    Create a user account from registration
// @route   POST /api/registrations/:id/create-account
// @access  Admin
exports.createUserAccount = async (req, res) => {
  const { password } = req.body;
  
  try {
    const registration = await PlayerRegistration.findById(req.params.id);
    
    if (!registration) {
      return res.status(404).json({ msg: 'Registration not found' });
    }
    
    if (registration.status !== 'Approved') {
      return res.status(400).json({ msg: 'Registration must be approved before creating account' });
    }
    
    if (registration.accountCreated) {
      return res.status(400).json({ msg: 'Account already created for this registration' });
    }
    
    // Create user account
    const user = new User({
      firstName: registration.player.firstName,
      lastName: registration.player.lastName,
      email: registration.player.email,
      password: password || Math.random().toString(36).slice(-8), // Generate random password if not provided
      role: 'player',
      phoneNumber: registration.player.phoneNumber,
      address: registration.player.address
    });
    
    await user.save();
    
    // Update registration
    registration.accountCreated = true;
    registration.userId = user._id;
    registration.status = 'Completed';
    
    await registration.save();
    
    // Create notification for the user
    const notification = new Notification({
      recipient: registration.registeredBy,
      sender: req.user.id,
      type: 'system',
      title: 'User Account Created',
      message: `A user account has been created for ${user.firstName} ${user.lastName}.`,
      relatedTo: {
        model: 'User',
        id: user._id
      }
    });
    
    await notification.save();
    
    // Remove password from response
    const userResponse = { ...user.toObject() };
    delete userResponse.password;
    
    res.json({
      registration,
      user: userResponse
    });
  } catch (err) {
    console.error(err.message);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Registration not found' });
    }
    
    res.status(500).json({ msg: 'Server error' });
  }
};

// @desc    Create a new registration fee
// @route   POST /api/registration-fees
// @access  Admin
exports.createRegistrationFee = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { sportType, period, amount, currency } = req.body;

  try {
    // Check if fee already exists
    let fee = await RegistrationFee.findOne({ sportType, period });
    
    if (fee) {
      // Update existing fee
      fee.amount = amount;
      fee.currency = currency || fee.currency;
      fee.updatedBy = req.user.id;
      
      await fee.save();
      return res.json(fee);
    }
    
    // Create new fee
    fee = new RegistrationFee({
      sportType,
      period,
      amount,
      currency,
      createdBy: req.user.id
    });
    
    await fee.save();
    res.status(201).json(fee);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error' });
  }
};

// @desc    Get all registration fees
// @route   GET /api/registration-fees
// @access  Admin, Accounting
exports.getRegistrationFees = async (req, res) => {
  try {
    const { sportType } = req.query;
    let query = { isActive: true };
    
    // Filter by sport type if provided
    if (sportType) {
      query.sportType = sportType;
    }
    
    const fees = await RegistrationFee.find(query)
      .sort({ sportType: 1, period: 1 })
      .populate('createdBy', 'firstName lastName')
      .populate('updatedBy', 'firstName lastName');
    
    res.json(fees);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error' });
  }
};

// @desc    Update registration fee
// @route   PUT /api/registration-fees/:id
// @access  Admin
exports.updateRegistrationFee = async (req, res) => {
  const { amount, currency, isActive } = req.body;
  
  try {
    let fee = await RegistrationFee.findById(req.params.id);
    
    if (!fee) {
      return res.status(404).json({ msg: 'Registration fee not found' });
    }
    
    // Update fields
    if (amount !== undefined) fee.amount = amount;
    if (currency !== undefined) fee.currency = currency;
    if (isActive !== undefined) fee.isActive = isActive;
    
    fee.updatedBy = req.user.id;
    
    await fee.save();
    res.json(fee);
  } catch (err) {
    console.error(err.message);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Registration fee not found' });
    }
    
    res.status(500).json({ msg: 'Server error' });
  }
}; 