const UtilityBill = require('../models/UtilityBill');
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