const mongoose = require('mongoose');

const CafeSessionSummarySchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date,
    required: true
  },
  startingBalance: {
    type: Number,
    required: true
  },
  totalSales: {
    type: Number,
    required: true,
    default: 0
  },
  finalBalance: {
    type: Number,
    required: true
  },
  cashier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('CafeSessionSummary', CafeSessionSummarySchema); 