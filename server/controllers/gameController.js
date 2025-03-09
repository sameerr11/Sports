const { validationResult } = require('express-validator');
const Game = require('../models/Game');
const Team = require('../models/Team');
const User = require('../models/User');

// @desc    Create a new game
// @route   POST /api/games
// @access  Private (Supervisor, Admin)
exports.createGame = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    // Strict permission check: only supervisor or admin
    if (req.user.role !== 'supervisor' && req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Not authorized. Only supervisors and admins can schedule matches.' });
    }

    const {
      title,
      homeTeam,
      awayTeam,
      location,
      court,
      startTime,
      endTime,
      gameType,
      status,
      notes
    } = req.body;

    // Check if teams exist
    const homeTeamExists = await Team.findById(homeTeam);
    if (!homeTeamExists) {
      return res.status(404).json({ msg: 'Home team not found' });
    }

    const awayTeamExists = await Team.findById(awayTeam);
    if (!awayTeamExists) {
      return res.status(404).json({ msg: 'Away team not found' });
    }

    // Create new game
    const newGame = new Game({
      title,
      homeTeam,
      awayTeam,
      location,
      court,
      startTime,
      endTime,
      gameType,
      status,
      notes,
      createdBy: req.user.id
    });

    const game = await newGame.save();
    res.status(201).json(game);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// @desc    Get all games
// @route   GET /api/games
// @access  Private
exports.getGames = async (req, res) => {
  try {
    let query = {};
    
    // Filter by team if provided
    if (req.query.team) {
      const teamId = req.query.team;
      query.$or = [{ homeTeam: teamId }, { awayTeam: teamId }];
    }
    
    // Filter by date range
    if (req.query.startDate && req.query.endDate) {
      query.startTime = {
        $gte: new Date(req.query.startDate),
        $lte: new Date(req.query.endDate)
      };
    }
    
    // Filter by status
    if (req.query.status) {
      query.status = req.query.status;
    }

    const games = await Game.find(query)
      .populate('homeTeam', 'name sportType logo')
      .populate('awayTeam', 'name sportType logo')
      .populate('court', 'name location')
      .sort({ startTime: 1 });
    
    res.json(games);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// @desc    Get games for a player
// @route   GET /api/games/player
// @access  Private
exports.getPlayerGames = async (req, res) => {
  try {
    // Find teams the player belongs to
    const teams = await Team.find({ 'players.player': req.user.id }).distinct('_id');
    
    if (teams.length === 0) {
      return res.json([]);
    }
    
    // Find games for those teams
    const games = await Game.find({ 
      $or: [
        { homeTeam: { $in: teams } },
        { awayTeam: { $in: teams } }
      ]
    })
      .populate('homeTeam', 'name sportType logo')
      .populate('awayTeam', 'name sportType logo')
      .populate('court', 'name location')
      .sort({ startTime: 1 });
    
    res.json(games);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// @desc    Get games for a coach
// @route   GET /api/games/coach
// @access  Private (Coach)
exports.getCoachGames = async (req, res) => {
  try {
    // Find teams the coach is assigned to
    const teams = await Team.find({ 'coaches.coach': req.user.id }).distinct('_id');
    
    if (teams.length === 0) {
      return res.json([]);
    }
    
    // Find games for those teams
    const games = await Game.find({ 
      $or: [
        { homeTeam: { $in: teams } },
        { awayTeam: { $in: teams } }
      ]
    })
      .populate('homeTeam', 'name sportType logo')
      .populate('awayTeam', 'name sportType logo')
      .populate('court', 'name location')
      .sort({ startTime: 1 });
    
    res.json(games);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// @desc    Get game by ID
// @route   GET /api/games/:id
// @access  Private
exports.getGameById = async (req, res) => {
  try {
    const game = await Game.findById(req.params.id)
      .populate('homeTeam', 'name sportType logo players')
      .populate('awayTeam', 'name sportType logo players')
      .populate('court', 'name location sportType')
      .populate('lineups.home.player', 'firstName lastName email')
      .populate('lineups.away.player', 'firstName lastName email')
      .populate('result.winner', 'name');
    
    if (!game) {
      return res.status(404).json({ msg: 'Game not found' });
    }

    res.json(game);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Game not found' });
    }
    res.status(500).send('Server Error');
  }
};

// @desc    Update game
// @route   PUT /api/games/:id
// @access  Private (Supervisor, Admin)
exports.updateGame = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const game = await Game.findById(req.params.id);
    
    if (!game) {
      return res.status(404).json({ msg: 'Game not found' });
    }

    // Strict permission check: only supervisor or admin
    if (req.user.role !== 'supervisor' && req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Not authorized. Only supervisors and admins can update match schedules.' });
    }

    const {
      title,
      homeTeam,
      awayTeam,
      location,
      court,
      startTime,
      endTime,
      gameType,
      status,
      notes,
      result,
      lineups,
      statistics
    } = req.body;

    // Update fields
    if (title) game.title = title;
    if (homeTeam) game.homeTeam = homeTeam;
    if (awayTeam) game.awayTeam = awayTeam;
    if (location) game.location = location;
    if (court) game.court = court;
    if (startTime) game.startTime = startTime;
    if (endTime) game.endTime = endTime;
    if (gameType) game.gameType = gameType;
    if (status) game.status = status;
    if (notes) game.notes = notes;
    if (result) game.result = result;
    if (lineups) game.lineups = lineups;
    if (statistics) game.statistics = statistics;

    await game.save();
    res.json(game);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Game not found' });
    }
    res.status(500).send('Server Error');
  }
};

// @desc    Update game lineups
// @route   PUT /api/games/:id/lineups
// @access  Private (Coach, Supervisor, Admin)
exports.updateLineups = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const game = await Game.findById(req.params.id);
    
    if (!game) {
      return res.status(404).json({ msg: 'Game not found' });
    }

    // Check if user is authorized to update lineups
    const isHomeTeamCoach = await Team.findOne({ 
      _id: game.homeTeam, 
      'coaches.coach': req.user.id 
    });
    
    const isAwayTeamCoach = await Team.findOne({ 
      _id: game.awayTeam, 
      'coaches.coach': req.user.id 
    });
    
    const isSupervisor = req.user.role === 'supervisor';
    const isAdmin = req.user.role === 'admin';
    
    if (!isHomeTeamCoach && !isAwayTeamCoach && !isSupervisor && !isAdmin) {
      return res.status(403).json({ msg: 'Not authorized to update lineups' });
    }

    const { lineups } = req.body;

    // Update lineups
    game.lineups = lineups;
    await game.save();

    res.json(game);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Game not found' });
    }
    res.status(500).send('Server Error');
  }
};

// @desc    Update game result
// @route   PUT /api/games/:id/result
// @access  Private (Coach, Supervisor, Admin)
exports.updateResult = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const game = await Game.findById(req.params.id);
    
    if (!game) {
      return res.status(404).json({ msg: 'Game not found' });
    }

    // Check if user is authorized to update result
    const isHomeTeamCoach = await Team.findOne({ 
      _id: game.homeTeam, 
      'coaches.coach': req.user.id 
    });
    
    const isAwayTeamCoach = await Team.findOne({ 
      _id: game.awayTeam, 
      'coaches.coach': req.user.id 
    });
    
    const isSupervisor = req.user.role === 'supervisor';
    const isAdmin = req.user.role === 'admin';
    
    if (!isHomeTeamCoach && !isAwayTeamCoach && !isSupervisor && !isAdmin) {
      return res.status(403).json({ msg: 'Not authorized to update result' });
    }

    const { result, status } = req.body;

    // Update result and status
    game.result = result;
    if (status) game.status = status;
    await game.save();

    res.json(game);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Game not found' });
    }
    res.status(500).send('Server Error');
  }
};

// @desc    Get games for a child (parent view)
// @route   GET /api/games/child/:childId
// @access  Private (Parent)
exports.getChildGames = async (req, res) => {
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
    
    // Find games for those teams
    const games = await Game.find({ 
      $or: [
        { homeTeam: { $in: teams } },
        { awayTeam: { $in: teams } }
      ]
    })
      .populate('homeTeam', 'name sportType logo')
      .populate('awayTeam', 'name sportType logo')
      .populate('court', 'name location')
      .sort({ startTime: 1 });
    
    res.json(games);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
}; 