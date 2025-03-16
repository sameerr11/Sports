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
    const { title, description, team, date, duration, activities, notes, attachments } = req.body;

    // Use default description if empty
    const planDescription = description || 'Created from scheduling';

    // Verify team exists
    const teamExists = await Team.findById(team).populate('coaches.coach');
    if (!teamExists) {
      return res.status(404).json({ msg: 'Team not found' });
    }
    
    // Automatically assign to the first coach of the team if available
    let assignedTo = null;
    let planStatus = 'Draft';
    
    if (teamExists.coaches && teamExists.coaches.length > 0) {
      // Get the first coach from the team
      assignedTo = teamExists.coaches[0].coach._id;
      planStatus = 'Assigned';
    }

    const newTrainingPlan = new TrainingPlan({
      title,
      description: planDescription,
      team,
      createdBy: req.user.id,
      assignedTo,
      date: new Date(date),
      duration,
      activities: activities || [],
      notes,
      attachments: attachments || [],
      status: planStatus
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
// @access  Private (Coach of that team, Supervisor, Admin, Player in that team)
exports.getTeamTrainingPlans = async (req, res) => {
  try {
    const { teamId } = req.params;
    
    // Verify user is coach or player of this team if not supervisor/admin
    if (!['admin', 'supervisor'].includes(req.user.role)) {
      // Check if user is a coach for this team
      let team = await Team.findOne({
        _id: teamId,
        'coaches.coach': req.user.id
      });
      
      // If not a coach, check if user is a player for this team
      if (!team && req.user.role === 'player') {
        team = await Team.findOne({
          _id: teamId,
          'players.player': req.user.id
        });
      }
      
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
      .populate('team', 'name sportType')
      .sort({ date: 1 });
    
    res.json(trainingPlans);
  } catch (err) {
    console.error('Error fetching team training plans:', err.message);
    res.status(500).send('Server Error');
  }
};

// @desc    Get training plan by ID
// @route   GET /api/training-plans/:id
// @access  Private (Assigned Coach, Coach of that team, Supervisor, Admin)
exports.getTrainingPlanById = async (req, res) => {
  try {
    const trainingPlan = await TrainingPlan.findById(req.params.id)
      .populate('team', 'name sportType')
      .populate('createdBy', 'firstName lastName')
      .populate('assignedTo', 'firstName lastName');
    
    if (!trainingPlan) {
      return res.status(404).json({ msg: 'Training plan not found' });
    }
    
    // Authorized roles:
    // 1. Supervisors and admins have full access
    // 2. Coaches who are assigned to this training plan
    // 3. Coaches who are part of the team for this training plan
    
    const isAssignedCoach = trainingPlan.assignedTo && 
                           trainingPlan.assignedTo._id && 
                           trainingPlan.assignedTo._id.toString() === req.user.id;
    
    if (['admin', 'supervisor'].includes(req.user.role) || isAssignedCoach) {
      // Admin, supervisor, or assigned coach - grant access
      return res.json(trainingPlan);
    }
    
    // For other coaches, check if they're a coach of this team
    if (req.user.role === 'coach') {
      const team = await Team.findOne({
        _id: trainingPlan.team,
        'coaches.coach': req.user.id
      });
      
      if (team) {
        return res.json(trainingPlan);
      }
    }
    
    // If we get here, user is not authorized
    return res.status(403).json({ msg: 'Not authorized to view this training plan' });
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
    
    // Check if user is authorized to update status
    // Handle both populated and non-populated assignedTo field
    const isAssignedCoach = 
      trainingPlan.assignedTo && 
      ((trainingPlan.assignedTo._id && trainingPlan.assignedTo._id.toString() === req.user.id) || 
       (typeof trainingPlan.assignedTo === 'string' && trainingPlan.assignedTo === req.user.id));
    
    if (!['admin', 'supervisor'].includes(req.user.role) && !isAssignedCoach) {
      return res.status(403).json({ msg: 'Not authorized to update this training plan' });
    }
    
    // Validate status transitions
    const validStatuses = ['Draft', 'Assigned', 'InProgress', 'Completed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ msg: 'Invalid status value' });
    }
    
    trainingPlan.status = status;
    
    // Update completedDate if status is Completed
    if (status === 'Completed') {
      trainingPlan.completedDate = Date.now();
    }
    
    await trainingPlan.save();
    
    // Re-populate the response
    await trainingPlan.populate('team', 'name sportType');
    await trainingPlan.populate('createdBy', 'firstName lastName');
    await trainingPlan.populate('assignedTo', 'firstName lastName');
    
    res.json(trainingPlan);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Training plan not found' });
    }
    res.status(500).send('Server Error');
  }
};

// @desc    Update training plan
// @route   PUT /api/training-plans/:id
// @access  Private (Supervisor, Admin)
exports.updateTrainingPlan = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { title, description, team, date, duration, activities, notes, attachments } = req.body;

    // Use default description if empty
    const planDescription = description || 'Created from scheduling';

    // Check if plan exists
    const plan = await TrainingPlan.findById(req.params.id);
    if (!plan) {
      return res.status(404).json({ msg: 'Training plan not found' });
    }
    
    // Prevent editing completed plans
    if (plan.status === 'Completed') {
      return res.status(403).json({ 
        msg: 'Cannot edit a completed training plan. Completed plans are locked for historical accuracy.' 
      });
    }

    // Check if team is being changed
    const isTeamChanged = team !== plan.team.toString();
    
    // If team is changed, get the new team's coaches
    let assignedTo = plan.assignedTo;
    if (isTeamChanged) {
      const newTeam = await Team.findById(team).populate('coaches.coach');
      if (!newTeam) {
        return res.status(404).json({ msg: 'Team not found' });
      }
      
      // Automatically assign to the first coach of the new team if available
      if (newTeam.coaches && newTeam.coaches.length > 0) {
        assignedTo = newTeam.coaches[0].coach._id;
        
        // If the plan was in Draft status, update it to Assigned now that we have a coach
        if (plan.status === 'Draft') {
          plan.status = 'Assigned';
        }
      } else {
        // No coaches on the new team, set to null
        assignedTo = null;
        
        // If the plan was Assigned or InProgress, revert to Draft since there's no coach
        if (plan.status === 'Assigned' || plan.status === 'InProgress') {
          plan.status = 'Draft';
        }
      }
    }

    // Update plan fields
    plan.title = title;
    plan.description = planDescription;
    plan.team = team;
    plan.assignedTo = assignedTo;
    plan.date = new Date(date);
    plan.duration = duration;
    plan.activities = activities || [];
    plan.notes = notes;
    plan.attachments = attachments || [];

    await plan.save();
    
    // Populate response
    await plan.populate('team', 'name sportType');
    await plan.populate('createdBy', 'firstName lastName');
    await plan.populate('assignedTo', 'firstName lastName');
    
    res.json(plan);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Training plan not found' });
    }
    res.status(500).send('Server Error');
  }
};

// @desc    Delete training plan
// @route   DELETE /api/training-plans/:id
// @access  Private (Supervisor, Admin)
exports.deleteTrainingPlan = async (req, res) => {
  try {
    console.log(`Attempting to delete training plan with ID: ${req.params.id}`);
    
    const plan = await TrainingPlan.findById(req.params.id);
    
    if (!plan) {
      console.log(`Training plan with ID ${req.params.id} not found`);
      return res.status(404).json({ msg: 'Training plan not found' });
    }

    // Check if user is creator or has rights
    if (plan.createdBy.toString() !== req.user.id && 
        !['admin', 'supervisor'].includes(req.user.role)) {
      console.log(`User ${req.user.id} not authorized to delete plan ${req.params.id}`);
      return res.status(403).json({ msg: 'Not authorized to delete this plan' });
    }

    console.log(`Deleting training plan: ${plan._id}`);
    const result = await TrainingPlan.deleteOne({ _id: plan._id });
    
    if (result.deletedCount === 0) {
      console.log(`Failed to delete training plan: ${plan._id}`);
      return res.status(500).json({ msg: 'Failed to delete training plan' });
    }
    
    console.log(`Successfully deleted training plan: ${plan._id}`);
    res.json({ msg: 'Training plan deleted successfully', id: plan._id });
  } catch (err) {
    console.error(`Error deleting training plan ${req.params.id}:`, err.message);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Training plan not found - invalid ID format' });
    }
    
    res.status(500).json({ 
      msg: 'Server error when deleting training plan',
      error: err.message
    });
  }
};

// @desc    Update player attendance for a training plan
// @route   PUT /api/training-plans/:id/attendance
// @access  Private (Assigned Coach, Supervisor, Admin)
exports.updateAttendance = async (req, res) => {
  try {
    const { attendance } = req.body;
    
    // Validate input
    if (!attendance || !Array.isArray(attendance)) {
      return res.status(400).json({ msg: 'Attendance data is required as an array' });
    }

    // Check if plan exists
    const plan = await TrainingPlan.findById(req.params.id);
    if (!plan) {
      return res.status(404).json({ msg: 'Training plan not found' });
    }
    
    // Check if user is authorized
    const isAssignedCoach = 
      plan.assignedTo && 
      ((plan.assignedTo._id && plan.assignedTo._id.toString() === req.user.id) || 
       (typeof plan.assignedTo === 'string' && plan.assignedTo === req.user.id));
    
    if (!['admin', 'supervisor'].includes(req.user.role) && !isAssignedCoach) {
      return res.status(403).json({ msg: 'Not authorized to update attendance for this plan' });
    }
    
    // Check if attendance can be updated based on plan status
    if (plan.status === 'Draft') {
      return res.status(400).json({ msg: 'Cannot mark attendance for a draft plan' });
    }
    
    // Set the attendance data
    plan.attendance = attendance.map(item => ({
      ...item,
      markedBy: req.user.id,
      markedAt: new Date()
    }));
    
    await plan.save();
    
    // Populate relevant fields for the response
    await plan.populate('attendance.player', 'firstName lastName');
    await plan.populate('attendance.markedBy', 'firstName lastName');
    
    res.json({
      success: true,
      attendance: plan.attendance,
      message: 'Attendance updated successfully'
    });
  } catch (err) {
    console.error('Error updating attendance:', err.message);
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
};

// @desc    Get player attendance for a training plan
// @route   GET /api/training-plans/:id/attendance
// @access  Private (Coaches of team, Supervisor, Admin)
exports.getAttendance = async (req, res) => {
  try {
    const plan = await TrainingPlan.findById(req.params.id)
      .populate('attendance.player', 'firstName lastName')
      .populate('attendance.markedBy', 'firstName lastName');
    
    if (!plan) {
      return res.status(404).json({ msg: 'Training plan not found' });
    }
    
    // Check if user is authorized
    const isAssignedCoach = 
      plan.assignedTo && 
      ((plan.assignedTo._id && plan.assignedTo._id.toString() === req.user.id) || 
       (typeof plan.assignedTo === 'string' && plan.assignedTo === req.user.id));
    
    if (!['admin', 'supervisor'].includes(req.user.role) && !isAssignedCoach) {
      // Check if user is any coach of the team
      const team = await Team.findOne({
        _id: plan.team,
        'coaches.coach': req.user.id
      });
      
      if (!team) {
        return res.status(403).json({ msg: 'Not authorized to view attendance for this plan' });
      }
    }
    
    res.json({
      success: true,
      attendance: plan.attendance || []
    });
  } catch (err) {
    console.error('Error getting attendance:', err.message);
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
}; 