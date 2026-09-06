const router = require('express').Router();
const { getModel } = require('../models/provider');
const { authenticate, authorizeRoles, verifyOwnershipOrRole } = require('../middleware/rbac');

// GET /api/visits (Scoped by Role and IDOR Guard)
router.get('/', authenticate, verifyOwnershipOrRole({ paramName: 'studentId' }), async (req, res) => {
  try {
    const MedicalVisit = getModel('MedicalVisit');
    let filter = {};

    if (req.user.role === 'STUDENT') {
      filter.studentId = req.user.studentId || req.user.id;
    } else if (req.query.studentId) {
      filter.studentId = req.query.studentId;
    }

    const visits = await MedicalVisit.find(filter);
    res.json(visits);
  } catch (err) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
});

// POST /api/visits (Restricted to Clinicians and Administrators)
router.post('/', authenticate, authorizeRoles('MEDICAL_STAFF', 'ADMIN'), async (req, res) => {
  try {
    const MedicalVisit = getModel('MedicalVisit');
    const visitData = {
      ...req.body,
      recordedBy: req.user.name || 'Medical Staff',
      createdAt: new Date().toISOString()
    };
    const visit = await MedicalVisit.create(visitData);
    res.status(201).json(visit);
  } catch (err) {
    res.status(400).json({ success: false, error: { code: 'BAD_REQUEST', message: err.message } });
  }
});

module.exports = router;
