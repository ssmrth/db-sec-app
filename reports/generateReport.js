const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

async function generateReport(data) {
  const timestamp = Date.now();
  const reportDir = path.join('./reports'); // Make sure it's pointing to the "reports" folder
  const reportPath = path.join(reportDir, `incident-${timestamp}.pdf`);

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
      console.log('📝 Report successfully generated at:', reportPath);
      resolve(reportPath);
    });
    stream.on('error', (err) => {
      console.error('❌ Error generating PDF:', err);
      reject(err);
    });
  });
}

module.exports = generateReport;
