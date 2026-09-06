const router = require('express').Router();
const jwt = require('jsonwebtoken');
const { getModel } = require('../models/provider');
const auth = require('../middleware/auth');

const sign = (user) => jwt.sign(
  { id: user._id || user.id, role: user.role, email: user.email,
    studentId: user.studentId, staffId: user.staffId },
  process.env.JWT_SECRET || 'campushealth_secret', { expiresIn: '7d' }
);

router.post('/register', async (req, res) => {
  try {
    const User = getModel('User');
    const { name, email, password, role, studentId, staffId, department, title } = req.body;
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(409).json({ error: 'Account already exists with this email.' });
    const user = await User.create({ name, email, password, role, studentId, staffId, department, title });
    const token = sign(user);
    res.json({ token, user: { id: user._id || user.id, name: user.name, email: user.email, role: user.role, studentId: user.studentId, staffId: user.staffId, department: user.department, title: user.title } });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const User = getModel('User');
    const { email, password } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(404).json({ error: 'No account found with this email.' });
    if (password && user.password) {
      const ok = await user.comparePassword(password);
      if (!ok) return res.status(401).json({ error: 'Incorrect password.' });
    }
    const token = sign(user);
    res.json({ token, user: { id: user._id || user.id, name: user.name, email: user.email, role: user.role, studentId: user.studentId, staffId: user.staffId, department: user.department, title: user.title } });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/change-password', auth, async (req, res) => {
  try {
    const User = getModel('User');
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found.' });
    if (user.password && currentPassword) {
      const ok = await user.comparePassword(currentPassword);
      if (!ok) return res.status(401).json({ error: 'Current password is incorrect.' });
    }
    if (!newPassword || newPassword.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    user.password = newPassword;
    await user.save();
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/users', async (req, res) => {
  try {
    const User = getModel('User');
    const users = await User.find({});
    res.json(users.map(u => ({ id: u._id || u.id, name: u.name, email: u.email, role: u.role, studentId: u.studentId, staffId: u.staffId, department: u.department, title: u.title })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/me', auth, async (req, res) => {
  try {
    const User = getModel('User');
    const user = await User.findById(req.user.id);
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
