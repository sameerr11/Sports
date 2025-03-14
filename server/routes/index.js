const express = require('express');
const router = express.Router();
const { check } = require('express-validator');

// Controllers
const userController = require('../controllers/userController');
const authController = require('../controllers/authController');
const notificationController = require('../controllers/notificationController');
const courtController = require('../controllers/courtController');
const bookingController = require('../controllers/bookingController');
const teamController = require('../controllers/teamController');
const cafeteriaRoutes = require('./cafeteriaRoutes');
const trainingPlanController = require('../controllers/trainingPlanController');
const feedbackController = require('../controllers/feedbackController');

// Middleware
const { auth, admin, supervisor, coach, player, parent } = require('../middleware/auth');

// Auth routes
router.post(
  '/auth/login',
  [
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password is required').exists()
  ],
  authController.login
);
router.get('/auth/me', auth, authController.getCurrentUser);

// User routes
router.post(
  '/users',
  [
    auth,
    admin,
    check('firstName', 'First name is required').not().isEmpty(),
    check('lastName', 'Last name is required').not().isEmpty(),
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 }),
    check('role', 'Role is required').not().isEmpty()
  ],
  userController.registerUser
);
router.get('/users', [auth, admin], userController.getUsers);
router.get('/users/role/:role', [auth, supervisor], userController.getUsersByRole);
router.get('/users/parent/children', [auth, parent], userController.getParentChildren);
router.get('/users/:id', [auth, admin], userController.getUserById);
router.put('/users/:id', [auth, admin], userController.updateUser);
router.delete('/users/:id', [auth, admin], userController.deleteUser);
router.put('/users/:id/password', [auth, admin], userController.changePassword);

// Notification routes
router.get('/notifications', auth, notificationController.getUserNotifications);
router.put('/notifications/:id', auth, notificationController.markAsRead);
router.put('/notifications/read-all', auth, notificationController.markAllAsRead);
router.delete('/notifications/:id', auth, notificationController.deleteNotification);
router.get('/notifications/unread-count', auth, notificationController.getUnreadCount);

// Court routes
router.post(
  '/courts',
  [
    auth,
    supervisor,
    check('name', 'Name is required').not().isEmpty(),
    check('sportType', 'Sport type is required').not().isEmpty(),
    check('location', 'Location is required').not().isEmpty(),
    check('hourlyRate', 'Hourly rate is required').isNumeric()
  ],
  courtController.createCourt
);
router.get('/courts', auth, courtController.getCourts);
router.get('/courts/:id', courtController.getCourtById);
router.put(
  '/courts/:id',
  [
    auth,
    supervisor
  ],
  courtController.updateCourt
);
router.delete('/courts/:id', [auth, supervisor], courtController.deleteCourt);
router.get('/courts/:id/availability', courtController.getCourtAvailability);

// Booking routes
router.post(
  '/bookings',
  [
    auth,
    check('court', 'Court is required').not().isEmpty(),
    check('startTime', 'Start time is required').not().isEmpty(),
    check('endTime', 'End time is required').not().isEmpty()
  ],
  bookingController.createBooking
);
router.get('/bookings', auth, bookingController.getBookings);
router.get('/bookings/me', auth, bookingController.getUserBookings);
router.get('/bookings/:id', auth, bookingController.getBookingById);
router.put(
  '/bookings/:id/status',
  [
    auth,
    supervisor,
    check('status', 'Status is required').isIn(['Pending', 'Confirmed', 'Cancelled', 'Completed'])
  ],
  bookingController.updateBookingStatus
);
router.put('/bookings/:id/cancel', auth, bookingController.cancelBooking);

// Team routes
router.post(
  '/teams',
  [
    auth,
    supervisor,
    check('name', 'Name is required').not().isEmpty(),
    check('sportType', 'Sport type is required').not().isEmpty()
  ],
  teamController.createTeam
);
router.get('/teams', auth, teamController.getTeams);
router.get('/teams/coach', [auth, coach], teamController.getTeamsByCoach);
router.get('/teams/player', [auth, player], teamController.getTeamsByPlayer);
router.get('/teams/player/:playerId', [auth], teamController.getTeamsByPlayerId);
router.get('/teams/:id', teamController.getTeamById);
router.put('/teams/:id', [auth, supervisor], teamController.updateTeam);
router.delete('/teams/:id', [auth, supervisor], teamController.deleteTeam);

// Team player management
router.post(
  '/teams/:id/players',
  [
    auth,
    supervisor,
    check('playerId', 'Player ID is required').not().isEmpty()
  ],
  teamController.addPlayerToTeam
);
router.delete('/teams/:id/players/:playerId', [auth, supervisor], teamController.removePlayerFromTeam);

// Team coach management
router.post(
  '/teams/:id/coaches',
  [
    auth,
    supervisor,
    check('coachId', 'Coach ID is required').not().isEmpty()
  ],
  teamController.addCoachToTeam
);
router.delete('/teams/:id/coaches/:coachId', [auth, supervisor], teamController.removeCoachFromTeam);

// Cafeteria routes
router.use('/cafeteria', cafeteriaRoutes);

// Training plan routes
router.post(
  '/training-plans',
  [
    auth,
    supervisor,
    check('title', 'Title is required').not().isEmpty(),
    check('team', 'Team is required').not().isEmpty(),
    check('date', 'Date is required').not().isEmpty(),
    check('duration', 'Duration is required').isNumeric()
  ],
  trainingPlanController.createTrainingPlan
);

router.get('/training-plans', [auth, supervisor], trainingPlanController.getAllTrainingPlans);
router.get('/training-plans/coach', [auth, coach], trainingPlanController.getCoachTrainingPlans);
router.get('/training-plans/team/:teamId', auth, trainingPlanController.getTeamTrainingPlans);
router.get('/training-plans/:id', auth, trainingPlanController.getTrainingPlanById);
router.put('/training-plans/:id', [auth, supervisor], trainingPlanController.updateTrainingPlan);
router.delete('/training-plans/:id', [auth, supervisor], trainingPlanController.deleteTrainingPlan);
router.put(
  '/training-plans/:id/status',
  [
    auth,
    check('status', 'Status is required').isIn(['Draft', 'Assigned', 'InProgress', 'Completed'])
  ],
  trainingPlanController.updateTrainingPlanStatus
);

// Feedback routes
router.post(
  '/feedback',
  [
    auth,
    check('message', 'Message is required').not().isEmpty()
  ],
  feedbackController.submitFeedback
);

router.get('/feedback', [auth, admin], feedbackController.getAllFeedback);
router.get('/feedback/user', auth, feedbackController.getUserFeedback);
router.put(
  '/feedback/:id',
  [
    auth,
    admin,
    check('status', 'Status is required').not().isEmpty()
  ],
  feedbackController.updateFeedbackStatus
);

module.exports = router; 