const fs = require('fs');
const path = require('path');
const { connectDB } = require('../db');
const { mongooseModels } = require('../models/provider');

async function restoreBackup(backupFilePath) {
  if (!backupFilePath) {
    // Find latest backup in server/data/backups/
    const backupDir = path.join(__dirname, '../../data/backups');
    if (!fs.existsSync(backupDir)) {
      throw new Error(`Backup directory '${backupDir}' does not exist.`);
    }
    const files = fs.readdirSync(backupDir).filter((f) => f.endsWith('.json')).sort().reverse();
    if (files.length === 0) {
      throw new Error('No backup files found in server/data/backups/');
    }
    backupFilePath = path.join(backupDir, files[0]);
  }

  console.log(`📦 Restoring from backup file: ${backupFilePath}`);
  const content = JSON.parse(fs.readFileSync(backupFilePath, 'utf8'));
  const collections = content.collections || {};

  await connectDB();

  for (const [modelName, records] of Object.entries(collections)) {
    const Model = mongooseModels[modelName];
    if (!Model) {
      console.warn(`Skipping unknown model: ${modelName}`);
      continue;
    }
    console.log(`Restoring ${records.length} records into '${modelName}'...`);
    await Model.deleteMany({});
    if (records.length > 0) {
      await Model.insertMany(records, { ordered: false });
    }
  }

  console.log('✅ Database restore completed successfully.');
}

if (require.main === module) {
  const fileArg = process.argv[2];
  restoreBackup(fileArg)
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('❌ Restore failed:', err.message);
      process.exit(1);
    });
}

module.exports = { restoreBackup };
