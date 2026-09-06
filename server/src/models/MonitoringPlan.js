const mongoose = require('mongoose');

const MonitoringPlanSchema = new mongoose.Schema({
  studentId: { type: String, required: true, index: true },
  diagnosis: String, doctorName: String, startDate: String,
  durationDays: { type: Number, default: 7 },
  active: { type: Boolean, default: true },
  questions: [{ id: String, question: String, type: String, options: [String] }]
}, { timestamps: true });

module.exports = mongoose.model('MonitoringPlan', MonitoringPlanSchema);
