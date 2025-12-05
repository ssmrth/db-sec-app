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
// Log origins safely (avoid issues with path-to-regexp)
if (Array.isArray(allowedOrigins)) {
  console.log('🌐 Allowed CORS origins:', allowedOrigins.length, 'origin(s) configured');
} else {
  console.log('🌐 Allowed CORS origins: * (all origins)');
}

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

// API routes (must be before static file serving)
app.use('/api', apiRoutes);
app.use('/api/vulnerable', vulnerableRoutes);

// 404 handler for API routes
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'API endpoint not found', path: req.path });
});

// Serve static files from React app (for production)
const frontendBuildPath = path.join(__dirname, 'frontend', 'build');

// Check if frontend build exists and serve it
if (fs.existsSync(frontendBuildPath)) {
  console.log('📦 Serving frontend build from:', frontendBuildPath);
  
  // Serve static files (JS, CSS, images, etc.) with proper MIME types
  // This MUST be before any catch-all routes
  // Important: This serves files from frontend/build directory
  app.use(express.static(frontendBuildPath, {
    maxAge: '1y',
    etag: true,
    index: false, // Don't serve index.html for directory requests
    fallthrough: true, // Allow fallthrough to next middleware if file not found
    setHeaders: (res, filePath) => {
      // Ensure proper MIME types for JavaScript and CSS files
      if (filePath.endsWith('.js')) {
        res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
      } else if (filePath.endsWith('.css')) {
        res.setHeader('Content-Type', 'text/css; charset=utf-8');
      } else if (filePath.endsWith('.json')) {
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
      }
    }
  }));
  
  // Root route - serve index.html
  app.get('/', (req, res) => {
    res.sendFile(path.join(frontendBuildPath, 'index.html'));
  });
  
  // Catch-all handler for client-side routing (React Router)
  // Use middleware function instead of route pattern to avoid path-to-regexp issues
  // This must be the LAST middleware
  app.use((req, res, next) => {
    // Only handle GET requests
    if (req.method !== 'GET') {
      return next();
    }
    
    // Skip API routes
    if (req.path.startsWith('/api')) {
      return next();
    }
    
    // Skip requests that look like static files
    // These should have been handled by express.static above
    const ext = path.extname(req.path).toLowerCase();
    const staticExtensions = ['.js', '.css', '.json', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.woff', '.woff2', '.ttf', '.eot', '.map', '.webp', '.avif', '.txt', '.xml', '.pdf'];
    if (staticExtensions.includes(ext)) {
      // Static file should have been served by express.static
      // If we reach here, file doesn't exist
      return res.status(404).send('File not found');
    }
    
    // For all other GET requests, send index.html (React Router will handle routing)
    res.sendFile(path.join(frontendBuildPath, 'index.html'), (err) => {
      if (err) {
        console.error('Error sending index.html:', err);
        next(err);
      }
    });
  });
} else {
  // No frontend build - API only mode
  app.get('/', (req, res) => {
    res.json({ message: 'API is running', frontend: 'Not built yet' });
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
  if (fs.existsSync(frontendBuildPath)) {
    console.log(`✅ Frontend build found - serving static files`);
  } else {
    console.log(`⚠️  Frontend build not found - API only mode`);
  }
  console.log(`🔌 Socket.io ready for connections`);
});
