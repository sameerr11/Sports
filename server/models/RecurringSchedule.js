const mongoose = require('mongoose');

const RecurringScheduleSchema = new mongoose.Schema({
  // The team this schedule belongs to
  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    required: true
  },
  // The court this schedule uses
  court: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Court',
    required: true
  },
  // The user who created this recurring schedule
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Purpose of the schedule
  purpose: {
    type: String,
    enum: ['Training', 'Match', 'Rental', 'Other'],
    default: 'Training'
  },
  // Day of week (0-6, where 0 is Sunday)
  dayOfWeek: {
    type: String,
    enum: ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
    required: true
  },
  // Start time in HH:MM format
  startTime: {
    type: String,
    required: true,
    match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
  },
  // End time in HH:MM format
  endTime: {
    type: String,
    required: true,
    match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
  },
  // Duration in minutes (calculated from start and end time)
  duration: {
    type: Number,
    required: true
  },
  // When this recurring schedule starts (first occurrence)
  startDate: {
    type: Date,
    required: true
  },
  // When this recurring schedule ends (no more occurrences after this date)
  // If null, it recurs indefinitely
  endDate: {
    type: Date,
    default: null
  },
  // Additional notes
  notes: {
    type: String,
    trim: true
  },
  // Whether this recurring schedule is active
  isActive: {
    type: Boolean,
    default: true
  },
  // Array of dates to skip (exceptions)
  exceptions: [{
    date: {
      type: Date,
      required: true
    },
    reason: {
      type: String,
      trim: true
    }
  }],
  // Reference to generated bookings created from this recurring schedule
  bookings: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking'
  }],
  // For maintaining creation info
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

// Create indexes for faster queries
RecurringScheduleSchema.index({ team: 1, dayOfWeek: 1 });
RecurringScheduleSchema.index({ court: 1, dayOfWeek: 1 });
RecurringScheduleSchema.index({ isActive: 1 });

module.exports = mongoose.model('RecurringSchedule', RecurringScheduleSchema);