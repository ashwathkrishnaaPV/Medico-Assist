import api, { unwrapData, extractApiError } from './api';
import { authService } from './authService';
import {
  StudentProfileData, MedicalVisit, Prescription, PrescriptionVersion,
  DailyMonitoringPlan, DailyMonitoringResponse, NutritionPlan,
  HealthCalendarEvent, NotificationItem, AuditLogEntry, LabReport,
  MedicineStockItem, StockStatus
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
  private medicineInventory: MedicineStockItem[] = [];
  private activeDoctorPatientId: string = '';
  private listeners: Array<() => void> = [];
  private initialized = false;
  private loadingPromise: Promise<void> | null = null;

  public getActiveDoctorPatientId(): string {
    return this.activeDoctorPatientId;
  }

  public setActiveDoctorPatientId(studentId: string): void {
    this.activeDoctorPatientId = studentId;
    this.notify();
  }

  private activeClinicalAssessment: {
    studentId: string;
    chiefComplaint: string;
    diagnosis?: string;
    clinicalNotes?: string;
  } = { studentId: '', chiefComplaint: '' };

  public getActiveClinicalAssessment(studentId?: string): { chiefComplaint: string; diagnosis: string; clinicalNotes: string } {
    const targetId = studentId || this.activeDoctorPatientId;
    if (targetId) {
      if (this.activeClinicalAssessment.studentId === targetId && this.activeClinicalAssessment.chiefComplaint) {
        return {
          chiefComplaint: this.activeClinicalAssessment.chiefComplaint || '',
          diagnosis: this.activeClinicalAssessment.diagnosis || '',
          clinicalNotes: this.activeClinicalAssessment.clinicalNotes || ''
        };
      }
      try {
        const stored = localStorage.getItem('campushealth_assessment_' + targetId);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed && parsed.studentId === targetId && parsed.chiefComplaint) {
            this.activeClinicalAssessment = parsed;
            return {
              chiefComplaint: parsed.chiefComplaint || '',
              diagnosis: parsed.diagnosis || '',
              clinicalNotes: parsed.clinicalNotes || ''
            };
          }
        }
      } catch {}
      const visits = this.getVisitsForStudent(targetId);
      if (visits.length > 0) {
        return {
          chiefComplaint: visits[0].chiefComplaint || '',
          diagnosis: visits[0].diagnosis || '',
          clinicalNotes: visits[0].clinicalNotes || ''
        };
      }
      return { chiefComplaint: '', diagnosis: '', clinicalNotes: '' };
    }
    return {
      chiefComplaint: this.activeClinicalAssessment.chiefComplaint || '',
      diagnosis: this.activeClinicalAssessment.diagnosis || '',
      clinicalNotes: this.activeClinicalAssessment.clinicalNotes || ''
    };
  }

  public setActiveClinicalAssessment(data: { studentId: string; chiefComplaint: string; diagnosis?: string; clinicalNotes?: string }): void {
    this.activeClinicalAssessment = {
      studentId: data.studentId,
      chiefComplaint: data.chiefComplaint,
      diagnosis: data.diagnosis !== undefined ? data.diagnosis : this.activeClinicalAssessment.diagnosis,
      clinicalNotes: data.clinicalNotes !== undefined ? data.clinicalNotes : this.activeClinicalAssessment.clinicalNotes
    };
    try {
      localStorage.setItem('campushealth_assessment_' + data.studentId, JSON.stringify(this.activeClinicalAssessment));
    } catch {}
    this.notify();
  }


  public isInitialized(): boolean {
    return this.initialized;
  }

  constructor() {
    try {
      localStorage.removeItem('campushealth_cached_profiles');
    } catch {}
  }

  async tryInit() {
    if (!authService.isAuthenticated() || this.initialized) return;
    await this.loadFromAPI();
  }

  async loadFromAPI(): Promise<void> {
    if (!authService.isAuthenticated()) return;
    if (this.loadingPromise) return this.loadingPromise;

    this.loadingPromise = (async () => {
      try {
        const role = authService.getCurrentUser()?.role;
        const canClinical = role === 'MEDICAL_STAFF' || role === 'STUDENT';
        const canAdminAudit = role === 'ADMIN';
        const canInventory = role === 'ADMIN' || role === 'MEDICAL_STAFF';

        const fetchArray = <T = any>(url: string, allowed: boolean): Promise<T[]> => {
          if (!allowed) return Promise.resolve([]);
          return api
            .get(url)
            .then((r) => {
              const data = unwrapData<T[]>(r);
              return Array.isArray(data) ? data : [];
            })
            .catch(() => []);
        };

        const [profiles, visits, prescriptions, nutrition, monPlans, monResp, calendar, notifs, audit, inventory] =
          await Promise.all([
            fetchArray('/profiles', role === 'STUDENT' || role === 'MEDICAL_STAFF' || role === 'ADMIN'),
            fetchArray('/visits', canClinical),
            fetchArray('/prescriptions', canClinical),
            fetchArray('/nutrition', canClinical),
            fetchArray('/monitoring/plans', canClinical),
            fetchArray('/monitoring/responses', canClinical),
            fetchArray('/calendar', canClinical),
            fetchArray('/notifications', true),
            fetchArray('/audit', canAdminAudit),
            fetchArray('/inventory', canInventory),
          ]);

        this.profiles = {};
        (profiles as StudentProfileData[]).forEach((p) => {
          if (p?.studentId) {
            this.profiles[p.studentId] = { ...p, id: (p as any)._id || p.id };
          }
        });
        this.visits = visits.map((v: any) => ({ ...v, id: v._id || v.id }));
        this.prescriptions = prescriptions.map((p: any) => ({ ...p, id: p._id || p.id }));
        this.nutritionPlans = nutrition.map((n: any) => ({ ...n, id: n._id || n.id }));
        this.monitoringPlans = monPlans.map((m: any) => ({ ...m, id: m._id || m.id }));
        this.monitoringResponses = monResp.map((r: any) => ({ ...r, id: r._id || r.id }));
        this.calendarEvents = calendar.map((c: any) => ({ ...c, id: c._id || c.id }));
        this.notifications = notifs.map((n: any) => ({
          ...n,
          id: n._id || n.id,
          recipientRole: n.recipientRole || n.targetRole,
          studentId: n.studentId || n.targetStudentId,
          read: Boolean(n.read),
        }));
        this.auditLogs = audit.map((a: any) => ({ ...a, id: a._id || a.id }));
        this.medicineInventory = inventory.map((it: any) => {
          const q = Number(it.quantity) || 0;
          const status = q >= 50 ? 'Full Stock' : q >= 10 ? 'Less Stock' : 'Restock';
          return {
            id: it.id || `med_${it.catalogId}`,
            catalogId: it.catalogId,
            name: it.name,
            generic: it.generic || '',
            category: it.category || 'Tablet',
            isTablet: Boolean(it.isTablet),
            defaultDosage: it.defaultDosage || '',
            symptoms: it.symptoms || '',
            quantity: q,
            minThreshold: Number(it.minThreshold) || 20,
            status: (it.status || status) as StockStatus,
            lastRestocked: it.lastRestocked,
            updatedAt: it.updatedAt,
          };
        });

        this.initialized = true;
        this.notify();
      } catch (err) {
        console.error('Failed to load from API:', err);
      } finally {
        this.loadingPromise = null;
      }
    })();

    return this.loadingPromise;
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

  private normalizeStudentId(id?: string): string {
    return (id || '').trim().toLowerCase().replace(/^user_/i, '');
  }

  // --- Profile Queries & Mutations ---
  getStudentProfile(studentId: string): StudentProfileData | undefined {
    if (!studentId) return undefined;
    if (this.profiles[studentId]) return this.profiles[studentId];
    const norm = this.normalizeStudentId(studentId);
    if (this.profiles[norm]) return this.profiles[norm];
    if (this.profiles[`user_${norm}`]) return this.profiles[`user_${norm}`];
    return Object.values(this.profiles).find(p => 
      this.normalizeStudentId(p.studentId) === norm ||
      this.normalizeStudentId(p.id || '') === norm
    );
  }

  getAllStudentProfiles(): StudentProfileData[] {
    return Object.values(this.profiles);
  }

  async createOrUpdateStudentProfile(profileData: StudentProfileData): Promise<StudentProfileData> {
    const previous = this.profiles[profileData.studentId] ? { ...this.profiles[profileData.studentId] } : undefined;
    this.profiles[profileData.studentId] = profileData;
    this.notify();

    try {
      const res = await api.post('/profiles', profileData);
      const created = unwrapData<any>(res);
      if (created) {
        this.profiles[profileData.studentId] = {
          ...profileData,
          ...created,
          id: created._id || created.id || profileData.id
        };
        this.notify();
      }
      return this.profiles[profileData.studentId];
    } catch (err) {
      if (previous) {
        this.profiles[profileData.studentId] = previous;
      } else {
        delete this.profiles[profileData.studentId];
      }
      this.notify();
      throw new Error(extractApiError(err, 'Failed to save student profile on server.'));
    }
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

  async updateStudentMeasurements(studentId: string, heightCm: number, weightKg: number): Promise<StudentProfileData | undefined> {
    const profile = this.profiles[studentId];
    if (!profile) return undefined;
    const heightM = heightCm / 100;
    const bmi = parseFloat((weightKg / (heightM * heightM)).toFixed(1));
    const previous = { ...profile };
    const updated = { ...profile, heightCm, weightKg, bmi, lastUpdated: new Date().toISOString().split('T')[0] };
    this.profiles[studentId] = updated;
    this.notify();

    try {
      const res = await api.put(`/profiles/${studentId}/vitals`, { heightCm, weightKg });
      const data = unwrapData<any>(res);
      if (data) {
        this.profiles[studentId] = { ...updated, ...data };
        this.notify();
      }
      return this.profiles[studentId];
    } catch {
      // Fallback try POST /profiles
      try {
        const res = await api.post('/profiles', updated);
        const data = unwrapData<any>(res);
        if (data) {
          this.profiles[studentId] = { ...updated, ...data };
          this.notify();
        }
        return this.profiles[studentId];
      } catch (err) {
        this.profiles[studentId] = previous;
        this.notify();
        throw new Error(extractApiError(err, 'Failed to update student vitals on server.'));
      }
    }
  }

  // --- Visit & Clinical History ---
  getVisitsForStudent(studentId: string): MedicalVisit[] {
    const norm = this.normalizeStudentId(studentId);
    return this.visits.filter(v => this.normalizeStudentId(v.studentId) === norm).sort((a, b) => b.visitDate.localeCompare(a.visitDate));
  }

  getAllVisits(): MedicalVisit[] {
    return [...this.visits].sort((a, b) => b.visitDate.localeCompare(a.visitDate));
  }

  async addMedicalVisit(visitData: Omit<MedicalVisit, 'id'>): Promise<MedicalVisit> {
    const id = `visit_${Date.now()}`;
    const newVisit: MedicalVisit = { ...visitData, id };
    const snapshot = [...this.visits];
    this.visits.unshift(newVisit);

    if (visitData.vitals.heightCm && visitData.vitals.weightKg) {
      void this.updateStudentMeasurements(visitData.studentId, visitData.vitals.heightCm, visitData.vitals.weightKg);
    }
    this.notify();

    try {
      const res = await api.post('/visits', {
        studentId: visitData.studentId,
        studentName: visitData.studentName,
        visitType: visitData.visitType,
        visitDate: visitData.visitDate,
        time: visitData.time,
        doctorName: visitData.doctorName,
        chiefComplaint: visitData.chiefComplaint,
        diagnosis: visitData.diagnosis,
        clinicalNotes: visitData.clinicalNotes,
        vitals: visitData.vitals,
        prescriptionId: visitData.prescriptionId,
        nutritionPlanId: visitData.nutritionPlanId,
        monitoringPlanActive: visitData.monitoringPlanActive,
        status: visitData.status
      });
      const created = unwrapData<any>(res);
      if (created) {
        newVisit.id = created._id || created.id || newVisit.id;
      }
      this.notify();
      return newVisit;
    } catch (err) {
      this.visits = snapshot;
      this.notify();
      throw new Error(extractApiError(err, 'Failed to save medical visit on server.'));
    }
  }

  // --- Prescriptions & Versioning ---
  getPrescriptionsForStudent(studentId: string): Prescription[] {
    const norm = this.normalizeStudentId(studentId);
    return this.prescriptions.filter(p => this.normalizeStudentId(p.studentId) === norm);
  }

  getPrescriptionById(rxId: string): Prescription | undefined {
    return this.prescriptions.find(p => p.id === rxId || (p as any)._id === rxId);
  }

  async createPrescription(rxData: {
    studentId: string;
    doctorName: string;
    diagnosis?: string;
    items: PrescriptionVersion['items'];
    followUpDate?: string;
    notes?: string;
  }): Promise<Prescription> {
    const id = `rx_${Date.now()}`;
    const initialVer: PrescriptionVersion = {
      version: 1,
      prescriptionId: id,
      createdAt: new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      createdByDoctor: rxData.doctorName,
      status: 'ACTIVE',
      diagnosis: rxData.diagnosis,
      followUpDate: rxData.followUpDate,
      notes: rxData.notes,
      items: rxData.items
    };
    const newRx: Prescription = {
      id,
      studentId: rxData.studentId,
      doctorName: rxData.doctorName,
      diagnosis: rxData.diagnosis,
      createdAt: new Date().toISOString().split('T')[0],
      status: 'ACTIVE',
      followUpDate: rxData.followUpDate,
      currentVersion: initialVer,
      history: [initialVer]
    };

    const rxSnapshot = [...this.prescriptions];
    this.prescriptions.unshift(newRx);
    this.notify();

    try {
      const res = await api.post('/prescriptions', {
        studentId: rxData.studentId,
        diagnosis: rxData.diagnosis || 'Medical Consultation',
        followUpDate: rxData.followUpDate,
        notes: rxData.notes,
        items: rxData.items
      });
      const created = unwrapData<any>(res);
      if (created) {
        newRx.id = created._id || created.id || newRx.id;
        if (created.currentVersion) newRx.currentVersion = created.currentVersion;
        if (created.history) newRx.history = created.history;
      }
      await this.fetchInventoryFromServer();
      this.notify();
      return newRx;
    } catch (err) {
      this.prescriptions = rxSnapshot;
      this.notify();
      throw new Error(extractApiError(err, 'Failed to save prescription on server.'));
    }
  }

  async updatePrescriptionVersion(
    rxId: string,
    updateData: {
      doctorName: string;
      items: PrescriptionVersion['items'];
      followUpDate?: string;
      notes?: string;
      changeReason: string;
      diagnosis?: string;
    }
  ): Promise<Prescription> {
    const rxIndex = this.prescriptions.findIndex(p => p.id === rxId || (p as any)._id === rxId);
    if (rxIndex < 0) {
      throw new Error('Prescription not found in local record.');
    }

    const rxSnapshot = JSON.parse(JSON.stringify(this.prescriptions));
    const rx = this.prescriptions[rxIndex];
    const nextVerNumber = (rx.currentVersion?.version || 1) + 1;
    const newVer: PrescriptionVersion = {
      version: nextVerNumber,
      prescriptionId: rxId,
      createdAt: new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      createdByDoctor: updateData.doctorName,
      status: 'ACTIVE',
      diagnosis: updateData.diagnosis || rx.diagnosis || rx.currentVersion.diagnosis,
      followUpDate: updateData.followUpDate || rx.followUpDate,
      notes: updateData.notes || rx.currentVersion.notes,
      changeReason: updateData.changeReason,
      items: updateData.items
    };

    rx.history = [newVer, ...rx.history.map(h => ({ ...h, status: 'MODIFIED' as const }))];
    rx.status = 'MODIFIED';
    rx.currentVersion = newVer;
    if (updateData.diagnosis) rx.diagnosis = updateData.diagnosis;
    if (updateData.followUpDate) rx.followUpDate = updateData.followUpDate;

    this.notify();

    try {
      const res = await api.put(`/prescriptions/${rxId}`, {
        changeReason: updateData.changeReason,
        diagnosis: updateData.diagnosis,
        followUpDate: updateData.followUpDate,
        notes: updateData.notes,
        items: updateData.items
      });
      const updated = unwrapData<any>(res);
      if (updated) {
        this.prescriptions[rxIndex] = { ...rx, ...updated, id: updated.id || updated._id || rx.id };
      }
      await this.fetchInventoryFromServer();
      this.notify();
      return this.prescriptions[rxIndex];
    } catch (err) {
      this.prescriptions = rxSnapshot;
      this.notify();
      throw new Error(extractApiError(err, 'Failed to update prescription version on server.'));
    }
  }

  // --- Nutrition Plans ---
  getNutritionPlanForStudent(studentId: string): NutritionPlan | undefined {
    const norm = this.normalizeStudentId(studentId);
    return this.nutritionPlans.find(n => this.normalizeStudentId(n.studentId) === norm);
  }

  async saveNutritionPlan(plan: NutritionPlan): Promise<NutritionPlan> {
    const snapshot = [...this.nutritionPlans];
    const idx = this.nutritionPlans.findIndex(n => n.studentId === plan.studentId);
    if (idx >= 0) this.nutritionPlans[idx] = plan;
    else this.nutritionPlans.unshift(plan);
    this.notify();

    try {
      const res = await api.post('/nutrition', plan);
      const saved = unwrapData<any>(res);
      if (saved) {
        const targetIdx = this.nutritionPlans.findIndex(n => n.studentId === plan.studentId);
        if (targetIdx >= 0) {
          this.nutritionPlans[targetIdx] = { ...plan, ...saved, id: saved._id || saved.id || plan.id };
        }
      }
      this.notify();
      return plan;
    } catch (err) {
      this.nutritionPlans = snapshot;
      this.notify();
      throw new Error(extractApiError(err, 'Failed to save nutrition plan on server.'));
    }
  }

  // --- Daily Monitoring ---
  getMonitoringPlan(studentId: string): DailyMonitoringPlan | undefined {
    const norm = this.normalizeStudentId(studentId);
    const plan = this.monitoringPlans.find(m => this.normalizeStudentId(m.studentId) === norm && m.active);
    if (!plan) return undefined;

    const responses = this.getMonitoringResponses(studentId);
    const uniqueDates = Array.from(new Set(responses.map(r => r.date).filter(Boolean)));
    const todayStr = new Date().toISOString().split('T')[0];
    const submittedToday = responses.some(r => r.date === todayStr);

    const duration = plan.durationDays || 3;
    const calculatedDay = submittedToday
      ? Math.min(Math.max(uniqueDates.length, 1), duration)
      : Math.min(uniqueDates.length + 1, duration);

    if (plan.currentDay !== calculatedDay) {
      plan.currentDay = calculatedDay;
    }
    return plan;
  }

  async activateMonitoringPlan(
    studentId: string,
    conditionName: string,
    durationDays: number = 3,
    createdBy: string = 'Dr. Nivetha M.B.B.S'
  ): Promise<DailyMonitoringPlan> {
    const effectiveDays = durationDays || 3;
    const plan: DailyMonitoringPlan = {
      id: `mon_${Date.now()}`,
      studentId,
      conditionName,
      startDate: new Date().toISOString().split('T')[0],
      durationDays: effectiveDays,
      currentDay: 1,
      active: true,
      createdBy
    };

    const snapshot = [...this.monitoringPlans];
    const existingIdx = this.monitoringPlans.findIndex(m => m.studentId === studentId);
    if (existingIdx >= 0) this.monitoringPlans[existingIdx] = plan;
    else this.monitoringPlans.unshift(plan);
    this.notify();

    try {
      const res = await api.post('/monitoring/plans', {
        studentId,
        conditionName,
        durationDays: effectiveDays,
        startDate: plan.startDate,
        active: true
      });
      const created = unwrapData<any>(res);
      if (created) {
        plan.id = created._id || created.id || plan.id;
      }
      this.notify();
      return plan;
    } catch (err) {
      this.monitoringPlans = snapshot;
      this.notify();
      throw new Error(extractApiError(err, 'Failed to activate monitoring plan on server.'));
    }
  }

  getMonitoringResponses(studentId: string): DailyMonitoringResponse[] {
    const norm = this.normalizeStudentId(studentId);
    return this.monitoringResponses.filter(r => this.normalizeStudentId(r.studentId) === norm).sort((a, b) => b.date.localeCompare(a.date));
  }

  async submitDailyResponse(
    studentId: string,
    response: Omit<DailyMonitoringResponse, 'id' | 'status'>
  ): Promise<DailyMonitoringResponse> {
    let status: DailyMonitoringResponse['status'] = 'Stable';
    if (response.feeling === 'Better' && !response.newSymptoms) status = 'Improving';
    if (response.feeling === 'Worse' || response.newSymptoms) status = 'Needs Review';
    const newResp: DailyMonitoringResponse = { ...response, id: `resp_${Date.now()}`, status };

    const snapshot = [...this.monitoringResponses];
    this.monitoringResponses.unshift(newResp);

    const plan = this.monitoringPlans.find(m => m.studentId === studentId && m.active);
    if (plan) {
      const responses = this.getMonitoringResponses(studentId);
      const uniqueDates = Array.from(new Set(responses.map(r => r.date).filter(Boolean)));
      plan.currentDay = Math.min(Math.max(uniqueDates.length, 1), plan.durationDays || 3);
    }
    this.notify();

    try {
      const res = await api.post('/monitoring/responses', {
        studentId,
        date: response.date,
        feeling: response.feeling,
        symptomsImproving: response.symptomsImproving,
        newSymptoms: response.newSymptoms,
        studentFeedback: response.studentFeedback || ''
      });
      const created = unwrapData<any>(res);
      if (created) {
        newResp.id = created._id || created.id || newResp.id;
      }
      this.notify();
      return newResp;
    } catch (err) {
      this.monitoringResponses = snapshot;
      this.notify();
      throw new Error(extractApiError(err, 'Failed to record monitoring check on server.'));
    }
  }

  // --- Calendar Events ---
  getCalendarEvents(studentId?: string): HealthCalendarEvent[] {
    if (studentId) {
      const norm = this.normalizeStudentId(studentId);
      return this.calendarEvents.filter(c => this.normalizeStudentId(c.studentId) === norm);
    }
    return [...this.calendarEvents];
  }

  async addCalendarEvent(event: Omit<HealthCalendarEvent, 'id'>): Promise<HealthCalendarEvent> {
    const newEv: HealthCalendarEvent = { ...event, id: `cal_${Date.now()}` };
    const snapshot = [...this.calendarEvents];
    this.calendarEvents.unshift(newEv);
    this.notify();

    try {
      const res = await api.post('/calendar', event);
      const created = unwrapData<any>(res);
      if (created) {
        newEv.id = created._id || created.id || newEv.id;
      }
      this.notify();
      return newEv;
    } catch (err) {
      this.calendarEvents = snapshot;
      this.notify();
      throw new Error(extractApiError(err, 'Failed to schedule calendar event on server.'));
    }
  }

  // --- Lab Reports ---
  getLabReports(studentId: string): LabReport[] {
    return this.labReports.filter(l => l.studentId === studentId);
  }

  // --- Notifications ---
  getNotifications(role: string, studentId?: string): NotificationItem[] {
    return this.notifications.filter(n => {
      const recRole = n.recipientRole || (n as any).targetRole;
      const sId = n.studentId || (n as any).targetStudentId;
      if (role === 'STUDENT') {
        return (recRole === 'STUDENT' || !recRole) && (!studentId || !sId || sId === studentId);
      }
      return recRole === role || (recRole as string) === 'ALL';
    });
  }

  async addNotification(notif: Omit<NotificationItem, 'id' | 'createdAt' | 'read'>): Promise<NotificationItem> {
    const newN: NotificationItem = {
      ...notif,
      id: `notif_${Date.now()}`,
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      read: false
    };
    const snapshot = [...this.notifications];
    this.notifications.unshift(newN);
    this.notify();

    try {
      const res = await api.post('/notifications', {
        title: notif.title,
        message: notif.message,
        type: notif.type || 'system',
        targetRole: notif.recipientRole,
        targetStudentId: (notif as any).studentId
      });
      const created = unwrapData<any>(res);
      if (created) {
        newN.id = created._id || created.id || newN.id;
      }
      this.notify();
      return newN;
    } catch (err) {
      this.notifications = snapshot;
      this.notify();
      throw new Error(extractApiError(err, 'Failed to dispatch notification.'));
    }
  }

  async markNotificationRead(id: string): Promise<void> {
    const item = this.notifications.find(n => n.id === id || (n as any)._id === id);
    if (item) {
      item.read = true;
      this.notify();
    }
    try {
      await api.put(`/notifications/${id}/read`);
    } catch (err) {
      console.warn('Failed to mark notification read on server:', err);
    }
  }

  async markAllNotificationsRead(role?: string, studentId?: string): Promise<void> {
    this.notifications.forEach(n => {
      const recRole = n.recipientRole || (n as any).targetRole;
      const sId = n.studentId || (n as any).targetStudentId;
      if (!role) {
        n.read = true;
      } else if (role === 'STUDENT') {
        if ((recRole === 'STUDENT' || !recRole) && (!studentId || !sId || sId === studentId)) {
          n.read = true;
        }
      } else if (recRole === role || (recRole as string) === 'ALL' || !recRole) {
        n.read = true;
      }
    });
    this.notify();
    try {
      await api.put('/notifications/read-all', { role, studentId });
    } catch (err) {
      console.warn('Failed to mark all notifications read on server:', err);
    }
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
      ipAddress: '127.0.0.1', sensitivity
    };
    this.auditLogs.unshift(entry);
    this.notify();
  }

  // --- Pharmacy & Medicine Stock Inventory ---
  getMedicineInventory(): MedicineStockItem[] {
    return [...this.medicineInventory];
  }

  public async fetchInventoryFromServer(): Promise<MedicineStockItem[]> {
    try {
      const res = await api.get('/inventory');
      const data = unwrapData<any[]>(res);
      if (Array.isArray(data)) {
        this.medicineInventory = data.map((it: any) => {
          const q = Number(it.quantity) || 0;
          const status = q >= 50 ? 'Full Stock' : (q >= 10 ? 'Less Stock' : 'Restock');
          return {
            id: it.id || `med_${it.catalogId}`,
            catalogId: it.catalogId,
            name: it.name,
            generic: it.generic || '',
            category: it.category || 'Tablet',
            isTablet: Boolean(it.isTablet),
            defaultDosage: it.defaultDosage || '',
            symptoms: it.symptoms || '',
            quantity: q,
            minThreshold: Number(it.minThreshold) || 20,
            status: (it.status || status) as StockStatus,
            lastRestocked: it.lastRestocked,
            updatedAt: it.updatedAt
          };
        });
        this.notify();
      }
    } catch (err) {
      console.error('Failed to sync inventory from server:', err);
    }
    return this.medicineInventory;
  }

  public calculateTabletCount(item: { dosage?: string; frequency?: string; durationDays?: number; quantity?: number }): number {
    if (item.quantity && Number(item.quantity) > 0) {
      return Number(item.quantity);
    }
    const days = Math.max(1, Number(item.durationDays) || 3);
    const freq = (item.frequency || '').toLowerCase().trim();

    let freqPerDay = 2; // Default 2 per day
    if (freq.includes('four') || freq.includes('qid') || freq.includes('4 times') || freq.includes('4x') || freq.includes('4/day') || freq.includes('qds')) {
      freqPerDay = 4;
    } else if (freq.includes('thrice') || freq.includes('three') || freq.includes('1-1-1') || freq.includes('tid') || freq.includes('3 times') || freq.includes('3x') || freq.includes('3/day') || freq.includes('tds')) {
      freqPerDay = 3;
    } else if (freq.includes('twice') || freq.includes('two') || freq.includes('1-0-1') || freq.includes('0-1-1') || freq.includes('1-1-0') || freq.includes('bid') || freq.includes('bd') || freq.includes('2 times') || freq.includes('2x') || freq.includes('2/day') || freq.includes('morning and night') || freq.includes('morning & night') || freq.includes('morning and evening')) {
      freqPerDay = 2;
    } else if (freq.includes('once') || freq.includes('one') || freq.includes('1-0-0') || freq.includes('0-0-1') || freq.includes('0-1-0') || freq.includes('od') || freq.includes('daily') || freq.includes('1 time') || freq.includes('1x') || freq.includes('1/day') || freq.includes('bedtime') || freq.includes('night') || freq.includes('morning') || freq.includes('hs')) {
      freqPerDay = 1;
    }

    const dosage = (item.dosage || '').toLowerCase();
    let doseMultiplier = 1;
    const numMatch = dosage.match(/(\d+)\s*(tab|cap|pill|tablet|capsule)/);
    if (numMatch) {
      doseMultiplier = Math.max(1, parseInt(numMatch[1], 10));
    } else if (dosage.includes('2 tab') || dosage.includes('2 cap') || dosage.includes('2 tablet')) {
      doseMultiplier = 2;
    } else if (dosage.includes('3 tab') || dosage.includes('3 cap') || dosage.includes('3 tablet')) {
      doseMultiplier = 3;
    }

    return Math.max(1, days * freqPerDay * doseMultiplier);
  }

  getMedicineStock(nameOrCatalogId: string | number): MedicineStockItem | undefined {
    if (typeof nameOrCatalogId === 'number') {
      return this.medicineInventory.find(m => m.catalogId === nameOrCatalogId);
    }
    const clean = String(nameOrCatalogId || '').toLowerCase().trim();
    if (!clean) return undefined;

    // 1. Exact match on name or generic
    const exact = this.medicineInventory.find(m => 
      m.name.toLowerCase() === clean || 
      (m.generic && m.generic.toLowerCase() === clean)
    );
    if (exact) return exact;

    // 2. Normalized match (stripping medical prefixes like "t.", "tab.", "cap.", etc.)
    const strippedSearch = clean.replace(/^(t\.|tab\.|cap\.|inj\.|syp\.|tablet\s+|capsule\s+)/i, '').trim();
    const strippedMatch = this.medicineInventory.find(m => {
      const normName = m.name.toLowerCase().replace(/^(t\.|tab\.|cap\.|inj\.|syp\.|tablet\s+|capsule\s+)/i, '').trim();
      return normName === strippedSearch || normName.startsWith(strippedSearch) || strippedSearch.startsWith(normName);
    });
    if (strippedMatch) return strippedMatch;

    // 3. Substring inclusion
    const substr = this.medicineInventory.find(m => 
      m.name.toLowerCase().includes(clean) || 
      clean.includes(m.name.toLowerCase()) ||
      (m.generic && (m.generic.toLowerCase().includes(clean) || clean.includes(m.generic.toLowerCase())))
    );
    if (substr) return substr;

    // 4. Token / Word matching
    const words = clean.replace(/[^a-z0-9]/g, ' ').split(/\s+/).filter(w => w.length > 2);
    if (words.length > 0) {
      return this.medicineInventory.find(m => {
        const medName = m.name.toLowerCase();
        const medGen = (m.generic || '').toLowerCase();
        return words.some(w => medName.includes(w) || medGen.includes(w));
      });
    }

    return undefined;
  }

  async addMedicineToInventory(payload: {
    name: string;
    generic?: string;
    category?: string;
    isTablet?: boolean;
    defaultDosage?: string;
    symptoms?: string;
    quantity: number;
    minThreshold?: number;
  }): Promise<MedicineStockItem> {
    try {
      const res = await api.post('/inventory', payload);
      const created = unwrapData<any>(res);
      const q = Number(created?.quantity ?? payload.quantity) || 0;
      const status: StockStatus = q >= 50 ? 'Full Stock' : q >= 10 ? 'Less Stock' : 'Restock';
      const item: MedicineStockItem = {
        id: String(created?.id || created?._id || `med_${Date.now()}`),
        catalogId: Number(created?.catalogId) || this.medicineInventory.length + 1,
        name: created?.name || payload.name,
        generic: created?.generic ?? payload.generic ?? '',
        category: created?.category || payload.category || 'Tablet',
        isTablet: Boolean(created?.isTablet ?? payload.isTablet ?? true),
        defaultDosage: created?.defaultDosage || payload.defaultDosage || '1 tablet',
        symptoms: created?.symptoms ?? payload.symptoms ?? '',
        quantity: q,
        minThreshold: Number(created?.minThreshold ?? payload.minThreshold) || 20,
        status,
        lastRestocked: created?.lastRestocked || new Date().toISOString(),
        updatedAt: created?.updatedAt || new Date().toISOString()
      };
      this.medicineInventory = [item, ...this.medicineInventory];
      this.notify();
      return item;
    } catch (err) {
      throw new Error(extractApiError(err, 'Failed to add medicine to inventory.'));
    }
  }

  async importMedicinesToInventory(
    medicines: Array<{
      name: string;
      generic?: string;
      category?: string;
      isTablet?: boolean;
      defaultDosage?: string;
      symptoms?: string;
      quantity: number;
      minThreshold?: number;
    }>
  ): Promise<{ added: MedicineStockItem[]; skipped: string[] }> {
    try {
      const CHUNK_SIZE = 100;
      const addedItems: MedicineStockItem[] = [];
      const skipped: string[] = [];

      for (let i = 0; i < medicines.length; i += CHUNK_SIZE) {
        const chunk = medicines.slice(i, i + CHUNK_SIZE);
        const res = await api.post('/inventory/import', { medicines: chunk }, { timeout: 60000 });
        const result = unwrapData<{ added: any[]; skipped: string[] }>(res);
        const addedRaw = Array.isArray(result?.added) ? result.added : [];
        if (Array.isArray(result?.skipped)) {
          skipped.push(...result.skipped);
        }

        const mappedChunk: MedicineStockItem[] = addedRaw.map((created: any) => {
          const q = Number(created?.quantity) || 0;
          const status: StockStatus = q >= 50 ? 'Full Stock' : q >= 10 ? 'Less Stock' : 'Restock';
          return {
            id: String(created?.id || created?._id || `med_${Date.now()}_${Math.random()}`),
            catalogId: Number(created?.catalogId) || this.medicineInventory.length + 1,
            name: created?.name || '',
            generic: created?.generic ?? '',
            category: created?.category || 'Tablet',
            isTablet: Boolean(created?.isTablet ?? true),
            defaultDosage: created?.defaultDosage || '1 tablet',
            symptoms: created?.symptoms ?? '',
            quantity: q,
            minThreshold: Number(created?.minThreshold) || 20,
            status: (created?.status || status) as StockStatus,
            lastRestocked: created?.lastRestocked || new Date().toISOString(),
            updatedAt: created?.updatedAt || new Date().toISOString()
          };
        });
        addedItems.push(...mappedChunk);
      }

      if (addedItems.length > 0) {
        this.medicineInventory = [...addedItems, ...this.medicineInventory];
        this.notify();
      }

      return { added: addedItems, skipped };
    } catch (err) {
      throw new Error(extractApiError(err, 'Failed to import medicines from file.'));
    }
  }

  async updateMedicineStock(id: string, quantity: number, minThreshold?: number): Promise<MedicineStockItem | null> {
    const q = Math.max(0, quantity);
    const status: StockStatus = q >= 50 ? 'Full Stock' : (q >= 10 ? 'Less Stock' : 'Restock');
    const snapshot = [...this.medicineInventory];

    const idx = this.medicineInventory.findIndex(m => m.id === id || String(m.catalogId) === String(id));
    if (idx >= 0) {
      this.medicineInventory[idx] = {
        ...this.medicineInventory[idx],
        quantity: q,
        status,
        minThreshold: minThreshold !== undefined ? minThreshold : this.medicineInventory[idx].minThreshold,
        updatedAt: new Date().toISOString()
      };
      this.notify();
    }

    try {
      const res = await api.put(`/inventory/${id}`, { quantity: q, minThreshold });
      const payload = unwrapData<any>(res);
      if (payload && idx >= 0) {
        this.medicineInventory[idx] = { ...this.medicineInventory[idx], ...payload };
        this.notify();
        return this.medicineInventory[idx];
      }
      return idx >= 0 ? this.medicineInventory[idx] : null;
    } catch (err) {
      this.medicineInventory = snapshot;
      this.notify();
      throw new Error(extractApiError(err, 'Failed to update medicine stock on server.'));
    }
  }

  async bulkLoadStock(action: 'set_all' | 'restock_low' | 'add_all', amount: number): Promise<MedicineStockItem[]> {
    const snapshot = [...this.medicineInventory];
    try {
      await api.post('/inventory/bulk-load', { action, amount });
      await this.fetchInventoryFromServer();
      return this.medicineInventory;
    } catch (err) {
      this.medicineInventory = snapshot;
      this.notify();
      throw new Error(extractApiError(err, 'Failed to complete bulk inventory reload.'));
    }
  }

  async deductStock(items: Array<{ name: string; quantity?: number; durationDays?: number; frequency?: string; dosage?: string }>): Promise<void> {
    if (!items || items.length === 0) return;
    
    const payloadItems: Array<{ name: string; quantity: number }> = [];

    items.forEach(it => {
      const med = this.getMedicineStock(it.name);
      const deductQty = this.calculateTabletCount(it);
      if (med) {
        med.quantity = Math.max(0, med.quantity - deductQty);
        med.status = med.quantity >= 50 ? 'Full Stock' : (med.quantity >= 10 ? 'Less Stock' : 'Restock');
        med.updatedAt = new Date().toISOString();
        payloadItems.push({ name: med.name, quantity: deductQty });
      } else {
        payloadItems.push({ name: it.name, quantity: deductQty });
      }
    });
    this.notify();

    try {
      await api.post('/inventory/deduct', { items: payloadItems });
    } catch (err) {
      console.error('Failed to deduct stock on server:', err);
    }
  }

  resetState() {
    this.profiles = {}; this.visits = []; this.prescriptions = [];
    this.nutritionPlans = []; this.monitoringPlans = []; this.monitoringResponses = [];
    this.labReports = []; this.calendarEvents = []; this.notifications = []; this.auditLogs = [];
    this.medicineInventory = [];
    this.initialized = false;
    this.loadingPromise = null;
    try {
      localStorage.removeItem('campushealth_token');
      localStorage.removeItem('campushealth_user');
      localStorage.removeItem('campushealth_cached_profiles');
    } catch {}
    this.notify();
  }
}

export const healthStore = new HealthStore();
