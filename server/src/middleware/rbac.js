const { getModel } = require('../models/provider');
const env = require('../config/env');
const { verifyAuthToken } = require('../services/tokenService');
const { logAuditEvent } = require('../services/auditService');
const { findByIdentifier } = require('../utils/dbHelpers');

/**
 * Verifies JWT from HttpOnly session cookie or explicit Authorization Bearer header,
 * validates tokenVersion & active status against stored user record, and attaches req.user.
 */
const authenticate = async (req, res, next) => {
  try {
    const cookieToken = req.cookies && req.cookies[env.authCookieName];
    const authHeader = req.headers.authorization;
    const bearerToken = authHeader && authHeader.startsWith('Bearer ')
      ? authHeader.slice(7).trim()
      : null;

    const token = cookieToken || bearerToken;
    if (!token) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHENTICATED', message: 'Authentication required. Please sign in.' }
      });
    }

    req.authSource = cookieToken ? 'cookie' : 'bearer';
    const decoded = verifyAuthToken(token);
    req.tokenDecoded = decoded;

    // Verify account remains active and tokenVersion has not been invalidated
    const User = getModel('User');
    if (User && (typeof User.findById === 'function' || typeof User.findOne === 'function')) {
      const dbUser = await findByIdentifier(User, decoded.id);
      if (!dbUser || dbUser.active === false) {
        return res.status(401).json({
          success: false,
          error: { code: 'ACCOUNT_INACTIVE', message: 'User account no longer active.' }
        });
      }
      if (Number(dbUser.tokenVersion || 0) !== Number(decoded.tv || 0)) {
        return res.status(401).json({
          success: false,
          error: { code: 'SESSION_INVALIDATED', message: 'Session has expired or been logged out. Please sign in again.' }
        });
      }
      req.user = {
        id: String(dbUser._id || dbUser.id),
        role: dbUser.role,
        email: dbUser.email,
        studentId: dbUser.studentId,
        staffId: dbUser.staffId,
        name: dbUser.name,
        tokenVersion: Number(dbUser.tokenVersion || 0)
      };
    } else {
      req.user = decoded;
    }

    next();
  } catch (err) {
    const code = err.code === 'TOKEN_REVOKED' ? 'TOKEN_REVOKED' : 'INVALID_TOKEN';
    return res.status(401).json({
      success: false,
      error: { code, message: 'Token is invalid, expired, or revoked. Please sign in again.' }
    });
  }
};

/**
 * Role-based access control guard.
 */
const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHENTICATED', message: 'Authentication required.' }
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      logAuditEvent(req, {
        action: 'RBAC_ACCESS_DENIED',
        resourceType: 'ROUTE',
        resource: req.originalUrl || req.path,
        details: `Role '${req.user.role}' denied access (allowed: ${allowedRoles.join(', ')})`,
        sensitivity: 'HIGH',
        outcome: 'DENIED'
      });

      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: `Access forbidden. Role '${req.user.role}' lacks required privileges for this resource.`
        }
      });
    }
    next();
  };
};

/**
 * Contextual Ownership Verification (IDOR Prevention).
 * - STUDENT: can ONLY access/mutate records matching their own verified server-side studentId
 * - MEDICAL_STAFF: allowed by default for clinical care (unless excluded by allowedElevatedRoles)
 * - ADMIN: NOT granted automatic clinical access by default; must be explicitly opted in only for operational routes
 * - RESEARCHER & EMERGENCY_RESPONDER: blocked from direct identifiable clinical records
 */
const verifyOwnershipOrRole = ({ paramName = 'studentId', allowedElevatedRoles = ['MEDICAL_STAFF'] } = {}) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHENTICATED', message: 'Authentication required.' }
      });
    }

    const userRole = req.user.role;

    if (allowedElevatedRoles.includes(userRole)) {
      return next();
    }

    if (userRole === 'RESEARCHER') {
      logAuditEvent(req, {
        action: 'RESEARCHER_PII_BLOCKED',
        resourceType: 'CLINICAL_RECORD',
        resource: req.originalUrl || req.path,
        details: 'Researcher blocked from accessing identifiable clinical records.',
        sensitivity: 'HIGH',
        outcome: 'DENIED'
      });
      return res.status(403).json({
        success: false,
        error: {
          code: 'RESEARCHER_ACCESS_RESTRICTED',
          message: 'Researchers are restricted to de-identified aggregate analytics at /api/research.'
        }
      });
    }

    if (userRole === 'EMERGENCY_RESPONDER') {
      return res.status(403).json({
        success: false,
        error: {
          code: 'EMERGENCY_RESPONDER_RESTRICTED',
          message: 'Emergency responders must use the token-based emergency verification portal.'
        }
      });
    }

    if (userRole === 'ADMIN') {
      logAuditEvent(req, {
        action: 'ADMIN_CLINICAL_ACCESS_DENIED',
        resourceType: 'CLINICAL_RECORD',
        resource: req.originalUrl || req.path,
        details: 'Administrator blocked from unrestricted clinical access per minimum-privilege policy.',
        sensitivity: 'HIGH',
        outcome: 'DENIED'
      });
      return res.status(403).json({
        success: false,
        error: {
          code: 'CLINICAL_ACCESS_RESTRICTED',
          message: 'Administrators do not have unrestricted access to individual patient clinical records.'
        }
      });
    }

    if (userRole === 'STUDENT') {
      const ownStudentId = req.user.studentId || req.user.id;
      const requestedStudentId =
        (req.params && req.params[paramName]) ||
        (req.query && req.query[paramName]) ||
        (req.body && req.body[paramName]);

      if (requestedStudentId && String(requestedStudentId).trim().toLowerCase() !== String(ownStudentId).trim().toLowerCase()) {
        logAuditEvent(req, {
          action: 'IDOR_ATTEMPT_BLOCKED',
          resourceType: 'STUDENT_RECORD',
          resource: String(requestedStudentId),
          details: `Student '${req.user.email}' (${ownStudentId}) attempted unauthorized access to '${requestedStudentId}'`,
          sensitivity: 'CRITICAL',
          outcome: 'DENIED'
        });

        return res.status(403).json({
          success: false,
          error: {
            code: 'IDOR_ACCESS_DENIED',
            message: 'Access denied. You can only view or manage your own medical records.'
          }
        });
      }

      req.scopedStudentId = ownStudentId;
      return next();
    }

    return res.status(403).json({
      success: false,
      error: { code: 'FORBIDDEN', message: 'Unauthorized resource access.' }
    });
  };
};

module.exports = {
  authenticate,
  authorizeRoles,
  verifyOwnershipOrRole
};
