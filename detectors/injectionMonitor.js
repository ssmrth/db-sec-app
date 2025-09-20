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
  const processedDocuments = new Set(); // Track ALL processed documents
  const processingQueue = new Set(); // Track documents currently being processed
  let lastCheckTime = new Date();
  
  // Polling approach for standalone MongoDB
  const pollInterval = setInterval(async () => {
    try {
      // Get documents created since last check
      const recentDocs = await db.collection('users').find({
        _id: { $gt: new mongoose.Types.ObjectId(Math.floor(lastCheckTime.getTime() / 1000).toString(16) + "0000000000000000") }
      }).toArray();

      for (const doc of recentDocs) {
        const docId = doc._id.toString();
        
        // BULLETPROOF DUPLICATE PREVENTION
        if (processedDocuments.has(docId) || processingQueue.has(docId)) {
          continue; // Skip - already processed or currently processing
        }

        if (detectInjection(doc)) {
          console.log(`[!] NoSQL Injection attack detected! Document ID: ${docId}`);

          // Mark as processing IMMEDIATELY to prevent duplicates
          processingQueue.add(docId);
          processedDocuments.add(docId);

          try {
            // Save to DB - check if already exists first
            const existingLog = await AttackLog.findOne({ 'rawData._id': doc._id });
            if (!existingLog) {
              const newLog = new AttackLog({
                attackType: 'NoSQL Injection',
                collection: 'users',
                rawData: doc,
                detectedAt: new Date()
              });
              await newLog.save();

              // Generate report ONLY if not already processed
              const reportPath = await generateReport({
                attackType: 'NoSQL Injection',
                collection: 'users',
                query: doc,
                detectedAt: new Date().toISOString(),
                documentId: docId,
                sourceIP: doc.sourceIP || '127.0.0.1',
                userAgent: doc.userAgent || 'Unknown'
              });

              // Send email ONLY if report was generated
              await sendAlert(
                {
                  detectedAt: new Date().toISOString(),
                  collection: 'users',
                  attackType: 'NoSQL Injection',
                  documentId: docId
                },
                reportPath
              );

              console.log(`✅ Attack ${docId} processed successfully`);
            } else {
              console.log(`⚠️ Attack ${docId} already exists in database - skipping`);
            }
          } catch (processError) {
            console.error(`❌ Error processing attack ${docId}:`, processError.message);
          } finally {
            // Remove from processing queue
            processingQueue.delete(docId);
          }
        }
      }
      
      // Update last check time
      lastCheckTime = new Date();

      // Clean up old processed IDs (keep last 5000 to be extra safe)
      if (processedDocuments.size > 5000) {
        const idsArray = Array.from(processedDocuments);
        const toRemove = idsArray.slice(0, idsArray.length - 2500);
        toRemove.forEach(id => processedDocuments.delete(id));
      }

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
