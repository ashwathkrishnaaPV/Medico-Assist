const mongoose = require('mongoose');

const StudentProfileSchema = new mongoose.Schema({
  studentId: { type: String, required: true, unique: true },
  name: String,
  email: String,
  age: Number,
  dob: String,
  gender: String,
  department: String,
  year: String,
  ugOrPg: { type: String, enum: ['UG','PG',''], default: '' },
  accommodation: { type: String, enum: ['Hosteller','Day Scholar',''], default: '' },
  hostelBlock: String,
  hostelRoom: String,
  phone: String,
  bloodGroup: String,
  emergencyContact: {
    name: { type: String, default: '' },
    relation: { type: String, default: '' },
    phone: { type: String, default: '' }
  },
  medicalCentreContact: { type: String, default: '+91-44-2257-0000' },
  criticalAllergies: [String],
  criticalConditions: [String],
  criticalMedications: [String],
  heightCm: { type: Number, default: 0 },
  weightKg: { type: Number, default: 0 },
  bmi: { type: Number, default: 0 },
  lastUpdated: String,
  profileComplete: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('StudentProfile', StudentProfileSchema);
