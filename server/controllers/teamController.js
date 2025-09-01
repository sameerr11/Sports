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
    const { name, sportType, ageGroup, level, logo } = req.body;

    // Check if sports supervisor is trying to create a team for a sport they're not assigned to
    if (req.user.role === 'supervisor') {
      const supervisor = await User.findById(req.user.id);
      
      if (supervisor.supervisorType === 'sports' && 
          Array.isArray(supervisor.supervisorSportTypes) && 
          supervisor.supervisorSportTypes.length > 0) {
        
        // If the requested sport type is not in the supervisor's assigned types
        if (!supervisor.supervisorSportTypes.includes(sportType)) {
          return res.status(403).json({ 
            msg: 'Not authorized to create teams for this sport type' 
          });
        }
      }
    }

    const newTeam = new Team({
      name,
      sportType,
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
    let query = {};
    
    // Check if we should include inactive teams (admin reports)
    if (req.query.includeInactive === 'true' && req.user && req.user.role === 'admin') {
      // Admin can see all teams (active and inactive)
      // No isActive filter needed
    } else {
      // Default behavior - only active teams
      query.isActive = true;
    }
    
    // Filter teams by sport type for sports supervisors
    if (req.user && req.user.role === 'supervisor') {
      // Get the supervisor details
      const supervisor = await User.findById(req.user.id);
      
      // If supervisor is a sports supervisor, filter by their assigned sport types
      if (supervisor.supervisorType === 'sports' && 
          Array.isArray(supervisor.supervisorSportTypes) && 
          supervisor.supervisorSportTypes.length > 0) {
        
        query.sportType = { $in: supervisor.supervisorSportTypes };
      }
      // General supervisors and cafeteria supervisors see all teams (or none for cafeteria)
    }
    
    const teams = await Team.find(query)
      .populate('coaches.coach', 'firstName lastName email')
      .populate('players.player', 'firstName lastName email')
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
    const { name, sportType, ageGroup, level, logo, isActive } = req.body;

    let team = await Team.findById(req.params.id);
    
    if (!team) {
      return res.status(404).json({ msg: 'Team not found' });
    }

    // Check if sports supervisor is trying to update a team for a sport they're not assigned to
    if (req.user.role === 'supervisor') {
      const supervisor = await User.findById(req.user.id);
      
      if (supervisor.supervisorType === 'sports' && 
          Array.isArray(supervisor.supervisorSportTypes) && 
          supervisor.supervisorSportTypes.length > 0) {
        
        // If the team's current sport type is not in supervisor's assigned types
        if (!supervisor.supervisorSportTypes.includes(team.sportType)) {
          return res.status(403).json({ 
            msg: 'Not authorized to update teams for this sport type' 
          });
        }
        
        // If trying to change sport type, check if new type is in supervisor's assigned types
        if (sportType && !supervisor.supervisorSportTypes.includes(sportType)) {
          return res.status(403).json({ 
            msg: 'Not authorized to update teams to this sport type' 
          });
        }
      }
    }

    // Build team object
    const teamFields = {};
    if (name) teamFields.name = name;
    if (sportType) teamFields.sportType = sportType;
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

// @desc    Get teams for a specific player by ID
// @route   GET /api/teams/player/:playerId
// @access  Private (Parent, Admin, Supervisor)
exports.getTeamsByPlayerId = async (req, res) => {
  try {
    const { playerId } = req.params;
    
    // Check if user is authorized to view this player's teams
    // Allow if user is the player themselves, a parent of the player, or an admin/supervisor
    const isAuthorized = 
      req.user.id === playerId || 
      req.user.role === 'admin' || 
      req.user.role === 'supervisor' ||
      (req.user.role === 'parent' && await isParentOfPlayer(req.user.id, playerId));
    
    if (!isAuthorized) {
      return res.status(403).json({ msg: 'Not authorized to view this player\'s teams' });
    }
    
    // Find teams where the specified player is a member
    const teams = await Team.find({
      'players.player': playerId,
      isActive: true
    })
      .populate('coaches.coach', 'firstName lastName email profilePicture')
      .populate('players.player', 'firstName lastName email profilePicture')
      .sort({ createdAt: -1 });
    
    res.json(teams);
  } catch (err) {
    console.error('Error fetching player teams by ID:', err.message);
    res.status(500).send('Server Error');
  }
};

// Helper function to check if a user is a parent of a player
const isParentOfPlayer = async (parentId, playerId) => {
  try {
    const player = await User.findById(playerId);
    return player && player.parentId && player.parentId.toString() === parentId;
  } catch (err) {
    console.error('Error checking parent relationship:', err.message);
    return false;
  }
}; 