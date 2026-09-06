const mongoose = require('mongoose');

const VitalsSchema = new mongoose.Schema({
  temperatureF: Number, bloodPressureSys: Number, bloodPressureDia: Number,
  heartRateBpm: Number, spo2Percent: Number, heightCm: Number,
  weightKg: Number, bmi: Number, recordedAt: String, recordedBy: String
}, { _id: false });

const MedicalVisitSchema = new mongoose.Schema({
  studentId: { type: String, required: true, index: true },
  studentName: String,
  visitType: { type: String, enum: ['Consultation','Follow-up','Reconsultation','Lab Check'] },
  visitDate: String,
  time: String,
  doctorName: String,
  chiefComplaint: String,
  vitals: VitalsSchema,
  clinicalNotes: String,
  diagnosis: String,
  prescriptionId: String,
  nutritionPlanId: String,
  monitoringPlanActive: { type: Boolean, default: false },
  status: { type: String, enum: ['Scheduled','Checked In','Waiting','In Consultation','Completed','Cancelled'], default: 'Completed' }
}, { timestamps: true });

module.exports = mongoose.model('MedicalVisit', MedicalVisitSchema);
