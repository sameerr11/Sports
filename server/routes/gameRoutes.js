const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const gameController = require('../controllers/gameController');
const { auth, admin, supervisor, coach } = require('../middleware/auth');

// Create a new game - ONLY supervisors and admins
router.post(
  '/',
  [
    auth,
    supervisor,
    check('title', 'Title is required').not().isEmpty(),
    check('homeTeam', 'Home team is required').not().isEmpty(),
    check('awayTeam', 'Away team is required').not().isEmpty(),
    check('location', 'Location is required').not().isEmpty(),
    check('startTime', 'Start time is required').not().isEmpty(),
    check('endTime', 'End time is required').not().isEmpty()
  ],
  gameController.createGame
);

// Get all games (filtered by query params)
router.get('/', auth, gameController.getGames);

// Get player's games
router.get('/player', auth, gameController.getPlayerGames);

// Get coach's games
router.get('/coach', [auth, coach], gameController.getCoachGames);

// Get game by ID
router.get('/:id', auth, gameController.getGameById);

// Update game - ONLY supervisors and admins
router.put(
  '/:id',
  [
    auth,
    supervisor,
    check('title', 'Title is required').optional(),
    check('homeTeam', 'Home team is required').optional(),
    check('awayTeam', 'Away team is required').optional(),
    check('location', 'Location is required').optional(),
    check('startTime', 'Start time is required').optional(),
    check('endTime', 'End time is required').optional()
  ],
  gameController.updateGame
);

// Update game lineups - Coaches can still manage team lineups
router.put(
  '/:id/lineups',
  [
    auth,
    coach,
    check('lineups', 'Lineups data is required').isObject()
  ],
  gameController.updateLineups
);

// Update game result - Coaches can still update match results
router.put(
  '/:id/result',
  [
    auth,
    coach,
    check('result', 'Result data is required').isObject()
  ],
  gameController.updateResult
);

// Get games for a child (parent view)
router.get('/child/:childId', auth, gameController.getChildGames);

module.exports = router; 