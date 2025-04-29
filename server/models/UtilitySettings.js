const mongoose = require('mongoose');

const UtilitySettingsSchema = new mongoose.Schema({
  settingName: {
    type: String,
    required: true,
    unique: true
  },
  stringValue: {
    type: String,
    default: null
  },
  arrayValue: {
    type: [String],
    default: []
  },
  numberValue: {
    type: Number,
    default: null
  },
  booleanValue: {
    type: Boolean,
    default: null
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true });

module.exports = mongoose.model('UtilitySettings', UtilitySettingsSchema); 