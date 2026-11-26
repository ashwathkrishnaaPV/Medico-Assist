const mongoose = require('mongoose');
const localDb = require('../localDb');
const env = require('../config/env');

// Pre-load all Mongoose models
const mongooseModels = {
  User: require('./User'),
  StudentProfile: require('./StudentProfile'),
  MedicalVisit: require('./MedicalVisit'),
  Prescription: require('./Prescription'),
  NutritionPlan: require('./NutritionPlan'),
  MonitoringPlan: require('./MonitoringPlan'),
  MonitoringResponse: require('./MonitoringResponse'),
  CalendarEvent: require('./CalendarEvent'),
  Notification: require('./Notification'),
  AuditLog: require('./AuditLog'),
  LabReport: require('./LabReport'),
  MedicineInventory: require('./MedicineInventory')
};

function getModel(name) {
  // Primary: return Mongoose model when MongoDB is connected (or connecting outside explicit local fallback)
  if (mongoose.connection && mongoose.connection.readyState === 1 && mongooseModels[name]) {
    return mongooseModels[name];
  }
  if (env.allowLocalJsonFallback && localDb[name]) {
    return localDb[name];
  }
  if (mongooseModels[name]) {
    return mongooseModels[name];
  }
  return localDb[name];
}

module.exports = {
  getModel,
  mongooseModels,
  localDb
};
