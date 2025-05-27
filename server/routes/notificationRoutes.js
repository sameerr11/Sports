const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const User = require('../models/User');
const { auth, admin, adminOrSupport } = require('../middleware/auth');
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
router.post('/send', [auth, adminOrSupport], async (req, res) => {
    try {
        console.log('Received notification request:', req.body);
        const { message, title, type, role, recipients, sendEmail } = req.body;
        
        if (!message || !title) {
            return res.status(400).json({ msg: 'Message and title are required' });
        }

        let notificationResults = [];
        let emailSent = false;
        let emailCount = 0;

        // For single recipient
        if (recipients && recipients.length === 1) {
            // Use notificationService to create notification with email support
            const notificationData = {
                recipientId: recipients[0],
                senderId: req.user.id,
                type: type || 'system',
                title,
                message,
                sendEmail: sendEmail === true // Only send email if explicitly requested
            };
            
            const notification = await require('../utils/notificationService').createNotification(notificationData);
            notificationResults = [notification];
            
            if (sendEmail) {
                // Check if email was sent by checking if user has email
                const User = require('../models/User');
                const recipient = await User.findById(recipients[0]).select('email');
                emailSent = recipient && recipient.email ? true : false;
                emailCount = emailSent ? 1 : 0;
            }
            
            console.log('Single notification saved successfully' + (emailSent ? ' with email' : ''));
            return res.json({ 
                msg: 'Notification sent successfully' + (emailSent ? ' with email' : ''), 
                notification: notificationResults[0],
                emailSent,
                emailRecipients: emailCount
            });
        }
        
        // For multiple recipients, create notifications in bulk
        if (recipients && Array.isArray(recipients) && recipients.length > 0) {
            const notificationService = require('../utils/notificationService');
            const notificationPromises = recipients.map(recipientId => {
                return notificationService.createNotification({
                    recipientId,
                    senderId: req.user.id,
                    type: type || 'system',
                    title,
                    message,
                    sendEmail: sendEmail === true // Only send email if explicitly requested
                });
            });
            
            notificationResults = await Promise.all(notificationPromises);
            
            if (sendEmail) {
                // Count how many users have emails (for reporting)
                const User = require('../models/User');
                const users = await User.find({ _id: { $in: recipients } }).select('email');
                emailCount = users.filter(user => user.email).length;
                emailSent = emailCount > 0;
            }
            
            console.log(`${notificationResults.length} notifications saved successfully` + 
                        (emailSent ? ` and ${emailCount} emails sent` : ''));
            
            return res.json({ 
                msg: 'Notifications sent successfully' + (emailSent ? ' with email' : ''), 
                count: notificationResults.length,
                emailSent,
                emailRecipients: emailCount
            });
        }
        
        // For role-based notifications
        if (type === 'role' && role) {
            const notificationService = require('../utils/notificationService');
            const result = await notificationService.createRoleNotifications({
                role,
                senderId: req.user.id,
                type: 'system',
                title,
                message,
                sendEmail: sendEmail === true // Only send email if explicitly requested
            });
            
            notificationResults = result;
            
            if (sendEmail) {
                // Get count of users with email in this role
                const User = require('../models/User');
                const users = await User.find({ role }).select('email');
                emailCount = users.filter(user => user.email).length;
                emailSent = emailCount > 0;
            }
            
            console.log(`${notificationResults.length} role-based notifications saved successfully` +
                       (emailSent ? ` and ${emailCount} emails sent` : ''));
            
            return res.json({ 
                msg: `Notifications sent to ${notificationResults.length} users with role ${role}` + 
                     (emailSent ? ` and ${emailCount} emails sent` : ''), 
                count: notificationResults.length,
                emailSent,
                emailRecipients: emailCount
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

// Mark all notifications as read
router.put('/read-all', auth, async (req, res) => {
    try {
        await Notification.updateMany(
            { recipient: req.user.id, isRead: false },
            { $set: { isRead: true } }
        );

        res.json({ msg: 'All notifications marked as read' });
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
        res.status(500).json({ msg: 'Server error' });
    }
});

// Mark notification as read
router.put('/:id', auth, async (req, res) => {
    try {
        const notification = await Notification.findOne({
            _id: req.params.id,
            recipient: req.user.id
        });

        if (!notification) {
            return res.status(404).json({ msg: 'Notification not found' });
        }

        notification.isRead = true;
        await notification.save();

        res.json({ msg: 'Notification marked as read' });
    } catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({ msg: 'Server error' });
    }
});

// Get unread notification count
router.get('/unread-count', auth, async (req, res) => {
    try {
        const count = await Notification.countDocuments({
            recipient: req.user.id,
            isRead: false
        });

        res.json({ count });
    } catch (error) {
        console.error('Error getting unread count:', error);
        res.status(500).json({ msg: 'Server error' });
    }
});

// Delete notification
router.delete('/:id', auth, async (req, res) => {
    try {
        const notification = await Notification.findOne({
            _id: req.params.id,
            recipient: req.user.id
        });

        if (!notification) {
            return res.status(404).json({ msg: 'Notification not found' });
        }

        await Notification.deleteOne({ _id: req.params.id });
        res.json({ msg: 'Notification deleted' });
    } catch (error) {
        console.error('Error deleting notification:', error);
        res.status(500).json({ msg: 'Server error' });
    }
});

// @desc   Broadcast notification to users (with email)
// @route  POST /api/notifications/broadcast
// @access Private/Admin and Support
router.post('/broadcast', [auth, adminOrSupport], notificationController.sendBroadcastNotification);

module.exports = router; 