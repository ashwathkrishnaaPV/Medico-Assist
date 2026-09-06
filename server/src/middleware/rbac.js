const jwt = require('jsonwebtoken');

// Ensure a valid JWT secret exists
const getJwtSecret = () => {
  return process.env.JWT_SECRET || 'dev_ephemeral_jwt_secret_change_in_production_2026';
};

/**
 * Verifies JWT token and attaches user context to req.user
 */
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: { code: 'UNAUTHENTICATED', message: 'No authentication token provided.' }
    });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, getJwtSecret());
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      error: { code: 'INVALID_TOKEN', message: 'Token is invalid or expired. Please sign in again.' }
    });
  }
};

/**
 * Role-based access control guard
 */
const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: `Access forbidden. Role '${req.user ? req.user.role : 'ANONYMOUS'}' lacks required privileges for this resource.`
        }
      });
    }
    next();
  };
};

/**
 * Contextual Ownership Verification (IDOR Prevention)
 * - If STUDENT: can ONLY access their own studentId records
 * - If MEDICAL_STAFF or ADMIN: allowed for clinical / operational care
 * - If RESEARCHER: blocked from identifiable student records
 * - If EMERGENCY_RESPONDER: blocked from direct clinical querying
 */
const verifyOwnershipOrRole = ({ paramName = 'studentId', allowedElevatedRoles = ['MEDICAL_STAFF', 'ADMIN'] } = {}) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: { code: 'UNAUTHENTICATED', message: 'Authentication required.' } });
    }

    const userRole = req.user.role;

    // Elevated clinician or admin access
    if (allowedElevatedRoles.includes(userRole)) {
      return next();
    }

    // Researchers must never access raw identifiable records
    if (userRole === 'RESEARCHER') {
      return res.status(403).json({
        success: false,
        error: {
          code: 'RESEARCHER_ACCESS_RESTRICTED',
          message: 'Researchers are restricted to de-identified aggregate analytics at /api/research.'
        }
      });
    }

    // Emergency Responders must use the dedicated token verification endpoint
    if (userRole === 'EMERGENCY_RESPONDER') {
      return res.status(403).json({
        success: false,
        error: {
          code: 'EMERGENCY_RESPONDER_RESTRICTED',
          message: 'Emergency responders must use the token-based emergency verification portal.'
        }
      });
    }

    // Student Ownership Check
    if (userRole === 'STUDENT') {
      const requestedStudentId = req.params[paramName] || req.query[paramName] || (req.body && req.body[paramName]);
      const ownStudentId = req.user.studentId || req.user.id;

      // If specific student ID requested, enforce strict equality
      if (requestedStudentId && requestedStudentId !== ownStudentId) {
        console.warn(`[SECURITY AUDIT - IDOR ATTEMPT] Student '${req.user.email}' (ID: ${ownStudentId}) attempted unauthorized access to student records '${requestedStudentId}'`);
        return res.status(403).json({
          success: false,
          error: {
            code: 'IDOR_ACCESS_DENIED',
            message: 'Access denied. You can only view or manage your own medical records.'
          }
        });
      }

      // Automatically scope query or body to student's own ID if not specified
      if (!req.query.studentId && !req.params[paramName]) {
        req.query.studentId = ownStudentId;
      }
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
  verifyOwnershipOrRole,
  getJwtSecret
};
