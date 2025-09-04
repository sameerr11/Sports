const { validationResult } = require('express-validator');
const RegistrationRenewal = require('../models/RegistrationRenewal');
const PlayerRegistration = require('../models/PlayerRegistration');
const RegistrationFee = require('../models/RegistrationFee');
const User = require('../models/User');
const Notification = require('../models/Notification');
const ApiResponse = require('../utils/ApiResponse');

// @desc    Get expired registrations for renewal
// @route   GET /api/registration-renewals/expired
// @access  Accounting
exports.getExpiredRegistrations = async (req, res) => {
  try {
    const { sport, limit = 50, page = 1 } = req.query;
    
    // Build query for expired registrations
    const query = {
      endDate: { $lt: new Date() }, // Expired
      status: { $nin: ['Cancelled'] }, // Not cancelled
      accountCreated: true // Only registrations with user accounts
    };
    
    // Filter by sport if provided
    if (sport) {
      query.sports = sport;
    }
    
    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Get total count
    const total = await PlayerRegistration.countDocuments(query);
    
    // Get expired registrations with user info
    const expiredRegistrations = await PlayerRegistration.find(query)
      .populate('userId', 'firstName lastName email phoneNumber')
      .populate('registeredBy', 'firstName lastName')
      .sort({ endDate: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    return ApiResponse.success(res, {
      registrations: expiredRegistrations,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching expired registrations:', error);
    return ApiResponse.error(res, 'Error fetching expired registrations', 500);
  }
};

// @desc    Get registration fees for renewal
// @route   GET /api/registration-renewals/fees
// @access  Accounting
exports.getRegistrationFees = async (req, res) => {
  try {
    const { sportType } = req.query;
    let query = { isActive: true };
    
    // Filter by sport type if provided
    if (sportType) {
      query.sportType = sportType;
    }
    
    const fees = await RegistrationFee.find(query)
      .sort({ sportType: 1, period: 1 });
    
    return ApiResponse.success(res, fees);
  } catch (error) {
    console.error('Error fetching registration fees:', error);
    return ApiResponse.error(res, 'Error fetching registration fees', 500);
  }
};

// @desc    Create a registration renewal
// @route   POST /api/registration-renewals
// @access  Accounting
exports.createRenewal = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return ApiResponse.error(res, errors.array()[0].msg, 400);
    }

    const {
      originalRegistrationId,
      sports,
      registrationPeriod,
      startDate,
      fee,
      notes
    } = req.body;

    // Find the original registration
    const originalRegistration = await PlayerRegistration.findById(originalRegistrationId)
      .populate('userId', 'firstName lastName email phoneNumber');
    
    if (!originalRegistration) {
      return ApiResponse.error(res, 'Original registration not found', 404);
    }

    // Check if registration is expired
    if (originalRegistration.endDate >= new Date()) {
      return ApiResponse.error(res, 'Registration is not yet expired', 400);
    }

    // Check if user account exists
    if (!originalRegistration.userId) {
      return ApiResponse.error(res, 'No user account found for this registration', 400);
    }

    // Calculate end date based on registration period
    const renewalStartDate = new Date(startDate);
    const endDate = new Date(renewalStartDate);
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

    // Create renewal record
    const renewal = new RegistrationRenewal({
      originalRegistration: originalRegistrationId,
      userId: originalRegistration.userId._id,
      player: {
        firstName: originalRegistration.userId.firstName,
        lastName: originalRegistration.userId.lastName,
        email: originalRegistration.userId.email,
        phoneNumber: originalRegistration.userId.phoneNumber
      },
      sports,
      registrationPeriod,
      startDate: renewalStartDate,
      endDate,
      fee,
      renewedBy: req.user.id,
      notes
    });

    await renewal.save();

    // Update the original registration to extend its end date
    originalRegistration.endDate = endDate;
    originalRegistration.status = 'Completed';
    await originalRegistration.save();

    // Create notifications
    await createRenewalNotifications(renewal, originalRegistration);

    return ApiResponse.success(
      res, 
      renewal, 
      'Registration renewed successfully',
      201
    );
  } catch (error) {
    console.error('Error creating registration renewal:', error);
    return ApiResponse.error(res, 'Error creating registration renewal', 500);
  }
};

// @desc    Get all renewals
// @route   GET /api/registration-renewals
// @access  Accounting, Admin
exports.getRenewals = async (req, res) => {
  try {
    const { status, sport, limit = 20, page = 1 } = req.query;
    let query = {};
    
    // Filter by status if provided
    if (status) {
      query.status = status;
    }
    
    // Filter by sport if provided
    if (sport) {
      query.sports = sport;
    }
    
    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Get total count
    const total = await RegistrationRenewal.countDocuments(query);
    
    // Get renewals with populated data
    const renewals = await RegistrationRenewal.find(query)
      .populate('originalRegistration', 'sports registrationPeriod startDate endDate')
      .populate('userId', 'firstName lastName email')
      .populate('renewedBy', 'firstName lastName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    return ApiResponse.success(res, {
      renewals,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching renewals:', error);
    return ApiResponse.error(res, 'Error fetching renewals', 500);
  }
};

// @desc    Get renewal by ID
// @route   GET /api/registration-renewals/:id
// @access  Accounting, Admin
exports.getRenewalById = async (req, res) => {
  try {
    const renewal = await RegistrationRenewal.findById(req.params.id)
      .populate('originalRegistration')
      .populate('userId', 'firstName lastName email phoneNumber')
      .populate('renewedBy', 'firstName lastName');
    
    if (!renewal) {
      return ApiResponse.error(res, 'Renewal not found', 404);
    }
    
    return ApiResponse.success(res, renewal);
  } catch (error) {
    console.error('Error fetching renewal:', error);
    return ApiResponse.error(res, 'Error fetching renewal', 500);
  }
};

// @desc    Cancel a renewal
// @route   PUT /api/registration-renewals/:id/cancel
// @access  Accounting, Admin
exports.cancelRenewal = async (req, res) => {
  try {
    const { notes } = req.body;
    
    const renewal = await RegistrationRenewal.findById(req.params.id);
    if (!renewal) {
      return ApiResponse.error(res, 'Renewal not found', 404);
    }
    
    if (renewal.status === 'Cancelled') {
      return ApiResponse.error(res, 'Renewal is already cancelled', 400);
    }
    
    // Update renewal status
    renewal.status = 'Cancelled';
    renewal.notes = notes || renewal.notes;
    await renewal.save();
    
    // Revert the original registration end date
    const originalRegistration = await PlayerRegistration.findById(renewal.originalRegistration);
    if (originalRegistration) {
      // Find the previous renewal or use original end date
      const previousRenewal = await RegistrationRenewal.findOne({
        originalRegistration: renewal.originalRegistration,
        _id: { $ne: renewal._id },
        status: 'Completed'
      }).sort({ createdAt: -1 });
      
      if (previousRenewal) {
        originalRegistration.endDate = previousRenewal.endDate;
      } else {
        // If no previous renewal, we need to calculate the original end date
        // This is a simplified approach - in production you might want to store original end date
        const originalStartDate = originalRegistration.startDate;
        const originalPeriod = originalRegistration.registrationPeriod;
        const originalEndDate = new Date(originalStartDate);
        
        switch (originalPeriod) {
          case '1 Month':
            originalEndDate.setMonth(originalEndDate.getMonth() + 1);
            break;
          case '3 Months':
            originalEndDate.setMonth(originalEndDate.getMonth() + 3);
            break;
          case '6 Months':
            originalEndDate.setMonth(originalEndDate.getMonth() + 6);
            break;
          case '1 Year':
            originalEndDate.setFullYear(originalEndDate.getFullYear() + 1);
            break;
        }
        
        originalRegistration.endDate = originalEndDate;
      }
      
      await originalRegistration.save();
    }
    
    return ApiResponse.success(res, renewal, 'Renewal cancelled successfully');
  } catch (error) {
    console.error('Error cancelling renewal:', error);
    return ApiResponse.error(res, 'Error cancelling renewal', 500);
  }
};

// Helper function to create notifications for renewal
const createRenewalNotifications = async (renewal, originalRegistration) => {
  try {
    // Notify the player
    if (renewal.userId) {
      const playerNotification = new Notification({
        recipient: renewal.userId,
        sender: renewal.renewedBy,
        type: 'registration_renewal',
        title: 'Registration Renewed',
        message: `Your registration for ${renewal.sports.join(', ')} has been renewed until ${new Date(renewal.endDate).toLocaleDateString()}.`,
        relatedTo: {
          model: 'RegistrationRenewal',
          id: renewal._id
        }
      });
      
      await playerNotification.save();
    }
    
    // Notify admins
    const admins = await User.find({ role: 'admin' });
    const adminNotifications = admins.map(admin => {
      return new Notification({
        recipient: admin._id,
        sender: renewal.renewedBy,
        type: 'registration_renewal',
        title: 'Registration Renewed',
        message: `${renewal.player.firstName} ${renewal.player.lastName}'s registration for ${renewal.sports.join(', ')} has been renewed by the accounting department.`,
        relatedTo: {
          model: 'RegistrationRenewal',
          id: renewal._id
        }
      });
    });
    
    await Promise.all(adminNotifications.map(notification => notification.save()));
    
    // Notify relevant supervisors
    const supervisors = await User.find({ 
      role: 'supervisor',
      $or: [
        { supervisorType: 'general' },
        { 
          supervisorType: 'sports',
          supervisorSportTypes: { $in: renewal.sports }
        }
      ]
    });
    
    const supervisorNotifications = supervisors.map(supervisor => {
      return new Notification({
        recipient: supervisor._id,
        sender: renewal.renewedBy,
        type: 'registration_renewal',
        title: 'Registration Renewed',
        message: `${renewal.player.firstName} ${renewal.player.lastName}'s registration for ${renewal.sports.join(', ')} has been renewed.`,
        relatedTo: {
          model: 'RegistrationRenewal',
          id: renewal._id
        }
      });
    });
    
    await Promise.all(supervisorNotifications.map(notification => notification.save()));
    
  } catch (error) {
    console.error('Error creating renewal notifications:', error);
    // Don't throw error here as renewal was successful
  }
};
