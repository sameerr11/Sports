const mongoose = require('mongoose');

const cafeReceiptSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    required: true,
    unique: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  items: [{
    name: {
      type: String,
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0
    }
  }],
  total: {
    type: Number,
    required: true,
    min: 0
  },
  paymentMethod: {
    type: String,
    required: true,
    enum: ['Cash', 'Card', 'Mobile']
  },
  cashier: {
    type: String,
    required: true
  },
  customer: {
    type: String,
    default: 'Walk-in Customer'
  },
  cashierId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CafeSessionSummary'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('CafeReceipt', cafeReceiptSchema); 