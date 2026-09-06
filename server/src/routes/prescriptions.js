const router = require('express').Router();
const { getModel } = require('../models/provider');
const { authenticate, authorizeRoles, verifyOwnershipOrRole } = require('../middleware/rbac');

// GET /api/prescriptions (Students only see their own; Clinicians see queried or all)
router.get('/', authenticate, verifyOwnershipOrRole({ paramName: 'studentId' }), async (req, res) => {
  try {
    const Prescription = getModel('Prescription');
    let filter = {};

    if (req.user.role === 'STUDENT') {
      filter.studentId = req.user.studentId || req.user.id;
    } else if (req.query.studentId) {
      filter.studentId = req.query.studentId;
    }

    const prescriptions = await Prescription.find(filter);
    res.json(prescriptions);
  } catch (err) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
});

// POST /api/prescriptions (Clinician only)
router.post('/', authenticate, authorizeRoles('MEDICAL_STAFF', 'ADMIN'), async (req, res) => {
  try {
    const Prescription = getModel('Prescription');
    const rx = await Prescription.create({
      ...req.body,
      doctorName: req.user.name || 'Campus Physician',
      createdAt: new Date().toISOString()
    });
    res.status(201).json(rx);
  } catch (err) {
    res.status(400).json({ success: false, error: { code: 'BAD_REQUEST', message: err.message } });
  }
});

// PUT /api/prescriptions/:id (Clinician only)
router.put('/:id', authenticate, authorizeRoles('MEDICAL_STAFF', 'ADMIN'), async (req, res) => {
  try {
    const Prescription = getModel('Prescription');
    const rx = await Prescription.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!rx) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Prescription not found.' } });
    res.json(rx);
  } catch (err) {
    res.status(400).json({ success: false, error: { code: 'BAD_REQUEST', message: err.message } });
  }
});

module.exports = router;
