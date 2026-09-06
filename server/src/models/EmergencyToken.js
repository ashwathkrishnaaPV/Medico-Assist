const mongoose = require('mongoose');

const EmergencyTokenSchema = new mongoose.Schema({
  tokenHash: { type: String, required: true, unique: true, index: true },
  studentId: { type: String, required: true, index: true },
  studentName: { type: String, required: true },
  expiresAt: { type: Date, required: true, index: true },
  usedAt: { type: Date },
  revoked: { type: Boolean, default: false },
  accessCount: { type: Number, default: 0 },
  maxAccessCount: { type: Number, default: 1 },
  responderRole: { type: String },
  responderName: { type: String },
  createdIp: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('EmergencyToken', EmergencyTokenSchema);
