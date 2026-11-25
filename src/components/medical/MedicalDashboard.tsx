import React, { useState, useEffect } from 'react';
import {
  Stethoscope,
  Users,
  Clock,
  CheckCircle2,
  AlertCircle,
  PlusCircle,
  ChevronRight
} from 'lucide-react';

import { healthStore } from '../../services/healthStore';
import { MedicalVisit, DailyMonitoringResponse } from '../../types';

interface MedicalDashboardProps {
  onNavigate: (tab: string) => void;
}

export const MedicalDashboard: React.FC<MedicalDashboardProps> = ({ onNavigate }) => {
  const [studentCount, setStudentCount] = useState<number>(0);
  const [visits, setVisits] = useState<MedicalVisit[]>([]);
  const [responses, setResponses] = useState<DailyMonitoringResponse[]>([]);

  useEffect(() => {
    const load = () => {
      const allProfiles = healthStore.getAllStudentProfiles();
      setStudentCount(allProfiles.length);
      setVisits(healthStore.getAllVisits());

      let allResponses: DailyMonitoringResponse[] = [];
      allProfiles.forEach(p => {
        allResponses = [...allResponses, ...healthStore.getMonitoringResponses(p.studentId)];
      });
      setResponses(allResponses);
    };

    load();
    const unsub = healthStore.subscribe(load);
    return () => unsub();
  }, []);

  const waitingCount = visits.filter(v => v.status === 'Waiting').length;
  const completedCount = visits.filter(v => v.status === 'Completed').length;
  const alertsCount = responses.filter(r => r.status === 'Needs Review' || r.status === 'Potential Concern').length;

  return (
    <div className="space-y-6 theme-medical animate-fade-in pb-12">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <Stethoscope className="w-6 h-6 text-sky-600" />
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Medical Centre Clinical Queue</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            EHR SaaS Dashboard · Real-time patient triage, vitals recording & clinical consultations.
          </p>
        </div>

        <button
          onClick={() => onNavigate('medical-new-visit')}
          className="px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-md shadow-sky-600/20 flex items-center gap-2"
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Patient Consultation</span>
        </button>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        
        <div className="card-clinical p-4 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Registered Students</span>
            <Users className="w-4 h-4 text-sky-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-800 dark:text-slate-100">{studentCount}</div>
          <span className="text-[10px] text-sky-600 font-semibold">{visits.length} Recorded Visits</span>
        </div>

        <div className="card-clinical p-4 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Waiting in Lobby</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-extrabold text-amber-600">{waitingCount}</div>
          <span className="text-[10px] text-slate-400">{waitingCount === 0 ? 'Queue clear' : `${waitingCount} waiting`}</span>
        </div>

        <div className="card-clinical p-4 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Completed Today</span>
            <CheckCircle2 className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-extrabold text-blue-600">{completedCount}</div>
          <span className="text-[10px] text-blue-600 font-semibold">{completedCount} Consultations</span>
        </div>

        <div className="card-clinical p-4 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Monitoring Alerts</span>
            <AlertCircle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-extrabold text-rose-600">{alertsCount}</div>
          <span className="text-[10px] text-rose-600 font-bold">{alertsCount === 0 ? 'All Clear' : `${alertsCount} Needs Review`}</span>
        </div>

      </div>

      {/* Patient Queue Roster Table */}
      <div className="card-clinical p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Clock className="w-4 h-4 text-sky-600" /> Today's Consultation Schedule
          </h3>

          <button
            onClick={() => onNavigate('medical-directory')}
            className="text-xs font-bold text-sky-600 hover:text-sky-800 flex items-center gap-1"
          >
            <span>Search All Students</span> <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 font-semibold uppercase text-[10px]">
              <tr>
                <th className="p-3">Time</th>
                <th className="p-3">Student ID & Name</th>
                <th className="p-3">Visit Type</th>
                <th className="p-3">Chief Complaint</th>
                <th className="p-3">Doctor</th>
                <th className="p-3">Status</th>
                <th className="p-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-700 dark:text-slate-300 font-medium">
              {visits.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    <p className="font-semibold text-sm">No clinical visits logged yet.</p>
                    <p className="text-xs text-slate-400 mt-1">Start a new consultation to record student encounters.</p>
                  </td>
                </tr>
              ) : (
                visits.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="p-3 font-mono text-xs">
                      {v.visitDate ? new Date(v.visitDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                    </td>
                    <td className="p-3">
                      <div className="font-bold text-slate-800 dark:text-slate-100">{v.studentId} · {v.studentName}</div>
                      <div className="text-[10px] text-slate-400">Student Patient</div>
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold">
                        {v.visitType}
                      </span>
                    </td>
                    <td className="p-3 font-semibold text-slate-800 dark:text-slate-100">{v.chiefComplaint}</td>
                    <td className="p-3">{v.doctorName || 'Dr. Nivetha M.B.B.S'}</td>
                    <td className="p-3">
                      <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                        v.status === 'Completed' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300' :
                        v.status === 'In Consultation' ? 'bg-sky-600 text-white animate-pulse' :
                        'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                      }`}>
                        {v.status}
                      </span>
                    </td>
                    <td className="p-3">
                      <button onClick={() => onNavigate('medical-directory')} className="text-sky-600 font-bold hover:underline">
                        View Dossier
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
