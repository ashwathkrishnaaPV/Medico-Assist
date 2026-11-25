const mongoose = require('mongoose');

const PrescriptionItemSchema = new mongoose.Schema(
  {
    id: { type: String, default: () => `item_${Date.now()}_${Math.random().toString(36).slice(2, 6)}` },
    medicineName: { type: String, required: true, trim: true },
    dosage: { type: String, required: true, trim: true },
    frequency: { type: String, required: true, trim: true },
    durationDays: { type: Number, required: true, min: 1, max: 180 },
    quantity: { type: Number, required: true, min: 1, max: 1000 },
    instructions: { type: String, default: '' }
  },
  { _id: false }
);

const PrescriptionVersionSchema = new mongoose.Schema(
  {
    version: { type: Number, required: true, min: 1 },
    prescriptionId: { type: String, required: true },
    createdAt: { type: String, default: () => new Date().toISOString() },
    createdByDoctor: { type: String, required: true },
    status: { type: String, enum: ['ACTIVE', 'MODIFIED', 'DISCONTINUED'], default: 'ACTIVE' },
    diagnosis: { type: String, default: '' },
    followUpDate: { type: String, default: '' },
    notes: { type: String, default: '' },
    changeReason: { type: String, default: '' },
    items: { type: [PrescriptionItemSchema], required: true }
  },
  { _id: false }
);

const PrescriptionSchema = new mongoose.Schema(
  {
    id: { type: String, index: true },
    studentId: { type: String, required: true, uppercase: true, trim: true, index: true },
    doctorName: { type: String, required: true, trim: true },
    diagnosis: { type: String, default: '' },
    createdAt: { type: String, default: () => new Date().toISOString().split('T')[0] },
    status: {
      type: String,
      enum: ['ACTIVE', 'MODIFIED', 'DISCONTINUED'],
      default: 'ACTIVE',
      index: true
    },
    followUpDate: { type: String, default: '' },
    currentVersion: { type: PrescriptionVersionSchema, required: true },
    history: { type: [PrescriptionVersionSchema], default: [] },
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

PrescriptionSchema.index({ studentId: 1, createdAt: -1 });

module.exports = mongoose.model('Prescription', PrescriptionSchema);
