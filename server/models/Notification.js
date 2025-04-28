const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    message: {
        type: String,
        required: true
    },
    recipients: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    read: {
        type: Boolean,
        default: false
    },
    type: {
        type: String,
        enum: ['all', 'role', 'specific'],
        required: true
    },
    role: {
        type: String,
        required: function() {
            return this.type === 'role';
        }
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Notification', notificationSchema); 