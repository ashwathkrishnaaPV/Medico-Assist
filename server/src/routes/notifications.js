const router = require('express').Router();
const auth = require('../middleware/auth');
const { getModel } = require('../models/provider');

router.get('/', auth, async (req, res) => {
  try {
    const Notification = getModel('Notification');
    const { role, studentId } = req.query;
    const notifs = await Notification.find({});
    const filtered = notifs.filter(n => {
      if (role && n.targetRole && n.targetRole !== 'ALL' && n.targetRole !== role) return false;
      if (studentId && n.targetStudentId && n.targetStudentId !== studentId) return false;
      return true;
    });
    res.json(filtered);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const Notification = getModel('Notification');
    const notif = await Notification.create(req.body);
    res.json(notif);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.put('/:id/read', auth, async (req, res) => {
  try {
    const Notification = getModel('Notification');
    const notif = await Notification.findByIdAndUpdate(req.params.id, { read: true }, { new: true });
    res.json(notif);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

module.exports = router;
