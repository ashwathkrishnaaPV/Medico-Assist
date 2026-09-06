import {
  User,
  StudentProfileData,
  MedicalVisit,
  Prescription,
  DailyMonitoringPlan,
  DailyMonitoringResponse,
  NutritionPlan,
  HealthCalendarEvent,
  NotificationItem,
  AuditLogEntry,
  LabReport
} from '../types';

export const initialUsers: User[] = [];

export const initialStudentProfiles: Record<string, StudentProfileData> = {};

export const initialVisits: MedicalVisit[] = [];

export const initialPrescriptions: Prescription[] = [];

export const initialNutritionPlans: NutritionPlan[] = [];

export const initialMonitoringPlans: DailyMonitoringPlan[] = [];

export const initialMonitoringResponses: DailyMonitoringResponse[] = [];

export const initialLabReports: LabReport[] = [];

export const initialCalendarEvents: HealthCalendarEvent[] = [];

export const initialNotifications: NotificationItem[] = [];

export const initialAuditLogs: AuditLogEntry[] = [];
