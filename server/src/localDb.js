const fs = require('fs');
const path = require('path');
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
  auditLogs: []
};

function readDb() {
  try {
    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, JSON.stringify(defaultState, null, 2), 'utf8');
      return { ...defaultState };
    }
    const raw = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    return { ...defaultState };
  }
}

function writeDb(data) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (e) {
    console.error('Failed to write local DB:', e);
  }
}

class Collection {
  constructor(name) {
    this.name = name;
  }

  async find(filter = {}) {
    const db = readDb();
    let list = db[this.name] || [];
    return list.filter(item => {
      for (const [k, v] of Object.entries(filter)) {
        if (v && typeof v === 'object' && Array.isArray(v['$in'])) {
          if (!v['$in'].includes(item[k])) return false;
        } else if (item[k] !== v) {
          return false;
        }
      }
      return true;
    });
  }

  async findOne(filter = {}) {
    const items = await this.find(filter);
    const item = items[0] || null;
    if (item && this.name === 'users') {
      item.comparePassword = async function(plain) {
        if (!this.password) return true;
        return bcrypt.compare(plain, this.password);
      };
      item.save = async function() {
        const db = readDb();
        const idx = (db.users || []).findIndex(u => (u._id || u.id) === (this._id || this.id));
        if (idx >= 0) {
          if (this.password && !this.password.startsWith('$2')) {
            this.password = await bcrypt.hash(this.password, 10);
          }
          db.users[idx] = this;
          writeDb(db);
        }
        return this;
      };
    }
    return item;
  }

  async findById(id) {
    return this.findOne({ _id: id }) || this.findOne({ id: id });
  }

  async create(doc) {
    const db = readDb();
    if (!db[this.name]) db[this.name] = [];
    const _id = doc._id || doc.id || 'id_' + Date.now() + '_' + Math.floor(Math.random() * 10000);
    const newDoc = { ...doc, _id, id: _id, createdAt: doc.createdAt || new Date().toISOString() };
    if (this.name === 'users' && newDoc.password && !newDoc.password.startsWith('$2')) {
      newDoc.password = await bcrypt.hash(newDoc.password, 10);
    }
    db[this.name].unshift(newDoc);
    writeDb(db);
    return newDoc;
  }

  async findOneAndUpdate(filter, update, options = {}) {
    const db = readDb();
    if (!db[this.name]) db[this.name] = [];
    const list = db[this.name];
    const idx = list.findIndex(item => {
      for (const [k, v] of Object.entries(filter)) {
        if (item[k] !== v) return false;
      }
      return true;
    });

    if (idx >= 0) {
      list[idx] = { ...list[idx], ...update, updatedAt: new Date().toISOString() };
      writeDb(db);
      return list[idx];
    } else if (options.upsert) {
      return this.create({ ...filter, ...update });
    }
    return null;
  }

  async findByIdAndUpdate(id, update, options = {}) {
    const db = readDb();
    if (!db[this.name]) db[this.name] = [];
    const list = db[this.name];
    const idx = list.findIndex(item => (item._id || item.id) === id);
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...update, updatedAt: new Date().toISOString() };
      writeDb(db);
      return list[idx];
    }
    return null;
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
  readDb,
  writeDb
};
