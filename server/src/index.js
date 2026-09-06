const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
require('dotenv').config(); // fallback to cwd .env
const express = require('express');
const cors = require('cors');
const { connectDB } = require('./db');

const app = express();

app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json({ limit: '10mb' }));

app.use('/api/auth',          require('./routes/auth'));
app.use('/api/profiles',      require('./routes/profiles'));
app.use('/api/visits',        require('./routes/visits'));
app.use('/api/prescriptions', require('./routes/prescriptions'));
app.use('/api/nutrition',     require('./routes/nutrition'));
app.use('/api/monitoring',    require('./routes/monitoring'));
app.use('/api/calendar',      require('./routes/calendar'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/audit',         require('./routes/audit'));

app.get('/api/health', (_, res) => res.json({ status: 'ok', time: new Date() }));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 3001;

// Start listening immediately so frontend never sees a 502 Bad Gateway
app.listen(PORT, () => {
  console.log(`🚀 CampusHealth API running on http://localhost:${PORT}`);
  // Connect to DB in background
  connectDB().catch(err => {
    console.warn('DB background init warning:', err.message);
  });
});
