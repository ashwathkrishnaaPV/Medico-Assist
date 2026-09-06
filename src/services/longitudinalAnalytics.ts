import {
  MedicalVisit,
  Prescription,
  DailyMonitoringResponse,
  AuditLogEntry,
  NutritionPlan,
  HealthTimelineEvent,
  RiskTier
} from '../types';

export interface VitalTrendSeries {
  dates: string[];
  systolicBP: (number | null)[];
  diastolicBP: (number | null)[];
  heartRate: (number | null)[];
  spo2: (number | null)[];
  temperature: (number | null)[];
  bmi: (number | null)[];
}

export interface LongitudinalVitalSummary {
  series: VitalTrendSeries;
  totalObservations: number;
  averageSystolicBP: number;
  averageDiastolicBP: number;
  averageHeartRate: number;
  averageSpO2: number;
  systolicTrendSlope: number; // positive = upward drift, negative = improving
  detectedAbnormalities: Array<{
    type: 'HYPERTENSION_DRIFT' | 'OXYGEN_DESATURATION' | 'TACHYCARDIA_EPISODE' | 'PYREXIA' | 'RAPID_BMI_CHANGE';
    severity: RiskTier;
    message: string;
    detectedAt: string;
  }>;
}

/**
 * Extracts longitudinal vital trends and detects clinical drift abnormalities
 */
export function extractLongitudinalVitalSummary(visits: MedicalVisit[]): LongitudinalVitalSummary {
  // Sort chronologically ascending
  const sortedVisits = [...visits].sort(
    (a, b) => new Date(a.visitDate).getTime() - new Date(b.visitDate).getTime()
  );

  const series: VitalTrendSeries = {
    dates: [],
    systolicBP: [],
    diastolicBP: [],
    heartRate: [],
    spo2: [],
    temperature: [],
    bmi: []
  };

  sortedVisits.forEach(v => {
    if (v.vitals) {
      series.dates.push(v.visitDate);
      series.systolicBP.push(v.vitals.bloodPressureSys ?? null);
      series.diastolicBP.push(v.vitals.bloodPressureDia ?? null);
      series.heartRate.push(v.vitals.heartRateBpm ?? null);
      series.spo2.push(v.vitals.spo2Percent ?? null);
      series.temperature.push(v.vitals.temperatureF ?? null);
      series.bmi.push(v.vitals.bmi ?? null);
    }
  });

  const validSBP = series.systolicBP.filter((x): x is number => x !== null);
  const validDBP = series.diastolicBP.filter((x): x is number => x !== null);
  const validHR = series.heartRate.filter((x): x is number => x !== null);
  const validSpO2 = series.spo2.filter((x): x is number => x !== null);

  const avg = (arr: number[]) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0);

  // Linear regression slope for Systolic BP drift
  let sbpSlope = 0;
  if (validSBP.length >= 2) {
    const n = validSBP.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
    for (let i = 0; i < n; i++) {
      sumX += i;
      sumY += validSBP[i];
      sumXY += i * validSBP[i];
      sumXX += i * i;
    }
    sbpSlope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX || 1);
  }

  // Detect abnormalities
  const detectedAbnormalities: LongitudinalVitalSummary['detectedAbnormalities'] = [];

  sortedVisits.forEach(v => {
    const vit = v.vitals;
    if (!vit) return;

    if (vit.bloodPressureSys && vit.bloodPressureSys >= 140) {
      detectedAbnormalities.push({
        type: 'HYPERTENSION_DRIFT',
        severity: vit.bloodPressureSys >= 160 ? 'HIGH' : 'MODERATE',
        message: `Elevated systolic pressure (${vit.bloodPressureSys} mmHg) recorded during ${v.visitType}`,
        detectedAt: v.visitDate
      });
    }

    if (vit.spo2Percent && vit.spo2Percent < 95) {
      detectedAbnormalities.push({
        type: 'OXYGEN_DESATURATION',
        severity: vit.spo2Percent <= 92 ? 'URGENT' : 'HIGH',
        message: `Desaturation below normoxemia (${vit.spo2Percent}%) observed`,
        detectedAt: v.visitDate
      });
    }

    if (vit.heartRateBpm && vit.heartRateBpm > 105) {
      detectedAbnormalities.push({
        type: 'TACHYCARDIA_EPISODE',
        severity: vit.heartRateBpm >= 120 ? 'HIGH' : 'MODERATE',
        message: `Elevated resting tachycardia (${vit.heartRateBpm} bpm)`,
        detectedAt: v.visitDate
      });
    }
  });

  return {
    series,
    totalObservations: sortedVisits.length,
    averageSystolicBP: parseFloat(avg(validSBP).toFixed(1)),
    averageDiastolicBP: parseFloat(avg(validDBP).toFixed(1)),
    averageHeartRate: parseFloat(avg(validHR).toFixed(1)),
    averageSpO2: parseFloat(avg(validSpO2).toFixed(1)),
    systolicTrendSlope: parseFloat(sbpSlope.toFixed(2)),
    detectedAbnormalities
  };
}

/**
 * Builds the Unified Student Health Timeline interweaving clinical events
 */
export function buildUnifiedHealthTimeline(params: {
  visits?: MedicalVisit[];
  prescriptions?: Prescription[];
  monitoringResponses?: DailyMonitoringResponse[];
  auditLogs?: AuditLogEntry[];
  nutritionPlans?: NutritionPlan[];
}): HealthTimelineEvent[] {
  const { visits = [], prescriptions = [], monitoringResponses = [], auditLogs = [], nutritionPlans = [] } = params;
  const events: HealthTimelineEvent[] = [];

  // 1. Visits
  visits.forEach(v => {
    events.push({
      id: `timeline_visit_${v.id}`,
      date: v.visitDate,
      time: v.time,
      type: 'VISIT',
      title: `${v.visitType}: ${v.diagnosis || v.chiefComplaint}`,
      subtitle: `Clinician: ${v.doctorName} · BP: ${v.vitals?.bloodPressureSys || '—'}/${v.vitals?.bloodPressureDia || '—'} · SpO2: ${v.vitals?.spo2Percent || '—'}%`,
      details: v.clinicalNotes,
      doctorOrActor: v.doctorName,
      badge: v.status
    });
  });

  // 2. Prescriptions & Prescription Versioning
  prescriptions.forEach(p => {
    // History versions
    if (p.history && p.history.length > 0) {
      p.history.forEach(v => {
        events.push({
          id: `timeline_rx_v${v.version}_${v.prescriptionId}`,
          date: v.createdAt.split('T')[0],
          type: v.version === 1 ? 'PRESCRIPTION_V1' : 'PRESCRIPTION_MODIFIED',
          title: v.version === 1 ? `Prescription Initiated (v1.0)` : `Prescription Revision (v${v.version}.0)`,
          subtitle: `Prescribing Clinician: ${v.createdByDoctor} · ${v.items.length} medication(s)`,
          details: v.changeReason ? `Revision Rationale: ${v.changeReason}` : v.notes,
          doctorOrActor: v.createdByDoctor,
          badge: v.status
        });
      });
    } else if (p.currentVersion) {
      events.push({
        id: `timeline_rx_${p.id}`,
        date: p.createdAt.split('T')[0],
        type: 'PRESCRIPTION_V1',
        title: `Prescription Record (${p.currentVersion.items.length} meds)`,
        subtitle: `Doctor: ${p.doctorName}`,
        doctorOrActor: p.doctorName,
        badge: p.status
      });
    }
  });

  // 3. Daily Monitoring Responses
  monitoringResponses.forEach(r => {
    events.push({
      id: `timeline_mon_${r.id}`,
      date: r.date,
      type: 'DAILY_MONITORING',
      title: `Daily Health Check-in (Status: ${r.feeling})`,
      subtitle: `Symptoms ${r.symptomsImproving ? 'improving' : 'persistent'} · New symptoms: ${r.newSymptoms ? 'Yes' : 'No'}`,
      details: r.studentFeedback,
      severity: r.feeling === 'Worse' ? 'HIGH' : r.feeling === 'Same' ? 'MODERATE' : 'LOW',
      badge: r.status
    });
  });

  // 4. Emergency Access Events from Audit Logs
  auditLogs.forEach(a => {
    if (a.action === 'EMERGENCY_MEDICAL_ACCESS' || a.action === 'GENERATE_EMERGENCY_TOKEN') {
      events.push({
        id: `timeline_emg_${a.id}`,
        date: a.timestamp.split('T')[0],
        time: a.timestamp.split('T')[1]?.slice(0, 5),
        type: 'EMERGENCY_ACCESS',
        title: a.action === 'EMERGENCY_MEDICAL_ACCESS' ? 'Emergency Medical Access Logged' : 'Emergency QR Token Generated',
        subtitle: `Actor: ${a.userName} (${a.userRole}) · IP: ${a.ipAddress}`,
        details: a.details,
        severity: 'URGENT',
        doctorOrActor: a.userName,
        badge: 'CRITICAL AUDIT'
      });
    }
  });

  // 5. Nutrition Plans
  nutritionPlans.forEach(n => {
    events.push({
      id: `timeline_nut_${n.id}`,
      date: n.reviewDate,
      type: 'NUTRITION',
      title: 'Nutrition Recommendation Plan',
      subtitle: `Goal: ${n.goal} · Approved: ${n.doctorApproved ? 'Yes' : 'Pending Review'}`,
      details: n.encouragingNotes,
      badge: n.doctorApproved ? 'Approved' : 'Guidance'
    });
  });

  // Sort descending by date (most recent first)
  return events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}
