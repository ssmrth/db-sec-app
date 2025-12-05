const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const connectDB = require('./config/db');
const helmet = require('helmet');
const { watchCollection } = require('./detectors/injectionMonitor');

require('dotenv').config();
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || '*',
    methods: ["GET", "POST"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"]
  },
  transports: ['websocket', 'polling'],
  allowEIO3: true
});

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));
app.use(express.json());
app.use(helmet({
  crossOriginEmbedderPolicy: false // Allow frontend integration
}));

// Import routes
const apiRoutes = require('./routes/api');
const vulnerableRoutes = require('./routes/vulnerable');

// Use routes
app.use('/api', apiRoutes);
app.use('/api/vulnerable', vulnerableRoutes);

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
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Frontend should connect to http://localhost:${PORT}`);
});
