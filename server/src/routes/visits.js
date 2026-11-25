const router = require('express').Router();
const { getModel } = require('../models/provider');
const { authenticate, authorizeRoles, verifyOwnershipOrRole } = require('../middleware/rbac');
const { validate } = require('../middleware/validate');
const { createVisitSchema } = require('../schemas/validationSchemas');
const { logAuditEvent } = require('../services/auditService');

// GET /api/visits (STUDENT sees own; MEDICAL_STAFF sees filtered or paginated all; ADMIN excluded)
router.get(
  '/',
  authenticate,
  verifyOwnershipOrRole({ paramName: 'studentId', allowedElevatedRoles: ['MEDICAL_STAFF'] }),
  async (req, res) => {
    try {
      const MedicalVisit = getModel('MedicalVisit');
      const filter = {};
      if (req.user.role === 'STUDENT') {
        filter.studentId = req.user.studentId || req.user.id;
      } else if (req.query.studentId) {
        filter.studentId = String(req.query.studentId);
      }

      const page = Math.max(1, parseInt(req.query.page, 10) || 1);
      const limit = Math.min(200, Math.max(1, parseInt(req.query.limit, 10) || 100));

      const allVisits = await MedicalVisit.find(filter);
      const sorted = [...allVisits].sort((a, b) => String(b.visitDate || '').localeCompare(String(a.visitDate || '')));
      const total = sorted.length;
      const paginated = sorted.slice((page - 1) * limit, page * limit);

      return res.json({
        success: true,
        message: 'Medical visits retrieved.',
        data: paginated,
        pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) }
      });
    } catch (err) {
      return res.status(500).json({
        success: false,
        error: { code: 'VISITS_FETCH_ERROR', message: err.message }
      });
    }
  }
);

// POST /api/visits (Strictly MEDICAL_STAFF clinicians only)
router.post('/', authenticate, authorizeRoles('MEDICAL_STAFF'), validate({ body: createVisitSchema }), async (req, res) => {
  try {
    const MedicalVisit = getModel('MedicalVisit');
    const StudentProfile = getModel('StudentProfile');
    const {
      studentId,
      studentName,
      visitType,
      visitDate,
      time,
      chiefComplaint,
      diagnosis,
      clinicalNotes,
      vitals,
      prescriptionId,
      nutritionPlanId,
      monitoringPlanActive,
      status
    } = req.body;

    const studentProfile = StudentProfile ? await StudentProfile.findOne({ studentId }) : null;
    if (!studentProfile) {
      return res.status(404).json({
        success: false,
        error: { code: 'STUDENT_NOT_FOUND', message: `No registered student profile found for '${studentId}'.` }
      });
    }

    const h = Number(vitals?.heightCm) || 0;
    const w = Number(vitals?.weightKg) || 0;
    const computedBmi = h >= 50 && w >= 15
      ? parseFloat((w / ((h / 100) * (h / 100))).toFixed(1))
      : vitals?.bmi;

    const doctorName = req.user.name || 'Campus Physician';
    const visit = await MedicalVisit.create({
      studentId,
      studentName: studentName || studentProfile.name,
      visitType,
      visitDate,
      time: time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      doctorName,
      chiefComplaint,
      diagnosis,
      clinicalNotes: clinicalNotes || '',
      vitals: {
        ...vitals,
        bmi: computedBmi,
        recordedAt: vitals?.recordedAt || new Date().toISOString(),
        recordedBy: doctorName
      },
      prescriptionId,
      nutritionPlanId,
      monitoringPlanActive: Boolean(monitoringPlanActive),
      status: status || 'Completed',
      createdByUserId: req.user.id
    });

    await logAuditEvent(req, {
      action: 'CREATE_MEDICAL_VISIT',
      resourceType: 'MEDICAL_VISIT',
      resource: studentId,
      details: `Clinical consultation recorded (${visitType})`,
      sensitivity: 'HIGH',
      outcome: 'SUCCESS'
    });

    return res.status(201).json({
      success: true,
      message: 'Medical visit created successfully.',
      data: visit
    });
  } catch (err) {
    return res.status(400).json({
      success: false,
      error: { code: 'VISIT_CREATE_ERROR', message: err.message }
    });
  }
});

module.exports = router;
