const router = require('express').Router();
const bcrypt = require('bcryptjs');
const { getModel } = require('../models/provider');
const { authenticate, authorizeRoles, verifyOwnershipOrRole } = require('../middleware/rbac');
const { validate } = require('../middleware/validate');
const {
  studentProfileSelfUpdateSchema,
  clinicianProfileUpdateSchema,
  adminCreateUserSchema
} = require('../schemas/validationSchemas');
const { logAuditEvent } = require('../services/auditService');

function toAdminRosterSummary(profile) {
  return {
    id: String(profile._id || profile.id || profile.studentId),
    studentId: profile.studentId,
    name: profile.name,
    email: profile.email,
    department: profile.department,
    year: profile.year,
    ugOrPg: profile.ugOrPg,
    accommodation: profile.accommodation,
    emergencyContact: profile.emergencyContact
      ? {
          name: profile.emergencyContact.name || '',
          relation: profile.emergencyContact.relation || '',
          phone: profile.emergencyContact.phone || ''
        }
      : { name: '', relation: '', phone: '' },
    profileComplete: Boolean(profile.profileComplete),
    lastUpdated: profile.lastUpdated
  };
}

function computeBmi(heightCm, weightKg, fallbackBmi = 0) {
  const h = Number(heightCm) || 0;
  const w = Number(weightKg) || 0;
  if (h >= 50 && w >= 15) {
    return parseFloat((w / ((h / 100) * (h / 100))).toFixed(1));
  }
  return fallbackBmi;
}

// GET /api/profiles — Scoped strictly by verified role & ownership
router.get('/', authenticate, async (req, res) => {
  try {
    const StudentProfile = getModel('StudentProfile');
    const role = req.user.role;

    if (role === 'STUDENT') {
      const studentId = req.user.studentId;
      if (!studentId) {
        return res.json({ success: true, message: 'No profile linked.', data: [] });
      }
      const profile = await StudentProfile.findOne({ studentId });
      return res.json({
        success: true,
        message: 'Student profile retrieved.',
        data: profile ? [profile] : []
      });
    }

    if (role === 'MEDICAL_STAFF' || role === 'ADMIN') {
      const page = Math.max(1, parseInt(req.query.page, 10) || 1);
      const limit = Math.min(200, Math.max(1, parseInt(req.query.limit, 10) || 100));
      const search = req.query.search ? String(req.query.search).trim().toLowerCase() : '';

      let profiles = await StudentProfile.find({});
      if (search) {
        profiles = profiles.filter((p) =>
          (p.name || '').toLowerCase().includes(search) ||
          (p.studentId || '').toLowerCase().includes(search) ||
          (p.department || '').toLowerCase().includes(search) ||
          (p.email || '').toLowerCase().includes(search)
        );
      }

      const total = profiles.length;
      const sliced = profiles.slice((page - 1) * limit, page * limit);
      const payload = role === 'ADMIN' ? sliced.map(toAdminRosterSummary) : sliced;

      return res.json({
        success: true,
        message: role === 'ADMIN' ? 'Non-clinical student roster retrieved.' : 'Clinical profiles retrieved.',
        data: payload,
        pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) }
      });
    }

    return res.status(403).json({
      success: false,
      error: { code: 'FORBIDDEN', message: 'Access denied for this role.' }
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: { code: 'PROFILE_FETCH_ERROR', message: err.message }
    });
  }
});

// GET /api/profiles/:studentId — Clinical detail (MEDICAL_STAFF + own STUDENT only; ADMIN excluded)
router.get(
  '/:studentId',
  authenticate,
  verifyOwnershipOrRole({ paramName: 'studentId', allowedElevatedRoles: ['MEDICAL_STAFF'] }),
  async (req, res) => {
    try {
      const StudentProfile = getModel('StudentProfile');
      const profile = await StudentProfile.findOne({ studentId: req.params.studentId });
      if (!profile) {
        return res.status(404).json({
          success: false,
          error: { code: 'PROFILE_NOT_FOUND', message: 'No student medical profile found for this ID.' }
        });
      }
      return res.json({
        success: true,
        message: 'Student profile retrieved.',
        data: profile
      });
    } catch (err) {
      return res.status(500).json({
        success: false,
        error: { code: 'PROFILE_FETCH_ERROR', message: err.message }
      });
    }
  }
);

// PUT /api/profiles/me — Student updates strictly permitted demographic & self-reported onboarding fields
router.put('/me', authenticate, authorizeRoles('STUDENT'), validate({ body: studentProfileSelfUpdateSchema }), async (req, res) => {
  try {
    const StudentProfile = getModel('StudentProfile');
    const ownStudentId = req.user.studentId;
    if (!ownStudentId) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_STUDENT_ID', message: 'Authenticated student identity lacks a studentId.' }
      });
    }

    const existing = await StudentProfile.findOne({ studentId: ownStudentId });
    const incoming = req.body;
    const nextHeight = incoming.heightCm ?? existing?.heightCm ?? 0;
    const nextWeight = incoming.weightKg ?? existing?.weightKg ?? 0;
    const bmi = computeBmi(nextHeight, nextWeight, existing?.bmi || 0);

    const safeUpdates = {
      studentId: ownStudentId,
      name: existing?.name || req.user.name,
      email: existing?.email || req.user.email,
      ...(incoming.year !== undefined && { year: incoming.year }),
      ...(incoming.ugOrPg !== undefined && { ugOrPg: incoming.ugOrPg }),
      ...(incoming.accommodation !== undefined && { accommodation: incoming.accommodation }),
      ...(incoming.hostelBlock !== undefined && { hostelBlock: incoming.hostelBlock }),
      ...(incoming.hostelRoom !== undefined && { hostelRoom: incoming.hostelRoom }),
      ...(incoming.phone !== undefined && { phone: incoming.phone }),
      ...(incoming.heightCm !== undefined && { heightCm: incoming.heightCm }),
      ...(incoming.weightKg !== undefined && { weightKg: incoming.weightKg }),
      ...(incoming.bloodGroup !== undefined && { bloodGroup: incoming.bloodGroup }),
      ...(incoming.dob !== undefined && { dob: incoming.dob }),
      ...(incoming.gender !== undefined && { gender: incoming.gender }),
      ...(incoming.emergencyContact !== undefined && { emergencyContact: incoming.emergencyContact }),
      ...(incoming.profileComplete !== undefined && { profileComplete: incoming.profileComplete }),
      bmi,
      lastUpdated: new Date().toISOString().split('T')[0]
    };

    const updated = await StudentProfile.findOneAndUpdate(
      { studentId: ownStudentId },
      safeUpdates,
      { new: true, upsert: true }
    );

    await logAuditEvent(req, {
      action: 'STUDENT_UPDATE_OWN_PROFILE',
      resourceType: 'STUDENT_PROFILE',
      resource: ownStudentId,
      details: 'Student updated permitted profile fields',
      sensitivity: 'LOW',
      outcome: 'SUCCESS'
    });

    return res.json({
      success: true,
      message: 'Profile updated successfully.',
      data: updated
    });
  } catch (err) {
    return res.status(400).json({
      success: false,
      error: { code: 'PROFILE_UPDATE_ERROR', message: err.message }
    });
  }
});

// POST /api/profiles — Clinician creates/updates patient profile; Student restricted to safe fields & own ID
router.post('/', authenticate, verifyOwnershipOrRole({ paramName: 'studentId', allowedElevatedRoles: ['MEDICAL_STAFF'] }), async (req, res) => {
  try {
    const StudentProfile = getModel('StudentProfile');
    const isClinician = req.user.role === 'MEDICAL_STAFF';
    const schema = isClinician ? clinicianProfileUpdateSchema : studentProfileSelfUpdateSchema;

    // For student legacy payloads during onboarding, allow only strict fields
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: parsed.error.issues[0]?.message || 'Invalid or unauthorized profile fields submitted.',
          details: parsed.error.issues
        }
      });
    }

    const data = parsed.data;
    const targetStudentId = isClinician ? data.studentId : req.user.studentId;
    if (!targetStudentId) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_INPUT', message: 'Student ID is required.' }
      });
    }

    const existing = await StudentProfile.findOne({ studentId: targetStudentId });
    const bmi = computeBmi(data.heightCm ?? existing?.heightCm, data.weightKg ?? existing?.weightKg, existing?.bmi || 0);

    const updatedProfile = await StudentProfile.findOneAndUpdate(
      { studentId: targetStudentId },
      {
        $set: {
          ...data,
          studentId: targetStudentId,
          bmi,
          lastUpdated: new Date().toISOString().split('T')[0]
        }
      },
      { new: true, upsert: true }
    );

    await logAuditEvent(req, {
      action: isClinician ? 'CLINICIAN_SAVE_PROFILE' : 'STUDENT_SAVE_PROFILE',
      resourceType: 'STUDENT_PROFILE',
      resource: targetStudentId,
      details: `Updated medical profile (${targetStudentId})`,
      sensitivity: isClinician ? 'MEDIUM' : 'LOW',
      outcome: 'SUCCESS'
    });

    return res.json({
      success: true,
      message: 'Medical profile saved successfully.',
      data: updatedProfile
    });
  } catch (err) {
    return res.status(400).json({
      success: false,
      error: { code: 'PROFILE_SAVE_ERROR', message: err.message }
    });
  }
});

// POST /api/profiles/clinician-create-student — Allows MEDICAL_STAFF/ADMIN to create a student account + profile without mutating active session cookies
router.post('/create-student', authenticate, authorizeRoles('MEDICAL_STAFF', 'ADMIN'), async (req, res) => {
  try {
    const schema = adminCreateUserSchema.omit({ role: true }).extend({
      studentId: adminCreateUserSchema.shape.studentId.optional(),
      bloodGroup: clinicianProfileUpdateSchema.shape.bloodGroup.optional(),
      gender: clinicianProfileUpdateSchema.shape.gender.optional()
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: parsed.error.issues[0]?.message || 'Invalid student registration payload.',
          details: parsed.error.issues
        }
      });
    }

    const User = getModel('User');
    const StudentProfile = getModel('StudentProfile');
    const d = parsed.data;
    const normalizedEmail = d.email.toLowerCase().trim();
    const assignedId = d.studentId ? d.studentId.toUpperCase() : `STU_${Date.now().toString().slice(-6)}`;

    const dup = (await User.findOne({ email: normalizedEmail })) || (await StudentProfile.findOne({ studentId: assignedId }));
    if (dup) {
      return res.status(409).json({
        success: false,
        error: { code: 'DUPLICATE_STUDENT', message: 'A student with this email or ID already exists.' }
      });
    }

    const hashedPassword = await bcrypt.hash(d.password, 10);
    const createdUser = await User.create({
      name: d.name,
      email: normalizedEmail,
      password: hashedPassword,
      role: 'STUDENT',
      studentId: assignedId,
      department: d.department || 'General',
      phone: d.phone,
      active: true,
      tokenVersion: 0
    });

    const profile = await StudentProfile.create({
      studentId: assignedId,
      userId: String(createdUser._id || createdUser.id),
      name: d.name,
      email: normalizedEmail,
      gender: d.gender || 'Male',
      department: d.department || 'General',
      year: '1st Year',
      ugOrPg: 'UG',
      accommodation: 'Day Scholar',
      phone: d.phone || '',
      bloodGroup: d.bloodGroup || '',
      emergencyContact: { name: '', relation: 'Parent', phone: d.phone || '' },
      medicalCentreContact: '+91-44-2257-0000',
      criticalAllergies: [],
      criticalConditions: [],
      criticalMedications: [],
      heightCm: 0,
      weightKg: 0,
      bmi: 0,
      lastUpdated: new Date().toISOString().split('T')[0],
      profileComplete: false
    });

    await logAuditEvent(req, {
      action: 'STAFF_CREATED_STUDENT_RECORD',
      resourceType: 'STUDENT_PROFILE',
      resource: assignedId,
      details: `Created student roster account (${assignedId})`,
      sensitivity: 'MEDIUM',
      outcome: 'SUCCESS'
    });

    return res.status(201).json({
      success: true,
      message: 'Student account and profile created successfully.',
      data: profile
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: { code: 'STUDENT_CREATE_ERROR', message: err.message }
    });
  }
});

module.exports = router;
