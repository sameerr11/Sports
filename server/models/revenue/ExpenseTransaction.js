const mongoose = require('mongoose');

const ExpenseTransactionSchema = new mongoose.Schema({
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  expenseType: {
    type: String,
    enum: ['Salary', 'Utility', 'Maintenance', 'Equipment', 'Other'],
    required: true
  },
  expenseId: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'expenseModel'
  },
  expenseModel: {
    type: String,
    enum: ['SalaryInvoice', 'UtilityBill', 'ExpenseType'],
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
  paymentStatus: {
    type: String,
    enum: ['Pending', 'Paid'],
    default: 'Pending'
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
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Create indexes for efficient querying
ExpenseTransactionSchema.index({ expenseType: 1, date: 1 });
ExpenseTransactionSchema.index({ expenseId: 1, expenseModel: 1 });
ExpenseTransactionSchema.index({ paymentStatus: 1 });

module.exports = mongoose.model('ExpenseTransaction', ExpenseTransactionSchema); 