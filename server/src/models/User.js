const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
      maxlength: 160
    },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ['STUDENT', 'MEDICAL_STAFF', 'ADMIN', 'RESEARCHER', 'EMERGENCY_RESPONDER'],
      default: 'STUDENT',
      index: true
    },
    studentId: { type: String, trim: true, index: true, sparse: true },
    staffId: { type: String, trim: true, index: true, sparse: true },
    registerNumber: { type: String, trim: true, index: true, sparse: true },
    department: { type: String, trim: true },
    title: { type: String, trim: true },
    phone: { type: String, trim: true },
    avatarUrl: { type: String },
    tokenVersion: { type: Number, default: 0 },
    active: { type: Boolean, default: true, index: true }
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        ret.id = String(ret._id);
        delete ret.password;
        delete ret.__v;
        return ret;
      }
    }
  }
);

UserSchema.pre('save', async function (next) {
  if (this.isModified('password') && this.password && !this.password.startsWith('$2')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

UserSchema.methods.comparePassword = function (plain) {
  if (!this.password || !plain) return Promise.resolve(false);
  return bcrypt.compare(plain, this.password);
};

module.exports = mongoose.model('User', UserSchema);
