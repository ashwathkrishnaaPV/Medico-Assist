const router = require('express').Router();
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { getModel } = require('../models/provider');
const env = require('../config/env');
const { authenticate, authorizeRoles } = require('../middleware/rbac');
const { authLimiter } = require('../middleware/rateLimiter');
const { validate } = require('../middleware/validate');
const {
  registerSchema,
  loginSchema,
  changePasswordSchema,
  adminCreateUserSchema,
  adminUpdateRoleSchema,
  adminUpdateStatusSchema
} = require('../schemas/validationSchemas');
const {
  signAuthToken,
  revokeToken,
  setSessionCookies,
  clearSessionCookies,
  getCsrfCookieOptions
} = require('../services/tokenService');
const {
  checkLockout,
  recordFailedAttempt,
  clearFailedAttempts
} = require('../services/bruteForceService');
const { logAuditEvent } = require('../services/auditService');
const { findByIdentifier, updateByIdentifier } = require('../utils/dbHelpers');

function sanitizeUser(user) {
  if (!user) return null;
  return {
    id: String(user._id || user.id),
    name: user.name,
    email: user.email,
    role: user.role,
    studentId: user.studentId,
    staffId: user.staffId,
    department: user.department,
    title: user.title,
    active: user.active !== false
  };
}

// GET /api/auth/csrf-token — Issue CSRF double-submit cookie cleanly
router.get('/csrf-token', (req, res) => {
  const existing = req.cookies && req.cookies[env.csrfCookieName];
  const csrfToken = existing || crypto.randomBytes(32).toString('hex');
  if (!existing) {
    res.cookie(env.csrfCookieName, csrfToken, getCsrfCookieOptions());
  }
  res.json({
    success: true,
    message: 'CSRF token ready.',
    data: { csrfToken }
  });
});

// POST /api/auth/register — Public self-registration strictly locked to STUDENT role
router.post('/register', authLimiter, validate({ body: registerSchema }), async (req, res) => {
  try {
    const User = getModel('User');
    const StudentProfile = getModel('StudentProfile');
    const {
      name,
      email,
      password,
      studentId,
      department = 'Computer and Communication Engineering (CCE)',
      phone = '',
      age,
      gender = 'Male',
      year = '1st Year'
    } = req.body;

    const normalizedEmail = email.toLowerCase().trim();
    const assignedStudentId = studentId && studentId.trim()
      ? studentId.trim().toUpperCase()
      : `STU_${Date.now().toString().slice(-6)}`;

    const existingEmail = await User.findOne({ email: normalizedEmail });
    if (existingEmail) {
      return res.status(409).json({
        success: false,
        error: { code: 'DUPLICATE_ACCOUNT', message: 'An account with these details already exists.' }
      });
    }

    const existingId =
      (await User.findOne({ studentId: assignedStudentId })) ||
      (StudentProfile && (await StudentProfile.findOne({ studentId: assignedStudentId })));
    if (existingId) {
      return res.status(409).json({
        success: false,
        error: { code: 'DUPLICATE_STUDENT_ID', message: `Student ID "${assignedStudentId}" is already registered.` }
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: 'STUDENT',
      studentId: assignedStudentId,
      phone: phone ? String(phone).trim() : undefined,
      department: department.trim(),
      active: true,
      tokenVersion: 0
    });

    if (StudentProfile) {
      await StudentProfile.findOneAndUpdate(
        { studentId: assignedStudentId },
        {
          studentId: assignedStudentId,
          userId: String(user._id || user.id),
          name: name.trim(),
          email: normalizedEmail,
          age: age || 19,
          dob: '',
          gender,
          department: department.trim(),
          year,
          ugOrPg: 'UG',
          accommodation: '',
          hostelBlock: '',
          hostelRoom: '',
          phone: phone ? String(phone).trim() : '',
          bloodGroup: '',
          emergencyContact: { name: '', relation: 'Father', phone: '' },
          medicalCentreContact: '+91-44-2257-0000',
          criticalAllergies: [],
          criticalConditions: [],
          criticalMedications: [],
          heightCm: 0,
          weightKg: 0,
          bmi: 0,
          lastUpdated: new Date().toISOString().split('T')[0],
          profileComplete: false
        },
        { upsert: true, new: true }
      );
    }

    const token = signAuthToken(user);
    const csrfToken = setSessionCookies(res, token);
    const safeUser = sanitizeUser(user);

    await logAuditEvent(req, {
      action: 'USER_REGISTERED',
      resourceType: 'USER',
      resource: safeUser.id,
      details: `Student account created (${assignedStudentId})`,
      sensitivity: 'MEDIUM',
      outcome: 'SUCCESS',
      actorOverride: safeUser
    });

    return res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      token,
      user: safeUser,
      data: { user: safeUser, token, csrfToken }
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: { code: 'REGISTRATION_ERROR', message: err.message }
    });
  }
});

// POST /api/auth/login — Strict bcrypt authentication with brute-force protection
router.post('/login', authLimiter, validate({ body: loginSchema }), async (req, res) => {
  try {
    const User = getModel('User');
    const { email, password } = req.body;
    const rawIdentifier = email.trim();
    const normalizedInput = rawIdentifier.toLowerCase();

    const lockout = checkLockout(normalizedInput);
    if (lockout.locked) {
      await logAuditEvent(req, {
        action: 'LOGIN_BLOCKED_LOCKOUT',
        resourceType: 'AUTH',
        resource: normalizedInput,
        details: `Account temporarily locked due to excessive failed login attempts`,
        sensitivity: 'HIGH',
        outcome: 'DENIED',
        actorOverride: { id: 'LOCKED_ATTEMPT', name: normalizedInput, role: 'ANONYMOUS' }
      });

      return res.status(429).json({
        success: false,
        error: {
          code: 'ACCOUNT_LOCKED',
          message: `Too many failed login attempts. Try again in ${Math.ceil(lockout.remainingSeconds / 60)} minute(s).`
        }
      });
    }

    let user = await User.findOne({ email: normalizedInput });
    if (!user) {
      user =
        (await User.findOne({ studentId: rawIdentifier.toUpperCase() })) ||
        (await User.findOne({ studentId: rawIdentifier })) ||
        (await User.findOne({ registerNumber: rawIdentifier }));
    }

    const validPassword = user && user.password
      ? await (typeof user.comparePassword === 'function'
          ? user.comparePassword(password)
          : bcrypt.compare(password, user.password))
      : false;

    if (!user || !validPassword) {
      recordFailedAttempt(normalizedInput);
      await logAuditEvent(req, {
        action: 'LOGIN_FAILED',
        resourceType: 'AUTH',
        resource: normalizedInput,
        details: 'Failed login attempt (invalid credentials)',
        sensitivity: 'MEDIUM',
        outcome: 'FAILURE',
        actorOverride: { id: 'AUTH_FAILURE', name: normalizedInput, role: 'ANONYMOUS' }
      });

      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email/ID or password.'
        }
      });
    }

    if (user.active === false) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'ACCOUNT_SUSPENDED',
          message: 'This account has been deactivated. Contact system administration.'
        }
      });
    }

    clearFailedAttempts(normalizedInput);
    const token = signAuthToken(user);
    const csrfToken = setSessionCookies(res, token);
    const safeUser = sanitizeUser(user);

    await logAuditEvent(req, {
      action: 'LOGIN_SUCCESS',
      resourceType: 'AUTH',
      resource: safeUser.id,
      details: `Authenticated session started for ${safeUser.role}`,
      sensitivity: 'LOW',
      outcome: 'SUCCESS',
      actorOverride: safeUser
    });

    return res.json({
      success: true,
      message: 'Signed in successfully.',
      token,
      user: safeUser,
      data: { user: safeUser, token, csrfToken }
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: { code: 'LOGIN_ERROR', message: err.message }
    });
  }
});

// POST /api/auth/logout — Revokes active JWT token & clears session cookies
router.post('/logout', authenticate, async (req, res) => {
  try {
    revokeToken(req.tokenDecoded);
    clearSessionCookies(res);

    await logAuditEvent(req, {
      action: 'LOGOUT',
      resourceType: 'AUTH',
      resource: req.user.id,
      details: 'Session logged out and token revoked.',
      sensitivity: 'LOW',
      outcome: 'SUCCESS'
    });

    return res.json({
      success: true,
      message: 'Logged out successfully.',
      data: null
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: { code: 'LOGOUT_ERROR', message: err.message }
    });
  }
});

// POST /api/auth/change-password — Requires verified currentPassword & invalidates older tokens
router.post('/change-password', authenticate, validate({ body: changePasswordSchema }), async (req, res) => {
  try {
    const User = getModel('User');
    const { currentPassword, newPassword } = req.body;

    if (currentPassword === newPassword) {
      return res.status(400).json({
        success: false,
        error: { code: 'PASSWORD_UNCHANGED', message: 'New password must differ from current password.' }
      });
    }

    const user = await findByIdentifier(User, req.user.id);
    if (!user || !user.password) {
      return res.status(404).json({
        success: false,
        error: { code: 'USER_NOT_FOUND', message: 'User account not found.' }
      });
    }

    const isMatch = typeof user.comparePassword === 'function'
      ? await user.comparePassword(currentPassword)
      : await bcrypt.compare(currentPassword, user.password);

    if (!isMatch) {
      await logAuditEvent(req, {
        action: 'PASSWORD_CHANGE_FAILED',
        resourceType: 'USER',
        resource: req.user.id,
        details: 'Incorrect current password submitted during password update.',
        sensitivity: 'HIGH',
        outcome: 'FAILURE'
      });

      return res.status(401).json({
        success: false,
        error: { code: 'INVALID_CURRENT_PASSWORD', message: 'Current password is incorrect.' }
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const nextTokenVersion = Number(user.tokenVersion || 0) + 1;
    const refreshedUser = await updateByIdentifier(User, user._id || user.id, {
      password: hashedPassword,
      tokenVersion: nextTokenVersion
    });

    // Invalidate current token and issue fresh session token cleanly
    revokeToken(req.tokenDecoded);
    const newToken = signAuthToken(refreshedUser || user);
    const csrfToken = setSessionCookies(res, newToken);

    await logAuditEvent(req, {
      action: 'PASSWORD_CHANGED',
      resourceType: 'USER',
      resource: req.user.id,
      details: 'Password updated and prior session tokens invalidated.',
      sensitivity: 'HIGH',
      outcome: 'SUCCESS'
    });

    return res.json({
      success: true,
      message: 'Password updated successfully.',
      data: { csrfToken }
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: { code: 'PASSWORD_UPDATE_ERROR', message: err.message }
    });
  }
});

// GET /api/auth/me — Returns verified current user profile from server identity
router.get('/me', authenticate, async (req, res) => {
  try {
    const User = getModel('User');
    const user = await findByIdentifier(User, req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: { code: 'USER_NOT_FOUND', message: 'User account not found.' }
      });
    }

    return res.json({
      success: true,
      message: 'Session verified.',
      data: { user: sanitizeUser(user) }
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: { code: 'SESSION_ERROR', message: err.message }
    });
  }
});

// GET /api/auth/users — Admin user directory with pagination & search (CLINICIANS excluded from user governance)
router.get('/users', authenticate, authorizeRoles('ADMIN'), async (req, res) => {
  try {
    const User = getModel('User');
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 50));
    const roleFilter = req.query.role ? String(req.query.role).trim().toUpperCase() : '';
    const search = req.query.search ? String(req.query.search).trim().toLowerCase() : '';

    let users = await User.find(roleFilter ? { role: roleFilter } : {});
    if (search) {
      users = users.filter((u) =>
        (u.name || '').toLowerCase().includes(search) ||
        (u.email || '').toLowerCase().includes(search) ||
        (u.studentId || '').toLowerCase().includes(search) ||
        (u.staffId || '').toLowerCase().includes(search)
      );
    }

    const total = users.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const start = (page - 1) * limit;
    const paginated = users.slice(start, start + limit).map(sanitizeUser);

    return res.json({
      success: true,
      message: 'Users retrieved successfully.',
      data: paginated,
      pagination: { page, limit, total, totalPages }
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: { code: 'USER_LIST_ERROR', message: err.message }
    });
  }
});

// GET /api/auth/staff — Non-sensitive clinician directory for Admin/Dashboard displays
router.get('/staff', authenticate, authorizeRoles('ADMIN', 'MEDICAL_STAFF'), async (req, res) => {
  try {
    const User = getModel('User');
    const staff = await User.find({ role: 'MEDICAL_STAFF' });
    return res.json({
      success: true,
      message: 'Medical staff retrieved.',
      data: staff.map(sanitizeUser)
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: { code: 'STAFF_LIST_ERROR', message: err.message }
    });
  }
});

// POST /api/auth/users — Admin-only creation of privileged/staff/student accounts
router.post('/users', authenticate, authorizeRoles('ADMIN'), validate({ body: adminCreateUserSchema }), async (req, res) => {
  try {
    const User = getModel('User');
    const { name, email, password, role, studentId, staffId, department, title, phone } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(409).json({
        success: false,
        error: { code: 'USER_EXISTS', message: 'A user with this email already exists.' }
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const created = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role,
      studentId: role === 'STUDENT' ? (studentId ? studentId.toUpperCase() : `STU_${Date.now().toString().slice(-6)}`) : undefined,
      staffId: role !== 'STUDENT' ? (staffId || `STF_${Date.now().toString().slice(-4)}`) : undefined,
      department: department || 'General',
      title,
      phone,
      active: true,
      tokenVersion: 0
    });

    const safeUser = sanitizeUser(created);

    await logAuditEvent(req, {
      action: 'ADMIN_CREATE_USER',
      resourceType: 'USER',
      resource: safeUser.id,
      details: `Admin created ${safeUser.role} account (${safeUser.email})`,
      sensitivity: 'HIGH',
      outcome: 'SUCCESS'
    });

    return res.status(201).json({
      success: true,
      message: 'User created successfully.',
      data: { user: safeUser }
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: { code: 'USER_CREATE_ERROR', message: err.message }
    });
  }
});

// PATCH /api/auth/users/:id/role — Admin updates user role and invalidates old tokens
router.patch('/users/:id/role', authenticate, authorizeRoles('ADMIN'), validate({ body: adminUpdateRoleSchema }), async (req, res) => {
  try {
    const User = getModel('User');
    const targetId = req.params.id;
    const { role } = req.body;

    if (String(targetId) === String(req.user.id) && role !== 'ADMIN') {
      return res.status(400).json({
        success: false,
        error: { code: 'SELF_DEMOTION_BLOCKED', message: 'Administrators cannot remove their own ADMIN role.' }
      });
    }

    const target = await findByIdentifier(User, targetId);
    if (!target) {
      return res.status(404).json({
        success: false,
        error: { code: 'USER_NOT_FOUND', message: 'Target user not found.' }
      });
    }

    const updated = await updateByIdentifier(User, target._id || target.id, {
      role,
      tokenVersion: Number(target.tokenVersion || 0) + 1
    });

    await logAuditEvent(req, {
      action: 'ADMIN_ROLE_UPDATED',
      resourceType: 'USER',
      resource: String(target._id || target.id),
      details: `Changed role from ${target.role} to ${role}`,
      sensitivity: 'CRITICAL',
      outcome: 'SUCCESS'
    });

    return res.json({
      success: true,
      message: `User role updated to ${role}.`,
      data: { user: sanitizeUser(updated) }
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: { code: 'ROLE_UPDATE_ERROR', message: err.message }
    });
  }
});

// PATCH /api/auth/users/:id/status — Admin activates/suspends account
router.patch('/users/:id/status', authenticate, authorizeRoles('ADMIN'), validate({ body: adminUpdateStatusSchema }), async (req, res) => {
  try {
    const User = getModel('User');
    const targetId = req.params.id;
    const { active } = req.body;

    if (String(targetId) === String(req.user.id) && !active) {
      return res.status(400).json({
        success: false,
        error: { code: 'SELF_SUSPEND_BLOCKED', message: 'Administrators cannot deactivate their own account.' }
      });
    }

    const target = await findByIdentifier(User, targetId);
    if (!target) {
      return res.status(404).json({
        success: false,
        error: { code: 'USER_NOT_FOUND', message: 'Target user not found.' }
      });
    }

    const updated = await updateByIdentifier(User, target._id || target.id, {
      active,
      tokenVersion: Number(target.tokenVersion || 0) + (active ? 0 : 1)
    });

    await logAuditEvent(req, {
      action: active ? 'ADMIN_ACCOUNT_REACTIVATED' : 'ADMIN_ACCOUNT_SUSPENDED',
      resourceType: 'USER',
      resource: String(target._id || target.id),
      details: `Set active=${active} for ${target.email}`,
      sensitivity: 'CRITICAL',
      outcome: 'SUCCESS'
    });

    return res.json({
      success: true,
      message: `Account ${active ? 'activated' : 'suspended'} successfully.`,
      data: { user: sanitizeUser(updated) }
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: { code: 'STATUS_UPDATE_ERROR', message: err.message }
    });
  }
});

module.exports = router;
