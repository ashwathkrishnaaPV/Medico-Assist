const { getIsConnected } = require('../db');
const localDb = require('../localDb');

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
  EmergencyToken: require('./EmergencyToken')
};

function getModel(name) {
  if (getIsConnected()) {
    return mongooseModels[name];
  }
  return localDb[name];
}

module.exports = { getModel, mongooseModels, localDb };
