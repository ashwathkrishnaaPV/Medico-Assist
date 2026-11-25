const mongoose = require('mongoose');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/campushealth';
const PG_CONN = process.env.DATABASE_URL ||
  `postgresql://${process.env.PGUSER || 'postgres'}:${process.env.PGPASSWORD || ''}@${process.env.PGHOST || 'localhost'}:${process.env.PGPORT || 5432}/${process.env.PGDATABASE || 'campushealth'}`;

async function runMigration() {
  console.log('🔄 Starting PostgreSQL -> MongoDB migration...');
  console.log(`Target MongoDB: ${MONGO_URI}`);
  console.log(`Source PostgreSQL: ${PG_CONN}`);

  const pool = new Pool({ connectionString: PG_CONN, connectionTimeoutMillis: 5000 });
  await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 5000 });
  console.log('✅ Connected to MongoDB and PostgreSQL.');

  const User = require('../models/User');
  const StudentProfile = require('../models/StudentProfile');
  const MedicalVisit = require('../models/MedicalVisit');
  const Prescription = require('../models/Prescription');
  const NutritionPlan = require('../models/NutritionPlan');
  const MonitoringPlan = require('../models/MonitoringPlan');
  const MonitoringResponse = require('../models/MonitoringResponse');
  const CalendarEvent = require('../models/CalendarEvent');
  const Notification = require('../models/Notification');
  const AuditLog = require('../models/AuditLog');
  const MedicineInventory = require('../models/MedicineInventory');

  // 1. Users
  const pgUsers = await pool.query('SELECT * FROM users');
  console.log(`Fetched ${pgUsers.rows.length} users from PostgreSQL.`);
  for (const row of pgUsers.rows) {
    const d = row.data || {};
    const existing = await User.findOne({ email: row.email.toLowerCase() });
    const userDoc = {
      name: row.name || d.name || 'User',
      email: row.email.toLowerCase(),
      password: d.password, // Pre-hashed bcrypt preserved
      role: row.role || d.role || 'STUDENT',
      studentId: row.student_id || d.studentId,
      staffId: row.staff_id || d.staffId,
      registerNumber: row.register_number || d.registerNumber,
      department: row.department || d.department,
      title: d.title,
      phone: d.phone,
      avatarUrl: d.avatarUrl,
      tokenVersion: d.tokenVersion || 0,
      active: d.active !== false
    };

    if (existing) {
      await User.findByIdAndUpdate(existing._id, userDoc);
    } else {
      // Use raw collection insert or set password without re-hashing
      await User.collection.insertOne({
        ...userDoc,
        createdAt: row.created_at || new Date(),
        updatedAt: row.updated_at || new Date()
      });
    }
  }

  // Ensure RESEARCHER and EMERGENCY_RESPONDER personas exist with secure hashes
  const researcherEmail = 'researcher@sece.ac.in';
  if (!(await User.findOne({ email: researcherEmail }))) {
    const passHash = await bcrypt.hash('sece@5678', 10);
    await User.create({
      name: 'Dr. Emily Watson (Clinical Researcher)',
      email: researcherEmail,
      password: passHash,
      role: 'RESEARCHER',
      staffId: 'RES501',
      title: 'Senior Healthcare Analytics Fellow',
      department: 'Clinical Data Sciences',
      active: true
    });
    console.log(`+ Seeded default RESEARCHER account: ${researcherEmail}`);
  }

  const responderEmail = 'responder@sece.ac.in';
  if (!(await User.findOne({ email: responderEmail }))) {
    const passHash = await bcrypt.hash('sece@1234', 10);
    await User.create({
      name: 'Officer Rajesh Kumar (EMT Lead)',
      email: responderEmail,
      password: passHash,
      role: 'EMERGENCY_RESPONDER',
      staffId: 'EMT101',
      title: 'First Response Paramedic',
      department: 'Emergency & Ambulance Services',
      active: true
    });
    console.log(`+ Seeded default EMERGENCY_RESPONDER account: ${responderEmail}`);
  }

  // 2. Student Profiles
  const pgProfiles = await pool.query('SELECT * FROM student_profiles');
  console.log(`Fetched ${pgProfiles.rows.length} student profiles.`);
  for (const row of pgProfiles.rows) {
    const d = row.data || {};
    const studentId = (row.student_id || d.studentId || '').toUpperCase();
    if (!studentId) continue;

    await StudentProfile.findOneAndUpdate(
      { studentId },
      {
        studentId,
        name: row.name || d.name,
        email: (row.email || d.email || '').toLowerCase(),
        age: d.age || 18,
        dob: d.dob || '',
        gender: d.gender || 'Male',
        department: row.department || d.department || 'Computer Science & Engineering',
        year: d.year || '1st Year',
        ugOrPg: d.ugOrPg || '',
        accommodation: d.accommodation || '',
        hostelBlock: d.hostelBlock || '',
        hostelRoom: d.hostelRoom || '',
        phone: d.phone || '',
        bloodGroup: row.blood_group || d.bloodGroup || '',
        emergencyContact: d.emergencyContact || { name: '', relation: '', phone: '' },
        medicalCentreContact: d.medicalCentreContact || '+91-44-2257-0000',
        criticalAllergies: Array.isArray(d.criticalAllergies) ? d.criticalAllergies : [],
        criticalConditions: Array.isArray(d.criticalConditions) ? d.criticalConditions : [],
        criticalMedications: Array.isArray(d.criticalMedications) ? d.criticalMedications : [],
        heightCm: d.heightCm || 0,
        weightKg: d.weightKg || 0,
        bmi: d.bmi || 0,
        lastUpdated: d.lastUpdated || new Date().toISOString().split('T')[0],
        profileComplete: Boolean(d.profileComplete)
      },
      { upsert: true, new: true }
    );
  }

  // 3. Medical Visits
  const pgVisits = await pool.query('SELECT * FROM medical_visits');
  console.log(`Fetched ${pgVisits.rows.length} visits.`);
  for (const row of pgVisits.rows) {
    const d = row.data || {};
    await MedicalVisit.findOneAndUpdate(
      { id: row.id },
      {
        id: row.id,
        studentId: (row.student_id || d.studentId).toUpperCase(),
        studentName: d.studentName,
        visitType: d.visitType || 'Consultation',
        visitDate: row.visit_date || d.visitDate || new Date().toISOString().split('T')[0],
        time: d.time || '10:00 AM',
        doctorName: d.doctorName || 'Dr. Nivetha M.B.B.S',
        chiefComplaint: d.chiefComplaint || 'Consultation',
        diagnosis: d.diagnosis || 'Clinical Consultation',
        clinicalNotes: d.clinicalNotes || '',
        vitals: d.vitals || {},
        prescriptionId: d.prescriptionId,
        nutritionPlanId: d.nutritionPlanId,
        monitoringPlanActive: Boolean(d.monitoringPlanActive),
        status: row.status || d.status || 'Completed'
      },
      { upsert: true, new: true }
    );
  }

  // 4. Prescriptions
  const pgRx = await pool.query('SELECT * FROM prescriptions');
  console.log(`Fetched ${pgRx.rows.length} prescriptions.`);
  for (const row of pgRx.rows) {
    const d = row.data || {};
    await Prescription.findOneAndUpdate(
      { id: row.id },
      {
        id: row.id,
        studentId: (row.student_id || d.studentId).toUpperCase(),
        doctorName: d.doctorName || 'Dr. Nivetha M.B.B.S',
        diagnosis: d.diagnosis || '',
        createdAt: d.createdAt || new Date().toISOString().split('T')[0],
        status: row.status || d.status || 'ACTIVE',
        followUpDate: d.followUpDate || '',
        currentVersion: d.currentVersion || {
          version: 1,
          prescriptionId: row.id,
          createdAt: new Date().toISOString(),
          createdByDoctor: d.doctorName || 'Dr. Nivetha M.B.B.S',
          status: 'ACTIVE',
          items: []
        },
        history: Array.isArray(d.history) ? d.history : []
      },
      { upsert: true, new: true }
    );
  }

  // 5. Nutrition Plans
  const pgNutrition = await pool.query('SELECT * FROM nutrition_plans');
  console.log(`Fetched ${pgNutrition.rows.length} nutrition plans.`);
  for (const row of pgNutrition.rows) {
    const d = row.data || {};
    await NutritionPlan.findOneAndUpdate(
      { studentId: row.student_id.toUpperCase() },
      {
        id: row.id,
        studentId: row.student_id.toUpperCase(),
        studentName: d.studentName,
        doctorName: d.doctorName,
        goal: d.goal || 'General Health Nutrition',
        aiSuggested: Boolean(d.aiSuggested),
        doctorApproved: Boolean(d.doctorApproved),
        targetCalories: d.targetCalories || 2000,
        proteinG: d.proteinG || 75,
        carbsG: d.carbsG || 250,
        fatG: d.fatG || 65,
        meals: d.meals || {},
        foodsToLimit: d.foodsToLimit || [],
        notes: d.notes || '',
        active: d.active !== false
      },
      { upsert: true, new: true }
    );
  }

  // 6. Monitoring Plans
  const pgMonPlans = await pool.query('SELECT * FROM monitoring_plans');
  console.log(`Fetched ${pgMonPlans.rows.length} monitoring plans.`);
  for (const row of pgMonPlans.rows) {
    const d = row.data || {};
    await MonitoringPlan.findOneAndUpdate(
      { studentId: row.student_id.toUpperCase() },
      {
        studentId: row.student_id.toUpperCase(),
        conditionName: d.conditionName || 'Post-Consultation Care',
        durationDays: d.durationDays || 3,
        currentDay: row.current_day || d.currentDay || 1,
        startDate: d.startDate || new Date().toISOString().split('T')[0],
        active: row.active !== false,
        createdBy: d.createdBy || 'Dr. Nivetha M.B.B.S'
      },
      { upsert: true, new: true }
    );
  }

  // 7. Monitoring Responses
  const pgMonResp = await pool.query('SELECT * FROM monitoring_responses');
  console.log(`Fetched ${pgMonResp.rows.length} monitoring responses.`);
  for (const row of pgMonResp.rows) {
    const d = row.data || {};
    await MonitoringResponse.findOneAndUpdate(
      { id: row.id },
      {
        studentId: (row.student_id || d.studentId).toUpperCase(),
        planId: d.planId,
        date: row.date || d.date,
        feeling: d.feeling || 'Better',
        symptomsImproving: d.symptomsImproving !== false,
        newSymptoms: Boolean(d.newSymptoms),
        studentFeedback: d.studentFeedback || ''
      },
      { upsert: true, new: true }
    );
  }

  // 8. Calendar Events
  const pgCal = await pool.query('SELECT * FROM calendar_events');
  console.log(`Fetched ${pgCal.rows.length} calendar events.`);
  for (const row of pgCal.rows) {
    const d = row.data || {};
    await CalendarEvent.findOneAndUpdate(
      { id: row.id },
      {
        id: row.id,
        studentId: (row.student_id || d.studentId).toUpperCase(),
        title: d.title || 'Checkup',
        date: row.date || d.date,
        time: d.time || '10:00 AM',
        eventType: d.eventType || 'Follow-up',
        status: row.status || d.status || 'Upcoming',
        notes: d.notes || ''
      },
      { upsert: true, new: true }
    );
  }

  // 9. Notifications
  const pgNotifs = await pool.query('SELECT * FROM notifications');
  console.log(`Fetched ${pgNotifs.rows.length} notifications.`);
  for (const row of pgNotifs.rows) {
    const d = row.data || {};
    await Notification.findOneAndUpdate(
      { id: row.id },
      {
        id: row.id,
        targetRole: row.target_role || d.targetRole || d.recipientRole,
        recipientRole: row.target_role || d.targetRole || d.recipientRole,
        targetStudentId: row.target_student_id || d.targetStudentId || d.studentId,
        studentId: row.target_student_id || d.targetStudentId || d.studentId,
        type: d.type || 'system',
        title: d.title || 'Notification',
        message: d.message || '',
        read: Boolean(row.read !== undefined ? row.read : d.read),
        createdAt: d.createdAt || new Date().toISOString()
      },
      { upsert: true, new: true }
    );
  }

  // 10. Audit Logs
  const pgAudit = await pool.query('SELECT * FROM audit_logs');
  console.log(`Fetched ${pgAudit.rows.length} audit logs.`);
  for (const row of pgAudit.rows) {
    const d = row.data || {};
    await AuditLog.create({
      userId: row.user_id || d.userId,
      userName: d.userName,
      userRole: d.userRole,
      action: row.action || d.action || 'ACTION',
      resource: row.resource || d.resource,
      resourceType: d.resourceType || 'RECORD',
      details: d.details || '',
      ipAddress: d.ipAddress || '127.0.0.1',
      sensitivity: row.sensitivity || d.sensitivity || 'LOW',
      timestamp: d.timestamp || (row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString())
    });
  }

  // 11. Medicine Inventory
  const pgInventory = await pool.query('SELECT * FROM medicine_inventory');
  console.log(`Fetched ${pgInventory.rows.length} medicine inventory rows.`);
  for (const row of pgInventory.rows) {
    const d = row.data || {};
    await MedicineInventory.findOneAndUpdate(
      { id: row.id },
      {
        id: row.id,
        catalogId: d.catalogId || parseInt(row.id.replace(/\D/g, ''), 10) || 1,
        name: row.name,
        generic: d.generic || '',
        category: row.category || d.category || 'Tablet',
        isTablet: d.isTablet !== false,
        defaultDosage: d.defaultDosage || '1 tablet',
        symptoms: d.symptoms || '',
        quantity: row.quantity !== undefined ? row.quantity : d.quantity || 100,
        minThreshold: row.min_threshold !== undefined ? row.min_threshold : d.minThreshold || 20,
        status: row.status || d.status || 'Full Stock',
        lastRestocked: d.lastRestocked || new Date().toISOString(),
        updatedAt: d.updatedAt || new Date().toISOString()
      },
      { upsert: true, new: true }
    );
  }

  // Report final counts in MongoDB
  const [
    mUsers,
    mProfiles,
    mVisits,
    mRx,
    mNutrition,
    mMonPlans,
    mMonResp,
    mCal,
    mNotifs,
    mAudit,
    mInventory
  ] = await Promise.all([
    User.countDocuments(),
    StudentProfile.countDocuments(),
    MedicalVisit.countDocuments(),
    Prescription.countDocuments(),
    NutritionPlan.countDocuments(),
    MonitoringPlan.countDocuments(),
    MonitoringResponse.countDocuments(),
    CalendarEvent.countDocuments(),
    Notification.countDocuments(),
    AuditLog.countDocuments(),
    MedicineInventory.countDocuments()
  ]);

  console.log('\n📊 MIGRATION SUMMARY (MongoDB `campushealth`):');
  console.log(`  Users:               ${mUsers}`);
  console.log(`  Student Profiles:    ${mProfiles}`);
  console.log(`  Medical Visits:      ${mVisits}`);
  console.log(`  Prescriptions:       ${mRx}`);
  console.log(`  Nutrition Plans:     ${mNutrition}`);
  console.log(`  Monitoring Plans:    ${mMonPlans}`);
  console.log(`  Monitoring Resp:     ${mMonResp}`);
  console.log(`  Calendar Events:     ${mCal}`);
  console.log(`  Notifications:       ${mNotifs}`);
  console.log(`  Audit Logs:          ${mAudit}`);
  console.log(`  Medicine Inventory:  ${mInventory}`);

  await pool.end();
  await mongoose.disconnect();
  console.log('🎉 Migration completed successfully!');
}

if (require.main === module) {
  runMigration().catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
  });
}

module.exports = { runMigration };
