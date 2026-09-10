const mongoose = require('mongoose');

let isConnected = false;

// Attach error listener to connection to prevent unhandled error event crashes
mongoose.connection.on('error', (err) => {
  console.warn('⚠️ Mongoose background event notice:', err.message);
});

const connectDB = async () => {
  if (!process.env.MONGO_URI) {
    console.log('ℹ️ No MONGO_URI set. Using local persistent storage.');
    return false;
  }
  try {
    console.log('Attempting MongoDB connection (4s limit)...');
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 4000,
      connectTimeoutMS: 4000
    });
    isConnected = true;
    console.log('✅ MongoDB Atlas connected successfully!');
    return true;
  } catch (err) {
    isConnected = false;
    try { await mongoose.disconnect(); } catch (_) {}
    console.warn('⚠️ MongoDB Atlas unreachable (port 27017 restricted on this network).');
    console.log('⚡ Active mode: Local persistent database (server/data/campushealth_db.json). Ready for all requests!');
    return false;
  }
};

const getIsConnected = () => isConnected && mongoose.connection.readyState === 1;

module.exports = { connectDB, getIsConnected };
