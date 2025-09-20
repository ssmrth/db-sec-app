const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const GeminiService = require('../services/geminiService');

// Enhanced helper function to parse and clean AI-generated content
function parseAIContent(content) {
  const sections = [];
  // First, clean up all ** symbols from the entire content
  const cleanContent = content.replace(/\*\*/g, '');
  const lines = cleanContent.split('\n');
  let currentSection = null;
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    // Enhanced section header detection - looking for section titles
    if (trimmed.length > 0 && (
        trimmed === trimmed.toUpperCase() && trimmed.length > 3 ||
        trimmed.match(/^[A-Z][A-Z\s&-]+:?$/) ||
        trimmed.startsWith('EXECUTIVE') ||
        trimmed.startsWith('INCIDENT') ||
        trimmed.startsWith('IMPACT') ||
        trimmed.startsWith('IMMEDIATE') ||
        trimmed.startsWith('ROOT CAUSE') ||
        trimmed.startsWith('REMEDIATION') ||
        trimmed.startsWith('LESSONS') ||
        trimmed.startsWith('APPENDIX') ||
        trimmed.startsWith('HIGH PRIORITY') ||
        trimmed.startsWith('MEDIUM PRIORITY') ||
        trimmed.startsWith('LOW PRIORITY')
    )) {
      
      // Save previous section
      if (currentSection && currentSection.content.trim()) {
        sections.push(currentSection);
      }
      
      // Clean up title - remove colons and extra formatting
      let cleanTitle = trimmed.replace(/:$/, '').trim();
      
      // Start new section
      currentSection = {
        title: cleanTitle,
        content: ''
      };
    } else if (currentSection && trimmed.length > 0) {
      // Clean the content line and add to current section
      const cleanLine = trimmed.replace(/\*\*/g, '').trim();
      if (cleanLine.length > 0) {
        currentSection.content += (currentSection.content ? '\n' : '') + cleanLine;
      }
    } else if (!currentSection && trimmed.length > 0) {
      // Content without a header - treat as introduction, but clean it
      const cleanLine = trimmed.replace(/\*\*/g, '').trim();
      if (cleanLine.length > 0) {
        sections.push({
          title: null,
          content: cleanLine
        });
      }
    }
  }
  
  // Don't forget the last section
  if (currentSection && currentSection.content.trim()) {
    sections.push(currentSection);
  }
  
  // Filter out unwanted sections
  const filteredSections = sections.filter(section => {
    if (!section.title) return true; // Keep introduction sections
    
    const title = section.title.toUpperCase();
    const unwantedSections = [
      'EXPLANATION OF NOSQL INJECTION ATTACKS',
      'ASSESSMENT OF AUTOMATED VS TARGETED ATTACK', 
      'REPUTATION AND CUSTOMER TRUST CONCERNS'
    ];
    
    return !unwantedSections.some(unwanted => title.includes(unwanted));
  });
  
  return filteredSections;
}

async function generateReport(data) {
  const timestamp = Date.now();
  const reportDir = path.join('./reports');
  const reportPath = path.join(reportDir, `incident-${timestamp}.pdf`);

  try {
    // Generate AI-powered report content
    console.log('🤖 Generating AI-powered security report...');
    const geminiService = new GeminiService();
    const aiReportContent = await geminiService.generateSecurityReport(data);
    
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const stream = fs.createWriteStream(reportPath);
      doc.pipe(stream);

      // Header with red background bar
      doc.rect(0, 0, 612, 80).fill('#d32f2f');
      doc.fillColor('#ffffff').fontSize(24).font('Helvetica-Bold');
      doc.text('SECURITY INCIDENT REPORT', 50, 25, { align: 'center' });
      doc.fillColor('#ffcdd2').fontSize(12).font('Helvetica');
      doc.text('NoSQL Injection Detection System', 50, 50, { align: 'center' });

      // Reset position after header
      doc.y = 100;
      
      // Incident info box
      doc.rect(50, doc.y, 512, 60).stroke('#d32f2f').lineWidth(1);
      doc.fillColor('#000000').fontSize(11).font('Helvetica-Bold');
      doc.text('INCIDENT DETAILS', 60, doc.y + 10);
      doc.font('Helvetica').fontSize(10);
      doc.text(`Report Generated: ${new Date(timestamp).toLocaleString()}`, 60, doc.y + 5);
      doc.text(`Incident ID: INC-${timestamp}`, 60, doc.y + 5);
      doc.text(`Collection: ${data.collection || 'users'}`, 60, doc.y + 5);
      doc.moveDown(2);

      // Parse and format AI content
      const sections = parseAIContent(aiReportContent);
      
      sections.forEach((section, index) => {
        // Check if we need a new page
        if (doc.y > 680) {
          doc.addPage();
        }

        // Section header
        if (section.title) {
          doc.fillColor('#1976d2').fontSize(13).font('Helvetica-Bold');
          
          // Special formatting for priority sections
          if (section.title.includes('PRIORITY')) {
            doc.fillColor('#d32f2f');
          }
          
          doc.text(section.title.toUpperCase(), { underline: true });
          doc.moveDown(0.3);
        }

        // Section content
        doc.fillColor('#000000').fontSize(10).font('Helvetica');
        
        if (section.content) {
          // Handle different content types
          const lines = section.content.split('\n');
          
          lines.forEach(line => {
            const trimmed = line.trim();
            
            if (trimmed.startsWith('•') || trimmed.startsWith('-')) {
              // Bullet points
              doc.text(`  ${trimmed}`, { 
                indent: 15, 
                paragraphGap: 2,
                width: 480
              });
            } else if (trimmed.length > 0) {
              // Regular paragraph
              doc.text(trimmed, { 
                align: 'justify', 
                paragraphGap: 3,
                width: 480
              });
            }
            
            // Check for page break within content
            if (doc.y > 720) {
              doc.addPage();
            }
          });
        }
        
        doc.moveDown(0.8);
      });

      // Raw data section
      if (doc.y < 600) {
        doc.addPage();
      }
      
      doc.fillColor('#1976d2').fontSize(12).font('Helvetica-Bold');
      doc.text('TECHNICAL APPENDIX', { underline: true });
      doc.moveDown(0.5);
      
      doc.fillColor('#000000').fontSize(10).font('Helvetica');
      doc.text('Raw Attack Data:', { continued: false });
      doc.moveDown(0.5);
      
      // Format JSON nicely
      const formattedJson = JSON.stringify(data, null, 2);
      doc.fontSize(9).font('Courier');
      doc.text(formattedJson, { width: 500 });

      // Add footer to current page
      const currentY = doc.y;
      doc.fillColor('#666666').fontSize(8).font('Helvetica');
      doc.text('Generated by NoSQL Security Monitor', 50, 770, { align: 'center', width: 512 });

      doc.end();

      stream.on('finish', () => {
        console.log('📝 AI-powered report successfully generated at:', reportPath);
        resolve(reportPath);
      });
      
      stream.on('error', (err) => {
        console.error('❌ Error generating PDF:', err);
        reject(err);
      });
    });

  } catch (error) {
    console.error('❌ Error generating AI report:', error);
    
    // Fallback to basic report if AI generation fails
    console.log('🔄 Falling back to basic report generation...');
    return generateBasicReport(data, timestamp, reportPath);
  }
}

// Fallback function for basic report generation
function generateBasicReport(data, timestamp, reportPath) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument();
    const stream = fs.createWriteStream(reportPath);
    doc.pipe(stream);

    doc.fontSize(18).text('🚨 NoSQL Injection Incident Report', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Timestamp: ${new Date(timestamp).toString()}`);
    doc.moveDown();
    doc.text(`Detected Attack Data:\n\n${JSON.stringify(data, null, 2)}`);

    doc.end();

    stream.on('finish', () => {
      console.log('📝 Basic report generated at:', reportPath);
      resolve(reportPath);
    });
    stream.on('error', (err) => {
      console.error('❌ Error generating basic PDF:', err);
      reject(err);
    });
  });
}

module.exports = generateReport;
