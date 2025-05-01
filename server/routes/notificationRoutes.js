const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const User = require('../models/User');
const { auth, admin } = require('../middleware/auth');
const notificationController = require('../controllers/notificationController');

// Get all notifications for the current user
router.get('/', auth, async (req, res) => {
    try {
        const notifications = await Notification.find({
            recipient: req.user.id
        })
        .sort({ createdAt: -1 })
        .populate('sender', 'firstName lastName');

        res.json(notifications);
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ msg: 'Server error' });
    }
});

// Send notification
router.post('/send', [auth, admin], async (req, res) => {
    try {
        console.log('Received notification request:', req.body);
        const { message, title, type, role, recipients } = req.body;
        
        if (!message || !title) {
            return res.status(400).json({ msg: 'Message and title are required' });
        }

        // For single recipient
        if (recipients && recipients.length === 1) {
            const notification = new Notification({
                recipient: recipients[0],
                sender: req.user.id,
                type: type || 'system',
                title,
                message
            });
            
            await notification.save();
            console.log('Single notification saved successfully');
            return res.json({ 
                msg: 'Notification sent successfully', 
                notification 
            });
        }
        
        // For multiple recipients, create notifications in bulk
        if (recipients && Array.isArray(recipients) && recipients.length > 0) {
            const notificationPromises = recipients.map(recipientId => {
                const notification = new Notification({
                    recipient: recipientId,
                    sender: req.user.id,
                    type: type || 'system',
                    title,
                    message
                });
                return notification.save();
            });
            
            const savedNotifications = await Promise.all(notificationPromises);
            console.log(`${savedNotifications.length} notifications saved successfully`);
            return res.json({ 
                msg: 'Notifications sent successfully', 
                count: savedNotifications.length 
            });
            }
        
        // For role-based notifications
        if (type === 'role' && role) {
            const roleUsers = await User.find({ role }, '_id');
            const recipientIds = roleUsers.map(user => user._id);
            
            if (recipientIds.length === 0) {
                return res.status(404).json({ msg: `No users found with role ${role}` });
            }
            
            const notificationPromises = recipientIds.map(recipientId => {
                const notification = new Notification({
                    recipient: recipientId,
                    sender: req.user.id,
                    type: 'system',
                    role,
                    title,
                    message
                });
                return notification.save();
            });
            
            const savedNotifications = await Promise.all(notificationPromises);
            console.log(`${savedNotifications.length} role-based notifications saved successfully`);
            return res.json({ 
                msg: `Notifications sent to ${savedNotifications.length} users with role ${role}`, 
                count: savedNotifications.length 
            });
        }
        
        return res.status(400).json({ 
            msg: 'Invalid request. Please specify either recipients or role.' 
        });
    } catch (error) {
        console.error('Error sending notification:', error);
        console.error('Error details:', {
            name: error.name,
            message: error.message,
            stack: error.stack
        });
        res.status(500).json({ msg: 'Failed to send notification', error: error.message });
    }
});

// Mark notification as read
router.put('/:id', auth, async (req, res) => {
    try {
        const notification = await Notification.findOne({
            _id: req.params.id,
            recipients: req.user._id
        });

        if (!notification) {
            return res.status(404).json({ msg: 'Notification not found' });
        }

        notification.read = true;
        await notification.save();

        res.json({ msg: 'Notification marked as read' });
    } catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({ msg: 'Server error' });
    }
});

// Mark all notifications as read
router.put('/read-all', auth, async (req, res) => {
    try {
        await Notification.updateMany(
            { recipients: req.user._id, read: false },
            { $set: { read: true } }
        );

        res.json({ msg: 'All notifications marked as read' });
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
        res.status(500).json({ msg: 'Server error' });
    }
});

// Get unread notification count
router.get('/unread-count', auth, async (req, res) => {
    try {
        const count = await Notification.countDocuments({
            recipients: req.user._id,
            read: false
        });

        res.json({ count });
    } catch (error) {
        console.error('Error getting unread count:', error);
        res.status(500).json({ msg: 'Server error' });
    }
});

// @desc   Broadcast notification to users (with email)
// @route  POST /api/notifications/broadcast
// @access Private/Admin
router.post('/broadcast', [auth, admin], notificationController.sendBroadcastNotification);

module.exports = router; 