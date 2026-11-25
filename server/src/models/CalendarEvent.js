const mongoose = require('mongoose');

const CalendarEventSchema = new mongoose.Schema(
  {
    id: { type: String, index: true },
    studentId: { type: String, required: true, uppercase: true, trim: true, index: true },
    title: { type: String, required: true, trim: true },
    date: { type: String, required: true, trim: true, index: true },
    time: { type: String, default: '10:00 AM' },
    eventType: {
      type: String,
      enum: [
        'Medical Consultation',
        'Follow-up',
        'Lab Test',
        'Daily Monitoring',
        'Prescription Reminder',
        'Nutrition Review',
        'Appointment',
        'Monitoring',
        'Vaccination',
        'Other'
      ],
      required: true,
      index: true
    },
    status: {
      type: String,
      enum: ['Upcoming', 'Completed', 'Missed', 'Cancelled'],
      default: 'Upcoming',
      index: true
    },
    notes: { type: String, default: '' },
    createdByUserId: { type: String },
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

CalendarEventSchema.index({ studentId: 1, date: 1 });

module.exports = mongoose.model('CalendarEvent', CalendarEventSchema);
