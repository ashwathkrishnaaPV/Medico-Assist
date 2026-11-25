const mongoose = require('mongoose');

const LabReportSchema = new mongoose.Schema(
  {
    studentId: { type: String, required: true, uppercase: true, trim: true, index: true },
    testName: { type: String, required: true, trim: true },
    date: { type: String, default: () => new Date().toISOString().split('T')[0] },
    orderedBy: { type: String, default: 'Campus Physician' },
    summary: { type: String, default: '' },
    fileUrl: { type: String, default: '' },
    status: { type: String, enum: ['Completed', 'Pending'], default: 'Pending', index: true }
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

module.exports = mongoose.model('LabReport', LabReportSchema);
