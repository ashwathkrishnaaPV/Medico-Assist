const router = require('express').Router();
const { getModel } = require('../models/provider');
const { authenticate } = require('../middleware/rbac');
const { validate } = require('../middleware/validate');
const { createNotificationSchema } = require('../schemas/validationSchemas');
const { findByIdentifier, updateByIdentifier } = require('../utils/dbHelpers');

// GET /api/notifications — Scoped strictly to the authenticated user's role and studentId
router.get('/', authenticate, async (req, res) => {
  try {
    const Notification = getModel('Notification');
    const role = req.user.role;
    const studentId = req.user.studentId;

    const notifs = await Notification.find({});
    const filtered = notifs.filter((n) => {
      const targetRole = n.targetRole || n.recipientRole;
      const targetStudentId = n.targetStudentId || n.studentId;

      // Role check: ALL matches anyone; otherwise must match user's role
      if (targetRole && targetRole !== 'ALL' && targetRole !== role) {
        return false;
      }
      // If notification is scoped to a specific student, ensure it matches
      if (role === 'STUDENT' && targetStudentId && targetStudentId !== studentId) {
        return false;
      }
      return true;
    });

    // Sort descending by timestamp / createdAt
    filtered.sort((a, b) =>
      String(b.timestamp || b.createdAt || '').localeCompare(String(a.timestamp || a.createdAt || ''))
    );

    return res.json({
      success: true,
      message: 'Notifications retrieved.',
      data: filtered
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: { code: 'NOTIFICATIONS_FETCH_ERROR', message: err.message }
    });
  }
});

// POST /api/notifications — Create notification with validation
router.post('/', authenticate, validate({ body: createNotificationSchema }), async (req, res) => {
  try {
    const Notification = getModel('Notification');
    const { recipientRole, studentId, title, message, type } = req.body;

    const notif = await Notification.create({
      id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      recipientRole,
      targetRole: recipientRole,
      studentId,
      targetStudentId: studentId,
      title,
      message,
      type: type || 'system',
      read: false,
      createdAt: new Date().toISOString(),
      timestamp: new Date().toISOString(),
      createdByUserId: req.user.id
    });

    return res.status(201).json({
      success: true,
      message: 'Notification dispatched.',
      data: notif
    });
  } catch (err) {
    return res.status(400).json({
      success: false,
      error: { code: 'NOTIFICATION_CREATE_ERROR', message: err.message }
    });
  }
});

// PUT /api/notifications/read-all — Mark all notifications read for the authenticated user
router.put('/read-all', authenticate, async (req, res) => {
  try {
    const Notification = getModel('Notification');
    const role = req.user.role;
    const studentId = req.user.studentId;

    const notifs = await Notification.find({});
    let updatedCount = 0;

    for (const n of notifs) {
      const targetRole = n.targetRole || n.recipientRole;
      const targetStudentId = n.targetStudentId || n.studentId;

      if (targetRole && targetRole !== 'ALL' && targetRole !== role) continue;
      if (role === 'STUDENT' && targetStudentId && targetStudentId !== studentId) continue;

      if (!n.read) {
        await updateByIdentifier(Notification, n._id || n.id, { read: true });
        updatedCount++;
      }
    }

    return res.json({
      success: true,
      message: `Marked ${updatedCount} notification(s) as read.`,
      data: { updatedCount }
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: { code: 'NOTIFICATIONS_UPDATE_ERROR', message: err.message }
    });
  }
});

// PUT /api/notifications/:id/read — Mark single notification read (with ownership check)
router.put('/:id/read', authenticate, async (req, res) => {
  try {
    const Notification = getModel('Notification');
    const target = await findByIdentifier(Notification, req.params.id);
    if (!target) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Notification not found.' }
      });
    }

    const targetRole = target.targetRole || target.recipientRole;
    const targetStudentId = target.targetStudentId || target.studentId;
    if (req.user.role !== 'ADMIN') {
      if (targetRole && targetRole !== 'ALL' && targetRole !== req.user.role) {
        return res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN', message: 'You cannot modify notifications belonging to another role.' }
        });
      }
      if (
        req.user.role === 'STUDENT' &&
        targetStudentId &&
        String(targetStudentId).toUpperCase() !== String(req.user.studentId || '').toUpperCase()
      ) {
        return res.status(403).json({
          success: false,
          error: { code: 'IDOR_ACCESS_DENIED', message: 'You can only update your own notifications.' }
        });
      }
    }

    const updated = await updateByIdentifier(
      Notification,
      target._id || target.id,
      { read: true },
      { new: true }
    );

    return res.json({
      success: true,
      message: 'Notification marked as read.',
      data: updated
    });
  } catch (err) {
    return res.status(400).json({
      success: false,
      error: { code: 'NOTIFICATION_UPDATE_ERROR', message: err.message }
    });
  }
});

module.exports = router;
