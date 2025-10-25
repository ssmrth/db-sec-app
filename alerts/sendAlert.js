const nodemailer = require("nodemailer");
const path = require("path");
const AlertRecipient = require("../models/AlertRecipient");

async function sendAlert(logData, reportPath) {
  try {
    // Get all active recipients who should receive alerts
    const recipients = await AlertRecipient.find({
      isActive: true,
      'permissions.receiveAlerts': true
    }).lean();

    if (recipients.length === 0) {
      console.log("⚠️ No active alert recipients found. Skipping email.");
      return;
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Send to all recipients
    const recipientEmails = recipients.map(r => r.email).join(', ');

    const mailOptions = {
      from: `"NoSQL Alert System" <${process.env.EMAIL_USER}>`,
      to: recipientEmails,
      subject: "⚠️ NoSQL Injection Attack Detected",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #dc2626;">🚨 Security Alert: NoSQL Injection Detected</h2>
          <p>An attack was detected on your system. Please review the details below:</p>
          
          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p><strong>🕓 Detected At:</strong> ${new Date(logData.detectedAt).toLocaleString()}</p>
            <p><strong>📂 Collection:</strong> ${logData.collection}</p>
            <p><strong>⚠️ Attack Type:</strong> ${logData.attackType}</p>
          </div>
          
          <p>A detailed security report is attached to this email.</p>
          
          <p style="color: #6b7280; font-size: 12px; margin-top: 30px;">
            This is an automated alert from your NoSQL Security Monitoring System.
          </p>
        </div>
      `,
      attachments: [
        {
          filename: path.basename(reportPath),
          path: reportPath,
        },
      ],
    };

    await transporter.sendMail(mailOptions);
    
    // Update last notified timestamp for all recipients
    await AlertRecipient.updateMany(
      { _id: { $in: recipients.map(r => r._id) } },
      { $set: { lastNotified: new Date() } }
    );

    console.log(`📧 Alert email sent to ${recipients.length} recipient(s).`);
  } catch (error) {
    console.error("❌ Error sending alert email:", error);
    throw error;
  }
}

module.exports = sendAlert;
