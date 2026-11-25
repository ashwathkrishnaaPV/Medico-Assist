const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema(
  {
    id: { type: String, index: true },
    targetRole: { type: String, trim: true, index: true },
    recipientRole: { type: String, trim: true },
    targetStudentId: { type: String, uppercase: true, trim: true, index: true },
    studentId: { type: String, uppercase: true, trim: true },
    type: {
      type: String,
      enum: ['prescription', 'followup', 'monitoring', 'nutrition', 'system', 'emergency'],
      default: 'system'
    },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    read: { type: Boolean, default: false, index: true },
    createdByUserId: { type: String },
    timestamp: { type: String, default: () => new Date().toISOString() },
    createdAt: { type: String, default: () => new Date().toISOString() }
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

NotificationSchema.index({ targetRole: 1, targetStudentId: 1, read: 1 });

module.exports = mongoose.model('Notification', NotificationSchema);
