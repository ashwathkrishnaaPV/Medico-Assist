const mongoose = require('mongoose');

const AuditLogSchema = new mongoose.Schema({
  userId: String, userName: String, userRole: String,
  action: String, resource: String, details: String,
  ipAddress: { type: String, default: '127.0.0.1' },
  sensitivity: { type: String, enum: ['LOW','MEDIUM','HIGH','CRITICAL'], default: 'LOW' },
  timestamp: String
}, { timestamps: true });

module.exports = mongoose.model('AuditLog', AuditLogSchema);
