import React, { useState, useEffect } from 'react';
import { Activity, CheckSquare, AlertTriangle, CheckCircle2, User, Stethoscope } from 'lucide-react';
import { healthStore } from '../../services/healthStore';
import { authService } from '../../services/authService';
import { DailyMonitoringPlan, DailyMonitoringResponse, StudentProfileData } from '../../types';

interface DailyMonitoringTriageProps {
  onNavigate: (tab: string) => void;
}

export const DailyMonitoringTriage: React.FC<DailyMonitoringTriageProps> = ({ onNavigate }) => {
  const [allProfiles, setAllProfiles] = useState<StudentProfileData[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [monitoringPlan, setMonitoringPlan] = useState<DailyMonitoringPlan | undefined>();
  const [responses, setResponses] = useState<DailyMonitoringResponse[]>([]);

  useEffect(() => {
    const load = () => {
      const list = healthStore.getAllStudentProfiles();
      setAllProfiles(list);

      let targetId = selectedStudentId;
      if (list.length > 0 && !targetId) {
        targetId = list[0].studentId;
        setSelectedStudentId(targetId);
      }

      if (targetId) {
        setMonitoringPlan(healthStore.getMonitoringPlan(targetId));
        setResponses(healthStore.getMonitoringResponses(targetId));
      }
    };

    load();
    const unsub = healthStore.subscribe(load);
    return () => unsub();
  }, [selectedStudentId]);

  const latestResp = responses[0];

  return (
    <div className="space-y-6 theme-medical animate-fade-in pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="w-6 h-6 text-rose-600" />
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Daily Health Monitoring Triage</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time daily symptom tracking relay from monitored students. Status badges indicate clinical priority.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <label className="text-xs font-bold text-slate-400">Patient:</label>
          <select
            value={selectedStudentId}
            onChange={e => setSelectedStudentId(e.target.value)}
            className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold"
          >
            {allProfiles.length === 0 ? (
              <option value="">No students in database</option>
            ) : (
              allProfiles.map(p => (
                <option key={p.studentId} value={p.studentId}>
                  {p.studentId} — {p.name}
                </option>
              ))
            )}
          </select>
        </div>
      </div>

      {allProfiles.length === 0 ? (
        <div className="p-12 text-center text-slate-400 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-2">
          <Activity className="w-12 h-12 mx-auto text-rose-500" />
          <h3 className="font-bold text-slate-700 dark:text-slate-200 text-base">No Students Registered</h3>
          <p className="text-xs">Register student profiles to initiate daily monitoring triage plans.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Active Plan Overview */}
          <div className="lg:col-span-5 space-y-4">
            <div className="card-clinical p-6 space-y-4">
              <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-emerald-600" /> Active Monitoring Protocol
              </h3>

              {monitoringPlan ? (
                <div className="space-y-3 text-xs">
                  <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-400">Condition</span>
                    <p className="font-extrabold text-slate-800 dark:text-slate-100 text-sm">{monitoringPlan.conditionName}</p>
                    <p className="text-slate-500">Day {monitoringPlan.currentDay} of {monitoringPlan.durationDays} · Initiated by {monitoringPlan.createdBy}</p>
                  </div>
                  
                  {latestResp ? (
                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-2">
                      <div className="flex items-center justify-between font-bold">
                        <span>Latest Response ({latestResp.date})</span>
                        <span className={`px-2 py-0.5 rounded-md text-[10px] ${
                          latestResp.status === 'Improving' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {latestResp.status}
                        </span>
                      </div>
                      <p className="text-slate-600 dark:text-slate-300">Feeling: <strong>{latestResp.feeling}</strong></p>
                      {latestResp.studentFeedback && (
                        <p className="text-slate-500 italic text-[11px]">"{latestResp.studentFeedback}"</p>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400">No daily check response logged yet for today.</p>
                  )}
                </div>
              ) : (
                <div className="space-y-3 text-xs">
                  <p className="text-slate-400">No active daily monitoring protocol for {selectedStudentId}.</p>
                  <button
                    onClick={() => {
                      if (selectedStudentId) {
                        healthStore.activateMonitoringPlan(selectedStudentId, 'Post-Consultation Recovery', 7, authService.getCurrentUser().name || 'Dr. Medical Staff');
                      }
                    }}
                    className="w-full py-2.5 rounded-xl bg-teal-600 text-white font-bold text-xs shadow-md shadow-teal-600/20"
                  >
                    Initiate 7-Day Monitoring Check
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Monitoring Responses History */}
          <div className="lg:col-span-7 card-clinical p-6 space-y-4">
            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Activity className="w-4 h-4 text-teal-600" /> Historical Check-in Submissions ({responses.length})
            </h3>

            {responses.length === 0 ? (
              <p className="text-xs text-slate-400 py-4">No daily check-in responses recorded yet.</p>
            ) : (
              <div className="space-y-2 text-xs">
                {responses.map(r => (
                  <div key={r.id} className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-800 dark:text-slate-200">{r.date} — Feeling: {r.feeling}</div>
                      {r.studentFeedback && <p className="text-[11px] text-slate-400 italic">"{r.studentFeedback}"</p>}
                    </div>
                    <span className={`px-2.5 py-1 rounded-md font-bold text-[10px] ${
                      r.status === 'Improving' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {r.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
};
