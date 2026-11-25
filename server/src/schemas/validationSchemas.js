const { z } = require('zod');

const ROLES = ['STUDENT', 'MEDICAL_STAFF', 'ADMIN', 'RESEARCHER', 'EMERGENCY_RESPONDER'];

const nonEmptyTrimmed = (min = 1, max = 500) =>
  z.string().trim().min(min).max(max);

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters long.')
  .max(128, 'Password cannot exceed 128 characters.')
  .refine((pw) => /[a-zA-Z]/.test(pw) && /[0-9]/.test(pw), {
    message: 'Password must contain at least one letter and one number.'
  });

const registerSchema = z.object({
  name: nonEmptyTrimmed(2, 120),
  email: z.string().trim().email('Valid institutional email is required.').toLowerCase(),
  password: passwordSchema,
  role: z.literal('STUDENT').optional(),
  studentId: z.string().trim().min(2).max(40).optional(),
  department: z.string().trim().max(150).optional(),
  phone: z.string().trim().regex(/^[0-9+\-\s()]{7,20}$/, 'Invalid phone format.').optional(),
  age: z.coerce.number().int().min(14).max(80).optional(),
  gender: z.enum(['Male', 'Female', 'Other']).optional(),
  year: z.enum(['1st Year', '2nd Year', '3rd Year', '4th Year', 'PG 1st Year', 'PG 2nd Year']).optional()
}).strict();

const loginSchema = z.object({
  email: nonEmptyTrimmed(2, 255),
  password: z.string().min(1, 'Password is required.').max(128)
}).strict();

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required.').max(128),
  newPassword: passwordSchema
}).strict();

const adminCreateUserSchema = z.object({
  name: nonEmptyTrimmed(2, 120),
  email: z.string().trim().email().toLowerCase(),
  password: passwordSchema,
  role: z.enum(ROLES),
  studentId: z.string().trim().min(2).max(40).optional(),
  staffId: z.string().trim().min(2).max(40).optional(),
  department: z.string().trim().max(150).optional(),
  title: z.string().trim().max(120).optional(),
  phone: z.string().trim().regex(/^[0-9+\-\s()]{7,20}$/).optional()
}).strict();

const adminUpdateRoleSchema = z.object({
  role: z.enum(ROLES)
}).strict();

const adminUpdateStatusSchema = z.object({
  active: z.boolean()
}).strict();

const emergencyContactSchema = z.object({
  name: nonEmptyTrimmed(1, 120),
  relation: nonEmptyTrimmed(1, 60),
  phone: z.string().trim().regex(/^[0-9+\-\s()]{7,20}$/, 'Valid emergency phone number required.')
}).strict();

const studentProfileSelfUpdateSchema = z.object({
  year: z.enum(['1st Year', '2nd Year', '3rd Year', '4th Year', 'PG 1st Year', 'PG 2nd Year']).optional(),
  ugOrPg: z.enum(['UG', 'PG', '']).optional(),
  accommodation: z.enum(['Hosteller', 'Day Scholar', '']).optional(),
  hostelBlock: z.string().trim().max(40).optional(),
  hostelRoom: z.string().trim().max(40).optional(),
  phone: z.string().trim().max(20).optional(),
  heightCm: z.coerce.number().min(0).max(260).optional(),
  weightKg: z.coerce.number().min(0).max(300).optional(),
  bloodGroup: z.enum(['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-', 'Unknown', '']).optional(),
  dob: z.string().trim().max(30).optional(),
  gender: z.enum(['Male', 'Female', 'Other', '']).optional(),
  emergencyContact: emergencyContactSchema.optional(),
  profileComplete: z.boolean().optional()
}).strict();

const clinicianProfileUpdateSchema = studentProfileSelfUpdateSchema.extend({
  studentId: nonEmptyTrimmed(2, 40),
  name: nonEmptyTrimmed(2, 120).optional(),
  email: z.string().trim().email().toLowerCase().optional(),
  age: z.coerce.number().int().min(14).max(90).optional(),
  department: z.string().trim().max(150).optional(),
  medicalCentreContact: z.string().trim().max(30).optional(),
  criticalAllergies: z.array(z.string().trim().max(100)).max(30).optional(),
  criticalConditions: z.array(z.string().trim().max(120)).max(30).optional(),
  criticalMedications: z.array(z.string().trim().max(120)).max(30).optional()
}).strict();

const vitalsSchema = z.object({
  temperatureF: z.coerce.number().min(85).max(115).optional(),
  bloodPressureSys: z.coerce.number().min(40).max(300).optional(),
  bloodPressureDia: z.coerce.number().min(20).max(200).optional(),
  heartRateBpm: z.coerce.number().min(20).max(260).optional(),
  spo2Percent: z.coerce.number().min(40).max(100).optional(),
  heightCm: z.coerce.number().min(40).max(260).optional(),
  weightKg: z.coerce.number().min(15).max(350).optional(),
  bmi: z.coerce.number().min(5).max(100).optional(),
  recordedAt: z.string().trim().max(80).optional(),
  recordedBy: z.string().trim().max(120).optional()
}).strict();

const createVisitSchema = z.object({
  studentId: nonEmptyTrimmed(2, 40),
  studentName: nonEmptyTrimmed(1, 120).optional(),
  visitType: z.enum(['Consultation', 'Follow-up', 'Reconsultation', 'Lab Check']),
  visitDate: nonEmptyTrimmed(4, 40),
  time: z.string().trim().max(40).optional(),
  chiefComplaint: nonEmptyTrimmed(2, 500),
  diagnosis: nonEmptyTrimmed(2, 300),
  clinicalNotes: z.string().trim().max(4000).optional().default(''),
  vitals: vitalsSchema,
  prescriptionId: z.string().trim().max(120).optional(),
  nutritionPlanId: z.string().trim().max(120).optional(),
  monitoringPlanActive: z.boolean().optional(),
  status: z.enum(['Scheduled', 'Checked In', 'Waiting', 'In Consultation', 'Completed', 'Cancelled']).optional()
}).strict();

const prescriptionItemSchema = z.object({
  id: z.string().trim().max(80).optional(),
  medicineName: nonEmptyTrimmed(1, 200),
  dosage: nonEmptyTrimmed(1, 100),
  frequency: nonEmptyTrimmed(1, 120),
  durationDays: z.coerce.number().int().min(1).max(365),
  quantity: z.coerce.number().int().min(1).max(5000).optional(),
  instructions: z.string().trim().max(300).optional().default('')
}).strict();

const createPrescriptionSchema = z.object({
  studentId: nonEmptyTrimmed(2, 40),
  diagnosis: z.string().trim().max(300).optional(),
  followUpDate: z.string().trim().max(40).optional(),
  notes: z.string().trim().max(2000).optional(),
  items: z.array(prescriptionItemSchema).min(1, 'At least one prescribed medicine item is required.').max(30)
}).strict();

const updatePrescriptionSchema = z.object({
  changeReason: nonEmptyTrimmed(3, 500),
  diagnosis: z.string().trim().max(300).optional(),
  followUpDate: z.string().trim().max(40).optional(),
  notes: z.string().trim().max(2000).optional(),
  items: z.array(prescriptionItemSchema).min(1, 'At least one medicine item is required.').max(30)
}).strict();

const saveNutritionSchema = z.object({
  id: z.string().trim().max(120).optional(),
  studentId: nonEmptyTrimmed(2, 40),
  studentName: z.string().trim().max(120).optional(),
  goal: nonEmptyTrimmed(2, 400),
  aiSuggested: z.boolean().optional(),
  doctorApproved: z.boolean().optional(),
  reviewDate: z.string().trim().max(40).optional(),
  targetCalories: z.coerce.number().min(500).max(6000).optional(),
  proteinG: z.coerce.number().min(0).max(500).optional(),
  carbsG: z.coerce.number().min(0).max(1000).optional(),
  fatG: z.coerce.number().min(0).max(500).optional(),
  meals: z.object({
    breakfast: z.array(z.string().trim().max(300)).max(15),
    midMorning: z.array(z.string().trim().max(300)).max(15).optional().default([]),
    lunch: z.array(z.string().trim().max(300)).max(15),
    evening: z.array(z.string().trim().max(300)).max(15).optional().default([]),
    dinner: z.array(z.string().trim().max(300)).max(15)
  }).strict(),
  foodsToLimit: z.array(z.string().trim().max(300)).max(30).optional().default([]),
  encouragingNotes: z.string().trim().max(1000).optional(),
  notes: z.string().trim().max(1000).optional()
}).strict();

const createMonitoringPlanSchema = z.object({
  studentId: nonEmptyTrimmed(2, 40),
  conditionName: nonEmptyTrimmed(2, 200),
  durationDays: z.coerce.number().int().min(1).max(30).default(3),
  startDate: z.string().trim().max(40).optional(),
  active: z.boolean().optional().default(true)
}).strict();

const updateMonitoringPlanSchema = z.object({
  conditionName: nonEmptyTrimmed(2, 200).optional(),
  durationDays: z.coerce.number().int().min(1).max(30).optional(),
  currentDay: z.coerce.number().int().min(1).max(30).optional(),
  active: z.boolean().optional()
}).strict().refine((obj) => Object.keys(obj).length > 0, {
  message: 'At least one update field is required.'
});

const createMonitoringResponseSchema = z.object({
  studentId: nonEmptyTrimmed(2, 40).optional(),
  planId: z.string().trim().max(120).optional(),
  date: nonEmptyTrimmed(4, 40),
  feeling: z.enum(['Better', 'Same', 'Worse']),
  symptomsImproving: z.boolean(),
  newSymptoms: z.boolean(),
  studentFeedback: z.string().trim().max(1000).optional().default('')
}).strict();

const createCalendarEventSchema = z.object({
  studentId: nonEmptyTrimmed(2, 40).optional(),
  title: nonEmptyTrimmed(2, 200),
  date: nonEmptyTrimmed(4, 40),
  time: z.string().trim().max(40).optional().default('10:00 AM'),
  eventType: z.enum([
    'Medical Consultation',
    'Follow-up',
    'Lab Test',
    'Daily Monitoring',
    'Prescription Reminder',
    'Nutrition Review',
    'Appointment',
    'Monitoring',
    'Vaccination',
    'Other'
  ]),
  status: z.enum(['Upcoming', 'Completed', 'Missed', 'Cancelled']).optional().default('Upcoming'),
  notes: z.string().trim().max(1000).optional()
}).strict();

const createNotificationSchema = z.object({
  recipientRole: z.enum([...ROLES, 'ALL']),
  studentId: z.string().trim().max(40).optional(),
  title: nonEmptyTrimmed(2, 160),
  message: nonEmptyTrimmed(2, 500),
  type: z.enum(['prescription', 'followup', 'monitoring', 'nutrition', 'system', 'emergency']).default('system')
}).strict();

const generateEmergencyTokenSchema = z.object({
  studentId: nonEmptyTrimmed(2, 40).optional()
}).strict();

const verifyEmergencyTokenSchema = z.object({
  token: nonEmptyTrimmed(10, 200),
  justification: z.string().trim().min(5).max(300).optional().default('Emergency medical triage lookup')
}).strict();

const updateInventorySchema = z.object({
  quantity: z.coerce.number().int().min(0).max(100000),
  minThreshold: z.coerce.number().int().min(1).max(10000).optional()
}).strict();

const bulkInventorySchema = z.object({
  action: z.enum(['set_all', 'restock_low', 'add_all']),
  amount: z.coerce.number().int().min(0).max(100000)
}).strict();

const deductInventorySchema = z.object({
  items: z.array(
    z.object({
      name: z.string().trim().max(200).optional(),
      medicineName: z.string().trim().max(200).optional(),
      quantity: z.coerce.number().int().min(1).max(5000).optional(),
      count: z.coerce.number().int().min(1).max(5000).optional()
    }).strict()
  ).min(1).optional(),
  medicineName: z.string().trim().max(200).optional(),
  count: z.coerce.number().int().min(1).max(5000).optional()
}).strict().refine((d) => (d.items && d.items.length > 0) || Boolean(d.medicineName), {
  message: 'Either items array or medicineName is required.'
});

const aiHealthQuestionSchema = z.object({
  question: z.string().trim().min(2).max(1000),
  context: z.string().trim().max(1000).optional().default('')
}).strict();

const aiNutritionQuerySchema = z.object({
  goal: z.string().trim().min(2).max(300),
  allergies: z.array(z.string().trim().max(100)).optional().default([]),
  preferences: z.string().trim().max(300).optional().default(''),
  currentBmi: z.coerce.number().min(5).max(100).optional().default(22)
}).strict();

const aiTrendQuerySchema = z.object({
  vitals: z.array(z.record(z.unknown())).min(1).max(30)
}).strict();

const aiVisitDraftSchema = z.object({
  chiefComplaint: z.string().trim().min(2).max(500),
  diagnosis: z.string().trim().min(2).max(500),
  vitals: z.record(z.unknown()).optional().default({}),
  clinicalNotes: z.string().trim().max(2000).optional().default('')
}).strict();

module.exports = {
  ROLES,
  registerSchema,
  loginSchema,
  changePasswordSchema,
  adminCreateUserSchema,
  adminUpdateRoleSchema,
  adminUpdateStatusSchema,
  studentProfileSelfUpdateSchema,
  clinicianProfileUpdateSchema,
  createVisitSchema,
  createPrescriptionSchema,
  updatePrescriptionSchema,
  saveNutritionSchema,
  createMonitoringPlanSchema,
  updateMonitoringPlanSchema,
  createMonitoringResponseSchema,
  createCalendarEventSchema,
  createNotificationSchema,
  generateEmergencyTokenSchema,
  verifyEmergencyTokenSchema,
  updateInventorySchema,
  bulkInventorySchema,
  deductInventorySchema,
  aiHealthQuestionSchema,
  aiNutritionQuerySchema,
  aiTrendQuerySchema,
  aiVisitDraftSchema
};
