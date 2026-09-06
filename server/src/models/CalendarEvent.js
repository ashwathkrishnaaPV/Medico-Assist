const mongoose = require('mongoose');

const CalendarEventSchema = new mongoose.Schema({
  studentId: { type: String, required: true, index: true },
  title: String, date: String, time: String,
  eventType: { type: String, enum: ['Appointment','Follow-up','Lab Test','Monitoring','Vaccination','Other'] },
  status: { type: String, enum: ['Upcoming','Completed','Cancelled'], default: 'Upcoming' },
  notes: String
}, { timestamps: true });

module.exports = mongoose.model('CalendarEvent', CalendarEventSchema);
