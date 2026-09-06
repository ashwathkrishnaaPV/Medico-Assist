const mongoose = require('mongoose');

const LabReportSchema = new mongoose.Schema({
  studentId: { type: String, required: true, index: true },
  testName: String, date: String, orderedBy: String,
  summary: String, fileUrl: String,
  status: { type: String, enum: ['Completed','Pending'], default: 'Pending' }
}, { timestamps: true });

module.exports = mongoose.model('LabReport', LabReportSchema);
