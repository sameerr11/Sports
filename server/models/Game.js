const mongoose = require('mongoose');

const GameSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  homeTeam: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    required: true
  },
  awayTeam: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    required: true
  },
  location: {
    type: String,
    required: true,
    trim: true
  },
  court: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Court'
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date,
    required: true
  },
  gameType: {
    type: String,
    enum: ['Friendly', 'League', 'Tournament', 'Cup', 'Playoff'],
    default: 'Friendly'
  },
  status: {
    type: String,
    enum: ['Scheduled', 'Live', 'Completed', 'Postponed', 'Cancelled'],
    default: 'Scheduled'
  },
  result: {
    homeScore: {
      type: Number,
      default: 0
    },
    awayScore: {
      type: Number,
      default: 0
    },
    winner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team'
    },
    isDraw: {
      type: Boolean,
      default: false
    }
  },
  lineups: {
    home: [{
      player: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      position: String,
      isStarting: {
        type: Boolean,
        default: false
      }
    }],
    away: [{
      player: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      position: String,
      isStarting: {
        type: Boolean,
        default: false
      }
    }]
  },
  statistics: {
    homeStats: {
      possession: Number,
      shotsOnTarget: Number,
      shotsOffTarget: Number,
      corners: Number,
      fouls: Number,
      yellowCards: Number,
      redCards: Number
    },
    awayStats: {
      possession: Number,
      shotsOnTarget: Number,
      shotsOffTarget: Number,
      corners: Number,
      fouls: Number,
      yellowCards: Number,
      redCards: Number
    }
  },
  notes: {
    type: String,
    trim: true
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

module.exports = mongoose.model('Game', GameSchema); 