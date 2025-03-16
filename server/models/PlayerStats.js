const mongoose = require('mongoose');

// Common stats for all sports
const commonStatsSchema = {
  height: {
    value: { type: Number },
    unit: { type: String, enum: ['cm', 'ft'], default: 'cm' }
  },
  weight: {
    value: { type: Number },
    unit: { type: String, enum: ['kg', 'lb'], default: 'kg' }
  },
  notes: { type: String, trim: true },
  lastUpdated: { type: Date, default: Date.now }
};

// Sport specific skill schema definitions
const footballSkillsSchema = {
  passing: { type: Number, min: 1, max: 10, default: 5 },
  shooting: { type: Number, min: 1, max: 10, default: 5 },
  dribbling: { type: Number, min: 1, max: 10, default: 5 },
  tackling: { type: Number, min: 1, max: 10, default: 5 },
  speed: { type: Number, min: 1, max: 10, default: 5 },
  stamina: { type: Number, min: 1, max: 10, default: 5 },
  positioning: { type: Number, min: 1, max: 10, default: 5 }
};

const cricketSkillsSchema = {
  batting: { type: Number, min: 1, max: 10, default: 5 },
  bowling: { type: Number, min: 1, max: 10, default: 5 },
  fielding: { type: Number, min: 1, max: 10, default: 5 },
  wicketKeeping: { type: Number, min: 1, max: 10, default: 5 }
};

const basketballSkillsSchema = {
  shooting: { type: Number, min: 1, max: 10, default: 5 },
  passing: { type: Number, min: 1, max: 10, default: 5 },
  dribbling: { type: Number, min: 1, max: 10, default: 5 },
  defense: { type: Number, min: 1, max: 10, default: 5 },
  rebounding: { type: Number, min: 1, max: 10, default: 5 },
  athleticism: { type: Number, min: 1, max: 10, default: 5 }
};

const tennisSkillsSchema = {
  forehand: { type: Number, min: 1, max: 10, default: 5 },
  backhand: { type: Number, min: 1, max: 10, default: 5 },
  serve: { type: Number, min: 1, max: 10, default: 5 },
  volley: { type: Number, min: 1, max: 10, default: 5 },
  movement: { type: Number, min: 1, max: 10, default: 5 }
};

// Define the PlayerStats schema
const PlayerStatsSchema = new mongoose.Schema({
  player: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sportType: {
    type: String,
    required: true,
    enum: ['Football', 'Cricket', 'Basketball', 'Tennis', 'Others']
  },
  // Common stats for all players
  common: commonStatsSchema,
  
  // Sport-specific skills
  football: footballSkillsSchema,
  cricket: cricketSkillsSchema,
  basketball: basketballSkillsSchema,
  tennis: tennisSkillsSchema,
  
  // General grades
  grades: {
    overall: { type: Number, min: 1, max: 10, default: 5 },
    improvement: { type: Number, min: 1, max: 10, default: 5 },
    teamwork: { type: Number, min: 1, max: 10, default: 5 },
    attitude: { type: Number, min: 1, max: 10, default: 5 }
  },
  
  // Who created this stat entry
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

// Create compound index for player and sport type
PlayerStatsSchema.index({ player: 1, sportType: 1 }, { unique: true });

module.exports = mongoose.model('PlayerStats', PlayerStatsSchema); 