const router = require('express').Router();
const { authenticate, authorizeRoles } = require('../middleware/rbac');
const { validate } = require('../middleware/validate');
const {
  aiHealthQuestionSchema,
  aiNutritionQuerySchema,
  aiTrendQuerySchema,
  aiVisitDraftSchema
} = require('../schemas/validationSchemas');
const {
  askHealthAssistant,
  generateNutritionAssistantAdvice,
  explainVitalsTrends,
  draftVisitSummary
} = require('../services/aiService');
const { logAuditEvent } = require('../services/auditService');

// POST /api/ai/health-info — General healthcare education questions & terminology explanations
router.post(
  '/health-info',
  authenticate,
  validate({ body: aiHealthQuestionSchema }),
  async (req, res) => {
    try {
      const { question, context } = req.body;
      const result = await askHealthAssistant(question, context);

      await logAuditEvent(req, {
        action: 'AI_HEALTH_EDUCATION_QUERY',
        resourceType: 'AI_SERVICE',
        resource: 'HEALTH_INFO_ASSISTANT',
        details: `Query topic: ${question.slice(0, 100)} (source: ${result.source})`,
        sensitivity: 'LOW',
        outcome: 'SUCCESS'
      });

      return res.json({
        success: true,
        message: 'Educational explanation generated.',
        data: result
      });
    } catch (err) {
      return res.status(500).json({
        success: false,
        error: { code: 'AI_QUERY_ERROR', message: err.message }
      });
    }
  }
);

// POST /api/ai/nutrition-advice — Meal suggestions observing declared allergies & preferences
router.post(
  '/nutrition-advice',
  authenticate,
  authorizeRoles('STUDENT', 'MEDICAL_STAFF'),
  validate({ body: aiNutritionQuerySchema }),
  async (req, res) => {
    try {
      const { goal, allergies, preferences, currentBmi } = req.body;
      const result = await generateNutritionAssistantAdvice({
        goal,
        allergies,
        preferences,
        currentBmi
      });

      await logAuditEvent(req, {
        action: 'AI_NUTRITION_ADVICE_QUERY',
        resourceType: 'AI_SERVICE',
        resource: 'NUTRITION_ASSISTANT',
        details: `Goal: ${goal.slice(0, 80)} | Allergies: ${(allergies || []).join(', ') || 'None'} (source: ${result.source})`,
        sensitivity: 'LOW',
        outcome: 'SUCCESS'
      });

      return res.json({
        success: true,
        message: 'Nutrition guidance generated.',
        data: result
      });
    } catch (err) {
      return res.status(500).json({
        success: false,
        error: { code: 'AI_NUTRITION_ERROR', message: err.message }
      });
    }
  }
);

// POST /api/ai/trend-explanation — Explain vital changes with lifestyle context (informational only)
router.post(
  '/trend-explanation',
  authenticate,
  authorizeRoles('STUDENT', 'MEDICAL_STAFF'),
  validate({ body: aiTrendQuerySchema }),
  async (req, res) => {
    try {
      const { vitals } = req.body;
      const result = await explainVitalsTrends(vitals);

      await logAuditEvent(req, {
        action: 'AI_TREND_EXPLANATION_QUERY',
        resourceType: 'AI_SERVICE',
        resource: 'TREND_ASSISTANT',
        details: `Analyzed ${vitals.length} measurements (source: ${result.source})`,
        sensitivity: 'LOW',
        outcome: 'SUCCESS'
      });

      return res.json({
        success: true,
        message: 'Vital trend explanation generated.',
        data: result
      });
    } catch (err) {
      return res.status(500).json({
        success: false,
        error: { code: 'AI_TREND_ERROR', message: err.message }
      });
    }
  }
);

// POST /api/ai/visit-summary-draft — Help clinicians draft structured consultation summaries
router.post(
  '/visit-summary-draft',
  authenticate,
  authorizeRoles('MEDICAL_STAFF'),
  validate({ body: aiVisitDraftSchema }),
  async (req, res) => {
    try {
      const { chiefComplaint, diagnosis, vitals, clinicalNotes } = req.body;
      const result = await draftVisitSummary({
        chiefComplaint,
        diagnosis,
        vitals,
        clinicalNotes
      });

      await logAuditEvent(req, {
        action: 'AI_VISIT_SUMMARY_DRAFT',
        resourceType: 'AI_SERVICE',
        resource: 'VISIT_SUMMARY_ASSISTANT',
        details: `Drafted summary for diagnosis: ${diagnosis.slice(0, 80)} (source: ${result.source})`,
        sensitivity: 'MEDIUM',
        outcome: 'SUCCESS'
      });

      return res.json({
        success: true,
        message: 'Clinical visit summary draft generated for clinician review.',
        data: result
      });
    } catch (err) {
      return res.status(500).json({
        success: false,
        error: { code: 'AI_DRAFT_ERROR', message: err.message }
      });
    }
  }
);

module.exports = router;
