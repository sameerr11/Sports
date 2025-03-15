const { validationResult } = require('express-validator');
const Feedback = require('../models/Feedback');
const User = require('../models/User');

// @route   POST /api/feedback
// @desc    Submit feedback
// @access  Private (users must be logged in)
exports.submitFeedback = async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { message } = req.body;
    const userId = req.user.id;

    // Get user email and role from database
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // Create feedback
    const feedback = new Feedback({
      userId,
      email: user.email,
      role: user.role,
      message
    });

    await feedback.save();
    
    res.status(201).json({ 
      success: true,
      feedback
    });
  } catch (err) {
    console.error('Error submitting feedback:', err.message);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
};

// @route   GET /api/feedback
// @desc    Get all feedback (admin only)
// @access  Private (admin only)
exports.getAllFeedback = async (req, res) => {
  try {
    const feedback = await Feedback.find().sort({ createdAt: -1 });
    res.json(feedback);
  } catch (err) {
    console.error('Error getting feedback:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// @route   GET /api/feedback/user
// @desc    Get user's feedback
// @access  Private (user can only see their own feedback)
exports.getUserFeedback = async (req, res) => {
  try {
    const feedback = await Feedback.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json(feedback);
  } catch (err) {
    console.error('Error getting user feedback:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// @route   PUT /api/feedback/:id
// @desc    Update feedback status (admin only)
// @access  Private (admin only)
exports.updateFeedbackStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['pending', 'reviewed', 'resolved'].includes(status)) {
      return res.status(400).json({ msg: 'Invalid status' });
    }
    
    // Use findByIdAndUpdate instead of save() to avoid full validation
    const feedback = await Feedback.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: false }
    );
    
    if (!feedback) {
      return res.status(404).json({ msg: 'Feedback not found' });
    }
    
    res.json(feedback);
  } catch (err) {
    console.error('Error updating feedback status:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
}; 