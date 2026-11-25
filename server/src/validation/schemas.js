const { z } = require('zod');

// Common primitives
const idSchema = z.string().trim().min(1, 'ID is required');
const emailSchema = z.string().trim().email('Invalid email address').toLowerCase();
const passwordSchema = z.string().min(6, 'Password must be at least 6 characters').max(128, 'Password cannot exceed 128 characters');

// Auth Schemas
const loginSchema = z.object({
  identifier: z.string().trim().min(1, 'Identifier (email, username, or roll number) is required'),
  password: z.string().min(1, 'Password is required')
}).strict();

const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
  email: emailSchema,
  password: passwordSchema,
  role: z.enum(['STUDENT']).default('STUDENT'), // Public registration is strictly STUDENT only
  studentId: z.string().trim().optional(),
  department: z.string().trim().optional(),
  year: z.union([z.number(), z.string()]).optional(),
  phone: z.string().trim().optional(),
  bloodGroup: z.string().trim().optional(),
  allergies: z.union([z.array(z.string()), z.string()]).optional(),
  chronicConditions: z.union([z.array(z.string()), z.string()]).optional(),
  emergencyContact: z.object({
    name: z.string().optional(),
    relation: z.string().optional(),
    phone: z.string().optional()
  }).optional()
}).strict();

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: passwordSchema
}).strict();

// Student Profile Update Schema
const updateProfileSchema = z.object({
  name: z.string().trim().min(2).optional(),
  phone: z.string().trim().optional(),
  department: z.string().trim().optional(),
  year: z.union([z.number(), z.string()]).optional(),
  bloodGroup: z.string().trim().optional(),
  dateOfBirth: z.string().optional(),
  gender: z.string().optional(),
  hostelBlock: z.string().optional(),
  roomNumber: z.string().optional(),
  allergies: z.union([z.array(z.string()), z.string()]).optional(),
  chronicConditions: z.union([z.array(z.string()), z.string()]).optional(),
  currentMedications: z.union([z.array(z.string()), z.string()]).optional(),
  emergencyContact: z.object({
    name: z.string().optional(),
    relation: z.string().optional(),
    phone: z.string().optional()
  }).optional(),
  notes: z.string().optional()
}).strict();

// Medical Consultation / Visit Schemas
const createVisitSchema = z.object({
  studentId: idSchema,
  studentName: z.string().trim().optional(),
  symptoms: z.union([z.array(z.string()), z.string()]),
  vitals: z.object({
    bloodPressure: z.string().optional(),
    heartRate: z.union([z.number(), z.string()]).optional(),
    temperature: z.union([z.number(), z.string()]).optional(),
    respiratoryRate: z.union([z.number(), z.string()]).optional(),
    oxygenSaturation: z.union([z.number(), z.string()]).optional(),
    weight: z.union([z.number(), z.string()]).optional(),
    height: z.union([z.number(), z.string()]).optional(),
    bmi: z.union([z.number(), z.string()]).optional(),
    bmiStatus: z.string().optional()
  }).optional().default({}),
  diagnosis: z.string().trim().min(1, 'Diagnosis is required'),
  treatment: z.string().optional().default(''),
  prescriptions: z.array(z.any()).optional().default([]),
  status: z.enum(['IN_PROGRESS', 'COMPLETED', 'REFERRED']).optional().default('COMPLETED'),
  followUpDate: z.string().optional(),
  notes: z.string().optional().default('')
}).strict();

// Prescription Medication Item Schema
const prescriptionItemSchema = z.object({
  medicine: z.string().trim().min(1, 'Medicine name is required'),
  dosage: z.string().trim().min(1, 'Dosage is required'),
  frequency: z.string().trim().min(1, 'Frequency is required'),
  duration: z.string().trim().min(1, 'Duration is required'),
  quantity: z.union([z.number().positive(), z.string()]).optional(),
  instructions: z.string().optional().default(''),
  timing: z.string().optional(),
  stock: z.union([z.number(), z.string()]).optional()
});

const createPrescriptionSchema = z.object({
  studentId: idSchema,
  studentName: z.string().trim().optional(),
  visitId: z.string().trim().optional(),
  diagnosis: z.string().trim().optional().default(''),
  medications: z.array(prescriptionItemSchema).min(1, 'At least one medication is required'),
  instructions: z.string().optional().default(''),
  status: z.enum(['ACTIVE', 'COMPLETED', 'DISCONTINUED']).optional().default('ACTIVE'),
  validUntil: z.string().optional()
}).strict();

const updatePrescriptionSchema = z.object({
  medications: z.array(prescriptionItemSchema).optional(),
  instructions: z.string().optional(),
  status: z.enum(['ACTIVE', 'COMPLETED', 'DISCONTINUED']).optional(),
  validUntil: z.string().optional(),
  changeReason: z.string().trim().optional().default('Clinical update')
}).strict();

// Monitoring Plan & Response Schemas
const createMonitoringPlanSchema = z.object({
  studentId: idSchema,
  condition: z.string().trim().min(1, 'Condition is required'),
  metrics: z.array(z.string()).min(1, 'At least one metric is required'),
  frequency: z.string().trim().min(1, 'Frequency is required'),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  instructions: z.string().optional().default(''),
  status: z.enum(['ACTIVE', 'COMPLETED', 'PAUSED']).optional().default('ACTIVE')
}).strict();

const submitMonitoringResponseSchema = z.object({
  planId: idSchema,
  metrics: z.record(z.any()),
  notes: z.string().optional().default(''),
  symptoms: z.array(z.string()).optional()
}).strict();

// Nutrition Plan Schema
const createNutritionPlanSchema = z.object({
  studentId: idSchema,
  bmi: z.union([z.number(), z.string()]).optional(),
  dailyCalories: z.union([z.number(), z.string()]).optional(),
  macronutrients: z.object({
    protein: z.union([z.number(), z.string()]).optional(),
    carbs: z.union([z.number(), z.string()]).optional(),
    fats: z.union([z.number(), z.string()]).optional()
  }).optional(),
  dietaryRestrictions: z.array(z.string()).optional().default([]),
  allergies: z.array(z.string()).optional().default([]),
  mealRecommendations: z.array(z.any()).optional().default([]),
  hydrationGoalLiters: z.number().optional().default(2.5),
  notes: z.string().optional().default('')
}).strict();

// Calendar Event Schema
const calendarEventSchema = z.object({
  title: z.string().trim().min(1, 'Title is required'),
  description: z.string().optional().default(''),
  type: z.enum(['APPOINTMENT', 'CHECKUP', 'VACCINATION', 'FOLLOW_UP', 'CAMPUS_EVENT', 'OTHER']).default('APPOINTMENT'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().optional(),
  studentId: z.string().optional(),
  staffId: z.string().optional(),
  location: z.string().optional().default('Campus Health Center'),
  status: z.enum(['SCHEDULED', 'COMPLETED', 'CANCELLED']).optional().default('SCHEDULED')
}).strict();

// Inventory Schemas
const inventoryDeductSchema = z.object({
  items: z.array(
    z.object({
      medicine: z.string().trim().min(1, 'Medicine name is required'),
      quantity: z.number().int().positive('Quantity must be greater than zero')
    })
  ).min(1, 'At least one item is required to deduct')
}).strict();

const inventoryBulkLoadSchema = z.object({
  items: z.array(
    z.object({
      id: z.string().optional(),
      catalogId: z.string().optional(),
      name: z.string().trim().min(1, 'Medicine name is required'),
      generic: z.string().optional().default(''),
      category: z.string().optional().default('General'),
      quantity: z.number().int().min(0, 'Quantity cannot be negative'),
      minThreshold: z.number().int().optional().default(10),
      batchNumber: z.string().optional().default(''),
      expiryDate: z.string().optional().default(''),
      status: z.string().optional()
    })
  ).min(1, 'At least one item is required')
}).strict();

// Emergency Access Schemas
const emergencyTokenSchema = z.object({
  studentId: idSchema,
  justification: z.string().trim().min(5, 'A clinical justification of at least 5 characters is required'),
  reason: z.string().optional()
}).strict();

const emergencyVerifySchema = z.object({
  token: z.string().trim().min(1, 'Emergency token is required')
}).strict();

// AI Query Schema
const aiChatSchema = z.object({
  prompt: z.string().trim().min(1, 'Prompt is required').max(2000, 'Prompt too long'),
  category: z.enum(['HEALTH_INFO', 'NUTRITION', 'TREND_EXPLANATION', 'CONSULTATION_NOTE']).default('HEALTH_INFO'),
  context: z.record(z.any()).optional().default({})
}).strict();

module.exports = {
  loginSchema,
  registerSchema,
  changePasswordSchema,
  updateProfileSchema,
  createVisitSchema,
  createPrescriptionSchema,
  updatePrescriptionSchema,
  createMonitoringPlanSchema,
  submitMonitoringResponseSchema,
  createNutritionPlanSchema,
  calendarEventSchema,
  inventoryDeductSchema,
  inventoryBulkLoadSchema,
  emergencyTokenSchema,
  emergencyVerifySchema,
  aiChatSchema
};
