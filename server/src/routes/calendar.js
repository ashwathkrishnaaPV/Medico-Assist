const router = require('express').Router();
const { getModel } = require('../models/provider');
const { authenticate, verifyOwnershipOrRole } = require('../middleware/rbac');

// GET /api/calendar
router.get('/', authenticate, verifyOwnershipOrRole({ paramName: 'studentId' }), async (req, res) => {
  try {
    const CalendarEvent = getModel('CalendarEvent');
    let filter = {};
    if (req.user.role === 'STUDENT') {
      filter.studentId = req.user.studentId || req.user.id;
    } else if (req.query.studentId) {
      filter.studentId = req.query.studentId;
    }
    const events = await CalendarEvent.find(filter);
    res.json(events);
  } catch (err) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
});

// POST /api/calendar
router.post('/', authenticate, async (req, res) => {
  try {
    const CalendarEvent = getModel('CalendarEvent');
    const studentId = req.user.role === 'STUDENT' ? (req.user.studentId || req.user.id) : req.body.studentId;
    const event = await CalendarEvent.create({
      ...req.body,
      studentId,
      createdAt: new Date().toISOString()
    });
    res.status(201).json(event);
  } catch (err) {
    res.status(400).json({ success: false, error: { code: 'BAD_REQUEST', message: err.message } });
  }
});

module.exports = router;
