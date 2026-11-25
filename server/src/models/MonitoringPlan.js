const mongoose = require('mongoose');

const MonitoringPlanSchema = new mongoose.Schema(
  {
    id: { type: String, index: true },
    studentId: { type: String, required: true, uppercase: true, trim: true, index: true },
    conditionName: { type: String, required: true, trim: true },
    durationDays: { type: Number, default: 3, min: 1, max: 30 },
    currentDay: { type: Number, default: 1, min: 1, max: 30 },
    startDate: { type: String, default: () => new Date().toISOString().split('T')[0] },
    active: { type: Boolean, default: true, index: true },
    createdBy: { type: String, default: 'Medical Staff' },
    questions: [
      {
        id: String,
        question: String,
        type: { type: String, default: 'boolean' },
        options: [String]
      }
    ],
    updatedAt: { type: String, default: () => new Date().toISOString() }
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

MonitoringPlanSchema.index({ studentId: 1, active: 1 });

module.exports = mongoose.model('MonitoringPlan', MonitoringPlanSchema);
