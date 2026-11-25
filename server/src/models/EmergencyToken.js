const mongoose = require('mongoose');

const EmergencyTokenSchema = new mongoose.Schema(
  {
    tokenHash: { type: String, required: true, unique: true, index: true },
    studentId: { type: String, required: true, uppercase: true, trim: true, index: true },
    studentName: { type: String, required: true, trim: true },
    expiresAt: { type: Date, required: true, index: true },
    usedAt: { type: Date },
    revoked: { type: Boolean, default: false, index: true },
    accessCount: { type: Number, default: 0 },
    maxAccessCount: { type: Number, default: 1 },
    responderRole: { type: String },
    responderName: { type: String },
    createdIp: { type: String }
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

module.exports = mongoose.model('EmergencyToken', EmergencyTokenSchema);
