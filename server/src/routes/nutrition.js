const router = require('express').Router();
const { getModel } = require('../models/provider');
const { authenticate, authorizeRoles, verifyOwnershipOrRole } = require('../middleware/rbac');

// GET /api/nutrition
router.get('/', authenticate, verifyOwnershipOrRole({ paramName: 'studentId' }), async (req, res) => {
  try {
    const NutritionPlan = getModel('NutritionPlan');
    let filter = {};
    if (req.user.role === 'STUDENT') {
      filter.studentId = req.user.studentId || req.user.id;
    } else if (req.query.studentId) {
      filter.studentId = req.query.studentId;
    }
    const plans = await NutritionPlan.find(filter);
    res.json(plans);
  } catch (err) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
});

// POST /api/nutrition (Clinician creates or updates approved plan)
router.post('/', authenticate, authorizeRoles('MEDICAL_STAFF', 'ADMIN'), async (req, res) => {
  try {
    const NutritionPlan = getModel('NutritionPlan');
    const plan = await NutritionPlan.create({
      ...req.body,
      approvedBy: req.user.name || 'Clinician',
      updatedAt: new Date().toISOString()
    });
    res.status(201).json(plan);
  } catch (err) {
    res.status(400).json({ success: false, error: { code: 'BAD_REQUEST', message: err.message } });
  }
});

module.exports = router;
