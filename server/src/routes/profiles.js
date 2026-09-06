const router = require('express').Router();
const { getModel } = require('../models/provider');
const { authenticate, authorizeRoles, verifyOwnershipOrRole } = require('../middleware/rbac');

// GET /api/profiles (Only Clinicians and Administrators can view all profiles)
router.get('/', authenticate, authorizeRoles('MEDICAL_STAFF', 'ADMIN'), async (req, res) => {
  try {
    const StudentProfile = getModel('StudentProfile');
    const profiles = await StudentProfile.find({});
    res.json(profiles);
  } catch (err) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
});

// GET /api/profiles/:studentId (Protected by IDOR Guard)
router.get('/:studentId', authenticate, verifyOwnershipOrRole({ paramName: 'studentId' }), async (req, res) => {
  try {
    const StudentProfile = getModel('StudentProfile');
    const profile = await StudentProfile.findOne({ studentId: req.params.studentId });
    if (!profile) {
      return res.status(404).json({ success: false, error: { code: 'PROFILE_NOT_FOUND', message: 'No student medical profile found for this ID.' } });
    }
    res.json(profile);
  } catch (err) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
});

// POST /api/profiles (Protected by IDOR Guard)
router.post('/', authenticate, verifyOwnershipOrRole({ paramName: 'studentId' }), async (req, res) => {
  try {
    const StudentProfile = getModel('StudentProfile');
    const data = req.body;
    const targetStudentId = data.studentId || req.user.studentId;

    if (!targetStudentId) {
      return res.status(400).json({ success: false, error: { code: 'INVALID_INPUT', message: 'Student ID is required.' } });
    }

    const updatedProfile = await StudentProfile.findOneAndUpdate(
      { studentId: targetStudentId },
      { ...data, studentId: targetStudentId, lastUpdated: new Date().toISOString() },
      { new: true, upsert: true }
    );
    res.json(updatedProfile);
  } catch (err) {
    res.status(400).json({ success: false, error: { code: 'BAD_REQUEST', message: err.message } });
  }
});

module.exports = router;
