const mongoose = require('mongoose');

const PrescriptionItemSchema = new mongoose.Schema({
  id: String, medicineName: String, dosage: String, frequency: String,
  durationDays: Number, instructions: String
}, { _id: false });

const PrescriptionVersionSchema = new mongoose.Schema({
  version: Number, prescriptionId: String, createdAt: String,
  createdByDoctor: String, status: { type: String, enum: ['ACTIVE','MODIFIED','DISCONTINUED'] },
  items: [PrescriptionItemSchema], followUpDate: String, notes: String, changeReason: String
}, { _id: false });

const PrescriptionSchema = new mongoose.Schema({
  studentId: { type: String, required: true, index: true },
  doctorName: String, createdAt: String,
  status: { type: String, enum: ['ACTIVE','MODIFIED','DISCONTINUED'], default: 'ACTIVE' },
  currentVersion: PrescriptionVersionSchema,
  history: [PrescriptionVersionSchema],
  followUpDate: String
}, { timestamps: true });

module.exports = mongoose.model('Prescription', PrescriptionSchema);
