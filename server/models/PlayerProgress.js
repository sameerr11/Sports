const mongoose = require('mongoose');

const PlayerProgressSchema = new mongoose.Schema({
  player: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    required: true
  },
  coach: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assessmentDate: {
    type: Date,
    default: Date.now
  },
  skills: {
    technical: {
      passing: {
        type: Number,
        min: 1,
        max: 10
      },
      shooting: {
        type: Number,
        min: 1,
        max: 10
      },
      dribbling: {
        type: Number,
        min: 1,
        max: 10
      },
      firstTouch: {
        type: Number,
        min: 1,
        max: 10
      },
      heading: {
        type: Number,
        min: 1,
        max: 10
      }
    },
    tactical: {
      positioning: {
        type: Number,
        min: 1,
        max: 10
      },
      gameReading: {
        type: Number,
        min: 1,
        max: 10
      },
      decisionMaking: {
        type: Number,
        min: 1,
        max: 10
      },
      teamwork: {
        type: Number,
        min: 1,
        max: 10
      }
    },
    physical: {
      speed: {
        type: Number,
        min: 1,
        max: 10
      },
      strength: {
        type: Number,
        min: 1,
        max: 10
      },
      stamina: {
        type: Number,
        min: 1,
        max: 10
      },
      agility: {
        type: Number,
        min: 1,
        max: 10
      },
      balance: {
        type: Number,
        min: 1,
        max: 10
      }
    },
    mental: {
      concentration: {
        type: Number,
        min: 1,
        max: 10
      },
      composure: {
        type: Number,
        min: 1,
        max: 10
      },
      leadership: {
        type: Number,
        min: 1,
        max: 10
      },
      workRate: {
        type: Number,
        min: 1,
        max: 10
      }
    }
  },
  performanceStats: {
    gamesPlayed: {
      type: Number,
      default: 0
    },
    goalsScored: {
      type: Number,
      default: 0
    },
    assists: {
      type: Number,
      default: 0
    },
    minutesPlayed: {
      type: Number,
      default: 0
    },
    yellowCards: {
      type: Number,
      default: 0
    },
    redCards: {
      type: Number,
      default: 0
    }
  },
  trainingAttendance: {
    total: {
      type: Number,
      default: 0
    },
    attended: {
      type: Number,
      default: 0
    },
    percentage: {
      type: Number,
      default: 0
    }
  },
  developmentGoals: [{
    description: String,
    status: {
      type: String,
      enum: ['Not Started', 'In Progress', 'Completed'],
      default: 'Not Started'
    },
    dueDate: Date,
    setBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  notes: {
    type: String,
    trim: true
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

module.exports = mongoose.model('PlayerProgress', PlayerProgressSchema); 