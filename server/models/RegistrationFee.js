const mongoose = require('mongoose');

const RegistrationFeeSchema = new mongoose.Schema({
  sportType: {
    type: String,
    required: true,
    enum: ['Football', 'Cricket', 'Basketball', 'Tennis', 'Others'],
  },
  period: {
    type: String,
    required: true,
    enum: ['1 Month', '3 Months', '6 Months', '1 Year'],
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'USD'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
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

// Create compound index for sport type and period
RegistrationFeeSchema.index({ sportType: 1, period: 1 }, { unique: true });

module.exports = mongoose.model('RegistrationFee', RegistrationFeeSchema); 