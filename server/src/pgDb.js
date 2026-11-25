const bcrypt = require('bcryptjs');
const { pool } = require('./db');

const SAFE_KEY_REGEX = /^[a-zA-Z_][a-zA-Z0-9_]*$/;

function assertSafeKey(key) {
  if (!SAFE_KEY_REGEX.test(key)) {
    throw new Error(`Invalid filter field name rejected: ${key}`);
  }
}

const MODEL_TO_TABLE = {
  User: 'users',
  StudentProfile: 'student_profiles',
  MedicalVisit: 'medical_visits',
  Prescription: 'prescriptions',
  NutritionPlan: 'nutrition_plans',
  MonitoringPlan: 'monitoring_plans',
  MonitoringResponse: 'monitoring_responses',
  CalendarEvent: 'calendar_events',
  Notification: 'notifications',
  AuditLog: 'audit_logs',
  EmergencyToken: 'emergency_tokens',
  LabReport: 'lab_reports',
  MedicineInventory: 'medicine_inventory'
};

class PgCollection {
  constructor(modelName, tableName) {
    this.modelName = modelName;
    this.tableName = tableName;
  }

  hydrate(row) {
    if (!row) return null;
    const doc = { ...(row.data || {}) };
    const id = row.id || doc.id || doc._id;
    doc.id = id;
    doc._id = id;

    if (this.tableName === 'users') {
      const self = this;
      doc.comparePassword = async function comparePassword(plain) {
        if (!this.password || !plain) return false;
        return bcrypt.compare(String(plain), String(this.password));
      };
      doc.save = async function save() {
        const clean = { ...this };
        delete clean.comparePassword;
        delete clean.save;
        return self.findByIdAndUpdate(this.id || this._id, clean);
      };
    }

    if (this.tableName === 'medicine_inventory') {
      if (row.quantity !== undefined && row.quantity !== null) doc.quantity = Number(row.quantity);
      if (row.status !== undefined && row.status !== null) doc.status = row.status;
      if (row.name !== undefined && row.name !== null) doc.name = row.name;
    }
    return doc;
  }

  buildWhereClause(filter) {
    const conditions = [];
    const params = [];
    let paramIndex = 1;

    for (const [key, val] of Object.entries(filter)) {
      if (key === '$or' && Array.isArray(val)) {
        const orClauses = [];
        for (const branch of val) {
          const subClauses = [];
          for (const [subKey, subVal] of Object.entries(branch)) {
            assertSafeKey(subKey);
            params.push(String(subVal));
            subClauses.push(`data->>'${subKey}' = $${paramIndex++}`);
          }
          if (subClauses.length > 0) {
            orClauses.push(`(${subClauses.join(' AND ')})`);
          }
        }
        if (orClauses.length > 0) {
          conditions.push(`(${orClauses.join(' OR ')})`);
        }
        continue;
      }

      assertSafeKey(key);

      if (val !== null && typeof val === 'object' && Array.isArray(val.$in)) {
        params.push(val.$in.map(String));
        conditions.push(`data->>'${key}' = ANY($${paramIndex++})`);
        continue;
      }

      if (key === '_id' || key === 'id') {
        params.push(String(val));
        conditions.push(`(id = $${paramIndex} OR data->>'id' = $${paramIndex} OR data->>'_id' = $${paramIndex++})`);
        continue;
      }

      params.push(String(val));
      conditions.push(`data->>'${key}' = $${paramIndex++}`);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    return { where, params };
  }

  async find(filter = {}) {
    const { where, params } = this.buildWhereClause(filter);
    const sql = `SELECT id, data FROM ${this.tableName} ${where} ORDER BY created_at ASC`;
    const res = await pool.query(sql, params);
    return res.rows.map((r) => this.hydrate(r));
  }

  async findOne(filter = {}) {
    const { where, params } = this.buildWhereClause(filter);
    const sql = `SELECT id, data FROM ${this.tableName} ${where} LIMIT 1`;
    const res = await pool.query(sql, params);
    if (res.rows.length === 0) return null;
    return this.hydrate(res.rows[0]);
  }

  async findById(id) {
    if (!id) return null;
    const res = await pool.query(`SELECT id, data FROM ${this.tableName} WHERE id = $1 LIMIT 1`, [String(id)]);
    if (res.rows.length === 0) {
      return this.findOne({ _id: id });
    }
    return this.hydrate(res.rows[0]);
  }

  async create(doc) {
    const id = doc.id || doc._id || `${this.tableName.slice(0, 3)}_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    const newDoc = {
      ...doc,
      id,
      _id: id,
      createdAt: doc.createdAt || new Date().toISOString(),
      updatedAt: doc.updatedAt || new Date().toISOString()
    };

    if (this.tableName === 'users' && newDoc.password && !newDoc.password.startsWith('$2')) {
      newDoc.password = await bcrypt.hash(newDoc.password, 10);
    }

    const columns = ['id', 'data', 'created_at', 'updated_at'];
    const values = [id, JSON.stringify(newDoc), newDoc.createdAt, newDoc.updatedAt];

    if (this.tableName === 'users') {
      columns.push('email', 'student_id', 'staff_id', 'register_number', 'role', 'name', 'department');
      values.push(
        (newDoc.email || '').toLowerCase().trim(),
        newDoc.studentId || null,
        newDoc.staffId || null,
        newDoc.registerNumber || null,
        newDoc.role || 'STUDENT',
        newDoc.name || '',
        newDoc.department || ''
      );
    } else if (this.tableName === 'student_profiles') {
      columns.push('student_id', 'name', 'email', 'department', 'blood_group');
      values.push(
        newDoc.studentId || '',
        newDoc.name || '',
        (newDoc.email || '').toLowerCase().trim(),
        newDoc.department || '',
        newDoc.bloodGroup || ''
      );
    } else if (this.tableName === 'medical_visits') {
      columns.push('student_id', 'visit_date', 'status');
      values.push(newDoc.studentId || '', newDoc.visitDate || '', newDoc.status || 'Completed');
    } else if (this.tableName === 'prescriptions') {
      columns.push('student_id', 'status');
      values.push(newDoc.studentId || '', newDoc.status || 'ACTIVE');
    } else if (this.tableName === 'nutrition_plans') {
      columns.push('student_id', 'active');
      values.push(newDoc.studentId || '', newDoc.active !== false);
    } else if (this.tableName === 'monitoring_plans') {
      columns.push('student_id', 'active', 'current_day');
      values.push(newDoc.studentId || '', newDoc.active !== false, newDoc.currentDay || 1);
    } else if (this.tableName === 'monitoring_responses') {
      columns.push('student_id', 'date');
      values.push(newDoc.studentId || '', newDoc.date || '');
    } else if (this.tableName === 'calendar_events') {
      columns.push('student_id', 'date', 'status');
      values.push(newDoc.studentId || '', newDoc.date || '', newDoc.status || 'Upcoming');
    } else if (this.tableName === 'notifications') {
      columns.push('target_role', 'target_student_id', 'read');
      values.push(newDoc.targetRole || 'ALL', newDoc.targetStudentId || null, Boolean(newDoc.read));
    } else if (this.tableName === 'audit_logs') {
      columns.push('user_id', 'resource', 'action', 'sensitivity');
      values.push(newDoc.userId || '', newDoc.resource || '', newDoc.action || '', newDoc.sensitivity || 'LOW');
    } else if (this.tableName === 'emergency_tokens') {
      columns.push('token_hash', 'student_id', 'revoked', 'expires_at');
      values.push(newDoc.tokenHash || '', newDoc.studentId || '', Boolean(newDoc.revoked), newDoc.expiresAt || new Date());
    } else if (this.tableName === 'lab_reports') {
      columns.push('student_id');
      values.push(newDoc.studentId || '');
    } else if (this.tableName === 'medicine_inventory') {
      columns.push('name', 'category', 'quantity', 'min_threshold', 'status');
      values.push(
        newDoc.name || '',
        newDoc.category || 'Tablet',
        newDoc.quantity !== undefined ? newDoc.quantity : 100,
        newDoc.minThreshold !== undefined ? newDoc.minThreshold : 20,
        newDoc.status || 'Full Stock'
      );
    }

    const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
    const sql = `
      INSERT INTO ${this.tableName} (${columns.join(', ')})
      VALUES (${placeholders})
      ON CONFLICT (id) DO UPDATE
      SET data = EXCLUDED.data, updated_at = EXCLUDED.updated_at
      RETURNING id, data
    `;

    const res = await pool.query(sql, values);
    return this.hydrate(res.rows[0]);
  }

  async findOneAndUpdate(filter, update, options = {}) {
    const existing = await this.findOne(filter);
    if (!existing) {
      if (options.upsert) {
        return this.create({ ...filter, ...update });
      }
      return null;
    }

    const cleanExisting = { ...existing };
    delete cleanExisting.comparePassword;
    delete cleanExisting.save;

    const updatedDoc = {
      ...cleanExisting,
      ...update,
      id: existing.id || existing._id,
      _id: existing.id || existing._id,
      updatedAt: new Date().toISOString()
    };

    if (this.tableName === 'users' && updatedDoc.password && updatedDoc.password !== existing.password && !updatedDoc.password.startsWith('$2')) {
      updatedDoc.password = await bcrypt.hash(updatedDoc.password, 10);
    }

    const updates = ['data = $1', 'updated_at = NOW()'];
    const params = [JSON.stringify(updatedDoc)];
    let pIdx = 2;

    if (this.tableName === 'users') {
      if (updatedDoc.email) { updates.push(`email = $${pIdx++}`); params.push(updatedDoc.email.toLowerCase().trim()); }
      if (updatedDoc.name) { updates.push(`name = $${pIdx++}`); params.push(updatedDoc.name); }
      if (updatedDoc.role) { updates.push(`role = $${pIdx++}`); params.push(updatedDoc.role); }
    } else if (this.tableName === 'student_profiles') {
      if (updatedDoc.name) { updates.push(`name = $${pIdx++}`); params.push(updatedDoc.name); }
      if (updatedDoc.bloodGroup !== undefined) { updates.push(`blood_group = $${pIdx++}`); params.push(updatedDoc.bloodGroup); }
    } else if (this.tableName === 'monitoring_plans') {
      if (updatedDoc.currentDay !== undefined) { updates.push(`current_day = $${pIdx++}`); params.push(updatedDoc.currentDay); }
      if (updatedDoc.active !== undefined) { updates.push(`active = $${pIdx++}`); params.push(updatedDoc.active); }
    } else if (this.tableName === 'notifications') {
      if (updatedDoc.read !== undefined) { updates.push(`read = $${pIdx++}`); params.push(updatedDoc.read); }
    } else if (this.tableName === 'emergency_tokens') {
      if (updatedDoc.revoked !== undefined) { updates.push(`revoked = $${pIdx++}`); params.push(updatedDoc.revoked); }
    } else if (this.tableName === 'medicine_inventory') {
      if (updatedDoc.quantity !== undefined) { updates.push(`quantity = $${pIdx++}`); params.push(updatedDoc.quantity); }
      if (updatedDoc.status !== undefined) { updates.push(`status = $${pIdx++}`); params.push(updatedDoc.status); }
      if (updatedDoc.minThreshold !== undefined) { updates.push(`min_threshold = $${pIdx++}`); params.push(updatedDoc.minThreshold); }
    }

    params.push(existing.id);
    const sql = `UPDATE ${this.tableName} SET ${updates.join(', ')} WHERE id = $${pIdx} RETURNING id, data`;
    const res = await pool.query(sql, params);
    return this.hydrate(res.rows[0]);
  }

  async findByIdAndUpdate(id, update, options = {}) {
    return this.findOneAndUpdate({ id }, update, options);
  }

  async deleteOne(filter) {
    const existing = await this.findOne(filter);
    if (!existing) return { deletedCount: 0 };
    await pool.query(`DELETE FROM ${this.tableName} WHERE id = $1`, [existing.id]);
    return { deletedCount: 1 };
  }
}

const pgModels = {};
for (const [modelName, tableName] of Object.entries(MODEL_TO_TABLE)) {
  pgModels[modelName] = new PgCollection(modelName, tableName);
}

module.exports = {
  PgCollection,
  pgModels,
  ...pgModels
};
