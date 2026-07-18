const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const app = express();

// --- Middleware ---
app.use(helmet());
const allowedOrigins = [
  'http://localhost:3000',
  process.env.CLIENT_URL,
].filter(Boolean);
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. curl, Postman), matching origins, or Vercel deployments
    if (
      !origin ||
      allowedOrigins.some(o => origin.startsWith(o)) ||
      origin.endsWith('.vercel.app')
    ) {
      callback(null, true);
    } else {
      callback(new Error(`CORS: origin ${origin} not allowed`));
    }
  },
  credentials: true,
}));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// --- Routes ---
app.use('/api/auth',      require('./routes/auth'));
app.use('/api/candidate', require('./routes/candidate'));
app.use('/api/recruiter', require('./routes/recruiter'));

// --- Root and Health check ---
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the HireFlow API!', status: 'ok' });
});

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
const { initDb } = require('./services/db');

async function startServer() {
  try {
    await initDb();
  } catch (err) {
    console.error('❌ Database connection/initialization error:', err.message);
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }

  app.listen(PORT, () => console.log(`🚀  Server running on http://localhost:${PORT}`));
}

startServer();

