const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const app = express();

// --- Middleware ---
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:3000' }));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// --- Routes ---
app.use('/api/auth',      require('./routes/auth'));
app.use('/api/candidate', require('./routes/candidate'));
app.use('/api/recruiter', require('./routes/recruiter'));

// --- Health check ---
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// --- Global error handler ---
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

// --- DB + Server Start ---
const PORT = process.env.PORT || 5000;
let MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/hireflow';

async function startServer() {
  const isDev = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;
  const isLocalHost = !process.env.MONGODB_URI || process.env.MONGODB_URI.includes('localhost') || process.env.MONGODB_URI.includes('127.0.0.1');

  if (isDev && isLocalHost) {
    try {
      console.log('Connecting to local MongoDB...');
      await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 2000 });
      console.log('✅  Local MongoDB connected');
    } catch (err) {
      console.log('⚠️  Local MongoDB not found. Spinning up persistent MongoDB memory server...');
      try {
        const fs = require('fs');
        const path = require('path');
        const dbDir = path.join(__dirname, 'db-data');
        if (!fs.existsSync(dbDir)) {
          fs.mkdirSync(dbDir, { recursive: true });
        }
        
        const { MongoMemoryServer } = require('mongodb-memory-server');
        const mongoServer = await MongoMemoryServer.create({
          instance: {
            dbPath: dbDir,
            storageEngine: 'wiredTiger',
          }
        });
        MONGO_URI = mongoServer.getUri();
        await mongoose.connect(MONGO_URI);
        console.log('✅  Persistent MongoDB memory server connected at', MONGO_URI);
      } catch (memErr) {
        console.error('❌ Failed to start persistent MongoDB memory server:', memErr.message);
        process.exit(1);
      }
    }
  } else {
    try {
      await mongoose.connect(MONGO_URI);
      console.log('✅  MongoDB connected');
    } catch (err) {
      console.error('❌  MongoDB connection error:', err.message);
      process.exit(1);
    }
  }

  app.listen(PORT, () => console.log(`🚀  Server running on http://localhost:${PORT}`));
}

startServer();

