const router = require('express').Router();
const { getModel } = require('../models/provider');
const { authenticate, verifyOwnershipOrRole } = require('../middleware/rbac');
const { validate } = require('../middleware/validate');
const { createCalendarEventSchema } = require('../schemas/validationSchemas');
const { logAuditEvent } = require('../services/auditService');

// GET /api/calendar (STUDENT sees own events; MEDICAL_STAFF sees filtered or all)
router.get(
  '/',
  authenticate,
  verifyOwnershipOrRole({ paramName: 'studentId', allowedElevatedRoles: ['MEDICAL_STAFF'] }),
  async (req, res) => {
    try {
      const CalendarEvent = getModel('CalendarEvent');
      const filter = {};
      if (req.user.role === 'STUDENT') {
        filter.studentId = req.user.studentId || req.user.id;
      } else if (req.query.studentId) {
        filter.studentId = String(req.query.studentId);
      }
      const events = await CalendarEvent.find(filter);
      return res.json({
        success: true,
        message: 'Calendar events retrieved.',
        data: events
      });
    } catch (err) {
      return res.status(500).json({
        success: false,
        error: { code: 'CALENDAR_FETCH_ERROR', message: err.message }
      });
    }
  }
);

// POST /api/calendar (Scoped ownership + Zod validation)
router.post(
  '/',
  authenticate,
  verifyOwnershipOrRole({ paramName: 'studentId', allowedElevatedRoles: ['MEDICAL_STAFF'] }),
  validate({ body: createCalendarEventSchema }),
  async (req, res) => {
    try {
      const CalendarEvent = getModel('CalendarEvent');
      const studentId = req.user.role === 'STUDENT'
        ? (req.user.studentId || req.user.id)
        : req.body.studentId;

      if (!studentId) {
        return res.status(400).json({
          success: false,
          error: { code: 'STUDENT_ID_REQUIRED', message: 'Student ID is required for calendar events.' }
        });
      }

      const event = await CalendarEvent.create({
        ...req.body,
        studentId,
        createdByUserId: req.user.id,
        createdAt: new Date().toISOString()
      });

      await logAuditEvent(req, {
        action: 'CREATE_CALENDAR_EVENT',
        resourceType: 'CALENDAR_EVENT',
        resource: studentId,
        details: `Scheduled ${req.body.eventType} for ${req.body.date}`,
        sensitivity: 'LOW',
        outcome: 'SUCCESS'
      });

      return res.status(201).json({
        success: true,
        message: 'Calendar event created.',
        data: event
      });
    } catch (err) {
      return res.status(400).json({
        success: false,
        error: { code: 'CALENDAR_CREATE_ERROR', message: err.message }
      });
    }
  }
);

module.exports = router;
