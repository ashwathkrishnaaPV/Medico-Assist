import React, { useState, useEffect } from 'react';
import { History, FileText, Lock } from 'lucide-react';
import { healthStore } from '../../services/healthStore';
import { buildUnifiedHealthTimeline } from '../../services/longitudinalAnalytics';
import { StudentHealthTimeline } from '../common/StudentHealthTimeline';
import { LabReport, HealthTimelineEvent } from '../../types';
import { authService } from '../../services/authService';

export const StudentMedicalHistory: React.FC = () => {
  const currentUser = authService.getCurrentUser();
  const studentId = currentUser.studentId || currentUser.id;
  const [labReports, setLabReports] = useState<LabReport[]>([]);
  const [timelineEvents, setTimelineEvents] = useState<HealthTimelineEvent[]>([]);

  useEffect(() => {
    const load = () => {
      if (studentId) {
        const v = healthStore.getVisitsForStudent(studentId);
        setLabReports(healthStore.getLabReports(studentId));

        const rx = healthStore.getPrescriptionsForStudent(studentId);
        const mon = healthStore.getMonitoringResponses(studentId);
        const nut = healthStore.getNutritionPlanForStudent(studentId);
        const aud = healthStore.getAuditLogs();

        const tl = buildUnifiedHealthTimeline({
          visits: v,
          prescriptions: rx,
          monitoringResponses: mon,
          nutritionPlans: nut ? [nut] : [],
          auditLogs: aud.filter(a => a.resource === studentId)
        });
        setTimelineEvents(tl);
      }
    };

    load();
    const unsub = healthStore.subscribe(load);
    return () => unsub();
  }, [studentId]);

  return (
    <div className="space-y-6 theme-student animate-fade-in pb-12">
      
      {/* Banner */}
      <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <History className="w-6 h-6 text-blue-600" /> Unified Longitudinal Health Ledger
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Complete chronologically verified stream of consultations, prescription version changes, daily monitoring logs, and emergency access audits.
          </p>
        </div>
        <div className="flex items-center gap-1 text-xs text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl">
          <Lock className="w-3.5 h-3.5" /> Read-Only Patient Ledger
        </div>
      </div>

      {/* Unified Interactive Timeline */}
      <StudentHealthTimeline
        events={timelineEvents}
        studentName={currentUser.name}
        studentId={studentId}
      />

      {/* Lab Reports Section */}
      {labReports.length > 0 && (
        <div className="space-y-4 pt-4">
          <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-600" /> Laboratory Diagnostics
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {labReports.map(lab => (
              <div key={lab.id} className="card-wellness p-5 space-y-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-slate-800 dark:text-slate-100">
                    🧪 {lab.testName}
                  </span>
                  <span className="text-xs text-slate-400">{lab.date}</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400">{lab.summary}</p>
                <div className="text-[10px] text-slate-400 pt-1 font-mono">Ordered by: {lab.orderedBy}</div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
