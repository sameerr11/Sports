const mongoose = require('mongoose');

const CourtSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  sportType: {
    type: String,
    required: true,
    trim: true,
    enum: ['Basketball', 'Football', 'Volleyball', 'Self Defense', 'Karate', 'Gymnastics', 'Gym', 'Zumba', 'Swimming', 'Ping Pong', 'Fitness', 'Crossfit']
  },
  location: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  capacity: {
    type: Number,
    required: true,
    default: 1
  },
  hourlyRate: {
    type: Number,
    required: true
  },
  availability: {
    monday: [{ 
      start: String, 
      end: String,
      type: {
        type: String,
        enum: ['Academy', 'Rental'],
        default: 'Rental'
      }
    }],
    tuesday: [{ 
      start: String, 
      end: String,
      type: {
        type: String,
        enum: ['Academy', 'Rental'],
        default: 'Rental'
      }
    }],
    wednesday: [{ 
      start: String, 
      end: String,
      type: {
        type: String,
        enum: ['Academy', 'Rental'],
        default: 'Rental'
      }
    }],
    thursday: [{ 
      start: String, 
      end: String,
      type: {
        type: String,
        enum: ['Academy', 'Rental'],
        default: 'Rental'
      }
    }],
    friday: [{ 
      start: String, 
      end: String,
      type: {
        type: String,
        enum: ['Academy', 'Rental'],
        default: 'Rental'
      }
    }],
    saturday: [{ 
      start: String, 
      end: String,
      type: {
        type: String,
        enum: ['Academy', 'Rental'],
        default: 'Rental'
      }
    }],
    sunday: [{ 
      start: String, 
      end: String,
      type: {
        type: String,
        enum: ['Academy', 'Rental'],
        default: 'Rental'
      }
    }]
  },
  isActive: {
    type: Boolean,
    default: true
  },
  image: {
    type: String,
    default: ''
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

module.exports = mongoose.model('Court', CourtSchema); 