const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const multer = require('multer');
const storage = multer.memoryStorage(); // Use memory storage for simplicity
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
  },
  fileFilter: (req, file, cb) => {
    // Only allow images
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

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
const playerStatsRoutes = require('./playerStatsRoutes');
const registrationRoutes = require('./registrationRoutes');
const utilityRoutes = require('./utilityRoutes');

// Middleware
const { auth, admin, supervisor, coach, player, parent, adminOrSupport, adminSupportOrAccounting, support } = require('../middleware/auth');

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
router.get('/users', [auth, adminSupportOrAccounting], userController.getUsers);
router.get('/users/role/:role', [auth], userController.getUsersByRole);
router.get('/users/parent/children', [auth, parent], userController.getParentChildren);
router.get('/users/:id', [auth, adminOrSupport], userController.getUserById);
router.put('/users/:id', [auth, adminOrSupport], userController.updateUser);
router.delete('/users/:id', [auth, admin], userController.deleteUser);
router.put('/users/:id/password', [auth], userController.changePassword);

// Add new profile picture upload routes
// Admin or support uploading a profile picture for any user
router.post('/users/:id/picture', [auth, adminOrSupport, upload.single('profilePicture')], userController.uploadUserProfilePicture);
// Users uploading their own profile picture (only admins or support can do this after your restriction)
router.post('/users/profile/picture', [auth, adminOrSupport, upload.single('profilePicture')], userController.uploadProfilePicture);

// Document routes
router.post(
  '/users/:id/documents',
  [
    auth,
    adminOrSupport,
    // Document upload middleware will be handled here
  ],
  userController.uploadDocument
);

router.delete(
  '/users/:id/documents/:documentId',
  [auth, adminOrSupport],
  userController.deleteDocument
);

// Notification routes
router.get('/notifications', auth, notificationController.getUserNotifications);
router.get('/notifications/unread-count', auth, notificationController.getUnreadCount);
router.put('/notifications/read-all', auth, notificationController.markAllAsRead);
router.put('/notifications/:id', auth, notificationController.markAsRead);
router.delete('/notifications/:id', auth, notificationController.deleteNotification);
router.post('/notifications', [auth, adminOrSupport], notificationController.createNotification);

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
router.put('/training-plans/:id/status', auth, trainingPlanController.updateTrainingPlanStatus);
router.get('/training-plans/:id/attendance', auth, trainingPlanController.getAttendance);
router.put('/training-plans/:id/attendance', auth, trainingPlanController.updateAttendance);
router.delete('/training-plans/:id', [auth, supervisor], trainingPlanController.deleteTrainingPlan);

// Feedback routes
router.post(
  '/feedback',
  [
    auth,
    check('message', 'Message is required').not().isEmpty()
  ],
  feedbackController.submitFeedback
);

router.get('/feedback', [auth, adminOrSupport], feedbackController.getAllFeedback);
router.get('/feedback/user', auth, feedbackController.getUserFeedback);
router.put(
  '/feedback/:id',
  [
    auth,
    adminOrSupport,
    check('status', 'Status is required').not().isEmpty()
  ],
  feedbackController.updateFeedbackStatus
);

// Registration routes
router.use('/registrations', registrationRoutes);

// Player Stats Routes
router.use('/player-stats', playerStatsRoutes);

// Utility routes
router.use('/utilities', utilityRoutes);

module.exports = router; 