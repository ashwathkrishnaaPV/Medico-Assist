const fs = require('fs');
const path = require('path');

const localDbPath = path.join(__dirname, '../data/campushealth_db.json');
const exportDir = path.join(__dirname, '../data/atlas_export');

if (!fs.existsSync(exportDir)) {
  fs.mkdirSync(exportDir, { recursive: true });
}

const localData = JSON.parse(fs.readFileSync(localDbPath, 'utf8'));

const collections = [
  { key: 'users', file: 'users.json' },
  { key: 'profiles', file: 'studentprofiles.json' },
  { key: 'visits', file: 'medicalvisits.json' },
  { key: 'prescriptions', file: 'prescriptions.json' },
  { key: 'nutritionPlans', file: 'nutritionplans.json' },
  { key: 'monitoringPlans', file: 'dailymonitoringplans.json' },
  { key: 'monitoringResponses', file: 'dailymonitoringresponses.json' },
  { key: 'calendarEvents', file: 'healthcalendarevents.json' },
  { key: 'notifications', file: 'notifications.json' },
  { key: 'auditLogs', file: 'auditlogs.json' }
];

console.log('Exporting collections to:', exportDir);
for (const col of collections) {
  const items = localData[col.key] || [];
  const targetPath = path.join(exportDir, col.file);
  fs.writeFileSync(targetPath, JSON.stringify(items, null, 2), 'utf8');
  console.log(`Saved ${items.length} items to ${col.file}`);
}
console.log('Export complete.');

