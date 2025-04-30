const { validationResult } = require('express-validator');
const SingleSessionFee = require('../models/SingleSessionFee');
const ApiResponse = require('../utils/ApiResponse');

// @desc    Get all single session fees
// @route   GET /api/single-session-fees
// @access  Admin, Accounting, Revenue Manager
exports.getSingleSessionFees = async (req, res) => {
  try {
    // Get optional sportType filter from query
    const { sportType } = req.query;
    
    // Build the query
    const query = sportType ? { sportType } : {};
    
    // Get fees
    const fees = await SingleSessionFee.find(query).sort({ sportType: 1 });
    
    return ApiResponse.success(res, fees);
  } catch (error) {
    console.error('Error getting single session fees:', error);
    return ApiResponse.error(res, 'Error getting single session fees', 500);
  }
};

// @desc    Get single session fee by sport type
// @route   GET /api/single-session-fees/:sportType
// @access  Admin, Accounting, Revenue Manager
exports.getSingleSessionFeeBySport = async (req, res) => {
  try {
    const { sportType } = req.params;
    
    // Find fee for the specified sport
    const fee = await SingleSessionFee.findOne({ sportType });
    
    if (!fee) {
      return ApiResponse.error(res, `No single session fee found for ${sportType}`, 404);
    }
    
    return ApiResponse.success(res, fee);
  } catch (error) {
    console.error('Error getting single session fee by sport:', error);
    return ApiResponse.error(res, 'Error getting single session fee', 500);
  }
};

// @desc    Create a single session fee
// @route   POST /api/single-session-fees
// @access  Admin
exports.createSingleSessionFee = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return ApiResponse.error(res, errors.array()[0].msg, 400);
    }
    
    const { sportType, amount, currency, isActive } = req.body;
    
    // Check if a fee for this sport already exists
    const existingFee = await SingleSessionFee.findOne({ sportType });
    if (existingFee) {
      return ApiResponse.error(res, `A fee for ${sportType} already exists. Use PUT to update it.`, 400);
    }
    
    // Create new fee
    const newFee = new SingleSessionFee({
      sportType,
      amount,
      currency: currency || 'USD',
      isActive: isActive !== undefined ? isActive : true,
      createdBy: req.user.id
    });
    
    await newFee.save();
    
    return ApiResponse.success(res, newFee, 'Single session fee created successfully', 201);
  } catch (error) {
    console.error('Error creating single session fee:', error);
    return ApiResponse.error(res, 'Error creating single session fee', 500);
  }
};

// @desc    Update a single session fee
// @route   PUT /api/single-session-fees/:sportType
// @access  Admin
exports.updateSingleSessionFee = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return ApiResponse.error(res, errors.array()[0].msg, 400);
    }
    
    const { sportType } = req.params;
    const { amount, currency, isActive } = req.body;
    
    // Find fee for the specified sport
    const fee = await SingleSessionFee.findOne({ sportType });
    
    if (!fee) {
      return ApiResponse.error(res, `No single session fee found for ${sportType}`, 404);
    }
    
    // Update fee fields
    if (amount !== undefined) fee.amount = amount;
    if (currency !== undefined) fee.currency = currency;
    if (isActive !== undefined) fee.isActive = isActive;
    
    // Set the updatedBy field
    fee.updatedBy = req.user.id;
    
    await fee.save();
    
    return ApiResponse.success(res, fee, 'Single session fee updated successfully');
  } catch (error) {
    console.error('Error updating single session fee:', error);
    return ApiResponse.error(res, 'Error updating single session fee', 500);
  }
};

// @desc    Delete a single session fee
// @route   DELETE /api/single-session-fees/:sportType
// @access  Admin
exports.deleteSingleSessionFee = async (req, res) => {
  try {
    const { sportType } = req.params;
    
    // Find and remove fee for the specified sport
    const fee = await SingleSessionFee.findOneAndDelete({ sportType });
    
    if (!fee) {
      return ApiResponse.error(res, `No single session fee found for ${sportType}`, 404);
    }
    
    return ApiResponse.success(res, null, 'Single session fee deleted successfully');
  } catch (error) {
    console.error('Error deleting single session fee:', error);
    return ApiResponse.error(res, 'Error deleting single session fee', 500);
  }
}; 