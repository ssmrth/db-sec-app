// models/SystemSettings.js
const mongoose = require("mongoose");

const systemSettingsSchema = new mongoose.Schema({
  settingKey: {
    type: String,
    required: true,
    unique: true
  },
  settingValue: mongoose.Schema.Types.Mixed,
  category: {
    type: String,
    enum: ['monitoring', 'alerts', 'reporting', 'security', 'general'],
    default: 'general'
  },
  description: String,
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("SystemSettings", systemSettingsSchema);

