const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const trainingController = require('../controllers/trainingController');
const { auth, admin, supervisor, coach } = require('../middleware/auth');

// Create a new training session - ONLY supervisors and admins
router.post(
  '/',
  [
    auth,
    supervisor,
    check('title', 'Title is required').not().isEmpty(),
    check('team', 'Team is required').not().isEmpty(),
    check('coach', 'Coach is required').not().isEmpty(),
    check('startTime', 'Start time is required').not().isEmpty(),
    check('endTime', 'End time is required').not().isEmpty()
  ],
  trainingController.createTraining
);

// Get all trainings (filtered by query params)
router.get('/', [auth, coach], trainingController.getTrainings);

// Get player's trainings
router.get('/player', auth, trainingController.getPlayerTrainings);

// Get coach's trainings
router.get('/coach', [auth, coach], trainingController.getCoachTrainings);

// Get training by ID
router.get('/:id', auth, trainingController.getTrainingById);

// Update training - ONLY supervisors and admins
router.put(
  '/:id',
  [
    auth,
    supervisor,
    check('title', 'Title is required').optional(),
    check('team', 'Team is required').optional(),
    check('coach', 'Coach is required').optional(),
    check('startTime', 'Start time is required').optional(),
    check('endTime', 'End time is required').optional()
  ],
  trainingController.updateTraining
);

// Delete training - ONLY supervisors and admins
router.delete('/:id', [auth, supervisor], trainingController.deleteTraining);

// Update attendance - Coaches can still track attendance
router.put(
  '/:id/attendance',
  [
    auth,
    coach,
    check('attendance', 'Attendance data is required').isArray()
  ],
  trainingController.updateAttendance
);

// Get trainings for a child (parent view)
router.get('/child/:childId', auth, trainingController.getChildTrainings);

module.exports = router; 