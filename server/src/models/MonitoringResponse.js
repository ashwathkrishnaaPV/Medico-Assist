const mongoose = require('mongoose');

const MonitoringResponseSchema = new mongoose.Schema({
  studentId: { type: String, required: true, index: true },
  planId: String, date: String,
  answers: mongoose.Schema.Types.Mixed,
  symptomNote: String, overallStatus: String
}, { timestamps: true });

module.exports = mongoose.model('MonitoringResponse', MonitoringResponseSchema);
