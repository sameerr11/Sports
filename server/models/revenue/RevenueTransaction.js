const mongoose = require('mongoose');

const RevenueTransactionSchema = new mongoose.Schema({
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  sourceType: {
    type: String,
    enum: ['Registration', 'Registration Renewal', 'Cafeteria', 'Rental', 'Other'],
    required: true
  },
  sourceId: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'sourceModel'
  },
  sourceModel: {
    type: String,
    enum: ['PlayerRegistration', 'RegistrationRenewal', 'CafeteriaOrder', 'Booking', 'GuestBooking', 'RevenueSourceType'],
    required: true
  },
  description: {
    type: String,
    trim: true
  },
  date: {
    type: Date,
    default: Date.now,
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Create indexes for efficient querying
RevenueTransactionSchema.index({ sourceType: 1, date: 1 });
RevenueTransactionSchema.index({ sourceId: 1, sourceModel: 1 });

module.exports = mongoose.model('RevenueTransaction', RevenueTransactionSchema); 