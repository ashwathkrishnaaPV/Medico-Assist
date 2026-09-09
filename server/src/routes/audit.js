const router = require('express').Router();
const { getModel } = require('../models/provider');
const { authenticate, authorizeRoles } = require('../middleware/rbac');

// GET /api/audit (ADMIN views all logs; STUDENTS view their own access logs)
router.get('/', authenticate, async (req, res) => {
  try {
    const AuditLog = getModel('AuditLog');
    if (req.user.role === 'ADMIN') {
      const logs = await AuditLog.find({});
      return res.json(logs);
    }
    if (req.user.role === 'STUDENT') {
      const studentId = req.user.studentId;
      const logs = await AuditLog.find({
        $or: [
          { resource: studentId },
          { userId: req.user.id }
        ]
      });
      return res.json(logs);
    }
    return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Access denied.' } });
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
