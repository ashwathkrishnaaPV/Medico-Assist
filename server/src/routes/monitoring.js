const router = require('express').Router();
const { getModel } = require('../models/provider');
const { authenticate, authorizeRoles, verifyOwnershipOrRole } = require('../middleware/rbac');

// GET /api/monitoring/plans
router.get('/plans', authenticate, verifyOwnershipOrRole({ paramName: 'studentId' }), async (req, res) => {
  try {
    const MonitoringPlan = getModel('MonitoringPlan');
    let filter = {};
    if (req.user.role === 'STUDENT') {
      filter.studentId = req.user.studentId || req.user.id;
    } else if (req.query.studentId) {
      filter.studentId = req.query.studentId;
    }
    const plans = await MonitoringPlan.find(filter);
    res.json(plans);
  } catch (err) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
});

// POST /api/monitoring/plans (Clinician only)
router.post('/plans', authenticate, authorizeRoles('MEDICAL_STAFF', 'ADMIN'), async (req, res) => {
  try {
    const MonitoringPlan = getModel('MonitoringPlan');
    const plan = await MonitoringPlan.findOneAndUpdate(
      { studentId: req.body.studentId },
      { ...req.body, createdBy: req.user.name || 'Medical Staff', updatedAt: new Date().toISOString() },
      { new: true, upsert: true }
    );
    res.json(plan);
  } catch (err) {
    res.status(400).json({ success: false, error: { code: 'BAD_REQUEST', message: err.message } });
  }
});

// GET /api/monitoring/responses
router.get('/responses', authenticate, verifyOwnershipOrRole({ paramName: 'studentId' }), async (req, res) => {
  try {
    const MonitoringResponse = getModel('MonitoringResponse');
    let filter = {};
    if (req.user.role === 'STUDENT') {
      filter.studentId = req.user.studentId || req.user.id;
    } else if (req.query.studentId) {
      filter.studentId = req.query.studentId;
    }
    const responses = await MonitoringResponse.find(filter);
    res.json(responses);
  } catch (err) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
});

// POST /api/monitoring/responses (Student submits daily check)
router.post('/responses', authenticate, verifyOwnershipOrRole({ paramName: 'studentId' }), async (req, res) => {
  try {
    const MonitoringResponse = getModel('MonitoringResponse');
    const studentId = req.user.role === 'STUDENT' ? (req.user.studentId || req.user.id) : req.body.studentId;

    const response = await MonitoringResponse.create({
      ...req.body,
      studentId,
      createdAt: new Date().toISOString()
    });
    res.status(201).json(response);
  } catch (err) {
    res.status(400).json({ success: false, error: { code: 'BAD_REQUEST', message: err.message } });
  }
});

module.exports = router;
