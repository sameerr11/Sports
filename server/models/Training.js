const mongoose = require('mongoose');

const TrainingSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    required: true
  },
  coach: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  court: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Court'
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date,
    required: true
  },
  trainingType: {
    type: String,
    enum: ['Technical', 'Tactical', 'Physical', 'Mental', 'Recovery', 'Match Preparation'],
    default: 'Technical'
  },
  goals: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['Pending', 'Confirmed', 'Completed', 'Cancelled'],
    default: 'Pending'
  },
  attendance: [{
    player: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    attended: {
      type: Boolean,
      default: false
    },
    performance: {
      type: Number,
      min: 1,
      max: 5
    },
    notes: String
  }],
  notes: {
    type: String,
    trim: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Training', TrainingSchema); 