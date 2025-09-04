const mongoose = require('mongoose');

const RegistrationRenewalSchema = new mongoose.Schema({
  // Reference to the original registration
  originalRegistration: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PlayerRegistration',
    required: true
  },
  
  // Reference to the user (if account exists)
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Player information (copied from original registration for reference)
  player: {
    firstName: {
      type: String,
      required: true,
      trim: true
    },
    lastName: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true
    },
    phoneNumber: {
      type: String,
      required: true,
      trim: true
    }
  },
  
  // Sports to renew (can be subset of original)
  sports: [{
    type: String,
    enum: ['Basketball', 'Football', 'Volleyball', 'Self Defense', 'Karate', 'Gymnastics', 'Gym', 'Zumba', 'Swimming', 'Ping Pong', 'Fitness', 'Crossfit'],
    required: true
  }],
  
  // Renewal period
  registrationPeriod: {
    type: String,
    enum: ['1 Month', '3 Months', '6 Months', '1 Year'],
    required: true
  },
  
  // Renewal dates
  startDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  endDate: {
    type: Date,
    required: true
  },
  
  // Fee information
  fee: {
    amount: {
      type: Number,
      required: true
    },
    currency: {
      type: String,
      default: 'USD'
    },
    paymentMethod: {
      type: String,
      enum: ['Cash', 'Card', 'BankTransfer', 'Other'],
      default: 'Cash'
    },
    paymentStatus: {
      type: String,
      enum: ['Paid', 'Pending', 'Failed'],
      default: 'Paid'
    },
    receiptNumber: String,
    transactionId: String,
    invoiceNumber: {
      type: String,
      required: true
    }
  },
  
  // Renewal processed by accountant
  renewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Status - no admin approval needed for renewals
  status: {
    type: String,
    enum: ['Completed', 'Cancelled'],
    default: 'Completed'
  },
  
  // Notes
  notes: {
    type: String,
    trim: true
  },
  
}, {
  timestamps: true
});

// Index for efficient queries
RegistrationRenewalSchema.index({ originalRegistration: 1 });
RegistrationRenewalSchema.index({ userId: 1 });
RegistrationRenewalSchema.index({ 'player.email': 1 });
RegistrationRenewalSchema.index({ endDate: 1 });

module.exports = mongoose.model('RegistrationRenewal', RegistrationRenewalSchema);