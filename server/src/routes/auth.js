const router = require('express').Router();
const jwt = require('jsonwebtoken');
const { getModel } = require('../models/provider');
const { authenticate, authorizeRoles, getJwtSecret } = require('../middleware/rbac');
const { authLimiter } = require('../middleware/rateLimiter');

const signToken = (user) => jwt.sign(
  {
    id: user._id || user.id,
    role: user.role,
    email: user.email,
    studentId: user.studentId,
    staffId: user.staffId,
    name: user.name
  },
  getJwtSecret(),
  { expiresIn: '7d' }
);

// POST /api/auth/register (Rate-limited)
router.post('/register', authLimiter, async (req, res) => {
  try {
    const User = getModel('User');
    const { name, email, password, role = 'STUDENT', studentId, staffId, department, title } = req.body;

    if (!email || !name) {
      return res.status(400).json({ success: false, error: { code: 'INVALID_INPUT', message: 'Name and email are required.' } });
    }

    if (password && password.length < 6) {
      return res.status(400).json({ success: false, error: { code: 'WEAK_PASSWORD', message: 'Password must be at least 6 characters long.' } });
    }

    // Role restrictions for public registration
    const validRoles = ['STUDENT', 'MEDICAL_STAFF', 'ADMIN', 'RESEARCHER', 'EMERGENCY_RESPONDER'];
    const assignedRole = validRoles.includes(role) ? role : 'STUDENT';

    const normalizedEmail = email.toLowerCase().trim();
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(409).json({ success: false, error: { code: 'USER_EXISTS', message: 'An account already exists with this email address.' } });
    }

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: password || 'DefaultPass@123',
      role: assignedRole,
      studentId: studentId ? studentId.trim() : (assignedRole === 'STUDENT' ? 'STU_' + Date.now().toString().slice(-4) : undefined),
      staffId: staffId ? staffId.trim() : undefined,
      department: department ? department.trim() : 'General',
      title: title ? title.trim() : undefined
    });

    const token = signToken(user);
    const sanitizedUser = {
      id: user._id || user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      studentId: user.studentId,
      staffId: user.staffId,
      department: user.department,
      title: user.title
    };

    res.status(201).json({
      success: true,
      token,
      user: sanitizedUser,
      data: { token, user: sanitizedUser } // backwards compatibility with existing frontend
    });
  } catch (err) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
});

// POST /api/auth/login (Rate-limited)
router.post('/login', authLimiter, async (req, res) => {
  try {
    const User = getModel('User');
    const { email, password } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, error: { code: 'INVALID_INPUT', message: 'Email address is required.' } });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(404).json({ success: false, error: { code: 'USER_NOT_FOUND', message: 'No registered account found with this email.' } });
    }

    if (password && user.password) {
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({ success: false, error: { code: 'INVALID_CREDENTIALS', message: 'Incorrect password. Please verify and try again.' } });
      }
    }

    const token = signToken(user);
    const sanitizedUser = {
      id: user._id || user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      studentId: user.studentId,
      staffId: user.staffId,
      department: user.department,
      title: user.title
    };

    res.json({
      success: true,
      token,
      user: sanitizedUser,
      data: { token, user: sanitizedUser }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
});

// POST /api/auth/change-password (Authenticated)
router.post('/change-password', authenticate, async (req, res) => {
  try {
    const User = getModel('User');
    const { currentPassword, newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ success: false, error: { code: 'WEAK_PASSWORD', message: 'New password must be at least 6 characters long.' } });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, error: { code: 'USER_NOT_FOUND', message: 'User account not found.' } });
    }

    if (user.password && currentPassword) {
      const isMatch = await user.comparePassword(currentPassword);
      if (!isMatch) {
        return res.status(401).json({ success: false, error: { code: 'INVALID_CURRENT_PASSWORD', message: 'Current password does not match records.' } });
      }
    }

    user.password = newPassword;
    await user.save();

    res.json({ success: true, message: 'Password updated successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
});

// GET /api/auth/users (Restricted to ADMIN and MEDICAL_STAFF)
router.get('/users', authenticate, authorizeRoles('ADMIN', 'MEDICAL_STAFF'), async (req, res) => {
  try {
    const User = getModel('User');
    const users = await User.find({});
    const sanitized = users.map(u => ({
      id: u._id || u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      studentId: u.studentId,
      staffId: u.staffId,
      department: u.department,
      title: u.title
    }));
    res.json(sanitized);
  } catch (err) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
});

// GET /api/auth/me (Authenticated)
router.get('/me', authenticate, async (req, res) => {
  try {
    const User = getModel('User');
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, error: { code: 'USER_NOT_FOUND', message: 'User not found.' } });
    res.json({
      id: user._id || user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      studentId: user.studentId,
      staffId: user.staffId,
      department: user.department,
      title: user.title
    });
  } catch (err) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
});

module.exports = router;
