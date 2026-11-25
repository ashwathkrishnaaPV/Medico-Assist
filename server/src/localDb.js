const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

const DATA_DIR = path.join(__dirname, '../data');
const DB_FILE = path.join(DATA_DIR, 'campushealth_db.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const defaultState = {
  users: [],
  profiles: [],
  visits: [],
  prescriptions: [],
  nutritionPlans: [],
  monitoringPlans: [],
  monitoringResponses: [],
  calendarEvents: [],
  notifications: [],
  auditLogs: [],
  emergencyTokens: [],
  labReports: [],
  medicineInventory: []
};

// Per-process write serialization queue preventing concurrent write corruption
let writeQueue = Promise.resolve();

function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function readDb() {
  if (!fs.existsSync(DB_FILE)) {
    const initial = clone(defaultState);
    writeDbSync(initial);
    return initial;
  }

  let raw;
  try {
    raw = fs.readFileSync(DB_FILE, 'utf8');
  } catch (err) {
    throw new Error(`Local DB read failure (${DB_FILE}): ${err.message}`);
  }

  try {
    return JSON.parse(raw);
  } catch (err) {
    throw new Error(`Local DB corrupted JSON (${DB_FILE}): ${err.message}`);
  }
}

function writeDbSync(data) {
  const tmpFile = path.join(
    DATA_DIR,
    `.campushealth_db.${process.pid}.${crypto.randomBytes(6).toString('hex')}.tmp`
  );
  try {
    const payload = JSON.stringify(data, null, 2);
    fs.writeFileSync(tmpFile, payload, 'utf8');
    fs.renameSync(tmpFile, DB_FILE);
  } catch (err) {
    if (fs.existsSync(tmpFile)) {
      try { fs.unlinkSync(tmpFile); } catch { /* ignore cleanup failure */ }
    }
    throw new Error(`Local DB atomic write failure: ${err.message}`);
  }
}

function withWriteLock(fn) {
  const task = writeQueue.then(fn, fn);
  writeQueue = task.then(() => {}, () => {});
  return task;
}

function attachUserMethods(collection, doc) {
  if (!doc || collection.name !== 'users') return doc;
  const copy = { ...doc };
  copy.comparePassword = async function comparePassword(plain) {
    if (!this.password || !plain) return false;
    return bcrypt.compare(String(plain), String(this.password));
  };
  copy.save = async function save() {
    return withWriteLock(async () => {
      const db = readDb();
      const idx = (db.users || []).findIndex(
        (u) => (u._id || u.id) === (this._id || this.id)
      );
      if (idx >= 0) {
        const toStore = { ...this };
        delete toStore.comparePassword;
        delete toStore.save;
        if (toStore.password && !toStore.password.startsWith('$2')) {
          toStore.password = await bcrypt.hash(toStore.password, 10);
        }
        toStore.updatedAt = new Date().toISOString();
        db.users[idx] = toStore;
        writeDbSync(db);
      }
      return this;
    });
  };
  return copy;
}

function matchesFilter(item, filter) {
  for (const [k, v] of Object.entries(filter)) {
    if (k === '$or' && Array.isArray(v)) {
      const anyMatch = v.some((sub) => matchesFilter(item, sub));
      if (!anyMatch) return false;
    } else if (v && typeof v === 'object' && Array.isArray(v.$in)) {
      if (!v.$in.includes(item[k])) return false;
    } else if (v && typeof v === 'object' && ('$ne' in v)) {
      if (item[k] === v.$ne) return false;
    } else if (item[k] !== v) {
      return false;
    }
  }
  return true;
}

class Collection {
  constructor(name) {
    this.name = name;
  }

  async find(filter = {}) {
    const db = readDb();
    const list = db[this.name] || [];
    return list
      .filter((item) => matchesFilter(item, filter))
      .map((item) => attachUserMethods(this, clone(item)));
  }

  async findOne(filter = {}) {
    const items = await this.find(filter);
    return items[0] || null;
  }

  async findById(id) {
    if (!id) return null;
    const byUnderscoreId = await this.findOne({ _id: id });
    if (byUnderscoreId) return byUnderscoreId;
    return this.findOne({ id });
  }

  async create(doc) {
    return withWriteLock(async () => {
      const db = readDb();
      if (!db[this.name]) db[this.name] = [];
      const _id = doc._id || doc.id || `id_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
      const newDoc = {
        ...clone(doc),
        _id,
        id: _id,
        createdAt: doc.createdAt || new Date().toISOString(),
        updatedAt: doc.updatedAt || new Date().toISOString()
      };
      if (this.name === 'users' && newDoc.password && !newDoc.password.startsWith('$2')) {
        newDoc.password = await bcrypt.hash(newDoc.password, 10);
      }
      db[this.name].unshift(newDoc);
      writeDbSync(db);
      return attachUserMethods(this, clone(newDoc));
    });
  }

  async findOneAndUpdate(filter, update, options = {}) {
    return withWriteLock(async () => {
      const db = readDb();
      if (!db[this.name]) db[this.name] = [];
      const list = db[this.name];
      const idx = list.findIndex((item) => matchesFilter(item, filter));

      if (idx >= 0) {
        const cleanUpdate = clone(update);
        if (this.name === 'users' && cleanUpdate.password && !cleanUpdate.password.startsWith('$2')) {
          cleanUpdate.password = await bcrypt.hash(cleanUpdate.password, 10);
        }
        list[idx] = { ...list[idx], ...cleanUpdate, updatedAt: new Date().toISOString() };
        writeDbSync(db);
        return attachUserMethods(this, clone(list[idx]));
      }
      if (options.upsert) {
        // Perform creation inside lock directly to avoid nested deadlock
        const _id = (update && (update._id || update.id)) || `id_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
        const newDoc = {
          ...clone(filter),
          ...clone(update),
          _id,
          id: _id,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        if (this.name === 'users' && newDoc.password && !newDoc.password.startsWith('$2')) {
          newDoc.password = await bcrypt.hash(newDoc.password, 10);
        }
        db[this.name].unshift(newDoc);
        writeDbSync(db);
        return attachUserMethods(this, clone(newDoc));
      }
      return null;
    });
  }

  async findByIdAndUpdate(id, update, options = {}) {
    if (!id) return null;
    return withWriteLock(async () => {
      const db = readDb();
      if (!db[this.name]) db[this.name] = [];
      const list = db[this.name];
      const idx = list.findIndex((item) => item._id === id || item.id === id);
      if (idx >= 0) {
        const cleanUpdate = clone(update);
        if (this.name === 'users' && cleanUpdate.password && !cleanUpdate.password.startsWith('$2')) {
          cleanUpdate.password = await bcrypt.hash(cleanUpdate.password, 10);
        }
        list[idx] = { ...list[idx], ...cleanUpdate, updatedAt: new Date().toISOString() };
        writeDbSync(db);
        return attachUserMethods(this, clone(list[idx]));
      }
      if (options.upsert) {
        const newDoc = {
          ...clone(update),
          _id: id,
          id,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        db[this.name].unshift(newDoc);
        writeDbSync(db);
        return attachUserMethods(this, clone(newDoc));
      }
      return null;
    });
  }
}

module.exports = {
  User: new Collection('users'),
  StudentProfile: new Collection('profiles'),
  MedicalVisit: new Collection('visits'),
  Prescription: new Collection('prescriptions'),
  NutritionPlan: new Collection('nutritionPlans'),
  MonitoringPlan: new Collection('monitoringPlans'),
  MonitoringResponse: new Collection('monitoringResponses'),
  CalendarEvent: new Collection('calendarEvents'),
  Notification: new Collection('notifications'),
  AuditLog: new Collection('auditLogs'),
  EmergencyToken: new Collection('emergencyTokens'),
  LabReport: new Collection('labReports'),
  MedicineInventory: new Collection('medicineInventory'),
  readDb,
  writeDb: writeDbSync
};
