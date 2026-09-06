export type Role = 'STUDENT' | 'MEDICAL_STAFF' | 'ADMIN' | 'EMERGENCY_RESPONDER';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatarUrl?: string;
  studentId?: string;
  staffId?: string;
  department?: string;
  title?: string;
}

export interface StudentProfileData {
  id: string;
  studentId: string;
  name: string;
  email: string;
  age?: number;
  dob: string;
  gender: string;
  department: string;
  year: string;
  ugOrPg: 'UG' | 'PG' | '';
  accommodation: 'Hosteller' | 'Day Scholar' | '';
  hostelBlock?: string;
  hostelRoom?: string;
  phone: string;
  bloodGroup: string;
  emergencyContact: {
    name: string;
    relation: string;
    phone: string;
  };
  medicalCentreContact: string;
  criticalAllergies: string[];
  criticalConditions: string[];
  criticalMedications: string[];
  heightCm: number;
  weightKg: number;
  bmi: number;
  lastUpdated: string;
  profileComplete: boolean;
}

export interface Vitals {
  temperatureF?: number;
  bloodPressureSys?: number;
  bloodPressureDia?: number;
  heartRateBpm?: number;
  spo2Percent?: number;
  heightCm?: number;
  weightKg?: number;
  bmi?: number;
  recordedAt: string;
  recordedBy: string;
}

export interface PrescriptionItem {
  id: string;
  medicineName: string;
  dosage: string;
  frequency: string; // e.g. "Twice daily after meals"
  durationDays: number;
  instructions: string;
}

export interface PrescriptionVersion {
  version: number;
  prescriptionId: string;
  createdAt: string;
  createdByDoctor: string;
  status: 'ACTIVE' | 'MODIFIED' | 'DISCONTINUED';
  items: PrescriptionItem[];
  followUpDate?: string;
  notes?: string;
  changeReason?: string;
}

export interface Prescription {
  id: string;
  studentId: string;
  doctorName: string;
  createdAt: string;
  status: 'ACTIVE' | 'MODIFIED' | 'DISCONTINUED';
  currentVersion: PrescriptionVersion;
  history: PrescriptionVersion[];
  followUpDate?: string;
}

export interface MedicalVisit {
  id: string;
  studentId: string;
  studentName: string;
  visitType: 'Consultation' | 'Follow-up' | 'Reconsultation' | 'Lab Check';
  visitDate: string;
  time: string;
  doctorName: string;
  chiefComplaint: string;
  vitals: Vitals;
  clinicalNotes: string;
  diagnosis: string;
  prescriptionId?: string;
  nutritionPlanId?: string;
  monitoringPlanActive: boolean;
  status: 'Scheduled' | 'Checked In' | 'Waiting' | 'In Consultation' | 'Completed' | 'Cancelled';
}

export interface LabReport {
  id: string;
  studentId: string;
  testName: string;
  date: string;
  orderedBy: string;
  summary: string;
  fileUrl?: string;
  status: 'Completed' | 'Pending';
}

export interface DailyMonitoringPlan {
  id: string;
  studentId: string;
  conditionName: string;
  startDate: string;
  durationDays: number;
  currentDay: number;
  active: boolean;
  createdBy: string;
}

export interface DailyMonitoringResponse {
  id: string;
  studentId: string;
  date: string;
  feeling: 'Better' | 'Same' | 'Worse';
  symptomsImproving: boolean;
  newSymptoms: boolean;
  studentFeedback?: string;
  status: 'Improving' | 'Stable' | 'Needs Review' | 'Potential Concern';
}

export interface NutritionPlan {
  id: string;
  studentId: string;
  goal: string;
  aiSuggested: boolean;
  doctorApproved: boolean;
  approvedBy?: string;
  approvedAt?: string;
  reviewDate: string;
  meals: {
    breakfast: string[];
    midMorning: string[];
    lunch: string[];
    evening: string[];
    dinner: string[];
  };
  foodsToLimit: string[];
  encouragingNotes: string;
}

export interface HealthCalendarEvent {
  id: string;
  studentId: string;
  title: string;
  date: string;
  time: string;
  eventType: 'Medical Consultation' | 'Follow-up' | 'Lab Test' | 'Daily Monitoring' | 'Prescription Reminder' | 'Nutrition Review';
  status: 'Upcoming' | 'Completed' | 'Missed';
  notes?: string;
}

export interface NotificationItem {
  id: string;
  recipientRole: Role;
  studentId?: string;
  title: string;
  message: string;
  type: 'prescription' | 'followup' | 'monitoring' | 'nutrition' | 'system' | 'emergency';
  createdAt: string;
  read: boolean;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: Role;
  action: string;
  resource: string;
  details: string;
  ipAddress: string;
  sensitivity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface RestrictedEmergencyView {
  studentName: string;
  studentId: string;
  bloodGroup: string;
  accommodation: string;
  hostelBlock?: string;
  hostelRoom?: string;
  criticalAllergies: string[];
  criticalConditions: string[];
  criticalMedications: string[];
  emergencyContact: {
    name: string;
    relation: string;
    phone: string;
  };
  medicalCentreContact: string;
  token: string;
}
