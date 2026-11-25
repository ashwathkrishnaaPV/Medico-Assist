const router = require('express').Router();
const { getModel } = require('../models/provider');
const { authenticate, authorizeRoles } = require('../middleware/rbac');
const { logAuditEvent } = require('../services/auditService');
const { createDatabaseBackup } = require('../db');

// GET /api/audit — Strictly ADMIN only audit log review with pagination
router.get('/', authenticate, authorizeRoles('ADMIN'), async (req, res) => {
  try {
    const AuditLog = getModel('AuditLog');
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(200, Math.max(1, parseInt(req.query.limit, 10) || 100));

    const allLogs = await AuditLog.find({});
    const sorted = [...allLogs].sort((a, b) =>
      String(b.timestamp || '').localeCompare(String(a.timestamp || ''))
    );
    const total = sorted.length;
    const paginated = sorted.slice((page - 1) * limit, page * limit);

    return res.json({
      success: true,
      message: 'Audit logs retrieved.',
      data: paginated,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit))
      }
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: { code: 'AUDIT_FETCH_ERROR', message: err.message }
    });
  }
});

// POST /api/audit/backup — Admin-only real database backup trigger
router.post('/backup', authenticate, authorizeRoles('ADMIN'), async (req, res) => {
  try {
    const backupInfo = await createDatabaseBackup();
    await logAuditEvent(req, {
      action: 'SYSTEM_DATABASE_BACKUP',
      resourceType: 'DATABASE',
      resource: backupInfo.filename,
      details: `Admin initiated full database snapshot. Saved to ${backupInfo.filename}`,
      sensitivity: 'HIGH',
      outcome: 'SUCCESS'
    });

    return res.json({
      success: true,
      message: 'Encrypted database snapshot created successfully.',
      data: backupInfo
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: { code: 'BACKUP_FAILED', message: err.message }
    });
  }
});

// POST /api/audit — Reject client-submitted audit logs (must originate server-side only)
router.post('/', authenticate, async (req, res) => {
  await logAuditEvent(req, {
    action: 'CLIENT_AUDIT_FORGERY_BLOCKED',
    resourceType: 'AUDIT_LOG',
    resource: 'SYSTEM_AUDIT',
    details: 'Blocked attempt to submit client-originated audit log record.',
    sensitivity: 'CRITICAL',
    outcome: 'DENIED'
  });

  return res.status(403).json({
    success: false,
    error: {
      code: 'CLIENT_AUDIT_FORBIDDEN',
      message: 'Audit events must be generated server-side and cannot be submitted by clients.'
    }
  });
});

// Reject any attempt to modify or delete immutable audit logs
router.all('/:id?', authenticate, (req, res, next) => {
  if (['PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    return res.status(403).json({
      success: false,
      error: {
        code: 'AUDIT_IMMUTABLE',
        message: 'Audit logs are append-only immutable records and cannot be modified or deleted.'
      }
    });
  }
  return next();
});

module.exports = router;
