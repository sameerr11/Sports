const { validationResult } = require('express-validator');
const Team = require('../models/Team');
const User = require('../models/User');

// @desc    Create a new team
// @route   POST /api/teams
// @access  Private (Supervisor only)
exports.createTeam = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { name, sportType, description, ageGroup, level, logo } = req.body;

    const newTeam = new Team({
      name,
      sportType,
      description,
      ageGroup,
      level,
      logo,
      createdBy: req.user.id
    });

    const team = await newTeam.save();
    res.status(201).json(team);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// @desc    Get all teams
// @route   GET /api/teams
// @access  Public
exports.getTeams = async (req, res) => {
  try {
    const teams = await Team.find({ isActive: true })
      .populate('coaches.coach', 'firstName lastName email')
      .sort({ createdAt: -1 });
    
    res.json(teams);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// @desc    Get team by ID
// @route   GET /api/teams/:id
// @access  Public
exports.getTeamById = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id)
      .populate('coaches.coach', 'firstName lastName email profilePicture')
      .populate('players.player', 'firstName lastName email profilePicture');
    
    if (!team) {
      return res.status(404).json({ msg: 'Team not found' });
    }

    res.json(team);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Team not found' });
    }
    res.status(500).send('Server Error');
  }
};

// @desc    Update team
// @route   PUT /api/teams/:id
// @access  Private (Supervisor only)
exports.updateTeam = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { name, sportType, description, ageGroup, level, logo, isActive } = req.body;

    let team = await Team.findById(req.params.id);
    
    if (!team) {
      return res.status(404).json({ msg: 'Team not found' });
    }

    // Build team object
    const teamFields = {};
    if (name) teamFields.name = name;
    if (sportType) teamFields.sportType = sportType;
    if (description) teamFields.description = description;
    if (ageGroup) teamFields.ageGroup = ageGroup;
    if (level) teamFields.level = level;
    if (logo) teamFields.logo = logo;
    if (isActive !== undefined) teamFields.isActive = isActive;

    team = await Team.findByIdAndUpdate(
      req.params.id,
      { $set: teamFields },
      { new: true }
    );

    res.json(team);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// @desc    Delete team
// @route   DELETE /api/teams/:id
// @access  Private (Supervisor only)
exports.deleteTeam = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);
    
    if (!team) {
      return res.status(404).json({ msg: 'Team not found' });
    }

    await Team.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Team removed' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Team not found' });
    }
    res.status(500).send('Server Error');
  }
};

// @desc    Add player to team
// @route   POST /api/teams/:id/players
// @access  Private (Supervisor only)
exports.addPlayerToTeam = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { playerId, position } = req.body;

    const team = await Team.findById(req.params.id);
    
    if (!team) {
      return res.status(404).json({ msg: 'Team not found' });
    }

    // Check if player exists and has player role
    const player = await User.findById(playerId);
    if (!player) {
      return res.status(404).json({ msg: 'Player not found' });
    }
    
    if (player.role !== 'player') {
      return res.status(400).json({ msg: 'User is not a player' });
    }

    // Check if player is already in the team
    if (team.players.some(p => p.player.toString() === playerId)) {
      return res.status(400).json({ msg: 'Player is already in the team' });
    }

    team.players.unshift({
      player: playerId,
      position
    });

    await team.save();
    
    // Return updated team with populated player data
    const updatedTeam = await Team.findById(req.params.id)
      .populate('players.player', 'firstName lastName email profilePicture');
    
    res.json(updatedTeam.players);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// @desc    Remove player from team
// @route   DELETE /api/teams/:id/players/:playerId
// @access  Private (Supervisor only)
exports.removePlayerFromTeam = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);
    
    if (!team) {
      return res.status(404).json({ msg: 'Team not found' });
    }

    // Check if player is in the team
    const playerIndex = team.players.findIndex(
      p => p.player.toString() === req.params.playerId
    );

    if (playerIndex === -1) {
      return res.status(404).json({ msg: 'Player not found in team' });
    }

    // Remove player
    team.players.splice(playerIndex, 1);
    await team.save();

    res.json(team.players);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// @desc    Add coach to team
// @route   POST /api/teams/:id/coaches
// @access  Private (Supervisor only)
exports.addCoachToTeam = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { coachId, role } = req.body;

    const team = await Team.findById(req.params.id);
    
    if (!team) {
      return res.status(404).json({ msg: 'Team not found' });
    }

    // Check if coach exists and has coach role
    const coach = await User.findById(coachId);
    if (!coach) {
      return res.status(404).json({ msg: 'Coach not found' });
    }
    
    if (coach.role !== 'coach') {
      return res.status(400).json({ msg: 'User is not a coach' });
    }

    // Check if coach is already assigned to the team
    if (team.coaches.some(c => c.coach.toString() === coachId)) {
      return res.status(400).json({ msg: 'Coach is already assigned to the team' });
    }

    team.coaches.unshift({
      coach: coachId,
      role: role || 'Assistant Coach'
    });

    await team.save();
    
    // Return updated team with populated coach data
    const updatedTeam = await Team.findById(req.params.id)
      .populate('coaches.coach', 'firstName lastName email profilePicture');
    
    res.json(updatedTeam.coaches);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// @desc    Remove coach from team
// @route   DELETE /api/teams/:id/coaches/:coachId
// @access  Private (Supervisor only)
exports.removeCoachFromTeam = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);
    
    if (!team) {
      return res.status(404).json({ msg: 'Team not found' });
    }

    // Check if coach is assigned to the team
    const coachIndex = team.coaches.findIndex(
      c => c.coach.toString() === req.params.coachId
    );

    if (coachIndex === -1) {
      return res.status(404).json({ msg: 'Coach not found in team' });
    }

    // Remove coach
    team.coaches.splice(coachIndex, 1);
    await team.save();

    res.json(team.coaches);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// @desc    Get teams coached by a specific coach
// @route   GET /api/teams/coach
// @access  Private (Coach, Supervisor, Admin)
exports.getTeamsByCoach = async (req, res) => {
  try {
    // Find teams where the current user is a coach
    const teams = await Team.find({
      'coaches.coach': req.user.id,
      isActive: true
    })
      .populate('coaches.coach', 'firstName lastName email profilePicture')
      .populate('players.player', 'firstName lastName email profilePicture')
      .sort({ createdAt: -1 });
    
    res.json(teams);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// @desc    Get teams where current user is a player
// @route   GET /api/teams/player
// @access  Private (Player)
exports.getTeamsByPlayer = async (req, res) => {
  try {
    // Find teams where the current user is a player
    const teams = await Team.find({
      'players.player': req.user.id,
      isActive: true
    })
      .populate('coaches.coach', 'firstName lastName email profilePicture')
      .populate('players.player', 'firstName lastName email profilePicture')
      .sort({ createdAt: -1 });
    
    res.json(teams);
  } catch (err) {
    console.error('Error fetching player teams:', err.message);
    res.status(500).send('Server Error');
  }
}; 