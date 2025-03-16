const { validationResult } = require('express-validator');
const mongoose = require('mongoose');
const PlayerStats = require('../models/PlayerStats');
const User = require('../models/User');

// @desc    Get all player stats
// @route   GET /api/player-stats
// @access  Private (Admin, Support, Coach)
exports.getAllPlayerStats = async (req, res) => {
  try {
    const playerStats = await PlayerStats.find()
      .populate('player', 'firstName lastName email profilePicture')
      .populate('createdBy', 'firstName lastName');
      
    res.json(playerStats);
  } catch (err) {
    console.error('Error getting player stats:', err.message);
    res.status(500).send('Server Error');
  }
};

// @desc    Get player stats by player ID
// @route   GET /api/player-stats/player/:playerId
// @access  Private
exports.getPlayerStatsByPlayerId = async (req, res) => {
  try {
    const playerStats = await PlayerStats.find({ player: req.params.playerId })
      .populate('player', 'firstName lastName email profilePicture')
      .populate('createdBy', 'firstName lastName');
    
    if (playerStats.length === 0) {
      return res.status(404).json({ msg: 'No stats found for this player' });
    }
    
    res.json(playerStats);
  } catch (err) {
    console.error('Error getting player stats:', err.message);
    res.status(500).send('Server Error');
  }
};

// @desc    Get player stats by ID
// @route   GET /api/player-stats/:id
// @access  Private
exports.getPlayerStatsById = async (req, res) => {
  try {
    const playerStats = await PlayerStats.findById(req.params.id)
      .populate('player', 'firstName lastName email profilePicture')
      .populate('createdBy', 'firstName lastName');
    
    if (!playerStats) {
      return res.status(404).json({ msg: 'Player stats not found' });
    }
    
    res.json(playerStats);
  } catch (err) {
    console.error('Error getting player stats:', err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Player stats not found' });
    }
    res.status(500).send('Server Error');
  }
};

// @desc    Create player stats
// @route   POST /api/player-stats
// @access  Private (Admin, Support, Coach)
exports.createPlayerStats = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { player: playerId, sportType } = req.body;

    // Check if player exists and has player role
    const player = await User.findById(playerId);
    if (!player) {
      return res.status(404).json({ msg: 'Player not found' });
    }
    
    if (player.role !== 'player') {
      return res.status(400).json({ msg: 'User is not a player' });
    }

    // Check if stats already exist for this player and sport
    const existingStats = await PlayerStats.findOne({ 
      player: playerId, 
      sportType 
    });

    if (existingStats) {
      return res.status(400).json({ 
        msg: 'Stats already exist for this player and sport. Use the update endpoint instead.' 
      });
    }

    // Create new player stats
    const newPlayerStats = new PlayerStats({
      ...req.body,
      createdBy: req.user.id
    });

    const playerStats = await newPlayerStats.save();
    
    res.json(playerStats);
  } catch (err) {
    console.error('Error creating player stats:', err.message);
    res.status(500).send('Server Error');
  }
};

// @desc    Update player stats
// @route   PUT /api/player-stats/:id
// @access  Private (Admin, Support, Coach)
exports.updatePlayerStats = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const playerStats = await PlayerStats.findById(req.params.id);
    
    if (!playerStats) {
      return res.status(404).json({ msg: 'Player stats not found' });
    }

    // Update player stats with new values
    // Set the common.lastUpdated field to current date
    const updatedFields = {
      ...req.body,
      common: {
        ...req.body.common,
        lastUpdated: Date.now()
      }
    };
    
    // Update the document
    const updatedPlayerStats = await PlayerStats.findByIdAndUpdate(
      req.params.id,
      { $set: updatedFields },
      { new: true }
    ).populate('player', 'firstName lastName email profilePicture')
     .populate('createdBy', 'firstName lastName');
    
    res.json(updatedPlayerStats);
  } catch (err) {
    console.error('Error updating player stats:', err.message);
    res.status(500).send('Server Error');
  }
};

// @desc    Delete player stats
// @route   DELETE /api/player-stats/:id
// @access  Private (Admin, Support)
exports.deletePlayerStats = async (req, res) => {
  try {
    const playerStats = await PlayerStats.findById(req.params.id);
    
    if (!playerStats) {
      return res.status(404).json({ msg: 'Player stats not found' });
    }

    await playerStats.remove();
    
    res.json({ msg: 'Player stats removed' });
  } catch (err) {
    console.error('Error deleting player stats:', err.message);
    res.status(500).send('Server Error');
  }
}; 