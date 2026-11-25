const router = require('express').Router();
const { getModel } = require('../models/provider');
const { authenticate, authorizeRoles, verifyOwnershipOrRole } = require('../middleware/rbac');
const { validate } = require('../middleware/validate');
const { saveNutritionSchema } = require('../schemas/validationSchemas');
const { logAuditEvent } = require('../services/auditService');

// GET /api/nutrition (STUDENT sees own; MEDICAL_STAFF sees filtered or all)
router.get(
  '/',
  authenticate,
  verifyOwnershipOrRole({ paramName: 'studentId', allowedElevatedRoles: ['MEDICAL_STAFF'] }),
  async (req, res) => {
    try {
      const NutritionPlan = getModel('NutritionPlan');
      const filter = {};
      if (req.user.role === 'STUDENT') {
        filter.studentId = req.user.studentId || req.user.id;
      } else if (req.query.studentId) {
        filter.studentId = String(req.query.studentId);
      }
      const plans = await NutritionPlan.find(filter);
      return res.json({
        success: true,
        message: 'Nutrition plans retrieved.',
        data: plans
      });
    } catch (err) {
      return res.status(500).json({
        success: false,
        error: { code: 'NUTRITION_FETCH_ERROR', message: err.message }
      });
    }
  }
);

// POST /api/nutrition (Strictly MEDICAL_STAFF; upserts student's active plan cleanly)
router.post('/', authenticate, authorizeRoles('MEDICAL_STAFF'), validate({ body: saveNutritionSchema }), async (req, res) => {
  try {
    const NutritionPlan = getModel('NutritionPlan');
    const doctorName = req.user.name || 'Clinician';
    const {
      id,
      studentId,
      studentName,
      goal,
      aiSuggested,
      doctorApproved,
      reviewDate,
      targetCalories,
      proteinG,
      carbsG,
      fatG,
      meals,
      foodsToLimit,
      encouragingNotes,
      notes
    } = req.body;

    const payload = {
      id: id || `nut_${Date.now()}`,
      studentId,
      studentName,
      doctorName,
      goal,
      aiSuggested: Boolean(aiSuggested),
      doctorApproved: Boolean(doctorApproved),
      approvedBy: doctorApproved ? doctorName : undefined,
      approvedAt: doctorApproved ? new Date().toISOString() : undefined,
      reviewDate: reviewDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      targetCalories,
      proteinG,
      carbsG,
      fatG,
      meals,
      foodsToLimit: foodsToLimit || [],
      encouragingNotes: encouragingNotes || '',
      notes: notes || '',
      active: true,
      updatedAt: new Date().toISOString()
    };

    const plan = await NutritionPlan.findOneAndUpdate(
      { studentId },
      payload,
      { new: true, upsert: true }
    );

    await logAuditEvent(req, {
      action: doctorApproved ? 'APPROVE_NUTRITION_PLAN' : 'SAVE_NUTRITION_PLAN',
      resourceType: 'NUTRITION_PLAN',
      resource: studentId,
      details: `Saved nutrition plan for ${studentId}`,
      sensitivity: 'MEDIUM',
      outcome: 'SUCCESS'
    });

    return res.status(201).json({
      success: true,
      message: 'Nutrition plan saved successfully.',
      data: plan
    });
  } catch (err) {
    return res.status(400).json({
      success: false,
      error: { code: 'NUTRITION_SAVE_ERROR', message: err.message }
    });
  }
});

module.exports = router;
