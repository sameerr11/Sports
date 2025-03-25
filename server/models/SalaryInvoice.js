const mongoose = require('mongoose');

const SalaryInvoiceSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  bonus: {
    type: Number,
    default: 0
  },
  description: {
    type: String,
    trim: true
  },
  invoiceNumber: {
    type: String,
    required: true,
    unique: true
  },
  paymentMethod: {
    type: String,
    enum: ['Bank Transfer', 'Check', 'Cash'],
    default: 'Bank Transfer'
  },
  paymentStatus: {
    type: String,
    enum: ['Pending', 'Paid'],
    default: 'Pending'
  },
  issuedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  issuedDate: {
    type: Date,
    default: Date.now
  },
  paidDate: {
    type: Date
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('SalaryInvoice', SalaryInvoiceSchema); 