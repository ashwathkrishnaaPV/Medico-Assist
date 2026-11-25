const router = require('express').Router();
const { getModel } = require('../models/provider');
const { authenticate, authorizeRoles, verifyOwnershipOrRole } = require('../middleware/rbac');
const { validate } = require('../middleware/validate');
const {
  createMonitoringPlanSchema,
  updateMonitoringPlanSchema,
  createMonitoringResponseSchema
} = require('../schemas/validationSchemas');
const { logAuditEvent } = require('../services/auditService');
const { findByIdentifier, updateByIdentifier } = require('../utils/dbHelpers');

// Helper to calculate and synchronize currentDay based on recorded responses
async function syncPlanProgress(plan) {
  if (!plan) return plan;
  try {
    const MonitoringResponse = getModel('MonitoringResponse');
    const studentId = plan.studentId;
    const responses = await MonitoringResponse.find({ studentId });
    const uniqueDates = Array.from(new Set((responses || []).map((r) => r.date).filter(Boolean)));
    const todayStr = new Date().toISOString().split('T')[0];
    const submittedToday = (responses || []).some((r) => r.date === todayStr);

    const duration = plan.durationDays || 3;
    const calculatedDay = submittedToday
      ? Math.min(Math.max(uniqueDates.length, 1), duration)
      : Math.min(uniqueDates.length + 1, duration);

    if (plan.currentDay !== calculatedDay) {
      const MonitoringPlan = getModel('MonitoringPlan');
      const planId = plan._id || plan.id;
      if (planId) {
        await updateByIdentifier(MonitoringPlan, planId, { currentDay: calculatedDay });
      } else {
        await MonitoringPlan.findOneAndUpdate({ studentId }, { currentDay: calculatedDay });
      }
      plan.currentDay = calculatedDay;
    }
  } catch (err) {
    console.error('Error syncing plan progress:', err);
  }
  return plan;
}

// GET /api/monitoring/plans
const getPlansHandler = async (req, res) => {
  try {
    const MonitoringPlan = getModel('MonitoringPlan');
    const filter = {};
    if (req.user.role === 'STUDENT') {
      filter.studentId = req.user.studentId || req.user.id;
    } else if (req.query.studentId) {
      filter.studentId = String(req.query.studentId);
    }

    const plans = await MonitoringPlan.find(filter);
    for (const plan of plans) {
      await syncPlanProgress(plan);
    }

    return res.json({
      success: true,
      message: 'Monitoring plans retrieved.',
      data: plans
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: { code: 'MONITORING_FETCH_ERROR', message: err.message }
    });
  }
};

router.get('/', authenticate, verifyOwnershipOrRole({ paramName: 'studentId' }), getPlansHandler);
router.get('/plans', authenticate, verifyOwnershipOrRole({ paramName: 'studentId' }), getPlansHandler);

// POST /api/monitoring/plans (Clinician only)
router.post(
  '/plans',
  authenticate,
  authorizeRoles('MEDICAL_STAFF'),
  validate({ body: createMonitoringPlanSchema }),
  async (req, res) => {
    try {
      const MonitoringPlan = getModel('MonitoringPlan');
      const { studentId, conditionName, durationDays, startDate, active } = req.body;

      const plan = await MonitoringPlan.findOneAndUpdate(
        { studentId },
        {
          studentId,
          conditionName,
          durationDays: durationDays || 3,
          startDate: startDate || new Date().toISOString().split('T')[0],
          active: active !== false,
          currentDay: 1,
          createdBy: req.user.name || 'Medical Staff',
          updatedAt: new Date().toISOString()
        },
        { new: true, upsert: true }
      );

      await syncPlanProgress(plan);

      await logAuditEvent(req, {
        action: 'CREATE_MONITORING_PLAN',
        resourceType: 'MONITORING_PLAN',
        resource: studentId,
        details: `Active monitoring started for condition '${conditionName}' (${durationDays} days)`,
        sensitivity: 'MEDIUM',
        outcome: 'SUCCESS'
      });

      return res.status(201).json({
        success: true,
        message: 'Monitoring plan established.',
        data: plan
      });
    } catch (err) {
      return res.status(400).json({
        success: false,
        error: { code: 'PLAN_CREATE_ERROR', message: err.message }
      });
    }
  }
);

// PUT /api/monitoring/plans/:id (Clinician only)
router.put(
  '/plans/:id',
  authenticate,
  authorizeRoles('MEDICAL_STAFF'),
  validate({ body: updateMonitoringPlanSchema }),
  async (req, res) => {
    try {
      const MonitoringPlan = getModel('MonitoringPlan');
      const target = await findByIdentifier(MonitoringPlan, req.params.id);
      if (!target) {
        return res.status(404).json({
          success: false,
          error: { code: 'PLAN_NOT_FOUND', message: 'Monitoring plan not found.' }
        });
      }

      const updated = await updateByIdentifier(
        MonitoringPlan,
        target._id || target.id,
        { ...req.body, updatedAt: new Date().toISOString() },
        { new: true }
      );

      return res.json({
        success: true,
        message: 'Monitoring plan updated.',
        data: updated
      });
    } catch (err) {
      return res.status(400).json({
        success: false,
        error: { code: 'PLAN_UPDATE_ERROR', message: err.message }
      });
    }
  }
);

// GET /api/monitoring/responses
router.get(
  '/responses',
  authenticate,
  verifyOwnershipOrRole({ paramName: 'studentId' }),
  async (req, res) => {
    try {
      const MonitoringResponse = getModel('MonitoringResponse');
      const filter = {};
      if (req.user.role === 'STUDENT') {
        filter.studentId = req.user.studentId || req.user.id;
      } else if (req.query.studentId) {
        filter.studentId = String(req.query.studentId);
      }

      const responses = await MonitoringResponse.find(filter);
      return res.json({
        success: true,
        message: 'Monitoring responses retrieved.',
        data: responses
      });
    } catch (err) {
      return res.status(500).json({
        success: false,
        error: { code: 'RESPONSES_FETCH_ERROR', message: err.message }
      });
    }
  }
);

// POST /api/monitoring/responses (Student submits daily check)
router.post(
  '/responses',
  authenticate,
  verifyOwnershipOrRole({ paramName: 'studentId' }),
  validate({ body: createMonitoringResponseSchema }),
  async (req, res) => {
    try {
      const MonitoringResponse = getModel('MonitoringResponse');
      const studentId = req.user.role === 'STUDENT'
        ? (req.user.studentId || req.user.id)
        : req.body.studentId;

      const response = await MonitoringResponse.create({
        ...req.body,
        studentId,
        createdAt: new Date().toISOString()
      });

      // Update monitoring plan progress
      const MonitoringPlan = getModel('MonitoringPlan');
      const plan = await MonitoringPlan.findOne({ studentId, active: true });
      if (plan) {
        await syncPlanProgress(plan);
      }

      await logAuditEvent(req, {
        action: 'SUBMIT_DAILY_CHECK',
        resourceType: 'MONITORING_RESPONSE',
        resource: studentId,
        details: `Daily check submitted (Feeling: ${req.body.feeling})`,
        sensitivity: 'LOW',
        outcome: 'SUCCESS'
      });

      return res.status(201).json({
        success: true,
        message: 'Daily health response recorded.',
        data: response
      });
    } catch (err) {
      return res.status(400).json({
        success: false,
        error: { code: 'RESPONSE_SUBMIT_ERROR', message: err.message }
      });
    }
  }
);

module.exports = router;
