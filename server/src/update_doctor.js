const { getModel } = require('./models/provider');

async function updateDoctorName() {
  console.log('🔄 Updating doctor name to Dr. Nivetha M.B.B.S across PostgreSQL...');

  const User = getModel('User');
  const Prescription = getModel('Prescription');
  const MedicalVisit = getModel('MedicalVisit');
  const CalendarEvent = getModel('CalendarEvent');

  // 1. Update User account
  const doctorUsers = await User.find({ role: 'MEDICAL_STAFF' });
  console.log(`Found ${doctorUsers.length} doctor account(s).`);
  for (const doc of doctorUsers) {
    doc.name = 'Dr. Nivetha M.B.B.S';
    doc.title = 'Campus Physician (M.B.B.S)';
    await User.findByIdAndUpdate(doc.id || doc._id, doc);
    console.log(`✅ Updated User ${doc.id} name to: ${doc.name}`);
  }

  // 2. Update all prescriptions
  const allRx = await Prescription.find({});
  console.log(`Found ${allRx.length} prescription(s).`);
  for (const rx of allRx) {
    rx.doctorName = 'Dr. Nivetha M.B.B.S';
    if (rx.currentVersion) {
      rx.currentVersion.createdByDoctor = 'Dr. Nivetha M.B.B.S';
    }
    if (Array.isArray(rx.history)) {
      rx.history.forEach(h => {
        h.createdByDoctor = 'Dr. Nivetha M.B.B.S';
      });
    }
    await Prescription.findByIdAndUpdate(rx.id || rx._id, rx);
    console.log(`✅ Updated Prescription ${rx.id} doctor to Dr. Nivetha M.B.B.S`);
  }

  // 3. Update all medical visits
  const allVisits = await MedicalVisit.find({});
  console.log(`Found ${allVisits.length} visit(s).`);
  for (const v of allVisits) {
    v.doctorName = 'Dr. Nivetha M.B.B.S';
    if (v.vitals) {
      v.vitals.recordedBy = 'Dr. Nivetha M.B.B.S';
    }
    await MedicalVisit.findByIdAndUpdate(v.id || v._id, v);
    console.log(`✅ Updated Medical Visit ${v.id} doctor to Dr. Nivetha M.B.B.S`);
  }

  // 4. Update calendar events mentioning physician
  const allEvents = await CalendarEvent.find({});
  for (const ev of allEvents) {
    let modified = false;
    if (ev.notes && (ev.notes.includes('Jenkins') || ev.notes.includes('Physician') || ev.notes.includes('Doctor'))) {
      ev.notes = ev.notes.replace(/Dr\.\s*Sarah\s*Jenkins/gi, 'Dr. Nivetha M.B.B.S');
      modified = true;
    }
    if (ev.title && ev.title.includes('Jenkins')) {
      ev.title = ev.title.replace(/Dr\.\s*Sarah\s*Jenkins/gi, 'Dr. Nivetha M.B.B.S');
      modified = true;
    }
    if (modified) {
      await CalendarEvent.findByIdAndUpdate(ev.id || ev._id, ev);
      console.log(`✅ Updated Calendar Event ${ev.id}`);
    }
  }

  console.log('🎉 Successfully updated all doctor references to Dr. Nivetha M.B.B.S!');
  process.exit(0);
}

updateDoctorName().catch(err => {
  console.error('Error updating doctor:', err);
  process.exit(1);
});

