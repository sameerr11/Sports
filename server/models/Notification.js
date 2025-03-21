const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  type: {
    type: String,
    enum: [
      'new_registration', 
      'role_change', 
      'document_upload', 
      'system', 
      'child_account_linked', 
      'training_scheduled', 
      'training_updated', 
      'training_cancelled',
      'match_scheduled',
      'match_updated',
      'match_result',
      'player_performance',
      'coach_feedback',
      'team_announcement',
      'payment_reminder',
      'attendance_update'
    ],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  relatedTo: {
    model: {
      type: String,
      enum: ['User', 'Team', 'Match', 'Training', 'Payment', 'PlayerRegistration', 'TrainingPlan', 'PlayerStats']
    },
    id: {
      type: mongoose.Schema.Types.ObjectId
    }
  },
  isRead: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Notification', NotificationSchema); 