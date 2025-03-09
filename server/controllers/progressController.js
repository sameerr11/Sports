const { validationResult } = require('express-validator');
const PlayerProgress = require('../models/PlayerProgress');
const Team = require('../models/Team');
const User = require('../models/User');

// @desc    Create a new player assessment
// @route   POST /api/progress
// @access  Private (Coach, Supervisor, Admin)
exports.createAssessment = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const {
      player,
      team,
      assessmentDate,
      skills,
      performanceStats,
      trainingAttendance,
      developmentGoals,
      notes
    } = req.body;

    // Check if player exists
    const playerExists = await User.findById(player);
    if (!playerExists || playerExists.role !== 'player') {
      return res.status(404).json({ msg: 'Player not found' });
    }

    // Check if team exists
    const teamExists = await Team.findById(team);
    if (!teamExists) {
      return res.status(404).json({ msg: 'Team not found' });
    }

    // Check if player belongs to the team
    const isInTeam = await Team.findOne({
      _id: team,
      'players.player': player
    });
    
    if (!isInTeam) {
      return res.status(400).json({ msg: 'Player does not belong to this team' });
    }

    // Create new assessment
    const newProgress = new PlayerProgress({
      player,
      team,
      coach: req.user.id,
      assessmentDate: assessmentDate || Date.now(),
      skills,
      performanceStats,
      trainingAttendance,
      developmentGoals,
      notes
    });

    const progress = await newProgress.save();
    res.status(201).json(progress);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// @desc    Get all assessments for a player
// @route   GET /api/progress/player/:playerId
// @access  Private (Coach, Supervisor, Admin, Parent of player, Player themselves)
exports.getPlayerAssessments = async (req, res) => {
  try {
    const playerId = req.params.playerId;
    
    // Check if player exists
    const playerExists = await User.findById(playerId);
    if (!playerExists) {
      return res.status(404).json({ msg: 'Player not found' });
    }

    // Authorization check
    const isCoach = await Team.findOne({
      'players.player': playerId,
      'coaches.coach': req.user.id
    });
    
    const isSupervisor = req.user.role === 'supervisor';
    const isAdmin = req.user.role === 'admin';
    const isPlayer = req.user.id === playerId;
    const isParent = req.user.role === 'parent'; // Parent relationship would need more validation in a real app
    
    if (!isCoach && !isSupervisor && !isAdmin && !isPlayer && !isParent) {
      return res.status(403).json({ msg: 'Not authorized to view these assessments' });
    }

    const assessments = await PlayerProgress.find({ player: playerId })
      .populate('team', 'name sportType')
      .populate('coach', 'firstName lastName email')
      .populate('player', 'firstName lastName email')
      .sort({ assessmentDate: -1 });
    
    res.json(assessments);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// @desc    Get latest assessment for a player
// @route   GET /api/progress/player/:playerId/latest
// @access  Private (Coach, Supervisor, Admin, Parent of player, Player themselves)
exports.getLatestAssessment = async (req, res) => {
  try {
    const playerId = req.params.playerId;
    
    // Check if player exists
    const playerExists = await User.findById(playerId);
    if (!playerExists) {
      return res.status(404).json({ msg: 'Player not found' });
    }

    // Authorization check (same as getPlayerAssessments)
    const isCoach = await Team.findOne({
      'players.player': playerId,
      'coaches.coach': req.user.id
    });
    
    const isSupervisor = req.user.role === 'supervisor';
    const isAdmin = req.user.role === 'admin';
    const isPlayer = req.user.id === playerId;
    const isParent = req.user.role === 'parent';
    
    if (!isCoach && !isSupervisor && !isAdmin && !isPlayer && !isParent) {
      return res.status(403).json({ msg: 'Not authorized to view this assessment' });
    }

    const assessment = await PlayerProgress.findOne({ player: playerId })
      .populate('team', 'name sportType')
      .populate('coach', 'firstName lastName email')
      .populate('player', 'firstName lastName email')
      .sort({ assessmentDate: -1 });
    
    if (!assessment) {
      return res.status(404).json({ msg: 'No assessments found for this player' });
    }
    
    res.json(assessment);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// @desc    Get assessments for a team
// @route   GET /api/progress/team/:teamId
// @access  Private (Coach, Supervisor, Admin)
exports.getTeamAssessments = async (req, res) => {
  try {
    const teamId = req.params.teamId;
    
    // Check if team exists
    const teamExists = await Team.findById(teamId);
    if (!teamExists) {
      return res.status(404).json({ msg: 'Team not found' });
    }

    // Authorization check
    const isCoach = await Team.findOne({
      _id: teamId,
      'coaches.coach': req.user.id
    });
    
    const isSupervisor = req.user.role === 'supervisor';
    const isAdmin = req.user.role === 'admin';
    
    if (!isCoach && !isSupervisor && !isAdmin) {
      return res.status(403).json({ msg: 'Not authorized to view these assessments' });
    }

    // Get latest assessment for each player in the team
    const players = teamExists.players.map(p => p.player);
    
    const assessments = await Promise.all(
      players.map(async (playerId) => {
        const latestAssessment = await PlayerProgress.findOne({ 
          player: playerId,
          team: teamId
        })
          .populate('player', 'firstName lastName email')
          .sort({ assessmentDate: -1 });
        
        return latestAssessment;
      })
    );
    
    // Filter out nulls (players with no assessments)
    const validAssessments = assessments.filter(a => a !== null);
    
    res.json(validAssessments);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// @desc    Get assessment by ID
// @route   GET /api/progress/:id
// @access  Private
exports.getAssessmentById = async (req, res) => {
  try {
    const assessment = await PlayerProgress.findById(req.params.id)
      .populate('team', 'name sportType')
      .populate('coach', 'firstName lastName email')
      .populate('player', 'firstName lastName email');
    
    if (!assessment) {
      return res.status(404).json({ msg: 'Assessment not found' });
    }

    // Authorization check
    const isCoach = assessment.coach._id.toString() === req.user.id;
    const isSupervisor = req.user.role === 'supervisor';
    const isAdmin = req.user.role === 'admin';
    const isPlayer = assessment.player._id.toString() === req.user.id;
    const isParent = req.user.role === 'parent'; // Parent relationship would need more validation
    
    if (!isCoach && !isSupervisor && !isAdmin && !isPlayer && !isParent) {
      return res.status(403).json({ msg: 'Not authorized to view this assessment' });
    }

    res.json(assessment);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Assessment not found' });
    }
    res.status(500).send('Server Error');
  }
};

// @desc    Update assessment
// @route   PUT /api/progress/:id
// @access  Private (Coach, Supervisor, Admin)
exports.updateAssessment = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const assessment = await PlayerProgress.findById(req.params.id);
    
    if (!assessment) {
      return res.status(404).json({ msg: 'Assessment not found' });
    }

    // Authorization check
    const isCoach = assessment.coach.toString() === req.user.id;
    const isSupervisor = req.user.role === 'supervisor';
    const isAdmin = req.user.role === 'admin';
    
    if (!isCoach && !isSupervisor && !isAdmin) {
      return res.status(403).json({ msg: 'Not authorized to update this assessment' });
    }

    const {
      assessmentDate,
      skills,
      performanceStats,
      trainingAttendance,
      developmentGoals,
      notes
    } = req.body;

    // Update fields
    if (assessmentDate) assessment.assessmentDate = assessmentDate;
    if (skills) assessment.skills = skills;
    if (performanceStats) assessment.performanceStats = performanceStats;
    if (trainingAttendance) assessment.trainingAttendance = trainingAttendance;
    if (developmentGoals) assessment.developmentGoals = developmentGoals;
    if (notes) assessment.notes = notes;

    await assessment.save();
    res.json(assessment);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Assessment not found' });
    }
    res.status(500).send('Server Error');
  }
};

// @desc    Update development goals
// @route   PUT /api/progress/:id/goals
// @access  Private (Coach, Supervisor, Admin)
exports.updateGoals = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const assessment = await PlayerProgress.findById(req.params.id);
    
    if (!assessment) {
      return res.status(404).json({ msg: 'Assessment not found' });
    }

    // Authorization check
    const isCoach = assessment.coach.toString() === req.user.id;
    const isSupervisor = req.user.role === 'supervisor';
    const isAdmin = req.user.role === 'admin';
    
    if (!isCoach && !isSupervisor && !isAdmin) {
      return res.status(403).json({ msg: 'Not authorized to update development goals' });
    }

    const { developmentGoals } = req.body;

    // Update goals
    assessment.developmentGoals = developmentGoals;
    await assessment.save();

    res.json(assessment);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Assessment not found' });
    }
    res.status(500).send('Server Error');
  }
};

// @desc    Get progress for a child (parent view)
// @route   GET /api/progress/child/:childId
// @access  Private (Parent)
exports.getChildProgress = async (req, res) => {
  try {
    const childId = req.params.childId;
    
    // Check if child exists
    const child = await User.findById(childId);
    if (!child) {
      return res.status(404).json({ msg: 'Child not found' });
    }
    
    // Verify that the requester is the parent of this child
    // This would require additional logic to establish parent-child relationships
    // For now, we'll assume a simple authorization check
    if (req.user.role !== 'parent' && req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Not authorized to view this data' });
    }
    
    const assessments = await PlayerProgress.find({ player: childId })
      .populate('team', 'name sportType')
      .populate('coach', 'firstName lastName email')
      .sort({ assessmentDate: -1 });
    
    res.json(assessments);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
}; 