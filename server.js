const express = require('express');
const connectDB = require('./config/db');
const helmet = require('helmet');
//const watchCollection = require('./detectors/injectionMonitor');
const { watchCollection } = require('./detectors/injectionMonitor');


require('dotenv').config();
const app = express();

app.use(express.json());
app.use(helmet());

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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
