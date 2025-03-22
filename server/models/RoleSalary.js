const mongoose = require('mongoose');

const RoleSalarySchema = new mongoose.Schema({
  role: {
    type: String,
    enum: [
      'admin', 
      'supervisor', 
      'supervisor-cafeteria', 
      'supervisor-sports', 
      'supervisor-general', 
      'supervisor-booking',
      'cashier', 
      'coach', 
      'accounting', 
      'support'
    ],
    required: true,
    unique: true
  },
  amount: {
    type: Number,
    required: true
  },
  description: {
    type: String,
    trim: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('RoleSalary', RoleSalarySchema); 