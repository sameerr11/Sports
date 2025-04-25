const { validationResult } = require('express-validator');
const mongoose = require('mongoose');
const PlayerStats = require('../models/PlayerStats');
const User = require('../models/User');
const notificationService = require('../utils/notificationService');

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
    res.status(500).json({ msg: 'Failed to load stats. Please try again.' });
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

// @desc    Create new player stats
// @route   POST /api/player-stats
// @access  Private (Coach)
exports.createPlayerStats = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const {
      player,
      sportType,
      common,
      basketball,
      football,
      volleyball,
      selfDefense,
      karate,
      gymnastics,
      gym,
      zumba,
      swimming,
      pingPong,
      grades
    } = req.body;

    // Check if player exists
    const playerUser = await User.findById(player);
    if (!playerUser) {
      return res.status(404).json({ msg: 'Player not found' });
    }

    // Check if stats already exist for this player and sport
    const existingStats = await PlayerStats.findOne({ 
      player: player, 
      sportType: sportType 
    });
    
    if (existingStats) {
      return res.status(400).json({ msg: 'Stats for this player and sport already exist' });
    }

    const playerStats = new PlayerStats({
      player,
      sportType,
      common,
      basketball,
      football,
      volleyball,
      selfDefense,
      karate,
      gymnastics,
      gym,
      zumba,
      swimming,
      pingPong,
      grades,
      createdBy: req.user.id
    });

    await playerStats.save();

    // Populate fields for response
    await playerStats.populate('player', 'firstName lastName');
    await playerStats.populate('createdBy', 'firstName lastName');

    // Notify player about their updated stats
      await notificationService.createNotification({
        recipientId: player,
        senderId: req.user.id,
        type: 'player_performance',
        title: 'Your Performance Stats',
      message: `Your performance metrics have been updated for ${sportType}`,
        relatedTo: {
          model: 'PlayerStats',
          id: playerStats._id
        }
      });

    res.status(201).json(playerStats);
  } catch (err) {
    console.error('Error creating player stats:', err.message);
    res.status(500).json({ msg: 'Failed to save stats. Please try again.' });
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
    
    // Notify the player about their updated stats
    await notificationService.createNotification({
      recipientId: updatedPlayerStats.player._id,
      senderId: req.user.id,
      type: 'player_performance',
      title: 'Your Performance Stats',
      message: `Your performance metrics have been updated for ${updatedPlayerStats.sportType}`,
      relatedTo: {
        model: 'PlayerStats',
        id: updatedPlayerStats._id
      }
    });
    
    res.json(updatedPlayerStats);
  } catch (err) {
    console.error('Error updating player stats:', err.message);
    res.status(500).json({ msg: 'Failed to save stats. Please try again.' });
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

    await PlayerStats.findByIdAndDelete(req.params.id);
    
    res.json({ msg: 'Player stats removed' });
  } catch (err) {
    console.error('Error deleting player stats:', err.message);
    res.status(500).json({ msg: 'Failed to delete stats. Please try again.' });
  }
}; 