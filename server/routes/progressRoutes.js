const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const progressController = require('../controllers/progressController');
const { auth, admin, supervisor, coach } = require('../middleware/auth');

// Create a new player assessment
router.post(
  '/',
  [
    auth,
    coach,
    check('player', 'Player is required').not().isEmpty(),
    check('team', 'Team is required').not().isEmpty(),
    check('skills', 'Skills assessment is required').isObject()
  ],
  progressController.createAssessment
);

// Get all assessments for a player
router.get('/player/:playerId', auth, progressController.getPlayerAssessments);

// Get latest assessment for a player
router.get('/player/:playerId/latest', auth, progressController.getLatestAssessment);

// Get assessments for a team
router.get('/team/:teamId', [auth, coach], progressController.getTeamAssessments);

// Get assessment by ID
router.get('/:id', auth, progressController.getAssessmentById);

// Update assessment
router.put(
  '/:id',
  [
    auth,
    coach,
    check('skills', 'Skills assessment is required').optional().isObject()
  ],
  progressController.updateAssessment
);

// Update development goals
router.put(
  '/:id/goals',
  [
    auth,
    coach,
    check('developmentGoals', 'Development goals are required').isArray()
  ],
  progressController.updateGoals
);

// Get progress for a child (parent view)
router.get('/child/:childId', auth, progressController.getChildProgress);

module.exports = router; 