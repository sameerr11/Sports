const { validationResult } = require('express-validator');
const TrainingPlan = require('../models/TrainingPlan');
const User = require('../models/User');
const Team = require('../models/Team');
const notificationService = require('../utils/notificationService');

// @desc    Create a new training plan
// @route   POST /api/training-plans
// @access  Private (Supervisor only)
exports.createTrainingPlan = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { 
      title, 
      description, 
      team, 
      date, 
      duration,
      activities,
      notes,
      scheduleId,
      isRecurring,
      assignedTo
    } = req.body;

    // Find the team to get the coaches
    let coach = assignedTo || null;
    let status = 'Draft';
    
    // If team is provided, check for coaches
    if (team) {
      const teamDoc = await Team.findById(team).populate('coaches.coach');
      if (teamDoc && teamDoc.coaches && teamDoc.coaches.length > 0) {
        // Set coach to the first coach if not already set
        coach = coach || teamDoc.coaches[0].coach._id;
        
        // If we have a coach, set status to Assigned
        if (coach) {
          status = 'Assigned';
        }
      }
    }

    // Create the training plan
    const trainingPlan = new TrainingPlan({
      title,
      description,
      team,
      date,
      duration,
      assignedTo: coach,
      activities: activities || [],
      notes,
      createdBy: req.user.id,
      status,
      scheduleId: scheduleId || null,
      isRecurring: isRecurring || false
    });

    await trainingPlan.save();

    // Populate response
    await trainingPlan.populate('team', 'name sportType');
    await trainingPlan.populate('createdBy', 'firstName lastName');
    
    if (coach) {
      await trainingPlan.populate('assignedTo', 'firstName lastName');
    }
    
    // If a schedule is attached, include it in the response
    if (trainingPlan.scheduleId) {
      await trainingPlan.populate({
        path: 'scheduleId',
        populate: {
          path: 'court',
          select: 'name location'
        }
      });
    }

    // Notify all coaches about the new training plan
    if (team) {
      await notificationService.createRoleNotifications({
        role: 'coach',
        senderId: req.user.id,
        type: 'training_scheduled',
        title: 'New Training Plan',
        message: `A new training plan "${title}" has been scheduled for ${new Date(date).toLocaleDateString()}`,
        relatedTo: {
          model: 'TrainingPlan',
          id: trainingPlan._id
        }
      });

      // Notify all players in the team
      await notificationService.notifyTeamPlayers({
        teamId: team,
        senderId: req.user.id,
        type: 'training_scheduled',
        title: 'New Training Scheduled',
        message: `A new training session "${title}" has been scheduled for ${new Date(date).toLocaleDateString()}`,
        relatedTo: {
          model: 'TrainingPlan',
          id: trainingPlan._id
        }
      });
    }

    res.status(201).json(trainingPlan);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error' });
  }
};

// @desc    Get all training plans
// @route   GET /api/training-plans
// @access  Private (Supervisor only)
exports.getAllTrainingPlans = async (req, res) => {
  try {
    // Build query based on supervisor type and assigned sports
    let query = { isActive: true };
    
    // Filter by sport type if user is a sports supervisor
    if (req.user.role === 'supervisor') {
      const supervisor = await User.findById(req.user.id);
      
      if (supervisor.supervisorType === 'sports') {
        if (Array.isArray(supervisor.supervisorSportTypes) && supervisor.supervisorSportTypes.length > 0) {
          // Find teams with the supervisor's sport types
          const teams = await Team.find({ 
            sportType: { $in: supervisor.supervisorSportTypes },
            isActive: true
          });
          
          if (teams.length > 0) {
            // Get team IDs
            const teamIds = teams.map(team => team._id);
            // Add team filter to query
            query.team = { $in: teamIds };
          } else {
            // If no teams are found for their sport types, return empty array
            return res.json([]);
          }
        } else {
          // If they don't have any assigned sport types, they shouldn't see any training plans
          return res.status(403).json({ 
            msg: 'Access denied: No sport types assigned to your profile' 
          });
        }
      }
      // General supervisors can see all training plans (no additional filtering needed)
      // Cafeteria supervisors shouldn't be calling this endpoint, but would see all plans if they did
    }
    
    // Get training plans with the constructed query
    const trainingPlans = await TrainingPlan.find(query)
      .populate('team', 'name sportType')
      .populate('createdBy', 'firstName lastName')
      .populate('assignedTo', 'firstName lastName')
      .populate({
        path: 'scheduleId',
        populate: {
          path: 'court',
          select: 'name location'
        }
      })
      .sort({ date: 1 });
    
    res.json(trainingPlans);
  } catch (err) {
    console.error('Error fetching training plans:', err.message);
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
      .populate({
        path: 'scheduleId',
        populate: {
          path: 'court',
          select: 'name location'
        }
      })
      .sort({ date: 1 });
    
    res.json(trainingPlans);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// @desc    Get training plans for a specific team
// @route   GET /api/training-plans/team/:teamId
// @access  Private (Coach of that team, Supervisor, Admin, Player in that team, Parent of player in team)
exports.getTeamTrainingPlans = async (req, res) => {
  try {
    const { teamId } = req.params;
    
    // For sports supervisors, verify they have access to the team's sport type
    if (req.user.role === 'supervisor') {
      const supervisor = await User.findById(req.user.id);
      
      if (supervisor.supervisorType === 'sports') {
        if (Array.isArray(supervisor.supervisorSportTypes) && supervisor.supervisorSportTypes.length > 0) {
          // Get the team to check its sport type
          const team = await Team.findById(teamId);
          
          if (!team) {
            return res.status(404).json({ msg: 'Team not found' });
          }
          
          // Check if the team's sport type is in the supervisor's assigned types
          if (!supervisor.supervisorSportTypes.includes(team.sportType)) {
            return res.status(403).json({ 
              msg: 'Not authorized to view training plans for this sport type' 
            });
          }
        } else {
          // If they don't have any assigned sport types, they shouldn't access any team
          return res.status(403).json({ 
            msg: 'Access denied: No sport types assigned to your profile' 
          });
        }
      }
      // General supervisors can access all teams
    } 
    // Verify user is coach, player, or parent of a player in this team if not supervisor/admin
    else if (!['admin'].includes(req.user.role)) {
      let team = null;
      
      // Check if user is a coach for this team
      team = await Team.findOne({
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
      
      // If not a coach or player, check if user is a parent of a player in this team
      if (!team && req.user.role === 'parent') {
        try {
          // First, find the user's children
          const user = await User.findById(req.user.id).populate({
            path: 'children',
            options: { strictPopulate: false }
          });
          
          if (user && user.children && user.children.length > 0) {
            // Get child IDs
            const childIds = user.children.map(child => child._id);
            
            // Find team with any of these children as players
            team = await Team.findOne({
              _id: teamId,
              'players.player': { $in: childIds }
            });
          }
        } catch (childError) {
          console.error('Error fetching parent children:', childError);
          return res.status(500).json({ 
            msg: 'Server error fetching user children data',
            error: childError.message 
          });
        }
      }
      
      if (!team) {
        return res.status(403).json({ msg: 'Not authorized to view training plans for this team' });
      }
    }
    
    try {
      const trainingPlans = await TrainingPlan.find({ 
        team: teamId,
        isActive: true 
      })
        .populate('assignedTo', 'firstName lastName')
        .populate('createdBy', 'firstName lastName')
        .populate('team', 'name sportType')
        .populate({
          path: 'scheduleId',
          populate: {
            path: 'court',
            select: 'name location'
          }
        })
        .sort({ date: 1 });
      
      res.json(trainingPlans);
    } catch (queryError) {
      console.error('Error in database query for training plans:', queryError);
      return res.status(500).json({ 
        msg: 'Error retrieving training plans',
        error: queryError.message 
      });
    }
  } catch (err) {
    console.error('Error fetching team training plans:', err);
    res.status(500).json({ 
      msg: 'Server Error',
      error: err.message || 'Unknown error'
    });
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
      .populate('assignedTo', 'firstName lastName')
      .populate({
        path: 'scheduleId',
        populate: {
          path: 'court',
          select: 'name location'
        }
      });
    
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
    const { 
      title, 
      description, 
      team, 
      date, 
      duration, 
      activities, 
      notes, 
      attachments,
      scheduleId,
      isRecurring
    } = req.body;

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
    
    // Update schedule fields if provided
    if (scheduleId !== undefined) {
      plan.scheduleId = scheduleId;
    }
    
    if (isRecurring !== undefined) {
      plan.isRecurring = isRecurring;
    }

    await plan.save();
    
    // Populate response
    await plan.populate('team', 'name sportType');
    await plan.populate('createdBy', 'firstName lastName');
    await plan.populate('assignedTo', 'firstName lastName');
    
    // If a schedule is attached, include it in the response
    if (plan.scheduleId) {
      await plan.populate({
        path: 'scheduleId',
        populate: {
          path: 'court',
          select: 'name location'
        }
      });
    }
    
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