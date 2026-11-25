const mongoose = require('mongoose');

const AuditLogSchema = new mongoose.Schema(
  {
    id: { type: String, index: true },
    userId: { type: String, index: true },
    userName: { type: String },
    userRole: { type: String, index: true },
    actorId: { type: String, index: true },
    actorName: { type: String },
    actorRole: { type: String, index: true },
    action: { type: String, required: true, uppercase: true, index: true },
    resourceType: { type: String, uppercase: true, index: true },
    resource: { type: String, index: true },
    details: { type: String, default: '' },
    ipAddress: { type: String, default: '127.0.0.1' },
    correlationId: { type: String, index: true },
    outcome: { type: String, enum: ['SUCCESS', 'FAILURE', 'DENIED'], default: 'SUCCESS', index: true },
    sensitivity: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], default: 'LOW', index: true },
    timestamp: { type: String, default: () => new Date().toISOString(), index: true }
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

AuditLogSchema.index({ timestamp: -1 });
AuditLogSchema.index({ resource: 1, timestamp: -1 });
AuditLogSchema.index({ actorId: 1, timestamp: -1 });

// Enforce append-only immutability at database model layer
function blockAuditMutation(next) {
  next(new Error('AuditLog records are immutable and cannot be modified or deleted.'));
}
AuditLogSchema.pre('updateOne', blockAuditMutation);
AuditLogSchema.pre('updateMany', blockAuditMutation);
AuditLogSchema.pre('findOneAndUpdate', blockAuditMutation);
AuditLogSchema.pre('deleteOne', blockAuditMutation);
AuditLogSchema.pre('deleteMany', blockAuditMutation);
AuditLogSchema.pre('findOneAndDelete', blockAuditMutation);

module.exports = mongoose.model('AuditLog', AuditLogSchema);
