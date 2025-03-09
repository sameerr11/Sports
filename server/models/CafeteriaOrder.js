const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  item: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CafeteriaItem',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true
  },
  description: {
    type: String
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
});

const cafeteriaOrderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    unique: true
  },
  items: [orderItemSchema],
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
  paymentStatus: {
    type: String,
    required: true,
    enum: ['Pending', 'Completed', 'Failed', 'Refunded'],
    default: 'Pending'
  },
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  customer: {
    name: String,
    email: String,
    phone: String
  }
}, {
  timestamps: true
});

// Generate order number before saving
cafeteriaOrderSchema.pre('save', async function(next) {
  try {
    if (!this.orderNumber) {
      const date = new Date();
      const year = date.getFullYear().toString().slice(-2);
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      
      // Get count of orders for today
      const startOfDay = new Date(date.setHours(0, 0, 0, 0));
      const endOfDay = new Date(date.setHours(23, 59, 59, 999));
      
      const count = await this.constructor.countDocuments({
        createdAt: {
          $gte: startOfDay,
          $lt: endOfDay
        }
      });
      
      // Format: YYMMDDxxxx where xxxx is the sequential number
      this.orderNumber = `${year}${month}${day}${(count + 1).toString().padStart(4, '0')}`;
    }
    next();
  } catch (error) {
    next(error);
  }
});

module.exports = mongoose.model('CafeteriaOrder', cafeteriaOrderSchema); 