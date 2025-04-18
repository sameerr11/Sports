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
const basketballSkillsSchema = {
  shooting: { type: Number, min: 1, max: 10, default: 5 },
  passing: { type: Number, min: 1, max: 10, default: 5 },
  dribbling: { type: Number, min: 1, max: 10, default: 5 },
  defense: { type: Number, min: 1, max: 10, default: 5 },
  rebounding: { type: Number, min: 1, max: 10, default: 5 },
  athleticism: { type: Number, min: 1, max: 10, default: 5 }
};

const footballSkillsSchema = {
  passing: { type: Number, min: 1, max: 10, default: 5 },
  shooting: { type: Number, min: 1, max: 10, default: 5 },
  dribbling: { type: Number, min: 1, max: 10, default: 5 },
  tackling: { type: Number, min: 1, max: 10, default: 5 },
  speed: { type: Number, min: 1, max: 10, default: 5 },
  stamina: { type: Number, min: 1, max: 10, default: 5 },
  positioning: { type: Number, min: 1, max: 10, default: 5 }
};

const volleyballSkillsSchema = {
  serving: { type: Number, min: 1, max: 10, default: 5 },
  passing: { type: Number, min: 1, max: 10, default: 5 },
  setting: { type: Number, min: 1, max: 10, default: 5 },
  attacking: { type: Number, min: 1, max: 10, default: 5 },
  blocking: { type: Number, min: 1, max: 10, default: 5 },
  digging: { type: Number, min: 1, max: 10, default: 5 }
};

const selfDefenseSkillsSchema = {
  technique: { type: Number, min: 1, max: 10, default: 5 },
  awareness: { type: Number, min: 1, max: 10, default: 5 },
  reaction: { type: Number, min: 1, max: 10, default: 5 },
  discipline: { type: Number, min: 1, max: 10, default: 5 }
};

const karateSkillsSchema = {
  kata: { type: Number, min: 1, max: 10, default: 5 },
  kumite: { type: Number, min: 1, max: 10, default: 5 },
  technique: { type: Number, min: 1, max: 10, default: 5 },
  discipline: { type: Number, min: 1, max: 10, default: 5 },
  speed: { type: Number, min: 1, max: 10, default: 5 }
};

const gymnasticsSkillsSchema = {
  flexibility: { type: Number, min: 1, max: 10, default: 5 },
  balance: { type: Number, min: 1, max: 10, default: 5 },
  strength: { type: Number, min: 1, max: 10, default: 5 },
  coordination: { type: Number, min: 1, max: 10, default: 5 },
  execution: { type: Number, min: 1, max: 10, default: 5 }
};

const gymSkillsSchema = {
  strength: { type: Number, min: 1, max: 10, default: 5 },
  endurance: { type: Number, min: 1, max: 10, default: 5 },
  technique: { type: Number, min: 1, max: 10, default: 5 },
  consistency: { type: Number, min: 1, max: 10, default: 5 }
};

const zumbaSkillsSchema = {
  rhythm: { type: Number, min: 1, max: 10, default: 5 },
  coordination: { type: Number, min: 1, max: 10, default: 5 },
  stamina: { type: Number, min: 1, max: 10, default: 5 },
  enthusiasm: { type: Number, min: 1, max: 10, default: 5 }
};

const swimmingSkillsSchema = {
  freestyle: { type: Number, min: 1, max: 10, default: 5 },
  backstroke: { type: Number, min: 1, max: 10, default: 5 },
  breaststroke: { type: Number, min: 1, max: 10, default: 5 },
  butterfly: { type: Number, min: 1, max: 10, default: 5 },
  endurance: { type: Number, min: 1, max: 10, default: 5 }
};

const pingPongSkillsSchema = {
  forehand: { type: Number, min: 1, max: 10, default: 5 },
  backhand: { type: Number, min: 1, max: 10, default: 5 },
  serve: { type: Number, min: 1, max: 10, default: 5 },
  footwork: { type: Number, min: 1, max: 10, default: 5 },
  spin: { type: Number, min: 1, max: 10, default: 5 }
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
    enum: ['Basketball', 'Football', 'Volleyball', 'Self Defense', 'Karate', 'Gymnastics', 'Gym', 'Zumba', 'Swimming', 'Ping Pong']
  },
  // Common stats for all players
  common: commonStatsSchema,
  
  // Sport-specific skills
  basketball: basketballSkillsSchema,
  football: footballSkillsSchema,
  volleyball: volleyballSkillsSchema,
  selfDefense: selfDefenseSkillsSchema,
  karate: karateSkillsSchema,
  gymnastics: gymnasticsSkillsSchema,
  gym: gymSkillsSchema,
  zumba: zumbaSkillsSchema,
  swimming: swimmingSkillsSchema,
  pingPong: pingPongSkillsSchema,
  
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