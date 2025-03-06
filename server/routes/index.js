const express = require('express');
const router = express.Router();
const { check } = require('express-validator');

// Controllers
const userController = require('../controllers/userController');
const authController = require('../controllers/authController');
const notificationController = require('../controllers/notificationController');

// Middleware
const { auth, admin, supervisor } = require('../middleware/auth');

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

module.exports = router; 