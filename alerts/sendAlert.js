const nodemailer = require("nodemailer");
const path = require("path");

async function sendAlert(logData, reportPath) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: `"NoSQL Alert System" <${process.env.EMAIL_USER}>`,
    to: process.env.EMAIL_USER,
    subject: "⚠️ NoSQL Injection Attack Detected",
    text: `An attack was detected:\n\n🕓 Detected At: ${logData.detectedAt}\n📂 Collection: ${logData.collection}\n⚠️ Attack Type: ${logData.attackType}`,
    attachments: [
      {
        filename: path.basename(reportPath),
        path: reportPath,
      },
    ],
  };

  await transporter.sendMail(mailOptions);
  console.log("📧 Alert email sent with PDF report.");
}

module.exports = sendAlert;
