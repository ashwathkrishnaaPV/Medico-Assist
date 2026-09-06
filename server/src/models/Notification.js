const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  targetRole: String,
  targetStudentId: String,
  type: String, title: String, message: String,
  read: { type: Boolean, default: false },
  createdAt: String
}, { timestamps: true });

module.exports = mongoose.model('Notification', NotificationSchema);
