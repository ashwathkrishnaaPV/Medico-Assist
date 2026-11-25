const mongoose = require('mongoose');

const StudentProfileSchema = new mongoose.Schema(
  {
    studentId: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true
    },
    name: { type: String, required: true, trim: true },
    email: { type: String, lowercase: true, trim: true, index: true },
    age: { type: Number, min: 10, max: 100, default: 18 },
    dob: { type: String, trim: true, default: '' },
    gender: { type: String, enum: ['Male', 'Female', 'Other'], default: 'Male' },
    department: { type: String, trim: true, index: true, default: 'Computer Science & Engineering' },
    year: { type: String, trim: true, default: '1st Year' },
    ugOrPg: { type: String, enum: ['UG', 'PG', ''], default: '' },
    accommodation: { type: String, enum: ['Hosteller', 'Day Scholar', ''], default: '' },
    hostelBlock: { type: String, trim: true, default: '' },
    hostelRoom: { type: String, trim: true, default: '' },
    phone: { type: String, trim: true, default: '' },
    bloodGroup: { type: String, trim: true, default: '' },
    emergencyContact: {
      name: { type: String, trim: true, default: '' },
      relation: { type: String, trim: true, default: '' },
      phone: { type: String, trim: true, default: '' }
    },
    medicalCentreContact: { type: String, default: '+91-44-2257-0000' },
    criticalAllergies: { type: [String], default: [] },
    criticalConditions: { type: [String], default: [] },
    criticalMedications: { type: [String], default: [] },
    heightCm: { type: Number, default: 0, min: 0, max: 300 },
    weightKg: { type: Number, default: 0, min: 0, max: 500 },
    bmi: { type: Number, default: 0, min: 0, max: 100 },
    lastUpdated: { type: String, default: () => new Date().toISOString().split('T')[0] },
    profileComplete: { type: Boolean, default: false, index: true }
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        ret.id = String(ret._id);
        delete ret.__v;
        return ret;
      }
    }
  }
);

StudentProfileSchema.index({ name: 'text', department: 'text', studentId: 'text' });

module.exports = mongoose.model('StudentProfile', StudentProfileSchema);
