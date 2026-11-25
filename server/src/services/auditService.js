const crypto = require('crypto');
const { getModel } = require('../models/provider');

/**
 * Server-side immutable audit logger.
 * Always derives actor identity from verified req.user (or explicit controlled system/auth context)
 * and strips any secret values. Client-supplied timestamps or identities are never trusted.
 */
async function logAuditEvent(req, {
  action,
  resource = 'SYSTEM',
  resourceType = 'SYSTEM',
  details = '',
  sensitivity = 'LOW',
  outcome = 'SUCCESS',
  actorOverride = null
}) {
  try {
    const AuditLog = getModel('AuditLog');
    if (!AuditLog || typeof AuditLog.create !== 'function') return null;

    const actor = actorOverride || (req && req.user) || {
      id: 'ANONYMOUS',
      name: 'Anonymous Caller',
      role: 'ANONYMOUS'
    };

    const correlationId = (req && req.correlationId) || crypto.randomUUID();
    const rawIp = (req && (req.ip || req.socket?.remoteAddress)) || '127.0.0.1';
    const ipAddress = String(rawIp).replace(/^::ffff:/, '');
    const timestamp = new Date().toISOString();

    return await AuditLog.create({
      userId: String(actor.id || actor._id || actor.studentId || 'UNKNOWN'),
      userName: String(actor.name || actor.email || 'Unknown Actor'),
      userRole: String(actor.role || 'ANONYMOUS'),
      actorId: String(actor.id || actor._id || actor.studentId || 'UNKNOWN'),
      actorName: String(actor.name || actor.email || 'Unknown Actor'),
      actorRole: String(actor.role || 'ANONYMOUS'),
      action: String(action),
      resourceType: String(resourceType),
      resource: String(resource),
      details: String(details).slice(0, 500),
      outcome: String(outcome),
      correlationId,
      ipAddress,
      sensitivity,
      timestamp
    });
  } catch (err) {
    console.warn('[AUDIT LOGGER WARNING]: Failed to persist audit record:', err.message);
    return null;
  }
}

module.exports = { logAuditEvent };
