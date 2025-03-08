const { validationResult } = require('express-validator');
const TrainingPlan = require('../models/TrainingPlan');
const User = require('../models/User');
const Team = require('../models/Team');

// @desc    Create a new training plan
// @route   POST /api/training-plans
// @access  Private (Supervisor only)
exports.createTrainingPlan = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { title, description, team, assignedTo, date, duration, activities, notes, attachments } = req.body;

    // Verify team exists
    const teamExists = await Team.findById(team);
    if (!teamExists) {
      return res.status(404).json({ msg: 'Team not found' });
    }

    // Verify assignedTo user exists if provided
    if (assignedTo) {
      const coach = await User.findById(assignedTo);
      if (!coach) {
        return res.status(404).json({ msg: 'Assigned coach not found' });
      }
    }

    const newTrainingPlan = new TrainingPlan({
      title,
      description,
      team,
      createdBy: req.user.id,
      assignedTo,
      date: new Date(date),
      duration,
      activities: activities || [],
      notes,
      attachments: attachments || [],
      status: assignedTo ? 'Assigned' : 'Draft'
    });

    const trainingPlan = await newTrainingPlan.save();
    
    // Populate related fields
    await trainingPlan.populate('team', 'name sportType');
    await trainingPlan.populate('createdBy', 'firstName lastName');
    await trainingPlan.populate('assignedTo', 'firstName lastName');
    
    res.status(201).json(trainingPlan);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// @desc    Get all training plans
// @route   GET /api/training-plans
// @access  Private (Supervisor only)
exports.getAllTrainingPlans = async (req, res) => {
  try {
    const trainingPlans = await TrainingPlan.find({ isActive: true })
      .populate('team', 'name sportType')
      .populate('createdBy', 'firstName lastName')
      .populate('assignedTo', 'firstName lastName')
      .sort({ date: 1 });
    
    res.json(trainingPlans);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// @desc    Get training plans for a specific coach
// @route   GET /api/training-plans/coach
// @access  Private (Coach, Supervisor, Admin)
exports.getCoachTrainingPlans = async (req, res) => {
  try {
    const trainingPlans = await TrainingPlan.find({ 
      assignedTo: req.user.id,
      isActive: true 
    })
      .populate('team', 'name sportType')
      .populate('createdBy', 'firstName lastName')
      .sort({ date: 1 });
    
    res.json(trainingPlans);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// @desc    Get training plans for a specific team
// @route   GET /api/training-plans/team/:teamId
// @access  Private (Coach of that team, Supervisor, Admin)
exports.getTeamTrainingPlans = async (req, res) => {
  try {
    const { teamId } = req.params;
    
    // Verify user is coach of this team if not supervisor/admin
    if (!['admin', 'supervisor'].includes(req.user.role)) {
      const team = await Team.findOne({
        _id: teamId,
        'coaches.coach': req.user.id
      });
      
      if (!team) {
        return res.status(403).json({ msg: 'Not authorized to view training plans for this team' });
      }
    }
    
    const trainingPlans = await TrainingPlan.find({ 
      team: teamId,
      isActive: true 
    })
      .populate('assignedTo', 'firstName lastName')
      .populate('createdBy', 'firstName lastName')
      .sort({ date: 1 });
    
    res.json(trainingPlans);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// @desc    Get training plan by ID
// @route   GET /api/training-plans/:id
// @access  Private (Coach of that team, Supervisor, Admin)
exports.getTrainingPlanById = async (req, res) => {
  try {
    const trainingPlan = await TrainingPlan.findById(req.params.id)
      .populate('team', 'name sportType')
      .populate('createdBy', 'firstName lastName')
      .populate('assignedTo', 'firstName lastName');
    
    if (!trainingPlan) {
      return res.status(404).json({ msg: 'Training plan not found' });
    }
    
    // Verify user is coach of this team if not supervisor/admin
    if (!['admin', 'supervisor'].includes(req.user.role) && 
        trainingPlan.assignedTo.toString() !== req.user.id) {
      const team = await Team.findOne({
        _id: trainingPlan.team,
        'coaches.coach': req.user.id
      });
      
      if (!team) {
        return res.status(403).json({ msg: 'Not authorized to view this training plan' });
      }
    }
    
    res.json(trainingPlan);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Training plan not found' });
    }
    res.status(500).send('Server Error');
  }
};

// @desc    Update training plan status
// @route   PUT /api/training-plans/:id/status
// @access  Private (Assigned Coach, Supervisor, Admin)
exports.updateTrainingPlanStatus = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { status } = req.body;
    
    const trainingPlan = await TrainingPlan.findById(req.params.id);
    
    if (!trainingPlan) {
      return res.status(404).json({ msg: 'Training plan not found' });
    }
    
    // Verify user is the assigned coach or supervisor/admin
    if (!['admin', 'supervisor'].includes(req.user.role) && 
        trainingPlan.assignedTo.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Not authorized to update this training plan' });
    }
    
    trainingPlan.status = status;
    await trainingPlan.save();
    
    res.json(trainingPlan);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
}; 