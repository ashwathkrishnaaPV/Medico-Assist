import api from './api';
import {
  StudentProfileData, MedicalVisit, Prescription, PrescriptionVersion,
  DailyMonitoringPlan, DailyMonitoringResponse, NutritionPlan,
  HealthCalendarEvent, NotificationItem, AuditLogEntry, LabReport, RestrictedEmergencyView
} from '../types';

class HealthStore {
  private profiles: Record<string, StudentProfileData> = {};
  private visits: MedicalVisit[] = [];
  private prescriptions: Prescription[] = [];
  private nutritionPlans: NutritionPlan[] = [];
  private monitoringPlans: DailyMonitoringPlan[] = [];
  private monitoringResponses: DailyMonitoringResponse[] = [];
  private labReports: LabReport[] = [];
  private calendarEvents: HealthCalendarEvent[] = [];
  private notifications: NotificationItem[] = [];
  private auditLogs: AuditLogEntry[] = [];
  private listeners: Array<() => void> = [];
  private initialized = false;

  constructor() {
    // Load data from API as soon as a token is available
    this.tryInit();
  }

  async tryInit() {
    const token = localStorage.getItem('campushealth_token');
    if (!token || this.initialized) return;
    await this.loadFromAPI();
  }

  async loadFromAPI() {
    try {
      const [profiles, visits, prescriptions, nutrition, monPlans, monResp, calendar, notifs, audit] = await Promise.all([
        api.get('/profiles').then(r => r.data).catch(() => []),
        api.get('/visits').then(r => r.data).catch(() => []),
        api.get('/prescriptions').then(r => r.data).catch(() => []),
        api.get('/nutrition').then(r => r.data).catch(() => []),
        api.get('/monitoring/plans').then(r => r.data).catch(() => []),
        api.get('/monitoring/responses').then(r => r.data).catch(() => []),
        api.get('/calendar').then(r => r.data).catch(() => []),
        api.get('/notifications').then(r => r.data).catch(() => []),
        api.get('/audit').then(r => r.data).catch(() => []),
      ]);

      this.profiles = {};
      (profiles as StudentProfileData[]).forEach(p => { this.profiles[p.studentId] = { ...p, id: (p as any)._id || p.id }; });
      this.visits = visits.map((v: any) => ({ ...v, id: v._id || v.id }));
      this.prescriptions = prescriptions.map((p: any) => ({ ...p, id: p._id || p.id }));
      this.nutritionPlans = nutrition.map((n: any) => ({ ...n, id: n._id || n.id }));
      this.monitoringPlans = monPlans.map((m: any) => ({ ...m, id: m._id || m.id }));
      this.monitoringResponses = monResp.map((r: any) => ({ ...r, id: r._id || r.id }));
      this.calendarEvents = calendar.map((c: any) => ({ ...c, id: c._id || c.id }));
      this.notifications = notifs.map((n: any) => ({ ...n, id: n._id || n.id, recipientRole: n.targetRole, studentId: n.targetStudentId }));
      this.auditLogs = audit.map((a: any) => ({ ...a, id: a._id || a.id }));
      this.initialized = true;
      this.notify();
    } catch (err) {
      console.error('Failed to load from API:', err);
    }
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    // Trigger initial load if not done yet
    if (!this.initialized) this.tryInit();
    return () => { this.listeners = this.listeners.filter(l => l !== listener); };
  }

  private notify() {
    this.listeners.forEach(l => l());
  }

  // --- Profile Queries & Mutations ---
  getStudentProfile(studentId: string): StudentProfileData | undefined {
    return this.profiles[studentId];
  }

  getAllStudentProfiles(): StudentProfileData[] {
    return Object.values(this.profiles);
  }

  createOrUpdateStudentProfile(profileData: StudentProfileData): StudentProfileData {
    this.profiles[profileData.studentId] = profileData;
    this.notify();
    api.post('/profiles', profileData).catch(console.error);
    this.logAudit(profileData.studentId, profileData.name, 'STUDENT', 'SAVE_STUDENT_PROFILE', profileData.studentId, `Saved student profile for ${profileData.name}`, 'LOW');
    return profileData;
  }

  deleteStudentProfile(studentId: string): void {
    delete this.profiles[studentId];
    this.visits = this.visits.filter(v => v.studentId !== studentId);
    this.prescriptions = this.prescriptions.filter(p => p.studentId !== studentId);
    this.nutritionPlans = this.nutritionPlans.filter(n => n.studentId !== studentId);
    this.monitoringPlans = this.monitoringPlans.filter(m => m.studentId !== studentId);
    this.monitoringResponses = this.monitoringResponses.filter(r => r.studentId !== studentId);
    this.notify();
  }

  updateStudentMeasurements(studentId: string, heightCm: number, weightKg: number): StudentProfileData | undefined {
    const profile = this.profiles[studentId];
    if (!profile) return undefined;
    const heightM = heightCm / 100;
    const bmi = parseFloat((weightKg / (heightM * heightM)).toFixed(1));
    const updated = { ...profile, heightCm, weightKg, bmi, lastUpdated: new Date().toISOString().split('T')[0] };
    this.profiles[studentId] = updated;
    api.post('/profiles', updated).catch(console.error);
    this.notify();
    return updated;
  }

  // --- Visit & Clinical History ---
  getVisitsForStudent(studentId: string): MedicalVisit[] {
    return this.visits.filter(v => v.studentId === studentId).sort((a, b) => b.visitDate.localeCompare(a.visitDate));
  }

  getAllVisits(): MedicalVisit[] {
    return [...this.visits].sort((a, b) => b.visitDate.localeCompare(a.visitDate));
  }

  addMedicalVisit(visitData: Omit<MedicalVisit, 'id'>): MedicalVisit {
    const id = `visit_${Date.now()}`;
    const newVisit: MedicalVisit = { ...visitData, id };
    this.visits.unshift(newVisit);
    if (visitData.vitals.heightCm && visitData.vitals.weightKg) {
      this.updateStudentMeasurements(visitData.studentId, visitData.vitals.heightCm, visitData.vitals.weightKg);
    }
    this.notify();
    api.post('/visits', newVisit).then(r => { newVisit.id = r.data._id || r.data.id; }).catch(console.error);
    this.logAudit('DOC402', visitData.doctorName, 'MEDICAL_STAFF', 'ADD_CLINICAL_VISIT', visitData.studentId, `Added visit: ${visitData.diagnosis}`, 'MEDIUM');
    return newVisit;
  }

  // --- Prescriptions & Versioning ---
  getPrescriptionsForStudent(studentId: string): Prescription[] {
    return this.prescriptions.filter(p => p.studentId === studentId);
  }

  getPrescriptionById(rxId: string): Prescription | undefined {
    return this.prescriptions.find(p => p.id === rxId);
  }

  createPrescription(rxData: { studentId: string; doctorName: string; items: PrescriptionVersion['items']; followUpDate?: string; notes?: string; }): Prescription {
    const id = `rx_${Date.now()}`;
    const initialVer: PrescriptionVersion = {
      version: 1, prescriptionId: id,
      createdAt: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      createdByDoctor: rxData.doctorName, status: 'ACTIVE',
      followUpDate: rxData.followUpDate, notes: rxData.notes, items: rxData.items
    };
    const newRx: Prescription = {
      id, studentId: rxData.studentId, doctorName: rxData.doctorName,
      createdAt: new Date().toISOString().split('T')[0], status: 'ACTIVE',
      followUpDate: rxData.followUpDate, currentVersion: initialVer, history: [initialVer]
    };
    this.prescriptions.unshift(newRx);
    this.addNotification({ recipientRole: 'STUDENT', studentId: rxData.studentId, title: 'Prescription Issued', message: `${rxData.doctorName} prescribed ${rxData.items.length} item(s).`, type: 'prescription' });
    this.notify();
    api.post('/prescriptions', newRx).then(r => { newRx.id = r.data._id || r.data.id; }).catch(console.error);
    this.logAudit('DOC402', rxData.doctorName, 'MEDICAL_STAFF', 'CREATE_PRESCRIPTION_V1', id, `Issued prescription to ${rxData.studentId}`, 'HIGH');
    return newRx;
  }

  updatePrescriptionVersion(rxId: string, updateData: { doctorName: string; items: PrescriptionVersion['items']; followUpDate?: string; notes?: string; changeReason: string; }): Prescription | undefined {
    const rx = this.prescriptions.find(p => p.id === rxId);
    if (!rx) return undefined;
    const nextVerNumber = rx.currentVersion.version + 1;
    const newVer: PrescriptionVersion = {
      version: nextVerNumber, prescriptionId: rxId,
      createdAt: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      createdByDoctor: updateData.doctorName, status: 'ACTIVE',
      followUpDate: updateData.followUpDate || rx.followUpDate,
      notes: updateData.notes, changeReason: updateData.changeReason, items: updateData.items
    };
    rx.history.forEach(h => { if (h.version === rx.currentVersion.version) h.status = 'MODIFIED'; });
    rx.status = 'MODIFIED'; rx.currentVersion = newVer; rx.history.unshift(newVer);
    if (updateData.followUpDate) rx.followUpDate = updateData.followUpDate;
    this.addNotification({ recipientRole: 'STUDENT', studentId: rx.studentId, title: `Prescription Updated (v${nextVerNumber})`, message: `${updateData.doctorName} updated your prescription. Reason: ${updateData.changeReason}`, type: 'prescription' });
    this.notify();
    api.put(`/prescriptions/${rxId}`, rx).catch(console.error);
    this.logAudit('DOC402', updateData.doctorName, 'MEDICAL_STAFF', `UPDATE_PRESCRIPTION_V${nextVerNumber}`, rxId, `Updated prescription for ${rx.studentId}. Reason: ${updateData.changeReason}`, 'HIGH');
    return rx;
  }

  // --- Nutrition Plans ---
  getNutritionPlanForStudent(studentId: string): NutritionPlan | undefined {
    return this.nutritionPlans.find(n => n.studentId === studentId);
  }

  saveNutritionPlan(plan: NutritionPlan): NutritionPlan {
    const idx = this.nutritionPlans.findIndex(n => n.studentId === plan.studentId);
    if (idx >= 0) this.nutritionPlans[idx] = plan; else this.nutritionPlans.unshift(plan);
    if ((plan as any).doctorApproved) {
      this.addNotification({ recipientRole: 'STUDENT', studentId: plan.studentId, title: 'Nutrition Plan Approved', message: 'Your clinician approved your nutrition plan.', type: 'nutrition' });
    }
    this.notify();
    api.post('/nutrition', plan).catch(console.error);
    this.logAudit('DOC402', (plan as any).approvedBy || 'Doctor', 'MEDICAL_STAFF', 'SAVE_NUTRITION_PLAN', plan.studentId, `Saved nutrition plan`, 'MEDIUM');
    return plan;
  }

  // --- Daily Monitoring ---
  getMonitoringPlan(studentId: string): DailyMonitoringPlan | undefined {
    return this.monitoringPlans.find(m => m.studentId === studentId && m.active);
  }

  activateMonitoringPlan(studentId: string, conditionName: string, durationDays: number, createdBy: string): DailyMonitoringPlan {
    const plan: DailyMonitoringPlan = { id: `mon_${Date.now()}`, studentId, conditionName, startDate: new Date().toISOString().split('T')[0], durationDays, currentDay: 1, active: true, createdBy };
    const existingIdx = this.monitoringPlans.findIndex(m => m.studentId === studentId);
    if (existingIdx >= 0) this.monitoringPlans[existingIdx] = plan; else this.monitoringPlans.unshift(plan);
    this.addNotification({ recipientRole: 'STUDENT', studentId, title: 'Daily Health Monitoring Active', message: `Your medical centre started a ${durationDays}-day check for ${conditionName}.`, type: 'monitoring' });
    this.notify();
    api.post('/monitoring/plans', plan).catch(console.error);
    return plan;
  }

  getMonitoringResponses(studentId: string): DailyMonitoringResponse[] {
    return this.monitoringResponses.filter(r => r.studentId === studentId).sort((a, b) => b.date.localeCompare(a.date));
  }

  submitDailyResponse(studentId: string, response: Omit<DailyMonitoringResponse, 'id' | 'status'>): DailyMonitoringResponse {
    let status: DailyMonitoringResponse['status'] = 'Stable';
    if (response.feeling === 'Better' && !response.newSymptoms) status = 'Improving';
    if (response.feeling === 'Worse' || response.newSymptoms) status = 'Needs Review';
    const newResp: DailyMonitoringResponse = { ...response, id: `resp_${Date.now()}`, status };
    this.monitoringResponses.unshift(newResp);
    if (status === 'Needs Review') {
      this.addNotification({ recipientRole: 'MEDICAL_STAFF', title: 'Monitoring Alert: Student Needs Review', message: `Student ${studentId} reported worsening symptoms.`, type: 'monitoring' });
    }
    this.notify();
    api.post('/monitoring/responses', newResp).catch(console.error);
    this.logAudit(studentId, 'Student', 'STUDENT', 'SUBMIT_DAILY_CHECK', studentId, `Daily check: Feeling ${response.feeling}, Status: ${status}`, 'LOW');
    return newResp;
  }

  // --- Calendar Events ---
  getCalendarEvents(studentId?: string): HealthCalendarEvent[] {
    if (studentId) return this.calendarEvents.filter(c => c.studentId === studentId);
    return [...this.calendarEvents];
  }

  addCalendarEvent(event: Omit<HealthCalendarEvent, 'id'>): HealthCalendarEvent {
    const newEv: HealthCalendarEvent = { ...event, id: `cal_${Date.now()}` };
    this.calendarEvents.unshift(newEv);
    this.notify();
    api.post('/calendar', newEv).catch(console.error);
    return newEv;
  }

  // --- Lab Reports ---
  getLabReports(studentId: string): LabReport[] {
    return this.labReports.filter(l => l.studentId === studentId);
  }

  // --- Notifications ---
  getNotifications(role: string, studentId?: string): NotificationItem[] {
    return this.notifications.filter(n => {
      if (role === 'STUDENT') return n.recipientRole === 'STUDENT' && n.studentId === studentId;
      return n.recipientRole === role;
    });
  }

  addNotification(notif: Omit<NotificationItem, 'id' | 'createdAt' | 'read'>): NotificationItem {
    const newN: NotificationItem = { ...notif, id: `notif_${Date.now()}`, createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), read: false };
    this.notifications.unshift(newN);
    this.notify();
    api.post('/notifications', { ...newN, targetRole: notif.recipientRole, targetStudentId: (notif as any).studentId }).catch(console.error);
    return newN;
  }

  markNotificationRead(id: string) {
    const item = this.notifications.find(n => n.id === id);
    if (item) { item.read = true; this.notify(); }
    api.put(`/notifications/${id}/read`).catch(console.error);
  }

  // --- Audit Logging & Emergency View ---
  getAuditLogs(): AuditLogEntry[] {
    return [...this.auditLogs].sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  }

  logAudit(userId: string, userName: string, userRole: any, action: string, resource: string, details: string, sensitivity: AuditLogEntry['sensitivity']) {
    const entry: AuditLogEntry = {
      id: `aud_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      userId, userName, userRole, action, resource, details,
      ipAddress: '10.20.4.' + (Math.floor(Math.random() * 50) + 1), sensitivity
    };
    this.auditLogs.unshift(entry);
    api.post('/audit', entry).catch(console.error);
  }

  getRestrictedEmergencyView(studentId: string, requestorInfo: string): RestrictedEmergencyView | undefined {
    const profile = this.profiles[studentId];
    if (!profile) return undefined;
    this.logAudit('EMERGENCY_SCANNER', requestorInfo, 'EMERGENCY_RESPONDER', 'RESTRICTED_EMERGENCY_QR_ACCESS', studentId, `Emergency card accessed for ${profile.name}`, 'CRITICAL');
    this.notify();
    return {
      studentName: profile.name, studentId: profile.studentId, bloodGroup: profile.bloodGroup,
      accommodation: profile.accommodation || '', hostelBlock: profile.hostelBlock, hostelRoom: profile.hostelRoom,
      criticalAllergies: profile.criticalAllergies, criticalConditions: profile.criticalConditions,
      criticalMedications: profile.criticalMedications, emergencyContact: profile.emergencyContact,
      medicalCentreContact: profile.medicalCentreContact, token: `EMERGENCY_TOKEN_${profile.studentId}_${Date.now()}`
    };
  }

  resetState() {
    this.profiles = {}; this.visits = []; this.prescriptions = [];
    this.nutritionPlans = []; this.monitoringPlans = []; this.monitoringResponses = [];
    this.labReports = []; this.calendarEvents = []; this.notifications = []; this.auditLogs = [];
    this.initialized = false;
    localStorage.removeItem('campushealth_token');
    localStorage.removeItem('campushealth_user');
    this.notify();
  }
}

export const healthStore = new HealthStore();
