const mongoose = require('mongoose');

const TrainingPlanSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  status: {
    type: String,
    enum: ['Draft', 'Assigned', 'InProgress', 'Completed'],
    default: 'Draft'
  },
  date: {
    type: Date,
    required: true
  },
  duration: {
    type: Number, // Duration in minutes
    required: true
  },
  activities: [{
    title: {
      type: String,
      required: true
    },
    description: {
      type: String
    },
    duration: {
      type: Number, // Duration in minutes
      required: true
    },
    order: {
      type: Number,
      required: true
    }
  }],
  attendance: [{
    player: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    status: {
      type: String,
      enum: ['Present', 'Absent', 'Late', 'Excused'],
      default: 'Absent'
    },
    notes: {
      type: String,
      trim: true
    },
    markedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    markedAt: {
      type: Date,
      default: Date.now
    }
  }],
  notes: {
    type: String,
    trim: true
  },
  attachments: [{
    name: {
      type: String
    },
    url: {
      type: String
    }
  }],
  isActive: {
    type: Boolean,
    default: true
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

// Indexes for faster queries
TrainingPlanSchema.index({ team: 1, date: 1 });
TrainingPlanSchema.index({ assignedTo: 1, status: 1 });
TrainingPlanSchema.index({ createdBy: 1 });

module.exports = mongoose.model('TrainingPlan', TrainingPlanSchema); 