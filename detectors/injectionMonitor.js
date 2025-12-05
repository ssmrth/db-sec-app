const mongoose = require('mongoose');
const AttackLog = require('../models/AttackLog');
const generateReport = require('../reports/generateReport');
const sendAlert = require('../alerts/sendAlert');
const SystemSettings = require('../models/SystemSettings');
const fs = require('fs');
const path = require('path');

const db = mongoose.connection;

// Helper to get a setting value from the database
async function getSetting(key, defaultValue) {
  try {
    const setting = await SystemSettings.findOne({ key });
    return setting ? setting.value : defaultValue;
  } catch (error) {
    console.error(`Error getting setting ${key}:`, error.message);
    return defaultValue;
  }
}

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

              // Check if report generation is enabled
              const reportEnabled = await getSetting('reportGeneration', true);
              let reportPath = null;
              
              if (reportEnabled) {
                // Generate report ONLY if enabled
                reportPath = await generateReport({
                  attackType: 'NoSQL Injection',
                  collection: 'users',
                  query: doc,
                  detectedAt: new Date().toISOString(),
                  documentId: docId,
                  sourceIP: doc.sourceIP || '127.0.0.1',
                  userAgent: doc.userAgent || 'Unknown'
                });
              } else {
                console.log('📝 Report generation disabled - skipping');
              }

              // Check if email alerts are enabled
              const emailEnabled = await getSetting('emailNotifications', true);
              
              if (emailEnabled) {
                // Send email alert
                await sendAlert(
                  {
                    detectedAt: new Date().toISOString(),
                    collection: 'users',
                    attackType: 'NoSQL Injection',
                    documentId: docId
                  },
                  reportPath
                );
              } else {
                console.log('📧 Email alerts disabled - skipping');
              }

              console.log(`✅ Attack ${docId} processed successfully`);

              // Emit real-time attack data to frontend
              if (global.io) {
                const attackData = {
                  id: docId,
                  timestamp: new Date().toISOString(),
                  type: 'NoSQL Injection',
                  severity: determineSeverity(doc),
                  payload: JSON.stringify(doc),
                  collection: 'users',
                              detected: true,
                  description: generateDescription(doc)
                };
                
                global.io.emit('new-attack', attackData);
                global.io.emit('metrics-update', {
                  attacksToday: await AttackLog.countDocuments({
                    detectedAt: { $gte: new Date().setHours(0, 0, 0, 0) }
                  })
                });
              }
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

// Helper functions for real-time data
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

module.exports = {
  watchCollection
};
