const express = require('express');
const router = express.Router();
const AttackLog = require('../models/AttackLog');
const UsageMonitor = require('../utils/usageMonitor');
const AlertRecipient = require('../models/AlertRecipient');
const SystemSettings = require('../models/SystemSettings');
const fs = require('fs');
const path = require('path');

// Dashboard API Routes

// Get dashboard metrics
router.get('/dashboard/metrics', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const attacksToday = await AttackLog.countDocuments({
      detectedAt: { $gte: today }
    });
    
    const totalAttacks = await AttackLog.countDocuments();
    
    const recentAttacks = await AttackLog.find()
      .sort({ detectedAt: -1 })
      .limit(5)
      .lean();

    // Get most common attack patterns
    const attackTypes = await AttackLog.aggregate([
      { $group: { _id: '$attackType', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // System health based on recent activity
    const lastHour = new Date(Date.now() - 60 * 60 * 1000);
    const recentAttacksCount = await AttackLog.countDocuments({
      detectedAt: { $gte: lastHour }
    });

    const systemHealth = recentAttacksCount > 10 ? 'critical' : 
                        recentAttacksCount > 5 ? 'warning' : 'healthy';

    // API usage stats
    const usageMonitor = new UsageMonitor();
    const apiUsage = usageMonitor.getUsageReport();

    res.json({
      attacksToday,
      totalAttacks,
      recentAttacksCount,
      systemHealth,
      topAttackType: attackTypes[0]?._id || 'NoSQL Injection',
      apiUsageToday: apiUsage.today.requests,
      apiUsageRemaining: apiUsage.today.remainingRequests
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get recent attacks for live feed
router.get('/dashboard/attacks/recent', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * limit;

    const attacks = await AttackLog.find()
      .sort({ detectedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await AttackLog.countDocuments();

    // Format for frontend
    const formattedAttacks = attacks.map(attack => ({
      id: attack._id,
      timestamp: attack.detectedAt,
      type: attack.attackType,
      severity: determineSeverity(attack.rawData),
      payload: JSON.stringify(attack.rawData),
      collection: attack.collection,
      detected: true, // Attack was detected by the monitoring system
      description: generateDescription(attack.rawData)
    }));

    res.json({
      attacks: formattedAttacks,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get analytics data for charts
router.get('/dashboard/analytics/timeline', async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const timeline = await AttackLog.aggregate([
      { $match: { detectedAt: { $gte: startDate } } },
      {
        $group: {
          _id: {
            year: { $year: '$detectedAt' },
            month: { $month: '$detectedAt' },
            day: { $dayOfMonth: '$detectedAt' },
            hour: { $hour: '$detectedAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1, '_id.hour': 1 } }
    ]);

    // Format for Chart.js
    const formattedTimeline = timeline.map(item => ({
      time: new Date(item._id.year, item._id.month - 1, item._id.day, item._id.hour),
      attacks: item.count
    }));

    // Attack types distribution
    const attackTypes = await AttackLog.aggregate([
      { $group: { _id: '$attackType', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Severity distribution
    const allAttacks = await AttackLog.find().lean();
    const severityData = allAttacks.reduce((acc, attack) => {
      const severity = determineSeverity(attack.rawData);
      acc[severity] = (acc[severity] || 0) + 1;
      return acc;
    }, {});

    res.json({
      timeline: formattedTimeline,
      attackTypes: attackTypes.map(type => ({
        name: type._id,
        value: type.count
      })),
      severity: Object.entries(severityData).map(([key, value]) => ({
        name: key,
        value
      }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Helper functions
function determineSeverity(rawData) {
  if (!rawData) return 'medium';
  try {
    const dataStr = JSON.stringify(rawData) || '';
    if (dataStr.includes('$where') || dataStr.includes('$eval')) return 'critical';
    if (dataStr.includes('$ne') && dataStr.includes('$gt')) return 'high';
    if (dataStr.includes('$ne') || dataStr.includes('$gt')) return 'medium';
    return 'low';
  } catch (e) {
    return 'medium';
  }
}

function generateDescription(rawData) {
  if (!rawData) return 'NoSQL injection attempt detected';
  try {
    const dataStr = JSON.stringify(rawData) || '';
    if (dataStr.includes('$where')) return 'JavaScript code injection attempt';
    if (dataStr.includes('$ne') && dataStr.includes('password')) return 'Authentication bypass attempt';
    if (dataStr.includes('$gt') && dataStr.includes('$ne')) return 'Complex query injection';
    if (dataStr.includes('$ne')) return 'Not-equal operator injection';
    if (dataStr.includes('$gt')) return 'Greater-than operator injection';
    return 'NoSQL injection attempt detected';
  } catch (e) {
    return 'NoSQL injection attempt detected';
  }
}

// ==================== ALERT RECIPIENTS API ====================

// Get all alert recipients
router.get('/alerts/recipients', async (req, res) => {
  try {
    const recipients = await AlertRecipient.find().sort({ createdAt: -1 });
    res.json({ recipients });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Check permissions
router.get('/alerts/permissions', async (req, res) => {
  try {
    const canViewReports = await hasPermission('viewReports');
    const canManageAlerts = await hasPermission('manageAlerts');
    res.json({ 
      canViewReports,
      canManageAlerts
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add new alert recipient
router.post('/alerts/recipients', async (req, res) => {
  try {
    // Check if any active recipient has manageAlerts permission
    const canManage = await hasPermission('manageAlerts');
    if (!canManage) {
      // Allow if no recipients exist yet (initial setup)
      const recipientCount = await AlertRecipient.countDocuments();
      if (recipientCount > 0) {
        return res.status(403).json({ 
          error: 'Access denied. No active recipients have permission to manage alerts.' 
        });
      }
    }

    const { email, name, role, permissions } = req.body;
    
    // Check if email already exists
    const existing = await AlertRecipient.findOne({ email });
    if (existing) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    const recipient = new AlertRecipient({
      email,
      name,
      role: role || 'viewer',
      permissions: permissions || {
        receiveAlerts: true,
        viewReports: true,
        manageAlerts: false,
        manageSettings: false
      }
    });

    await recipient.save();
    res.status(201).json({ recipient, message: 'Recipient added successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update alert recipient
router.put('/alerts/recipients/:id', async (req, res) => {
  try {
    // Check if any active recipient has manageAlerts permission
    const canManage = await hasPermission('manageAlerts');
    if (!canManage) {
      return res.status(403).json({ 
        error: 'Access denied. No active recipients have permission to manage alerts.' 
      });
    }

    const { id } = req.params;
    const updates = req.body;

    const recipient = await AlertRecipient.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    );

    if (!recipient) {
      return res.status(404).json({ error: 'Recipient not found' });
    }

    res.json({ recipient, message: 'Recipient updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete alert recipient
router.delete('/alerts/recipients/:id', async (req, res) => {
  try {
    // Check if any active recipient has manageAlerts permission
    const canManage = await hasPermission('manageAlerts');
    if (!canManage) {
      return res.status(403).json({ 
        error: 'Access denied. No active recipients have permission to manage alerts.' 
      });
    }

    const { id } = req.params;
    const recipient = await AlertRecipient.findByIdAndDelete(id);

    if (!recipient) {
      return res.status(404).json({ error: 'Recipient not found' });
    }

    res.json({ message: 'Recipient deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== REPORTS API ====================

// Helper function to check if any active recipient has a permission
async function hasPermission(permission) {
  const recipient = await AlertRecipient.findOne({
    isActive: true,
    [`permissions.${permission}`]: true
  });
  return !!recipient;
}

// Get all reports
router.get('/reports', async (req, res) => {
  try {
    // Check if any active recipient has viewReports permission
    const canView = await hasPermission('viewReports');
    if (!canView) {
      return res.status(403).json({ 
        error: 'Access denied. No active recipients have permission to view reports.' 
      });
    }

    const reportsDir = path.join(__dirname, '../reports');
    
    // Read all PDF files from reports directory
    const files = fs.readdirSync(reportsDir)
      .filter(file => file.endsWith('.pdf'))
      .map(file => {
        const filePath = path.join(reportsDir, file);
        const stats = fs.statSync(filePath);
        const timestamp = file.match(/incident-(\d+)\.pdf/)?.[1];
        
        return {
          filename: file,
          timestamp: timestamp ? parseInt(timestamp) : stats.birthtimeMs,
          date: timestamp ? new Date(parseInt(timestamp)) : stats.birthtime,
          size: stats.size,
          path: `/api/reports/download/${file}`
        };
      })
      .sort((a, b) => b.timestamp - a.timestamp);

    res.json({ reports: files, total: files.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Download specific report
router.get('/reports/download/:filename', async (req, res) => {
  try {
    // Check if any active recipient has viewReports permission
    const canView = await hasPermission('viewReports');
    if (!canView) {
      return res.status(403).json({ 
        error: 'Access denied. No active recipients have permission to view reports.' 
      });
    }

    const { filename } = req.params;
    const filePath = path.join(__dirname, '../reports', filename);

    // Security check - ensure filename doesn't contain path traversal
    if (filename.includes('..') || !filename.endsWith('.pdf')) {
      return res.status(400).json({ error: 'Invalid filename' });
    }

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Report not found' });
    }

    res.download(filePath);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete report
router.delete('/reports/:filename', async (req, res) => {
  try {
    // Check if any active recipient has viewReports permission (needed to delete)
    const canView = await hasPermission('viewReports');
    if (!canView) {
      return res.status(403).json({ 
        error: 'Access denied. No active recipients have permission to manage reports.' 
      });
    }

    const { filename } = req.params;
    const filePath = path.join(__dirname, '../reports', filename);

    // Security check
    if (filename.includes('..') || !filename.endsWith('.pdf')) {
      return res.status(400).json({ error: 'Invalid filename' });
    }

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Report not found' });
    }

    fs.unlinkSync(filePath);
    res.json({ message: 'Report deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== SETTINGS API ====================

// Get all settings
router.get('/settings', async (req, res) => {
  try {
    const settings = await SystemSettings.find();
    
    // Convert to key-value object
    const settingsObj = settings.reduce((acc, setting) => {
      acc[setting.settingKey] = {
        value: setting.settingValue,
        category: setting.category,
        description: setting.description,
        updatedAt: setting.updatedAt
      };
      return acc;
    }, {});

    res.json({ settings: settingsObj });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update setting
router.put('/settings/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const { value, category, description } = req.body;

    const setting = await SystemSettings.findOneAndUpdate(
      { settingKey: key },
      {
        settingValue: value,
        category: category || 'general',
        description: description || '',
        updatedAt: new Date()
      },
      { upsert: true, new: true }
    );

    res.json({ setting, message: 'Setting updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get analytics data with detailed attack information
router.get('/analytics/attacks', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * limit;

    const attacks = await AttackLog.find()
      .sort({ detectedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await AttackLog.countDocuments();

    // Format attacks with detailed information
    const formattedAttacks = attacks.map(attack => ({
      id: attack._id,
      timestamp: attack.detectedAt,
      collection: attack.collection,
      attackType: attack.attackType,
      severity: determineSeverity(attack.rawData),
      payload: attack.rawData,
      payloadString: JSON.stringify(attack.rawData, null, 2),
      description: generateDescription(attack.rawData),
      detected: true
    }));

    res.json({
      attacks: formattedAttacks,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
