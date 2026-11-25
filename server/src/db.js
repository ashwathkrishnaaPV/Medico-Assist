const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const env = require('./config/env');

const MONGO_URI = env.mongoUri || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/campushealth';

let isConnected = false;
let supportsTransactions = false;

mongoose.connection.on('connected', () => {
  isConnected = true;
  console.log(`✅ MongoDB connected successfully to "${mongoose.connection.name}"!`);
});

mongoose.connection.on('error', (err) => {
  isConnected = false;
  console.warn('⚠️ MongoDB connection error:', err.message);
});

mongoose.connection.on('disconnected', () => {
  isConnected = false;
  console.log('ℹ️ MongoDB disconnected.');
});

const connectDB = async () => {
  try {
    if (mongoose.connection.readyState === 1) {
      isConnected = true;
      return true;
    }

    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
      autoIndex: true
    });

    isConnected = true;

    // Detect if MongoDB deployment supports multi-document transactions (replica set or mongos)
    try {
      const admin = mongoose.connection.db.admin();
      const helloInfo = await admin.command({ hello: 1 }).catch(() => admin.command({ isMaster: 1 }));
      supportsTransactions = Boolean(helloInfo.setName || helloInfo.msg === 'isdbgrid');
      if (supportsTransactions) {
        console.log(`✅ MongoDB replica set detected (${helloInfo.setName || 'mongos'}). Multi-document transactions enabled.`);
      } else {
        console.log('ℹ️ MongoDB standalone mode detected (atomic single-document operations enabled).');
      }
    } catch {
      supportsTransactions = false;
      console.log('ℹ️ MongoDB standalone mode assumed (atomic single-document operations enabled).');
    }

    return true;
  } catch (err) {
    isConnected = false;
    console.error('❌ MongoDB initial connection failed:', err.message);
    return false;
  }
};

/**
 * Execute a unit of work inside a transaction if supported, or directly if standalone.
 */
async function withTransaction(workFn) {
  if (supportsTransactions && mongoose.connection.readyState === 1) {
    const session = await mongoose.startSession();
    try {
      let result;
      await session.withTransaction(async () => {
        result = await workFn(session);
      });
      return result;
    } catch (err) {
      if (err.message && err.message.includes('replica set member')) {
        supportsTransactions = false;
        return workFn(null);
      }
      throw err;
    } finally {
      await session.endSession();
    }
  }
  // Standalone fallback: execute work without session
  return workFn(null);
}

/**
 * Create a full database backup in server/data/backups/
 */
async function createDatabaseBackup() {
  const { mongooseModels } = require('./models/provider');
  const backupDir = path.join(__dirname, '../data/backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFile = path.join(backupDir, `backup_${timestamp}.json`);

  const dump = {
    metadata: {
      timestamp: new Date().toISOString(),
      platform: 'MedicoAssist Campus Healthcare System',
      version: '3.0.0'
    },
    collections: {}
  };

  for (const [name, model] of Object.entries(mongooseModels)) {
    try {
      const records = await model.find({}).lean();
      dump.collections[name] = records;
    } catch {
      dump.collections[name] = [];
    }
  }

  fs.writeFileSync(backupFile, JSON.stringify(dump, null, 2), 'utf8');
  console.log(`✅ Backup successfully saved to ${backupFile}`);
  return {
    filename: path.basename(backupFile),
    path: backupFile,
    timestamp: dump.metadata.timestamp,
    stats: Object.fromEntries(Object.entries(dump.collections).map(([k, v]) => [k, v.length]))
  };
}

const getIsConnected = () => isConnected || mongoose.connection.readyState === 1;

module.exports = {
  connectDB,
  getIsConnected,
  withTransaction,
  createDatabaseBackup,
  MONGO_URI
};
