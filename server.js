const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const connectDB = require('./config/db');
const helmet = require('helmet');
const { watchCollection } = require('./detectors/injectionMonitor');
const path = require('path');
const fs = require('fs');

require('dotenv').config();
const app = express();
const server = http.createServer(app);
// Get allowed origins for CORS
const getAllowedOrigins = () => {
  const origins = [];
  
  // Add FRONTEND_URL if set
  if (process.env.FRONTEND_URL) {
    origins.push(process.env.FRONTEND_URL);
  }
  
  // Add Railway public domain if available (Railway provides this)
  if (process.env.RAILWAY_PUBLIC_DOMAIN) {
    origins.push(`https://${process.env.RAILWAY_PUBLIC_DOMAIN}`);
    origins.push(`http://${process.env.RAILWAY_PUBLIC_DOMAIN}`);
  }
  
  // Add Railway static URL if available (for separate frontend service)
  if (process.env.RAILWAY_STATIC_URL) {
    origins.push(process.env.RAILWAY_STATIC_URL);
  }
  
  // Add Railway service URL (for same-service deployments)
  if (process.env.RAILWAY_SERVICE_URL) {
    origins.push(process.env.RAILWAY_SERVICE_URL);
  }
  
  // In development, allow localhost
  if (process.env.NODE_ENV !== 'production') {
    origins.push('http://localhost:3000');
    origins.push('http://localhost:3002');
    origins.push('http://127.0.0.1:3000');
    origins.push('http://127.0.0.1:3002');
  }
  
  // If no origins specified, allow all (for development)
  // In production, this should be set via environment variables
  return origins.length > 0 ? origins : '*';
};

const allowedOrigins = getAllowedOrigins();
console.log('🌐 Allowed CORS origins:', allowedOrigins);

const io = socketIo(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"]
  },
  transports: ['websocket', 'polling'],
  allowEIO3: true
});

// Middleware
app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));
app.use(express.json());
app.use(helmet({
  crossOriginEmbedderPolicy: false // Allow frontend integration
}));

// Import routes
const apiRoutes = require('./routes/api');
const vulnerableRoutes = require('./routes/vulnerable');

// Serve static files from React app (for production)
const frontendBuildPath = path.join(__dirname, 'frontend', 'build');

// Check if frontend build exists and serve it
if (fs.existsSync(frontendBuildPath)) {
  console.log('📦 Serving frontend build from:', frontendBuildPath);
  app.use(express.static(frontendBuildPath));
}

// API routes (before catch-all)
app.use('/api', apiRoutes);
app.use('/api/vulnerable', vulnerableRoutes);

// Root route - serve API info if frontend not built, otherwise frontend handles it
if (!fs.existsSync(frontendBuildPath)) {
  app.get('/', (req, res) => {
    res.json({ message: 'API is running', frontend: 'Not built yet' });
  });
} else {
  // Catch-all handler: send back React's index.html file for client-side routing
  app.get('*', (req, res) => {
    // Don't serve index.html for API routes
    if (req.path.startsWith('/api')) {
      return res.status(404).json({ error: 'API endpoint not found' });
    }
    res.sendFile(path.join(frontendBuildPath, 'index.html'));
  });
}

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('✅ Frontend client connected:', socket.id);
  console.log(`   Total connected clients: ${io.sockets.sockets.size}`);
  
  // Send initial connection confirmation
  socket.emit('connected', { 
    message: 'Connected to security monitoring system',
    socketId: socket.id,
    timestamp: new Date().toISOString()
  });
  
  socket.on('disconnect', (reason) => {
    console.log('❌ Frontend client disconnected:', socket.id, 'Reason:', reason);
    console.log(`   Remaining connected clients: ${io.sockets.sockets.size}`);
  });
  
  socket.on('error', (error) => {
    console.error('❌ Socket error:', error);
  });
});

// Make io available globally for attack notifications
global.io = io;

connectDB().then(() => {
  const cleanup = watchCollection();
  console.log('Watching MongoDB changes...');
  
  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\nShutting down gracefully...');
    if (cleanup) cleanup();
    process.exit(0);
  });
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📡 CORS Origins: ${JSON.stringify(allowedOrigins)}`);
  if (fs.existsSync(frontendBuildPath)) {
    console.log(`✅ Frontend build found - serving static files`);
  } else {
    console.log(`⚠️  Frontend build not found - API only mode`);
  }
  console.log(`🔌 Socket.io ready for connections`);
});
