const fs = require('fs');
const path = require('path');

class UsageMonitor {
  constructor() {
    this.usageFile = path.join(__dirname, '../logs/gemini-usage.json');
    this.ensureUsageFile();
  }

  ensureUsageFile() {
    try {
      if (!fs.existsSync(this.usageFile)) {
        const initialData = {
          dailyUsage: {},
          totalRequests: 0,
          lastReset: new Date().toISOString()
        };
        fs.writeFileSync(this.usageFile, JSON.stringify(initialData, null, 2));
      }
    } catch (error) {
      console.warn('Could not create usage tracking file:', error.message);
    }
  }

  getUsageData() {
    try {
      const data = fs.readFileSync(this.usageFile, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.warn('Could not read usage data, returning defaults:', error.message);
      return {
        dailyUsage: {},
        totalRequests: 0,
        lastReset: new Date().toISOString()
      };
    }
  }

  logRequest(inputTokens, outputTokens, totalTokens) {
    try {
      const usage = this.getUsageData();
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

      if (!usage.dailyUsage[today]) {
        usage.dailyUsage[today] = {
          requests: 0,
          inputTokens: 0,
          outputTokens: 0,
          totalTokens: 0
        };
      }

      usage.dailyUsage[today].requests++;
      usage.dailyUsage[today].inputTokens += inputTokens || 0;
      usage.dailyUsage[today].outputTokens += outputTokens || 0;
      usage.dailyUsage[today].totalTokens += totalTokens || 0;
      usage.totalRequests++;

      // Clean up old entries (keep last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const cutoffDate = thirtyDaysAgo.toISOString().split('T')[0];

      Object.keys(usage.dailyUsage).forEach(date => {
        if (date < cutoffDate) {
          delete usage.dailyUsage[date];
        }
      });

      fs.writeFileSync(this.usageFile, JSON.stringify(usage, null, 2));
    } catch (error) {
      console.warn('Could not log usage data:', error.message);
    }
  }

  getTodaysUsage() {
    const usage = this.getUsageData();
    const today = new Date().toISOString().split('T')[0];
    return usage.dailyUsage[today] || {
      requests: 0,
      inputTokens: 0,
      outputTokens: 0,
      totalTokens: 0
    };
  }

  isWithinLimits() {
    const todaysUsage = this.getTodaysUsage();
    const FREE_TIER_DAILY_LIMIT = 1400; // Conservative limit
    
    return {
      withinDailyLimit: todaysUsage.requests < FREE_TIER_DAILY_LIMIT,
      remainingRequests: Math.max(0, FREE_TIER_DAILY_LIMIT - todaysUsage.requests),
      todaysUsage
    };
  }

  getUsageReport() {
    const usage = this.getUsageData();
    const today = new Date().toISOString().split('T')[0];
    const todaysUsage = this.getTodaysUsage();
    const limits = this.isWithinLimits();

    return {
      today: {
        date: today,
        requests: todaysUsage.requests,
        tokens: todaysUsage.totalTokens,
        remainingRequests: limits.remainingRequests
      },
      total: {
        allTimeRequests: usage.totalRequests,
        trackingSince: usage.lastReset
      },
      status: {
        withinLimits: limits.withinDailyLimit,
        message: limits.withinDailyLimit 
          ? `✅ ${limits.remainingRequests} requests remaining today`
          : '⚠️ Daily limit reached'
      }
    };
  }
}

module.exports = UsageMonitor;
