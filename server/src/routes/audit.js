const router = require('express').Router();
const { getModel } = require('../models/provider');
const { authenticate, authorizeRoles } = require('../middleware/rbac');

// GET /api/audit (ADMIN ONLY)
router.get('/', authenticate, authorizeRoles('ADMIN'), async (req, res) => {
  try {
    const AuditLog = getModel('AuditLog');
    const logs = await AuditLog.find({});
    res.json(logs);
  } catch (err) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
});

// POST /api/audit (Authenticated system audit recorder)
router.post('/', authenticate, async (req, res) => {
  try {
    const AuditLog = getModel('AuditLog');
    const logData = {
      ...req.body,
      userId: req.user.id || req.body.userId,
      userName: req.user.name || req.body.userName,
      userRole: req.user.role || req.body.userRole,
      ipAddress: req.ip || req.connection.remoteAddress || '127.0.0.1',
      timestamp: new Date().toISOString()
    };
    const log = await AuditLog.create(logData);
    res.status(201).json(log);
  } catch (err) {
    res.status(400).json({ success: false, error: { code: 'BAD_REQUEST', message: err.message } });
  }
});

module.exports = router;
