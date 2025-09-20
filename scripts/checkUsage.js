#!/usr/bin/env node

// Usage monitoring script for Gemini API
const UsageMonitor = require('../utils/usageMonitor');

function displayUsageReport() {
  const monitor = new UsageMonitor();
  const report = monitor.getUsageReport();
  
  console.log('\n🤖 GEMINI API USAGE REPORT');
  console.log('═══════════════════════════════════════');
  
  console.log('\n📅 TODAY\'S USAGE:');
  console.log(`   Date: ${report.today.date}`);
  console.log(`   Requests: ${report.today.requests}/1,400 (daily limit)`);
  console.log(`   Tokens: ${report.today.tokens.toLocaleString()}`);
  console.log(`   Remaining: ${report.today.remainingRequests} requests`);
  
  console.log('\n📊 TOTAL STATISTICS:');
  console.log(`   All-time requests: ${report.total.allTimeRequests.toLocaleString()}`);
  console.log(`   Tracking since: ${new Date(report.total.trackingSince).toLocaleDateString()}`);
  
  console.log('\n🚦 STATUS:');
  console.log(`   ${report.status.message}`);
  
  // Warning thresholds
  const usagePercentage = (report.today.requests / 1400) * 100;
  if (usagePercentage > 80) {
    console.log('\n⚠️  WARNING: High usage detected!');
    console.log('   Consider monitoring attack frequency or implementing request queuing.');
  } else if (usagePercentage > 60) {
    console.log('\n💡 INFO: Moderate usage detected.');
    console.log('   Usage is within normal range but approaching daily limits.');
  }
  
  console.log('\n📋 FREE TIER LIMITS:');
  console.log('   • 15 requests per minute');
  console.log('   • 1,000,000 tokens per minute');
  console.log('   • 1,500 requests per day');
  console.log('   • Conservative limits: 10 RPM, 1,400 daily requests');
  
  console.log('\n');
}

// Run the usage report
if (require.main === module) {
  displayUsageReport();
}

module.exports = { displayUsageReport };
