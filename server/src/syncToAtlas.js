const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const fs = require('fs');
const mongoose = require('mongoose');

const localDbPath = path.join(__dirname, '../data/campushealth_db.json');

async function sync() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error('❌ No MONGO_URI found in server/.env');
    process.exit(1);
  }

  if (!fs.existsSync(localDbPath)) {
    console.error('❌ Local database file not found at:', localDbPath);
    process.exit(1);
  }

  const localData = JSON.parse(fs.readFileSync(localDbPath, 'utf8'));
  console.log('📦 Local data loaded successfully.');

  console.log('🔄 Connecting to MongoDB Atlas...');
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
    console.log('✅ Connected to MongoDB Atlas successfully!');
  } catch (err) {
    console.error('\n❌ Could not connect to MongoDB Atlas:');
    console.error(err.message);
    console.log('\n💡 Resolution:');
    console.log('1. Go to MongoDB Atlas (cloud.mongodb.com)');
    console.log('2. Click "Network Access" in the left sidebar');
    console.log('3. Click "Add IP Address" and select "Allow Access From Anywhere" (0.0.0.0/0)');
    console.log('4. Wait 1 minute and re-run: node server/src/syncToAtlas.js\n');
    process.exit(1);
  }

  const db = mongoose.connection.db;

  const collections = [
    { key: 'users', collectionName: 'users' },
    { key: 'profiles', collectionName: 'studentprofiles' },
    { key: 'visits', collectionName: 'medicalvisits' },
    { key: 'prescriptions', collectionName: 'prescriptions' },
    { key: 'nutritionPlans', collectionName: 'nutritionplans' },
    { key: 'monitoringPlans', collectionName: 'dailymonitoringplans' },
    { key: 'monitoringResponses', collectionName: 'dailymonitoringresponses' },
    { key: 'calendarEvents', collectionName: 'healthcalendarevents' },
    { key: 'notifications', collectionName: 'notifications' },
    { key: 'auditLogs', collectionName: 'auditlogs' }
  ];

  console.log('\n🚀 Starting Data Migration to Atlas:');
  for (const col of collections) {
    const items = localData[col.key] || [];
    if (items.length === 0) continue;

    const mongoCol = db.collection(col.collectionName);
    let inserted = 0;

    for (const doc of items) {
      // Clean string IDs to avoid conflict with MongoDB _id
      const query = doc._id ? { _id: doc._id } : doc.id ? { id: doc.id } : { email: doc.email };
      await mongoCol.replaceOne(query, doc, { upsert: true });
      inserted++;
    }

    console.log(`  ✓ Synced ${inserted} record(s) into collection "${col.collectionName}"`);
  }

  console.log('\n🎉 Atlas Migration Complete! All local records are now in your cloud cluster.\n');
  await mongoose.disconnect();
  process.exit(0);
}

sync();

