const { validationResult } = require('express-validator');
const Training = require('../models/Training');
const Team = require('../models/Team');
const User = require('../models/User');

// @desc    Create a new training session
// @route   POST /api/trainings
// @access  Private (Supervisor, Admin)
exports.createTraining = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    // Strict permission check: only supervisor or admin
    if (req.user.role !== 'supervisor' && req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Not authorized. Only supervisors and admins can create training sessions.' });
    }

    const {
      title,
      description,
      team,
      coach,
      court,
      startTime,
      endTime,
      trainingType,
      goals,
      status,
      notes
    } = req.body;

    // Check if team exists
    const teamExists = await Team.findById(team);
    if (!teamExists) {
      return res.status(404).json({ msg: 'Team not found' });
    }

    // Check if coach exists
    const coachExists = await User.findById(coach);
    if (!coachExists || !['coach', 'supervisor', 'admin'].includes(coachExists.role)) {
      return res.status(404).json({ msg: 'Coach not found or user is not a coach' });
    }

    // Create new training
    const newTraining = new Training({
      title,
      description,
      team,
      coach,
      court,
      startTime,
      endTime,
      trainingType,
      goals,
      status,
      notes,
      createdBy: req.user.id
    });

    const training = await newTraining.save();
    res.status(201).json(training);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// @desc    Get all trainings
// @route   GET /api/trainings
// @access  Private (Coach, Supervisor, Admin)
exports.getTrainings = async (req, res) => {
  try {
    let query = {};
    
    // Filter by team if provided
    if (req.query.team) {
      query.team = req.query.team;
    }
    
    // Filter by coach if provided
    if (req.query.coach) {
      query.coach = req.query.coach;
    }
    
    // Filter by date range
    if (req.query.startDate && req.query.endDate) {
      query.startTime = {
        $gte: new Date(req.query.startDate),
        $lte: new Date(req.query.endDate)
      };
    }

    const trainings = await Training.find(query)
      .populate('team', 'name sportType')
      .populate('coach', 'firstName lastName email')
      .populate('court', 'name location')
      .sort({ startTime: 1 });
    
    res.json(trainings);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// @desc    Get trainings for a player
// @route   GET /api/trainings/player
// @access  Private
exports.getPlayerTrainings = async (req, res) => {
  try {
    // Find teams the player belongs to
    const teams = await Team.find({ 'players.player': req.user.id }).distinct('_id');
    
    if (teams.length === 0) {
      return res.json([]);
    }
    
    // Find trainings for those teams
    const trainings = await Training.find({ 
      team: { $in: teams },
      startTime: { $gte: new Date() }  // Only future trainings
    })
      .populate('team', 'name sportType')
      .populate('coach', 'firstName lastName email')
      .populate('court', 'name location')
      .sort({ startTime: 1 });
    
    res.json(trainings);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// @desc    Get coach's trainings
// @route   GET /api/trainings/coach
// @access  Private (Coach)
exports.getCoachTrainings = async (req, res) => {
  try {
    const trainings = await Training.find({ coach: req.user.id })
      .populate('team', 'name sportType')
      .populate('court', 'name location')
      .sort({ startTime: 1 });
    
    res.json(trainings);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// @desc    Get training by ID
// @route   GET /api/trainings/:id
// @access  Private
exports.getTrainingById = async (req, res) => {
  try {
    const training = await Training.findById(req.params.id)
      .populate('team', 'name sportType players')
      .populate('coach', 'firstName lastName email')
      .populate('court', 'name location sportType')
      .populate('attendance.player', 'firstName lastName email');
    
    if (!training) {
      return res.status(404).json({ msg: 'Training not found' });
    }

    // Check if user is authorized to view this training
    const isPlayer = await Team.findOne({ 
      _id: training.team._id, 
      'players.player': req.user.id 
    });
    
    const isCoach = training.coach._id.toString() === req.user.id;
    const isSupervisor = req.user.role === 'supervisor';
    const isAdmin = req.user.role === 'admin';
    
    if (!isPlayer && !isCoach && !isSupervisor && !isAdmin) {
      return res.status(403).json({ msg: 'Not authorized to view this training' });
    }

    res.json(training);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Training not found' });
    }
    res.status(500).send('Server Error');
  }
};

// @desc    Update training
// @route   PUT /api/trainings/:id
// @access  Private (Supervisor, Admin)
exports.updateTraining = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const training = await Training.findById(req.params.id);
    
    if (!training) {
      return res.status(404).json({ msg: 'Training not found' });
    }

    // Strict permission check: only supervisor or admin
    if (req.user.role !== 'supervisor' && req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Not authorized. Only supervisors and admins can update training sessions.' });
    }

    const {
      title,
      description,
      team,
      coach,
      court,
      startTime,
      endTime,
      trainingType,
      goals,
      status,
      notes
    } = req.body;

    // Update fields
    if (title) training.title = title;
    if (description) training.description = description;
    if (team) training.team = team;
    if (coach) training.coach = coach;
    if (court) training.court = court;
    if (startTime) training.startTime = startTime;
    if (endTime) training.endTime = endTime;
    if (trainingType) training.trainingType = trainingType;
    if (goals) training.goals = goals;
    if (status) training.status = status;
    if (notes) training.notes = notes;

    await training.save();
    res.json(training);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Training not found' });
    }
    res.status(500).send('Server Error');
  }
};

// @desc    Delete training
// @route   DELETE /api/trainings/:id
// @access  Private (Supervisor, Admin)
exports.deleteTraining = async (req, res) => {
  try {
    const training = await Training.findById(req.params.id);
    
    if (!training) {
      return res.status(404).json({ msg: 'Training not found' });
    }

    // Strict permission check: only supervisor or admin
    if (req.user.role !== 'supervisor' && req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Not authorized. Only supervisors and admins can delete training sessions.' });
    }

    await training.remove();
    res.json({ msg: 'Training removed' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Training not found' });
    }
    res.status(500).send('Server Error');
  }
};

// @desc    Update attendance for a training
// @route   PUT /api/trainings/:id/attendance
// @access  Private (Coach, Supervisor, Admin)
exports.updateAttendance = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const training = await Training.findById(req.params.id);
    
    if (!training) {
      return res.status(404).json({ msg: 'Training not found' });
    }

    // Check if user is authorized to update attendance - allow coach, supervisor, admin
    const isCoach = training.coach.toString() === req.user.id;
    const isSupervisor = req.user.role === 'supervisor';
    const isAdmin = req.user.role === 'admin';
    
    if (!isCoach && !isSupervisor && !isAdmin) {
      return res.status(403).json({ msg: 'Not authorized to update attendance' });
    }

    const { attendance } = req.body;

    // Update attendance
    training.attendance = attendance;
    await training.save();

    res.json(training);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Training not found' });
    }
    res.status(500).send('Server Error');
  }
};

// @desc    Get trainings for a child (parent view)
// @route   GET /api/trainings/child/:childId
// @access  Private (Parent)
exports.getChildTrainings = async (req, res) => {
  try {
    // Get the child user
    const child = await User.findById(req.params.childId);
    
    if (!child) {
      return res.status(404).json({ msg: 'Child not found' });
    }
    
    // Verify that the requester is the parent of this child
    // This would require additional logic to establish parent-child relationships
    // For now, we'll assume a simple authorization check
    if (req.user.role !== 'parent' && req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Not authorized to view this data' });
    }
    
    // Find teams the child belongs to
    const teams = await Team.find({ 'players.player': req.params.childId }).distinct('_id');
    
    if (teams.length === 0) {
      return res.json([]);
    }
    
    // Find trainings for those teams
    const trainings = await Training.find({ team: { $in: teams } })
      .populate('team', 'name sportType')
      .populate('coach', 'firstName lastName email')
      .populate('court', 'name location')
      .sort({ startTime: 1 });
    
    res.json(trainings);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
}; 