const mongoose = require('mongoose');

const TeamSchema = new mongoose.Schema({
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
  description: {
    type: String,
    trim: true
  },
  players: [{
    player: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    position: String,
    joinedAt: {
      type: Date,
      default: Date.now
    }
  }],
  coaches: [{
    coach: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    role: {
      type: String,
      default: 'Assistant Coach'
    },
    assignedAt: {
      type: Date,
      default: Date.now
    }
  }],
  ageGroup: {
    type: String,
    trim: true
  },
  level: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced', 'Professional'],
    default: 'Beginner'
  },
  logo: {
    type: String,
    default: ''
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

module.exports = mongoose.model('Team', TeamSchema); 