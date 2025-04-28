const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const User = require('../models/User');
const { auth, admin } = require('../middleware/auth');

// Get all notifications for the current user
router.get('/', auth, async (req, res) => {
    try {
        const notifications = await Notification.find({
            recipients: req.user.id
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
        const { message, type, role, recipients } = req.body;
        let finalRecipients = [];

        // Determine recipients based on type
        if (type === 'all') {
            console.log('Fetching all users...');
            const allUsers = await User.find({}, '_id');
            finalRecipients = allUsers.map(user => user._id);
            console.log(`Found ${finalRecipients.length} users`);
        } else if (type === 'role') {
            if (!role) {
                return res.status(400).json({ msg: 'Role is required for role-based notifications' });
            }
            console.log(`Fetching users with role: ${role}`);
            const roleUsers = await User.find({ role }, '_id');
            finalRecipients = roleUsers.map(user => user._id);
            console.log(`Found ${finalRecipients.length} users with role ${role}`);
        } else if (type === 'specific') {
            if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
                return res.status(400).json({ msg: 'Recipients are required for specific notifications' });
            }
            finalRecipients = recipients;
            console.log(`Using ${finalRecipients.length} specific recipients`);
        } else {
            return res.status(400).json({ msg: 'Invalid notification type' });
        }

        console.log('Creating notification with data:', {
            message,
            type,
            role: type === 'role' ? role : undefined,
            recipientsCount: finalRecipients.length,
            sender: req.user.id
        });

        // Create notification with sender
        const notification = new Notification({
            message,
            type,
            role: type === 'role' ? role : undefined,
            recipients: finalRecipients,
            sender: req.user.id
        });

        await notification.save();
        console.log('Notification saved successfully');

        res.json({ msg: 'Notification sent successfully', notification });
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

module.exports = router; 