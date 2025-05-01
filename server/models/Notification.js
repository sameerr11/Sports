const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    message: {
        type: String,
        required: true
    },
    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false
    },
    type: {
        type: String,
        enum: ['all', 'role', 'specific', 'system', 'training_scheduled', 'match_scheduled', 
               'player_performance', 'coach_feedback', 'team_announcement', 'payment_reminder',
               'role_change', 'document_upload', 'child_account_linked', 'profile_updated', 
               'password_reset', 'training_updated', 'training_cancelled', 'match_updated',
               'match_result', 'attendance_update', 'registration_expiry', 'new_registration'],
        required: true,
        default: 'system'
    },
    title: {
        type: String,
        required: true
    },
    isRead: {
        type: Boolean,
        default: false
    },
    read: {
        type: Boolean,
        default: false
    },
    role: {
        type: String,
        required: function() {
            return this.type === 'role';
        }
    },
    relatedTo: {
        model: String,
        id: mongoose.Schema.Types.ObjectId
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Notification', notificationSchema); 