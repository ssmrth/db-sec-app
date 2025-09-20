const mongoose = require('mongoose');
const AttackLog = require('../models/AttackLog');
const generateReport = require('../reports/generateReport');
const sendAlert = require('../alerts/sendAlert');
const fs = require('fs');
const path = require('path');

const db = mongoose.connection;

function detectInjection(doc) {
  const suspicious = JSON.stringify(doc).includes('$ne') || JSON.stringify(doc).includes('$gt');
  return suspicious;
}

function watchCollection() {
  let lastCheckTime = new Date();
  
  // Polling approach for standalone MongoDB
  const pollInterval = setInterval(async () => {
    try {
      const recentDocs = await db.collection('users').find({
        _id: { $gt: new mongoose.Types.ObjectId(Math.floor(lastCheckTime.getTime() / 1000).toString(16) + "0000000000000000") }
      }).toArray();

      for (const doc of recentDocs) {
        if (detectInjection(doc)) {
          console.log('[!] Injection attack detected!');

          // Save to DB
          const newLog = new AttackLog({
            attackType: 'NoSQL Injection',
            details: doc,
            timestamp: new Date()
          });
          await newLog.save();

          // Generate report
          const reportPath = await generateReport(doc);

          // Send email with attachment
          await sendAlert(
            {
              detectedAt: new Date().toISOString(),
              collection: 'users',
              attackType: 'NoSQL Injection',
            },
            reportPath
          );
        }
      }
      
      lastCheckTime = new Date();
    } catch (error) {
      console.error('Error polling collection:', error.message);
    }
  }, 5000); // Check every 5 seconds

  console.log('👀 Polling collection for changes every 5 seconds...');
  
  // Return cleanup function
  return () => clearInterval(pollInterval);
}

module.exports = {
  watchCollection
};
