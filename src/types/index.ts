export type Role = 'STUDENT' | 'MEDICAL_STAFF' | 'ADMIN' | 'RESEARCHER' | 'EMERGENCY_RESPONDER';

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
  frequency: string;
  durationDays: number;
  instructions: string;
  quantity?: number;
}

export interface PrescriptionVersion {
  version: number;
  prescriptionId: string;
  createdAt: string;
  createdByDoctor: string;
  status: 'ACTIVE' | 'MODIFIED' | 'DISCONTINUED';
  items: PrescriptionItem[];
  diagnosis?: string;
  followUpDate?: string;
  notes?: string;
  changeReason?: string;
}

export interface Prescription {
  id: string;
  studentId: string;
  doctorName: string;
  diagnosis?: string;
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
  targetCalories?: number;
  proteinG?: number;
  carbsG?: number;
  fatG?: number;
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

// -------------------------------------------------------------
// RESEARCH & CLINICAL DECISION SUPPORT EXTENSIONS
// -------------------------------------------------------------

export type RiskTier = 'LOW' | 'MODERATE' | 'HIGH' | 'URGENT';

export interface ContributingFactor {
  feature: string;
  clinicalValue: string;
  attributionScore: number;
  direction: 'RISK_INCREASING' | 'PROTECTIVE';
  percentageOfRisk: number;
  explanation: string;
}

export interface RiskEvaluationResult {
  engine: string;
  modelVersion?: string;
  riskTier: RiskTier;
  confidenceScore: number;
  logOdds?: number;
  contributingFactors: ContributingFactor[];
  clinicalDecisionSupportNotice: string;
}

export interface DualRiskEvaluation {
  studentId?: string;
  timestamp: string;
  ruleBasedBaseline: {
    engine: string;
    totalScore: number;
    riskTier: RiskTier;
    contributingRules: string[];
  };
  machineLearningModel: RiskEvaluationResult;
  isDivergent: boolean;
  recommendedTier: RiskTier;
  divergenceReason: string;
}

export interface EmergencyTokenResponse {
  token: string;
  tokenId: string;
  expiresAt: string;
  ttlSeconds: number;
  studentId: string;
  studentName: string;
}

export interface EmergencyVerificationResult {
  studentName: string;
  studentId: string;
  bloodGroup: string;
  criticalAllergies: string[];
  criticalConditions: string[];
  criticalMedications: string[];
  emergencyContact: {
    name: string;
    relation: string;
    phone: string;
  };
  medicalCentreContact: string;
  accommodation?: string;
  hostelLocation?: string;
  lastClinicalVerification: string;
  accessMetadata: {
    accessTimestamp: string;
    responderName: string;
    responderRole: string;
    tokenHashPrefix: string;
    latencyMs: number;
  };
  privacyNotice: string;
}

export interface EmergencyMetrics {
  metricName: string;
  traditionalFullRecordFields: number;
  privacyPreservingEmergencyFields: number;
  withheldSensitiveFieldsCount: number;
  privacyPreservationRatioPercent: number;
  exposureRatioPercent: number;
  totalTokensGenerated: number;
  totalEmergencyAccessEvents: number;
  averageAccessLatencyMs: number;
  auditLoggingCompletenessPercent: number;
}

export interface HealthTimelineEvent {
  id: string;
  date: string;
  time?: string;
  type: 'VISIT' | 'PRESCRIPTION_V1' | 'PRESCRIPTION_MODIFIED' | 'DAILY_MONITORING' | 'EMERGENCY_ACCESS' | 'NUTRITION';
  title: string;
  subtitle: string;
  severity?: RiskTier;
  details?: string;
  doctorOrActor?: string;
  badge?: string;
}

export interface BenchmarkExperiment {
  title: string;
  hypothesis: string;
  datasetSize?: number;
  metricsComparison?: any;
  metrics?: any;
  deltaImprovementPercent?: any;
  conclusion: string;
}

export interface ResearcherMetrics {
  privacyProtocol: string;
  totalCohortSize: number;
  totalClinicalVisits: number;
  totalMonitoringResponsesLogged: number;
  totalPrescriptionsTracked: number;
  anonymizedDistributions: {
    conditionPrevalence: Record<string, number>;
    bloodGroupBreakdown: Record<string, number>;
    departmentDistribution: Record<string, number>;
    bmiClassification: {
      underweight: number;
      normalWeight: number;
      overweight: number;
      obese: number;
    };
  };
  privacyCompliance: {
    hipaaDeIdentificationMethod: string;
    directIdentifiersStripped: string[];
    minimumCellSizeSuppression: number;
  };
}

export interface ModelEvaluationMetrics {
  evaluationTimestamp: string;
  datasetMetadata: {
    totalSamples: number;
    randomSeed: number;
    classDistribution: Record<string, number>;
  };
  overallPerformance: {
    ruleBasedAccuracy: number;
    machineLearningAccuracy: number;
    macroAveragesML: {
      precision: number;
      recallSensitivity: number;
      specificity: number;
      f1Score: number;
      macroAUROC: number;
    };
  };
  confusionMatrixRuleBased: Record<string, Record<string, number>>;
  confusionMatrixML: Record<string, Record<string, number>>;
  classSpecificMetricsML: Record<string, any>;
  featureImportanceRankings: Array<{
    feature: string;
    relativeImportanceScore: number;
    clinicalDomain: string;
  }>;
  formalExperiments: {
    experimentA: BenchmarkExperiment;
    experimentB: BenchmarkExperiment;
    experimentC: BenchmarkExperiment;
  };
}

// -------------------------------------------------------------
// PHARMACY & MEDICINE STOCK INVENTORY
// -------------------------------------------------------------

export type StockStatus = 'Full Stock' | 'Less Stock' | 'Restock';

export interface MedicineStockItem {
  id: string;
  catalogId: number;
  name: string;
  generic: string;
  category: string;
  isTablet: boolean;
  defaultDosage?: string;
  symptoms?: string;
  quantity: number;
  minThreshold: number;
  status: StockStatus;
  lastRestocked?: string;
  updatedAt?: string;
}

