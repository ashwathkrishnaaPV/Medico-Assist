const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
require('dotenv').config();
const { connectDB } = require('./db');
const pgDb = require('./pgDb');

const DATA_FILE = path.join(__dirname, '../data/campushealth_db.json');

async function seedDatabase() {
  console.log('🔄 Beginning PostgreSQL data feeding process...');

  if (!fs.existsSync(DATA_FILE)) {
    console.error(`❌ Data file not found at ${DATA_FILE}`);
    return false;
  }

  const raw = fs.readFileSync(DATA_FILE, 'utf8');
  const dbData = JSON.parse(raw);

  const stats = {
    users: 0,
    profiles: 0,
    visits: 0,
    prescriptions: 0,
    nutritionPlans: 0,
    monitoringPlans: 0,
    monitoringResponses: 0,
    calendarEvents: 0,
    notifications: 0,
    auditLogs: 0,
    emergencyTokens: 0
  };

  // 1. Seed Users
  if (Array.isArray(dbData.users) && dbData.users.length > 0) {
    console.log(`👤 Feeding ${dbData.users.length} users into PostgreSQL...`);
    for (const u of dbData.users) {
      await pgDb.User.create(u);
      stats.users++;
    }
  }

  // 2. Seed Student Profiles
  if (Array.isArray(dbData.profiles) && dbData.profiles.length > 0) {
    console.log(`📋 Feeding ${dbData.profiles.length} student profiles into PostgreSQL...`);
    for (const p of dbData.profiles) {
      await pgDb.StudentProfile.create(p);
      stats.profiles++;
    }
  }

  // 3. Seed Medical Visits
  if (Array.isArray(dbData.visits) && dbData.visits.length > 0) {
    console.log(`🩺 Feeding ${dbData.visits.length} medical visits into PostgreSQL...`);
    for (const v of dbData.visits) {
      await pgDb.MedicalVisit.create(v);
      stats.visits++;
    }
  }

  // 4. Seed Prescriptions
  if (Array.isArray(dbData.prescriptions) && dbData.prescriptions.length > 0) {
    console.log(`💊 Feeding ${dbData.prescriptions.length} prescriptions into PostgreSQL...`);
    for (const rx of dbData.prescriptions) {
      await pgDb.Prescription.create(rx);
      stats.prescriptions++;
    }
  }

  // 5. Seed Nutrition Plans
  if (Array.isArray(dbData.nutritionPlans) && dbData.nutritionPlans.length > 0) {
    console.log(`🥗 Feeding ${dbData.nutritionPlans.length} nutrition plans into PostgreSQL...`);
    for (const n of dbData.nutritionPlans) {
      await pgDb.NutritionPlan.create(n);
      stats.nutritionPlans++;
    }
  }

  // 6. Seed Monitoring Plans
  if (Array.isArray(dbData.monitoringPlans) && dbData.monitoringPlans.length > 0) {
    console.log(`📊 Feeding ${dbData.monitoringPlans.length} monitoring plans into PostgreSQL...`);
    for (const m of dbData.monitoringPlans) {
      await pgDb.MonitoringPlan.create(m);
      stats.monitoringPlans++;
    }
  }

  // 7. Seed Monitoring Responses
  if (Array.isArray(dbData.monitoringResponses) && dbData.monitoringResponses.length > 0) {
    console.log(`📝 Feeding ${dbData.monitoringResponses.length} monitoring responses into PostgreSQL...`);
    for (const r of dbData.monitoringResponses) {
      await pgDb.MonitoringResponse.create(r);
      stats.monitoringResponses++;
    }
  }

  // 8. Seed Calendar Events
  if (Array.isArray(dbData.calendarEvents) && dbData.calendarEvents.length > 0) {
    console.log(`📅 Feeding ${dbData.calendarEvents.length} calendar events into PostgreSQL...`);
    for (const c of dbData.calendarEvents) {
      await pgDb.CalendarEvent.create(c);
      stats.calendarEvents++;
    }
  }

  // 9. Seed Notifications
  if (Array.isArray(dbData.notifications) && dbData.notifications.length > 0) {
    console.log(`🔔 Feeding ${dbData.notifications.length} notifications into PostgreSQL...`);
    for (const notif of dbData.notifications) {
      await pgDb.Notification.create(notif);
      stats.notifications++;
    }
  }

  // 10. Seed Audit Logs
  if (Array.isArray(dbData.auditLogs) && dbData.auditLogs.length > 0) {
    console.log(`🛡️ Feeding ${dbData.auditLogs.length} audit logs into PostgreSQL...`);
    for (const a of dbData.auditLogs) {
      await pgDb.AuditLog.create(a);
      stats.auditLogs++;
    }
  }

  // 11. Seed Emergency Tokens
  if (Array.isArray(dbData.emergencyTokens) && dbData.emergencyTokens.length > 0) {
    console.log(`🚨 Feeding ${dbData.emergencyTokens.length} emergency tokens into PostgreSQL...`);
    for (const e of dbData.emergencyTokens) {
      await pgDb.EmergencyToken.create(e);
      stats.emergencyTokens++;
    }
  }

  console.log('\n========================================================');
  console.log('🎉 POSTGRESQL DATA FEED COMPLETE');
  console.log('========================================================');
  console.log(`  Users Seeded:             ${stats.users}`);
  console.log(`  Profiles Seeded:          ${stats.profiles}`);
  console.log(`  Medical Visits:           ${stats.visits}`);
  console.log(`  Prescriptions:            ${stats.prescriptions}`);
  console.log(`  Nutrition Plans:          ${stats.nutritionPlans}`);
  console.log(`  Monitoring Plans:         ${stats.monitoringPlans}`);
  console.log(`  Monitoring Responses:     ${stats.monitoringResponses}`);
  console.log(`  Calendar Events:          ${stats.calendarEvents}`);
  console.log(`  Notifications:            ${stats.notifications}`);
  console.log(`  Audit Logs:               ${stats.auditLogs}`);
  console.log(`  Emergency Tokens:         ${stats.emergencyTokens}`);
  console.log('========================================================\n');
  return true;
}

// Allow direct execution from terminal
if (require.main === module) {
  (async () => {
    try {
      await connectDB();
      await seedDatabase();
      console.log('✅ PostgreSQL is fully seeded and ready for production.');
      process.exit(0);
    } catch (err) {
      console.error('❌ Seeding failed:', err);
      process.exit(1);
    }
  })();
}

module.exports = { seedDatabase };

