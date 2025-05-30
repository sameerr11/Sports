const PlayerRegistration = require('../models/PlayerRegistration');
const RegistrationFee = require('../models/RegistrationFee');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { validationResult } = require('express-validator');
const mongoose = require('mongoose');
const SalaryInvoice = require('../models/SalaryInvoice');

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
    
    // Get general supervisors (they always receive notifications)
    const generalSupervisors = await User.find({ 
      role: 'supervisor',
      supervisorType: 'general'
    });
    
    const generalSupervisorNotificationPromises = generalSupervisors.map(supervisor => {
      const notification = new Notification({
        recipient: supervisor._id,
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
    
    // Get sports supervisors and filter by relevant sports
    const sportsSupervisors = await User.find({ 
      role: 'supervisor',
      supervisorType: 'sports'
    });
    
    const sportsSupervisorNotificationPromises = [];
    
    // Only notify sports supervisors for sports they manage
    for (const supervisor of sportsSupervisors) {
      // Skip supervisors with no assigned sports
      if (!supervisor.supervisorSportTypes || !supervisor.supervisorSportTypes.length) {
        continue;
      }
      
      // Check if there's an overlap between player sports and supervisor sports
      const relevantSports = sports.filter(sport => supervisor.supervisorSportTypes.includes(sport));
      
      if (relevantSports.length > 0) {
        const notification = new Notification({
          recipient: supervisor._id,
          sender: req.user.id,
          type: 'new_registration',
          title: 'New Player Registration',
          message: `${player.firstName} ${player.lastName} has been registered for ${relevantSports.join(', ')} by the accounting department.`,
          relatedTo: {
            model: 'PlayerRegistration',
            id: registration._id
          }
        });
        
        sportsSupervisorNotificationPromises.push(notification.save());
      }
    }
    
    // Also notify support users
    const supportUsers = await User.find({ role: 'support' });
    
    const supportNotificationPromises = supportUsers.map(supportUser => {
      const notification = new Notification({
        recipient: supportUser._id,
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
    
    await Promise.all([
      ...notificationPromises, 
      ...generalSupervisorNotificationPromises,
      ...sportsSupervisorNotificationPromises,
      ...supportNotificationPromises
    ]);

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
      // Create notification for the accounting user
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
      
      // Also notify other support users (excluding the one who approved, if it was a support user)
      const supportUsers = await User.find({ 
        role: 'support',
        _id: { $ne: req.user.id } // Exclude the user who approved the registration
      });
      
      const supportNotificationPromises = supportUsers.map(supportUser => {
        const notification = new Notification({
          recipient: supportUser._id,
          sender: req.user.id,
          type: 'system',
          title: 'Registration Approved',
          message: `The registration for ${registration.player.firstName} ${registration.player.lastName} has been approved by ${req.user.firstName} ${req.user.lastName}.`,
          relatedTo: {
            model: 'PlayerRegistration',
            id: registration._id
          }
        });
        
        return notification.save();
      });
      
      await Promise.all(supportNotificationPromises);

      // Send email notification to the player
      try {
        const { sendNotificationEmail } = require('../utils/emailService');
        
        // Format sports list for email
        const sportsList = registration.sports.join(', ');
        const startDate = new Date(registration.startDate).toLocaleDateString();
        const endDate = new Date(registration.endDate).toLocaleDateString();
        
        // Send email to player
        await sendNotificationEmail({
          email: registration.player.email,
          title: 'Your Sports Registration Has Been Approved',
          message: `Hello ${registration.player.firstName} ${registration.player.lastName},

We're pleased to inform you that your registration for ${sportsList} has been approved.

Registration Details:
- Sport(s): ${sportsList}
- Period: ${registration.registrationPeriod}
- Start Date: ${startDate}
- End Date: ${endDate}
- Fee: ${registration.fee.amount} ${registration.fee.currency || 'USD'}

Please log in to your account to view more details about your registration.

If you have any questions, please contact our support team.
`
        });
        
        console.log(`Registration approval email sent to ${registration.player.email}`);
      } catch (emailError) {
        console.error('Error sending registration approval email:', emailError);
        // Don't throw the error here, just log it - we don't want to fail the approval if email fails
      }
    } else if (registration.status === 'Rejected') {
      // Send rejection email notification
      try {
        const { sendNotificationEmail } = require('../utils/emailService');
        
        await sendNotificationEmail({
          email: registration.player.email,
          title: 'Update on Your Sports Registration',
          message: `Hello ${registration.player.firstName} ${registration.player.lastName},

We regret to inform you that your registration request could not be approved at this time.

${notes ? `Additional information: ${notes}` : ''}

If you have any questions, please contact our support team.
`
        });
        
        console.log(`Registration rejection email sent to ${registration.player.email}`);
      } catch (emailError) {
        console.error('Error sending registration rejection email:', emailError);
      }
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
    
    // Generate a random password if not provided
    const userPassword = password || Math.random().toString(36).slice(-8);
    
    // Create user account
    const user = new User({
      firstName: registration.player.firstName,
      lastName: registration.player.lastName,
      email: registration.player.email,
      password: userPassword, // Use the password or generated one
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
    
    // Notify support users (excluding the one who created the account, if it was a support user)
    const supportUsers = await User.find({ 
      role: 'support',
      _id: { $ne: req.user.id } // Exclude the user who created the account
    });
    
    const supportNotificationPromises = supportUsers.map(supportUser => {
      const notification = new Notification({
        recipient: supportUser._id,
        sender: req.user.id,
        type: 'system',
        title: 'User Account Created',
        message: `A user account has been created for ${user.firstName} ${user.lastName} by ${req.user.firstName} ${req.user.lastName}.`,
        relatedTo: {
          model: 'User',
          id: user._id
        }
      });
      
      return notification.save();
    });
    
    await Promise.all(supportNotificationPromises);
    
    // Send email to the player with their account details
    try {
      const { sendRegistrationEmail, sendNotificationEmail } = require('../utils/emailService');
      
      // Send registration email with account details
      await sendRegistrationEmail({
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        password: password ? 'the password you provided' : userPassword // Include the generated password in the email if it was auto-generated
      });
      
      console.log(`Account creation email sent to ${user.email}`);
      
      // Get all admin users and send them notification emails
      const adminUsers = await User.find({ role: 'admin' });
      
      // No need to await for all these promises since we don't want to block the response
      // if email sending to admins takes time
      for (const admin of adminUsers) {
        try {
          await sendNotificationEmail({
            email: admin.email,
            title: 'New Player Account Created',
            message: `Hello ${admin.firstName},

A new player account has been created following an approved registration:

Player: ${user.firstName} ${user.lastName}
Email: ${user.email}
Sports: ${registration.sports.join(', ')}
Registration Period: ${registration.registrationPeriod}
Start Date: ${new Date(registration.startDate).toLocaleDateString()}
End Date: ${new Date(registration.endDate).toLocaleDateString()}

The account was created by: ${req.user.firstName} ${req.user.lastName}
`
          });
          
          console.log(`Admin notification email sent to ${admin.email}`);
        } catch (adminEmailError) {
          console.error(`Failed to send admin notification email to ${admin.email}:`, adminEmailError);
          // Continue with other admins if one fails
        }
      }
    } catch (emailError) {
      console.error('Error sending account creation email:', emailError);
      // Don't throw the error here, just log it
    }
    
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

// @desc    Create a salary invoice
// @route   POST /api/registrations/salary
// @access  Admin, Accounting
exports.createSalaryInvoice = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { userId, amount, bonus, description, paymentMethod, paymentStatus, invoiceNumber } = req.body;

    // Check if the user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // Check if the invoice number is already used
    const existingInvoice = await SalaryInvoice.findOne({ invoiceNumber });
    if (existingInvoice) {
      return res.status(400).json({ msg: 'Invoice number already exists' });
    }

    // Create the salary invoice
    const salaryInvoice = new SalaryInvoice({
      userId,
      amount,
      bonus: bonus || 0,
      description,
      invoiceNumber,
      paymentMethod,
      paymentStatus,
      issuedBy: req.user.id,
      issuedDate: new Date(),
      paidDate: paymentStatus === 'Paid' ? new Date() : null
    });

    await salaryInvoice.save();

    // Return the created invoice
    return res.status(201).json(salaryInvoice);
  } catch (err) {
    console.error('Error creating salary invoice:', err.message);
    return res.status(500).json({ msg: 'Server error' });
  }
};

// @desc    Get all salary invoices
// @route   GET /api/registrations/salary
// @access  Admin, Accounting
exports.getSalaryInvoices = async (req, res) => {
  try {
    const salaryInvoices = await SalaryInvoice.find()
      .populate('userId', 'firstName lastName email role')
      .populate('issuedBy', 'firstName lastName')
      .sort({ issuedDate: -1 });
    
    return res.json(salaryInvoices);
  } catch (err) {
    console.error('Error fetching salary invoices:', err.message);
    return res.status(500).json({ msg: 'Server error' });
  }
};

// @desc    Update salary invoice payment status
// @route   PUT /api/registrations/salary/:id
// @access  Admin, Accounting
exports.updateSalaryInvoice = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { paymentStatus } = req.body;
    
    // Find the salary invoice
    const salaryInvoice = await SalaryInvoice.findById(req.params.id);
    if (!salaryInvoice) {
      return res.status(404).json({ msg: 'Salary invoice not found' });
    }
    
    // Update the payment status
    salaryInvoice.paymentStatus = paymentStatus;
    
    // If status is changed to Paid, update paidDate
    if (paymentStatus === 'Paid' && salaryInvoice.paymentStatus !== 'Paid') {
      salaryInvoice.paidDate = new Date();
    }
    
    await salaryInvoice.save();
    
    // Return the updated invoice
    return res.json(salaryInvoice);
  } catch (err) {
    console.error('Error updating salary invoice:', err.message);
    return res.status(500).json({ msg: 'Server error' });
  }
}; 