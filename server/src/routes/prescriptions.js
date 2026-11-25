const router = require('express').Router();
const { getModel } = require('../models/provider');
const { authenticate, authorizeRoles, verifyOwnershipOrRole } = require('../middleware/rbac');
const { validate } = require('../middleware/validate');
const { createPrescriptionSchema, updatePrescriptionSchema } = require('../schemas/validationSchemas');
const { computeStockStatus, calculateDeductQuantity, matchMedicine } = require('../utils/medicineHelper');
const { logAuditEvent } = require('../services/auditService');
const { withTransaction } = require('../db');
const { findByIdentifier, updateByIdentifier, toPlain } = require('../utils/dbHelpers');

// GET /api/prescriptions (Students only see their own; MEDICAL_STAFF sees filtered or paginated)
router.get(
  '/',
  authenticate,
  verifyOwnershipOrRole({ paramName: 'studentId', allowedElevatedRoles: ['MEDICAL_STAFF'] }),
  async (req, res) => {
    try {
      const Prescription = getModel('Prescription');
      const filter = {};
      if (req.user.role === 'STUDENT') {
        filter.studentId = req.user.studentId || req.user.id;
      } else if (req.query.studentId) {
        filter.studentId = String(req.query.studentId);
      }

      const page = Math.max(1, parseInt(req.query.page, 10) || 1);
      const limit = Math.min(200, Math.max(1, parseInt(req.query.limit, 10) || 100));

      const prescriptions = await Prescription.find(filter);
      const total = prescriptions.length;
      const paginated = prescriptions.slice((page - 1) * limit, page * limit);

      return res.json({
        success: true,
        message: 'Prescriptions retrieved.',
        data: paginated,
        pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) }
      });
    } catch (err) {
      return res.status(500).json({
        success: false,
        error: { code: 'PRESCRIPTION_FETCH_ERROR', message: err.message }
      });
    }
  }
);

async function deductInventoryForItems(items, session = null) {
  if (!Array.isArray(items) || items.length === 0) return [];
  const MedicineInventory = getModel('MedicineInventory');
  if (!MedicineInventory) return [];

  const allMeds = await MedicineInventory.find({}, null, session ? { session } : {});
  const deductedSummary = [];

  for (const it of items) {
    const med = matchMedicine(allMeds, it.medicineName || it.name);
    if (!med) continue;

    const deductQty = calculateDeductQuantity(it);
    const currentQty = Number(med.quantity) || 0;
    const newQty = Math.max(0, currentQty - deductQty);
    const status = computeStockStatus(newQty);

    const updateOptions = session ? { session, new: true } : { new: true };
    await updateByIdentifier(
      MedicineInventory,
      med._id || med.id,
      {
        quantity: newQty,
        status,
        updatedAt: new Date().toISOString()
      },
      updateOptions
    );
    med.quantity = newQty;
    med.status = status;
    deductedSummary.push({ name: med.name, deducted: deductQty, remaining: newQty });
  }
  return deductedSummary;
}

// POST /api/prescriptions (Strictly MEDICAL_STAFF only)
router.post('/', authenticate, authorizeRoles('MEDICAL_STAFF'), validate({ body: createPrescriptionSchema }), async (req, res) => {
  try {
    const Prescription = getModel('Prescription');
    const StudentProfile = getModel('StudentProfile');
    const { studentId, diagnosis, followUpDate, notes, items } = req.body;

    const student = StudentProfile ? await StudentProfile.findOne({ studentId }) : null;
    if (!student) {
      return res.status(404).json({
        success: false,
        error: { code: 'STUDENT_NOT_FOUND', message: `No student found with ID '${studentId}'.` }
      });
    }

    const doctorName = req.user.name || 'Campus Physician';
    const rxId = `rx_${Date.now()}`;
    const normalizedItems = items.map((it, i) => ({
      id: it.id || `item_${Date.now()}_${i}`,
      medicineName: it.medicineName,
      dosage: it.dosage,
      frequency: it.frequency,
      durationDays: it.durationDays,
      quantity: calculateDeductQuantity(it),
      instructions: it.instructions || ''
    }));

    const initialVersion = {
      version: 1,
      prescriptionId: rxId,
      createdAt: new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      createdByDoctor: doctorName,
      status: 'ACTIVE',
      diagnosis,
      followUpDate,
      notes,
      items: normalizedItems
    };

    const rx = await withTransaction(async (session) => {
      const rxDoc = {
        id: rxId,
        studentId,
        doctorName,
        diagnosis,
        createdAt: new Date().toISOString().split('T')[0],
        status: 'ACTIVE',
        followUpDate,
        currentVersion: initialVersion,
        history: [initialVersion],
        createdByUserId: req.user.id
      };

      const created = session && Prescription.create
        ? (await Prescription.create([rxDoc], { session }))[0]
        : await Prescription.create(rxDoc);

      await deductInventoryForItems(normalizedItems, session);
      return created;
    });

    await logAuditEvent(req, {
      action: 'CREATE_PRESCRIPTION_V1',
      resourceType: 'PRESCRIPTION',
      resource: String(rx._id || rx.id),
      details: `Issued v1 prescription (${normalizedItems.length} item(s)) for ${studentId}`,
      sensitivity: 'HIGH',
      outcome: 'SUCCESS'
    });

    return res.status(201).json({
      success: true,
      message: 'Prescription v1 created successfully.',
      data: rx
    });
  } catch (err) {
    return res.status(400).json({
      success: false,
      error: { code: 'PRESCRIPTION_CREATE_ERROR', message: err.message }
    });
  }
});

// PUT /api/prescriptions/:id (Strictly MEDICAL_STAFF; immutable append-only version history)
router.put('/:id', authenticate, authorizeRoles('MEDICAL_STAFF'), validate({ body: updatePrescriptionSchema }), async (req, res) => {
  try {
    const Prescription = getModel('Prescription');
    const existing = await findByIdentifier(Prescription, req.params.id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: { code: 'PRESCRIPTION_NOT_FOUND', message: 'Prescription not found.' }
      });
    }

    const { changeReason, diagnosis, followUpDate, notes, items } = req.body;
    const doctorName = req.user.name || 'Campus Physician';
    const currentVersionNumber = Number(existing.currentVersion?.version || 1);
    const nextVersionNumber = currentVersionNumber + 1;

    const normalizedItems = items.map((it, i) => ({
      id: it.id || `item_${Date.now()}_${i}`,
      medicineName: it.medicineName,
      dosage: it.dosage,
      frequency: it.frequency,
      durationDays: it.durationDays,
      quantity: calculateDeductQuantity(it),
      instructions: it.instructions || ''
    }));

    const newVersion = {
      version: nextVersionNumber,
      prescriptionId: String(existing.id || existing._id),
      createdAt: new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      createdByDoctor: doctorName,
      status: 'ACTIVE',
      diagnosis: diagnosis || existing.diagnosis || existing.currentVersion?.diagnosis,
      followUpDate: followUpDate || existing.followUpDate,
      notes: notes || existing.currentVersion?.notes,
      changeReason,
      items: normalizedItems
    };

    const preservedHistory = Array.isArray(existing.history)
      ? existing.history.map((h) => ({ ...(typeof h?.toObject === 'function' ? h.toObject() : toPlain(h)), status: 'MODIFIED' }))
      : [];

    const updated = await withTransaction(async (session) => {
      const updateOptions = session ? { session, new: true } : { new: true };
      const resDoc = await updateByIdentifier(
        Prescription,
        existing._id || existing.id,
        {
          status: 'MODIFIED',
          diagnosis: newVersion.diagnosis,
          followUpDate: newVersion.followUpDate,
          currentVersion: newVersion,
          history: [newVersion, ...preservedHistory]
        },
        updateOptions
      );
      await deductInventoryForItems(normalizedItems, session);
      return resDoc;
    });

    await logAuditEvent(req, {
      action: `UPDATE_PRESCRIPTION_V${nextVersionNumber}`,
      resourceType: 'PRESCRIPTION',
      resource: String(existing._id || existing.id),
      details: `Issued version ${nextVersionNumber} for ${existing.studentId} (Reason: ${changeReason})`,
      sensitivity: 'HIGH',
      outcome: 'SUCCESS'
    });

    return res.json({
      success: true,
      message: `Prescription version ${nextVersionNumber} issued successfully.`,
      data: updated
    });
  } catch (err) {
    return res.status(400).json({
      success: false,
      error: { code: 'PRESCRIPTION_UPDATE_ERROR', message: err.message }
    });
  }
});

module.exports = router;
