// models/AlertRecipient.js
const mongoose = require("mongoose");

const alertRecipientSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  role: {
    type: String,
    enum: ['admin', 'security_analyst', 'developer', 'viewer'],
    default: 'viewer'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  permissions: {
    receiveAlerts: {
      type: Boolean,
      default: true
    },
    viewReports: {
      type: Boolean,
      default: true
    },
    manageAlerts: {
      type: Boolean,
      default: false
    },
    manageSettings: {
      type: Boolean,
      default: false
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastNotified: {
    type: Date,
    default: null
  }
});

module.exports = mongoose.model("AlertRecipient", alertRecipientSchema);

