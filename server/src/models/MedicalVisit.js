const mongoose = require('mongoose');

const VitalsSchema = new mongoose.Schema(
  {
    temperatureF: { type: Number, min: 90, max: 110 },
    bloodPressureSys: { type: Number, min: 50, max: 260 },
    bloodPressureDia: { type: Number, min: 30, max: 160 },
    heartRateBpm: { type: Number, min: 30, max: 250 },
    spo2Percent: { type: Number, min: 50, max: 100 },
    heightCm: { type: Number, min: 0, max: 300 },
    weightKg: { type: Number, min: 0, max: 500 },
    bmi: { type: Number, min: 0, max: 100 },
    recordedAt: { type: String, default: () => new Date().toISOString() },
    recordedBy: { type: String, default: 'Campus Physician' }
  },
  { _id: false }
);

const MedicalVisitSchema = new mongoose.Schema(
  {
    id: { type: String, index: true },
    studentId: { type: String, required: true, uppercase: true, trim: true, index: true },
    studentName: { type: String, trim: true },
    visitType: {
      type: String,
      enum: ['Consultation', 'Follow-up', 'Reconsultation', 'Lab Check', 'Emergency'],
      default: 'Consultation',
      index: true
    },
    visitDate: { type: String, required: true, index: true },
    time: { type: String, default: '10:00 AM' },
    doctorName: { type: String, required: true, trim: true },
    chiefComplaint: { type: String, required: true, trim: true },
    diagnosis: { type: String, required: true, trim: true },
    clinicalNotes: { type: String, default: '' },
    vitals: VitalsSchema,
    prescriptionId: { type: String },
    nutritionPlanId: { type: String },
    monitoringPlanActive: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ['Scheduled', 'Checked In', 'Waiting', 'In Consultation', 'Completed', 'Cancelled'],
      default: 'Completed',
      index: true
    },
    createdByUserId: { type: String }
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        ret.id = ret.id || String(ret._id);
        delete ret.__v;
        return ret;
      }
    }
  }
);

MedicalVisitSchema.index({ studentId: 1, visitDate: -1 });

module.exports = mongoose.model('MedicalVisit', MedicalVisitSchema);
