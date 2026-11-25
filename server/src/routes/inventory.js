const router = require('express').Router();
const path = require('path');
const fs = require('fs');
const { getModel } = require('../models/provider');
const { authenticate, authorizeRoles } = require('../middleware/rbac');
const { validate } = require('../middleware/validate');
const {
  updateInventorySchema,
  bulkInventorySchema,
  deductInventorySchema
} = require('../schemas/validationSchemas');
const {
  computeStockStatus,
  matchMedicine
} = require('../utils/medicineHelper');
const { logAuditEvent } = require('../services/auditService');
const { findByIdentifier, updateByIdentifier, toPlain } = require('../utils/dbHelpers');

// Auto-seed inventory from catalog if database table is empty
async function ensureInventoryPopulated() {
  try {
    const MedicineInventory = getModel('MedicineInventory');
    const existing = await MedicineInventory.find({});
    if (existing && existing.length > 0) {
      return existing;
    }

    const catalogPath = path.join(__dirname, '../../data/medicine_catalog.json');
    if (!fs.existsSync(catalogPath)) {
      return [];
    }

    const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
    const createdList = [];
    for (const item of catalog) {
      let initialQty = 120;
      if (item.id === 1) initialQty = 85;
      else if (item.id === 3) initialQty = 25;
      else if (item.id === 8) initialQty = 8;
      else if (item.id === 15) initialQty = 30;
      else if (item.id === 22) initialQty = 4;
      else if (item.id === 50) initialQty = 18;
      else if (item.id === 75) initialQty = 6;

      const status = computeStockStatus(initialQty);
      const stockDoc = {
        id: `med_${item.id}`,
        catalogId: item.id,
        name: item.name,
        generic: item.generic,
        category: item.category || 'Tablet',
        isTablet: Boolean(item.isTablet),
        defaultDosage: item.defaultDosage || '1 tablet',
        symptoms: item.symptoms || '',
        quantity: initialQty,
        minThreshold: 20,
        status,
        lastRestocked: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const doc = await MedicineInventory.create(stockDoc);
      createdList.push(doc);
    }
    return createdList;
  } catch (err) {
    console.error('Error auto-initializing medicine inventory:', err);
    return [];
  }
}

// GET /api/inventory — View inventory items (Available to authenticated users; Admin/Clinician full details)
router.get('/', authenticate, async (req, res) => {
  try {
    const MedicineInventory = getModel('MedicineInventory');
    let items = await MedicineInventory.find({});

    if (!items || items.length === 0) {
      items = await ensureInventoryPopulated();
    }

    const mapped = items.map((it) => {
      const plain = toPlain(it);
      const q = Number(plain.quantity) || 0;
      const calculatedStatus = computeStockStatus(q, plain.minThreshold);
      return {
        ...plain,
        status: plain.status || calculatedStatus
      };
    });

    mapped.sort((a, b) => (Number(a.catalogId) || 0) - (Number(b.catalogId) || 0));

    return res.json({
      success: true,
      message: 'Inventory retrieved.',
      data: mapped
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: { code: 'INVENTORY_FETCH_ERROR', message: err.message }
    });
  }
});

// PUT /api/inventory/:id — Update medicine quantity & threshold (Admin/Medical Staff)
router.put(
  '/:id',
  authenticate,
  authorizeRoles('ADMIN', 'MEDICAL_STAFF'),
  validate({ body: updateInventorySchema }),
  async (req, res) => {
    try {
      const MedicineInventory = getModel('MedicineInventory');
      const { id } = req.params;
      const { quantity, minThreshold } = req.body;

      const existing = await findByIdentifier(MedicineInventory, id);
      if (!existing) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Medicine item not found.' }
        });
      }

      const newQty = Math.max(0, parseInt(quantity, 10) || 0);
      const newThreshold =
        minThreshold !== undefined ? Math.max(1, parseInt(minThreshold, 10)) : existing.minThreshold || 20;
      const newStatus = computeStockStatus(newQty, newThreshold);

      const updated = await updateByIdentifier(
        MedicineInventory,
        existing._id || existing.id,
        {
          quantity: newQty,
          minThreshold: newThreshold,
          status: newStatus,
          lastRestocked: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      );

      await logAuditEvent(req, {
        action: 'UPDATE_MEDICINE_STOCK',
        resourceType: 'INVENTORY',
        resource: existing.name,
        details: `Updated stock of ${existing.name} to ${newQty} units (${newStatus})`,
        sensitivity: 'LOW',
        outcome: 'SUCCESS'
      });

      return res.json({
        success: true,
        message: `Stock updated for ${existing.name}.`,
        data: updated
      });
    } catch (err) {
      return res.status(500).json({
        success: false,
        error: { code: 'INVENTORY_UPDATE_ERROR', message: err.message }
      });
    }
  }
);

// POST /api/inventory/bulk-load — Bulk restock inventory (Admin only)
router.post(
  '/bulk-load',
  authenticate,
  authorizeRoles('ADMIN'),
  validate({ body: bulkInventorySchema }),
  async (req, res) => {
    try {
      const MedicineInventory = getModel('MedicineInventory');
      const { action, amount } = req.body;

      const allItems = await MedicineInventory.find({});
      let updatedCount = 0;

      for (const item of allItems) {
        let shouldUpdate = false;
        let finalQty = Number(item.quantity) || 0;

        if (action === 'set_all') {
          finalQty = amount;
          shouldUpdate = true;
        } else if (action === 'add_all') {
          finalQty += amount;
          shouldUpdate = true;
        } else if (action === 'restock_low' && finalQty < (item.minThreshold || 20)) {
          finalQty += amount;
          shouldUpdate = true;
        }

        if (shouldUpdate) {
          const status = computeStockStatus(finalQty, item.minThreshold);
          await updateByIdentifier(MedicineInventory, item._id || item.id, {
            quantity: finalQty,
            status,
            lastRestocked: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
          updatedCount++;
        }
      }

      await logAuditEvent(req, {
        action: 'BULK_RESTOCK_INVENTORY',
        resourceType: 'INVENTORY',
        resource: 'ALL_MEDICINES',
        details: `Bulk inventory action '${action}' applied to ${updatedCount} medicines (Amount: ${amount})`,
        sensitivity: 'MEDIUM',
        outcome: 'SUCCESS'
      });

      return res.json({
        success: true,
        message: `Successfully updated stock for ${updatedCount} medicines.`,
        data: { updatedCount }
      });
    } catch (err) {
      return res.status(500).json({
        success: false,
        error: { code: 'INVENTORY_BULK_ERROR', message: err.message }
      });
    }
  }
);

// POST /api/inventory/deduct — Deduct medicine stock upon prescription issuance
router.post(
  '/deduct',
  authenticate,
  authorizeRoles('MEDICAL_STAFF', 'ADMIN'),
  validate({ body: deductInventorySchema }),
  async (req, res) => {
    try {
      const MedicineInventory = getModel('MedicineInventory');
      const { medicineName, count, items } = req.body;
      const allMeds = await MedicineInventory.find({});

      if (Array.isArray(items) && items.length > 0) {
        let deductedCount = 0;
        const updatedItems = [];

        for (const it of items) {
          const name = (it.name || it.medicineName || '').trim();
          if (!name) continue;
          const match = matchMedicine(allMeds, name);
          if (match) {
            const deductAmt = Math.max(1, parseInt(it.quantity || it.count, 10) || 10);
            const currentQty = Number(match.quantity) || 0;
            const newQty = Math.max(0, currentQty - deductAmt);
            const status = computeStockStatus(newQty, match.minThreshold);

            await updateByIdentifier(MedicineInventory, match._id || match.id, {
              quantity: newQty,
              status,
              updatedAt: new Date().toISOString()
            });

            match.quantity = newQty;
            match.status = status;
            deductedCount++;
            updatedItems.push({ name: match.name, previousQty: currentQty, newQty, status });
          }
        }

        await logAuditEvent(req, {
          action: 'DEDUCT_MEDICINE_BATCH',
          resourceType: 'INVENTORY',
          resource: 'PRESCRIPTION_DISPENSE',
          details: `Deducted stock for ${deductedCount} item(s)`,
          sensitivity: 'LOW',
          outcome: 'SUCCESS'
        });

        return res.json({
          success: true,
          message: `Deducted stock for ${deductedCount} prescribed items.`,
          data: { deductedCount, items: updatedItems }
        });
      }

      const match = matchMedicine(allMeds, medicineName);
      if (!match) {
        return res.status(404).json({
          success: false,
          error: { code: 'MEDICINE_NOT_FOUND', message: `Medicine '${medicineName}' not tracked in inventory.` }
        });
      }

      const currentQty = Number(match.quantity) || 0;
      const deductAmt = Math.max(1, parseInt(count, 10) || 10);
      const newQty = Math.max(0, currentQty - deductAmt);
      const status = computeStockStatus(newQty, match.minThreshold);

      await updateByIdentifier(MedicineInventory, match._id || match.id, {
        quantity: newQty,
        status,
        updatedAt: new Date().toISOString()
      });

      return res.json({
        success: true,
        message: `Deducted ${deductAmt} unit(s) of ${match.name}.`,
        data: {
          medicineName: match.name,
          remainingQuantity: newQty,
          status
        }
      });
    } catch (err) {
      return res.status(500).json({
        success: false,
        error: { code: 'DEDUCTION_ERROR', message: err.message }
      });
    }
  }
);

module.exports = router;
