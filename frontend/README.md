# NoSQL Security Monitor - Frontend

A comprehensive React frontend for demonstrating and monitoring NoSQL injection attacks.

## Features

### 🛒 Vulnerable E-commerce Application (`/vulnerable`)
- **Homepage**: Product showcase with attack demo buttons
- **Login Page**: Demonstrates authentication bypass vulnerabilities
- **Product Pages**: Shows search and filter injection vulnerabilities
- **Profile Page**: User lookup injection demonstrations

### 🛡️ Security Dashboard (`/dashboard`)
- **Overview**: Real-time metrics and recent attack summary
- **Live Monitoring**: Real-time attack feed with Socket.io
- **Analytics**: Attack pattern visualization (placeholder)
- **Alerts**: Notification management (placeholder)
- **Reports**: Security report generation (placeholder)

## Setup Instructions

### 1. Prerequisites
- Node.js 16+ installed
- Backend server running on `http://localhost:3000`

### 2. Installation
```bash
cd db-sec-frontend
npm install
```

### 3. Environment Configuration
The application will automatically connect to:
- **API**: `http://localhost:3000`
- **Socket.io**: `http://localhost:3000`

### 4. Start Development Server
```bash
npm start
```

The frontend will start on `http://localhost:3001`

## Usage Guide

### Testing Vulnerabilities

1. **Start the Backend**: Ensure your MongoDB security monitor is running
2. **Open Vulnerable App**: Navigate to `http://localhost:3001/vulnerable`
3. **Try Attack Demos**: Use the demo buttons on the homepage or try manual injections:

**Authentication Bypass (Login Page):**
- Username: `admin`
- Password: `{"$ne": null}`

**Search Injection:**
- Search for: `{"$where": "function() { return true; }"}`

**Profile Lookup Injection:**
- User ID: `{"$ne": null}`

### Monitoring Security

1. **Open Dashboard**: Navigate to `http://localhost:3001/dashboard`
2. **View Live Feed**: Go to Live Monitoring for real-time attack detection
3. **Simulate Attacks**: Use the "Simulate Attack Wave" button for demo purposes

## Architecture

### Frontend Structure
```
src/
├── components/
│   ├── dashboard/          # Security dashboard components
│   └── vulnerable/         # Vulnerable app components
├── pages/
│   ├── dashboard/          # Dashboard page components
│   └── vulnerable/         # Vulnerable app pages
├── services/
│   ├── api.ts             # API service layer
│   └── socket.ts          # Socket.io service
└── App.tsx                # Main routing component
```

### Real-time Features
- **Socket.io Integration**: Live attack notifications
- **Real-time Metrics**: Attack counters and system health
- **Live Feed**: Streaming attack detection with payload details
- **Auto-refresh**: Dashboard updates automatically

### Demo Features
- **Attack Simulation**: Generate fake attacks for demonstration
- **Payload Examples**: Pre-loaded injection examples
- **Security Alerts**: Real-time notifications for detected attacks
- **Professional UI**: Clean interface suitable for presentations

## Integration with Backend

The frontend integrates with your existing MongoDB security monitor:

### API Endpoints Used
- `GET /api/dashboard/metrics` - Dashboard statistics
- `GET /api/dashboard/attacks/recent` - Recent attack list
- `POST /api/vulnerable/auth/login` - Vulnerable login endpoint
- `GET /api/vulnerable/products/search` - Vulnerable search endpoint

### Real-time Events
- `new-attack` - New attack detected
- `metrics-update` - Updated dashboard metrics
- `system-alert` - Critical system alerts

## Security Notes

⚠️ **This application contains intentional vulnerabilities for educational purposes**

- All vulnerable endpoints are prefixed with `/vulnerable`
- All attack attempts are logged and monitored
- The application should only be used in controlled environments
- Real-time monitoring helps demonstrate security concepts

## Customization

### Adding New Vulnerabilities
1. Add new API endpoints in the backend `/routes/vulnerable.js`
2. Create corresponding frontend components
3. Add demo buttons with example payloads

### Extending Dashboard
1. Add new dashboard pages in `/pages/dashboard/`
2. Update navigation in `DashboardLayout.tsx`
3. Add corresponding API endpoints for data

### Styling
- Uses Tailwind CSS for styling
- Custom CSS classes in `App.css`
- Responsive design for demo flexibility

## Troubleshooting

### Connection Issues
- Ensure backend is running on port 3000
- Check CORS settings in backend
- Verify Socket.io connection in browser console

### Missing Dependencies
```bash
npm install axios socket.io-client react-router-dom react-hot-toast lucide-react
```

### Build Issues
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

## Demo Usage Tips

1. **Start with Overview**: Show the dashboard overview first
2. **Demonstrate Attacks**: Use the vulnerable app to generate real attacks
3. **Show Real-time**: Switch to live monitoring to see attacks appear
4. **Use Simulation**: Use attack simulation for controlled demonstrations
5. **Explain Context**: Use the educational hints and warnings in the UI