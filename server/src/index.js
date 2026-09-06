const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
require('dotenv').config(); // fallback to cwd .env
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { connectDB } = require('./db');
const { apiLimiter } = require('./middleware/rateLimiter');

// Process crash safeguards
process.on('uncaughtException', (err) => {
  console.error('[UNCAUGHT EXCEPTION]:', err.message);
});
process.on('unhandledRejection', (reason) => {
  console.error('[UNHANDLED REJECTION]:', reason);
});

const app = express();

// Security Headers
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

// CORS Configuration
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  process.env.CLIENT_ORIGIN
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, true); // Dev-friendly fallback
    }
  },
  credentials: true
}));

// Request body limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Global API rate limiting
app.use('/api/', apiLimiter);

// API Routes
app.use('/api/auth',          require('./routes/auth'));
app.use('/api/profiles',      require('./routes/profiles'));
app.use('/api/visits',        require('./routes/visits'));
app.use('/api/prescriptions', require('./routes/prescriptions'));
app.use('/api/nutrition',     require('./routes/nutrition'));
app.use('/api/monitoring',    require('./routes/monitoring'));
app.use('/api/calendar',      require('./routes/calendar'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/audit',         require('./routes/audit'));
app.use('/api/emergency',     require('./routes/emergency'));
app.use('/api/research',      require('./routes/research'));

app.get('/api/health', (_, res) => res.json({
  status: 'ok',
  platform: 'MedicoAssist Research Platform',
  version: '2.5.0-research',
  timestamp: new Date().toISOString()
}));

// Safe error handler - never exposes internal stack traces
app.use((err, req, res, next) => {
  console.error('[SERVER ERROR]:', err.message);
  res.status(err.status || 500).json({
    success: false,
    error: {
      code: err.code || 'INTERNAL_SERVER_ERROR',
      message: process.env.NODE_ENV === 'production' ? 'An unexpected internal error occurred.' : err.message
    }
  });
});

const PORT = process.env.PORT || 3001;

// Start listening immediately
app.listen(PORT, () => {
  console.log(`🚀 MedicoAssist Research API running on http://localhost:${PORT}`);
  connectDB().catch(err => {
    console.warn('DB background init notice:', err.message);
  });
});
