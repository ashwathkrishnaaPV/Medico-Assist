const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String },
  role: { type: String, enum: ['STUDENT', 'MEDICAL_STAFF', 'ADMIN', 'RESEARCHER', 'EMERGENCY_RESPONDER'], default: 'STUDENT' },
  studentId: String,
  staffId: String,
  department: String,
  title: String,
  avatarUrl: String,
}, { timestamps: true });

UserSchema.pre('save', async function(next) {
  if (this.isModified('password') && this.password) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

UserSchema.methods.comparePassword = function(plain) {
  if (!this.password || !plain) return false;
  return bcrypt.compare(plain, this.password);
};

module.exports = mongoose.model('User', UserSchema);
