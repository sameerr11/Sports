const mongoose = require('mongoose');

const UtilityBillSchema = new mongoose.Schema({
  billNumber: {
    type: String,
    required: true,
    unique: true
  },
  billType: {
    type: String,
    required: true
  },
  customBillType: {
    type: String,
    trim: true
  },
  sportType: {
    type: String,
    enum: ['Basketball', 'Football', 'Volleyball', 'Self Defense', 'Karate', 'Gymnastics', 'Gym', 'Zumba', 'Swimming', 'Ping Pong', 'General'],
    default: 'General'
  },
  amount: {
    type: Number,
    required: true
  },
  vendor: {
    type: String,
    required: true
  },
  billDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  dueDate: {
    type: Date,
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['Pending', 'Paid', 'Overdue'],
    default: 'Pending'
  },
  paymentMethod: {
    type: String,
    enum: ['Cash'],
    default: 'Cash'
  },
  paidDate: {
    type: Date
  },
  paidBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
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

module.exports = mongoose.model('UtilityBill', UtilityBillSchema); 