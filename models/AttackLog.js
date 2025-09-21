// models/AttackLog.js
const mongoose = require("mongoose");

const attackLogSchema = new mongoose.Schema({
  detectedAt: {
    type: Date,
    default: Date.now,
  },
  collection: String,
  attackType: String,
  rawData: mongoose.Schema.Types.Mixed,
}, {
  suppressReservedKeysWarning: true
});

module.exports = mongoose.model("AttackLog", attackLogSchema);

