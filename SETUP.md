# NoSQL Security Monitor - Complete Setup Guide

## 🚀 Quick Start

### Option 1: Automated Setup (Recommended)
```bash
cd /Users/seezo/codes/dbsec
./start-demo.sh
```

### Option 2: Manual Setup
```bash
# 1. Start Backend
cd /Users/seezo/codes/dbsec/db-sec-app
npm start

# 2. Start Frontend (new terminal)
cd /Users/seezo/codes/dbsec/db-sec-app
npm run frontend
```

## 📋 Prerequisites

1. **MongoDB Running**
   ```bash
   # macOS with Homebrew
   brew services start mongodb/brew/mongodb-community
   
   # Linux
   sudo systemctl start mongod
   ```

2. **Node.js 16+** installed

3. **Environment Variables** (optional)
   Create `.env` file in project root:
   ```env
   MONGODB_URI=mongodb://localhost:27017/nosql-security
   GEMINI_API_KEY=your-api-key-here  # Optional for AI reports
   PORT=3000
   FRONTEND_URL=http://localhost:3001
   ```

## 🎯 Access Points

Once running:
- **🛒 Vulnerable App**: http://localhost:3001/vulnerable
- **🛡️ Security Dashboard**: http://localhost:3001/dashboard  
- **🔧 Backend API**: http://localhost:3000

## 🎪 Demo Instructions

### 1. Test Vulnerabilities
Navigate to http://localhost:3001/vulnerable and try:

**Authentication Bypass (Login Page):**
- Username: `admin`
- Password: `{"$ne": null}`

**Search Injection:**
- Search: `{"$where": "function() { return true; }"}`

### 2. Monitor Security
Navigate to http://localhost:3001/dashboard:
- View real-time attack detection
- Check live monitoring feed
- Use "Simulate Attack Wave" for demos

## 🛠️ Available Commands

```bash
# Backend only
npm start                 # Start backend server
npm run dev              # Start with nodemon
npm run usage            # Check API usage

# Frontend management  
npm run frontend         # Start frontend dev server
npm run frontend:install # Install frontend dependencies
npm run frontend:build   # Build frontend for production

# Demo
npm run demo            # Start complete demo environment
```

## 📁 Project Structure

```
db-sec-app/
├── frontend/           # React frontend application
│   ├── src/
│   │   ├── components/ # React components
│   │   ├── pages/      # Page components
│   │   └── services/   # API & Socket services
│   └── package.json
├── alerts/            # Email alert system
├── config/            # Database configuration  
├── detectors/         # Attack detection logic
├── models/            # MongoDB schemas
├── reports/           # PDF report generation
├── routes/            # API routes
├── services/          # Backend services (AI, etc.)
├── scripts/           # Utility scripts
├── utils/             # Helper utilities
└── logs/             # System logs
```

## 🔧 Troubleshooting

### Frontend Issues
```bash
# Reinstall frontend dependencies
cd frontend
rm -rf node_modules package-lock.json
npm install
```

### Backend Issues
```bash
# Check MongoDB connection
mongosh --eval "db.adminCommand('ping')"

# Restart with clean state
rm -rf node_modules package-lock.json
npm install
```

### Port Conflicts
- Backend uses port 3000
- Frontend uses port 3001
- Modify `PORT` in .env if needed

## 🎯 Demo Tips

1. **Start with Dashboard Overview** - Show metrics and system status
2. **Demonstrate Attacks** - Use vulnerable app to trigger real attacks
3. **Show Real-time Detection** - Switch to Live Monitoring
4. **Use Attack Simulation** - Click "Simulate Attack Wave" for bulk demo
5. **Explain AI Reports** - Show generated PDF reports (if Gemini API configured)

## ⚠️ Security Notes

- This application contains **intentional vulnerabilities**
- Use only in **controlled environments**
- All activities are **logged and monitored**
- Perfect for **security education and demonstrations**
