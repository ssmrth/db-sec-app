const express = require('express');
const router = express.Router();
const AttackLog = require('../models/AttackLog');
const UsageMonitor = require('../utils/usageMonitor');

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
      blocked: true, // All detected attacks are blocked
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
  const dataStr = JSON.stringify(rawData);
  if (dataStr.includes('$where') || dataStr.includes('$eval')) return 'critical';
  if (dataStr.includes('$ne') && dataStr.includes('$gt')) return 'high';
  if (dataStr.includes('$ne') || dataStr.includes('$gt')) return 'medium';
  return 'low';
}

function generateDescription(rawData) {
  const dataStr = JSON.stringify(rawData);
  if (dataStr.includes('$where')) return 'JavaScript code injection attempt';
  if (dataStr.includes('$ne') && dataStr.includes('password')) return 'Authentication bypass attempt';
  if (dataStr.includes('$gt') && dataStr.includes('$ne')) return 'Complex query injection';
  if (dataStr.includes('$ne')) return 'Not-equal operator injection';
  if (dataStr.includes('$gt')) return 'Greater-than operator injection';
  return 'NoSQL injection attempt detected';
}

module.exports = router;
