const router = require('express').Router();
const auth = require('../middleware/auth');
const { getModel } = require('../models/provider');

router.get('/', auth, async (req, res) => {
  try {
    const StudentProfile = getModel('StudentProfile');
    const profiles = await StudentProfile.find({});
    res.json(profiles);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:studentId', auth, async (req, res) => {
  try {
    const StudentProfile = getModel('StudentProfile');
    const profile = await StudentProfile.findOne({ studentId: req.params.studentId });
    if (!profile) return res.status(404).json({ error: 'Profile not found' });
    res.json(profile);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const StudentProfile = getModel('StudentProfile');
    const data = req.body;
    const profile = await StudentProfile.findOneAndUpdate(
      { studentId: data.studentId },
      data,
      { new: true, upsert: true }
    );
    res.json(profile);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

module.exports = router;
