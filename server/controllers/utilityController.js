const UtilityBill = require('../models/UtilityBill');
const UtilitySettings = require('../models/UtilitySettings');
const { validationResult } = require('express-validator');

// @desc    Create a new utility bill
// @route   POST /api/utilities
// @access  Admin, Accounting
exports.createUtilityBill = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const {
      billNumber,
      billType,
      customBillType,
      amount,
      vendor,
      billDate,
      dueDate,
      paymentStatus
    } = req.body;

    // Check if bill number already exists
    const existingBill = await UtilityBill.findOne({ billNumber });
    if (existingBill) {
      return res.status(400).json({ msg: 'Bill number already exists' });
    }

    // If custom bill type is provided, add it to the list of bill types
    if (billType === 'Other' && customBillType && customBillType.trim() !== '') {
      await addCustomBillType(customBillType.trim(), req.user.id);
    }

    // Create the utility bill
    const utilityBill = new UtilityBill({
      billNumber,
      billType,
      customBillType,
      amount,
      vendor,
      billDate,
      dueDate,
      paymentMethod: 'Cash', // Only cash payments
      paymentStatus,
      createdBy: req.user.id,
      paidDate: paymentStatus === 'Paid' ? new Date() : null,
      paidBy: paymentStatus === 'Paid' ? req.user.id : null
    });

    await utilityBill.save();

    return res.status(201).json(utilityBill);
  } catch (err) {
    console.error('Error creating utility bill:', err.message);
    return res.status(500).json({ msg: 'Server error' });
  }
};

// @desc    Get all utility bills
// @route   GET /api/utilities
// @access  Admin, Accounting
exports.getUtilityBills = async (req, res) => {
  try {
    const utilityBills = await UtilityBill.find()
      .populate('createdBy', 'firstName lastName')
      .populate('paidBy', 'firstName lastName')
      .sort({ createdAt: -1 });

    return res.json(utilityBills);
  } catch (err) {
    console.error('Error fetching utility bills:', err.message);
    return res.status(500).json({ msg: 'Server error' });
  }
};

// @desc    Get a utility bill by ID
// @route   GET /api/utilities/:id
// @access  Admin, Accounting
exports.getUtilityBillById = async (req, res) => {
  try {
    const utilityBill = await UtilityBill.findById(req.params.id)
      .populate('createdBy', 'firstName lastName')
      .populate('paidBy', 'firstName lastName');

    if (!utilityBill) {
      return res.status(404).json({ msg: 'Utility bill not found' });
    }

    return res.json(utilityBill);
  } catch (err) {
    console.error('Error fetching utility bill:', err.message);
    return res.status(500).json({ msg: 'Server error' });
  }
};

// @desc    Update utility bill payment status
// @route   PUT /api/utilities/:id
// @access  Admin, Accounting
exports.updateUtilityBill = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { paymentStatus } = req.body;

    // Find the utility bill
    const utilityBill = await UtilityBill.findById(req.params.id);
    if (!utilityBill) {
      return res.status(404).json({ msg: 'Utility bill not found' });
    }

    // Update the payment status
    if (paymentStatus) {
      utilityBill.paymentStatus = paymentStatus;
      
      // If status is changed to Paid, update paidDate and paidBy
      if (paymentStatus === 'Paid' && utilityBill.paymentStatus !== 'Paid') {
        utilityBill.paidDate = new Date();
        utilityBill.paidBy = req.user.id;
      }
    }

    // Payment method is always Cash
    utilityBill.paymentMethod = 'Cash';

    await utilityBill.save();

    return res.json(utilityBill);
  } catch (err) {
    console.error('Error updating utility bill:', err.message);
    return res.status(500).json({ msg: 'Server error' });
  }
};

// @desc    Delete a utility bill
// @route   DELETE /api/utilities/:id
// @access  Admin
exports.deleteUtilityBill = async (req, res) => {
  try {
    const utilityBill = await UtilityBill.findById(req.params.id);

    if (!utilityBill) {
      return res.status(404).json({ msg: 'Utility bill not found' });
    }

    await utilityBill.remove();

    return res.json({ msg: 'Utility bill removed' });
  } catch (err) {
    console.error('Error deleting utility bill:', err.message);
    return res.status(500).json({ msg: 'Server error' });
  }
};

// Helper function to add a custom bill type
async function addCustomBillType(customType, userId) {
  try {
    // Get the current bill types or create a new entry if it doesn't exist
    let billTypesSettings = await UtilitySettings.findOne({ settingName: 'customBillTypes' });
    
    if (!billTypesSettings) {
      // Create new settings with default bill types and the new custom type
      billTypesSettings = new UtilitySettings({
        settingName: 'customBillTypes',
        arrayValue: [customType],
        createdBy: userId
      });
    } else {
      // Check if this custom type already exists
      if (!billTypesSettings.arrayValue.includes(customType)) {
        billTypesSettings.arrayValue.push(customType);
        billTypesSettings.updatedBy = userId;
      }
    }
    
    await billTypesSettings.save();
    return billTypesSettings;
  } catch (error) {
    console.error('Error adding custom bill type:', error);
    throw error;
  }
}

// @desc    Get all bill types (default + custom)
// @route   GET /api/utilities/bill-types
// @access  Admin, Accounting
exports.getBillTypes = async (req, res) => {
  try {
    // Default bill types
    const defaultBillTypes = [
      'Electricity',
      'Water',
      'Gas',
      'Internet',
      'Phone',
      'Maintenance',
      'Equipment'
    ];
    
    // Get custom bill types
    const customBillTypesSettings = await UtilitySettings.findOne({ settingName: 'customBillTypes' });
    
    let allBillTypes = [...defaultBillTypes];
    
    // Add custom bill types if they exist
    if (customBillTypesSettings && customBillTypesSettings.arrayValue.length > 0) {
      allBillTypes = [...allBillTypes, ...customBillTypesSettings.arrayValue];
    }
    
    // Always add "Other" as the last option
    allBillTypes.push('Other');
    
    return res.json(allBillTypes);
  } catch (err) {
    console.error('Error fetching bill types:', err.message);
    return res.status(500).json({ msg: 'Server error' });
  }
}; 