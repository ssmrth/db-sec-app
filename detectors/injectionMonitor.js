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
  const changeStream = db.collection('users').watch(); 

  changeStream.on('change', async (change) => {
    if (change.operationType === 'insert') {
      const fullDocument = change.fullDocument;

      if (detectInjection(fullDocument)) {
        console.log('[!] Injection attack detected!');

        // Save to DB
        const newLog = new AttackLog({
          attackType: 'NoSQL Injection',
          details: fullDocument,
          timestamp: new Date()
        });
        await newLog.save();

        // Generate report
        const reportPath = await generateReport(fullDocument);

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
  });

  console.log('👀 Watching collection for changes...');
}

module.exports = {
  watchCollection
};
