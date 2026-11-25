const mongoose = require('mongoose');

const MonitoringResponseSchema = new mongoose.Schema(
  {
    id: { type: String, index: true },
    studentId: { type: String, required: true, uppercase: true, trim: true, index: true },
    planId: { type: String, trim: true },
    date: { type: String, required: true, trim: true, index: true },
    feeling: { type: String, enum: ['Better', 'Same', 'Worse'], required: true },
    symptomsImproving: { type: Boolean, required: true },
    newSymptoms: { type: Boolean, required: true },
    studentFeedback: { type: String, default: '' },
    answers: { type: mongoose.Schema.Types.Mixed },
    symptomNote: { type: String, default: '' },
    overallStatus: { type: String, default: '' }
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

MonitoringResponseSchema.index({ studentId: 1, date: -1 });

module.exports = mongoose.model('MonitoringResponse', MonitoringResponseSchema);
