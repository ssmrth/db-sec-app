# NoSQL Security Monitor

A real-time NoSQL injection detection and reporting system with AI-powered incident analysis.

## Features

- 🔍 **Real-time NoSQL Injection Detection**: Monitors MongoDB collections for suspicious queries
- 🤖 **AI-Powered Report Generation**: Uses Google Gemini AI to create comprehensive security incident reports
- 📧 **Automated Alerts**: Sends email notifications with detailed PDF reports
- 📊 **Attack Logging**: Stores attack details in MongoDB for analysis
- 🛡️ **Security Best Practices**: Implements helmet.js and input sanitization

## Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Configuration
Create a `.env` file in the root directory with the following variables:

```env
# Database Configuration
MONGODB_URI=mongodb://localhost:27017/nosql-security

# Email Configuration (for alerts)
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_RECIPIENT=admin@yourcompany.com

# Google Gemini API Configuration
GEMINI_API_KEY=your-gemini-api-key-here

# Server Configuration
PORT=3000
```

### 3. Google Gemini API Setup
1. Go to [Google AI Studio](https://aistudio.google.com/)
2. Create a new project or use an existing one
3. Generate an API key
4. Add the API key to your `.env` file as `GEMINI_API_KEY`

### 4. Email Configuration (Optional)
For email alerts, configure your email credentials:
- Use Gmail with an App Password for `EMAIL_PASS`
- Or configure your SMTP server details

## Usage

### Starting the System
```bash
npm start
```

The system will:
1. Connect to MongoDB
2. Start monitoring for NoSQL injection attacks
3. Generate AI-powered PDF reports when attacks are detected
4. Send email alerts with the reports attached

### Monitoring API Usage
```bash
npm run usage
```

This command shows:
- Daily request count and remaining quota
- Token usage statistics
- Current status within free tier limits
- Usage warnings and recommendations

### Free Tier Management
The system automatically manages Google Gemini's free tier limits:
- **Rate Limiting**: Maximum 10 requests per minute (conservative)
- **Daily Limits**: Maximum 1,400 requests per day (conservative)
- **Token Optimization**: Prompts optimized to use ~300-500 input tokens
- **Output Limits**: Reports capped at 1,000 tokens (~2 pages)
- **Usage Tracking**: Persistent monitoring across restarts

## AI-Powered Reports

The system uses Google Gemini 2.5 Flash to generate comprehensive security reports that include:

- **Executive Summary**: Brief overview and impact assessment
- **Attack Details**: Technical analysis of the injection attempt
- **Prevention Guidelines**: Specific recommendations to prevent similar attacks
- **Remediation Steps**: Immediate and long-term security improvements

## File Structure

```
├── alerts/           # Email alert functionality
├── config/           # Database configuration
├── detectors/        # NoSQL injection detection logic
├── frontend/         # React frontend application
├── models/           # MongoDB schemas
├── reports/          # PDF report generation
├── routes/           # API routes for frontend integration
├── services/         # AI service integration
├── scripts/          # Utility scripts
├── utils/            # Helper utilities
└── logs/            # Activity logs
```

## Frontend Application

The system now includes a comprehensive React frontend with:

### 🛒 **Vulnerable E-commerce Demo** (`/frontend`)
- Interactive vulnerable application for security testing
- Real NoSQL injection examples and demonstrations
- Educational hints and attack payload examples

### 🛡️ **Security Dashboard**
- Real-time attack monitoring with Socket.io
- Professional security dashboard interface
- Live metrics and attack analytics
- Incident reporting and alert management

### 🚀 **Quick Start**
```bash
# Start both backend and frontend
./start-demo.sh

# Or manually:
# Terminal 1 - Backend
npm start

# Terminal 2 - Frontend
cd frontend && npm start
```

### 📍 **Access Points**
- **Vulnerable App**: http://localhost:3001/vulnerable
- **Security Dashboard**: http://localhost:3001/dashboard
- **Backend API**: http://localhost:3000
