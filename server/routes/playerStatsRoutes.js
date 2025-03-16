const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const { auth } = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const playerStatsController = require('../controllers/playerStatsController');

// @route   GET /api/player-stats
// @desc    Get all player stats
// @access  Private (Admin, Support, Coach)
router.get(
  '/',
  auth,
  authorize(['admin', 'support', 'coach']),
  playerStatsController.getAllPlayerStats
);

// @route   GET /api/player-stats/player/:playerId
// @desc    Get stats by player ID
// @access  Private
router.get(
  '/player/:playerId',
  auth,
  playerStatsController.getPlayerStatsByPlayerId
);

// @route   GET /api/player-stats/:id
// @desc    Get stats by ID
// @access  Private
router.get(
  '/:id',
  auth,
  playerStatsController.getPlayerStatsById
);

// @route   POST /api/player-stats
// @desc    Create new player stats
// @access  Private (Admin, Support, Coach)
router.post(
  '/',
  auth,
  authorize(['admin', 'support', 'coach']),
  [
    check('player', 'Player ID is required').not().isEmpty(),
    check('sportType', 'Sport type is required').not().isEmpty(),
  ],
  playerStatsController.createPlayerStats
);

// @route   PUT /api/player-stats/:id
// @desc    Update player stats
// @access  Private (Admin, Support, Coach)
router.put(
  '/:id',
  auth,
  authorize(['admin', 'support', 'coach']),
  playerStatsController.updatePlayerStats
);

// @route   DELETE /api/player-stats/:id
// @desc    Delete player stats
// @access  Private (Admin, Support)
router.delete(
  '/:id',
  auth,
  authorize(['admin', 'support']),
  playerStatsController.deletePlayerStats
);

module.exports = router; 