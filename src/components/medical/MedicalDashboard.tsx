import React, { useState, useEffect } from 'react';
import {
  Stethoscope,
  Users,
  Clock,
  CheckCircle2,
  AlertCircle,
  Activity,
  Calendar,
  Search,
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
  const inConsultCount = visits.filter(v => v.status === 'In Consultation').length;
  const completedCount = visits.filter(v => v.status === 'Completed').length;
  const alertsCount = responses.filter(r => r.status === 'Needs Review' || r.status === 'Potential Concern').length;

  return (
    <div className="space-y-6 theme-medical animate-fade-in pb-12">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <Stethoscope className="w-6 h-6 text-teal-600" />
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Medical Centre Clinical Queue</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            EHR SaaS Dashboard · Real-time patient triage, vitals recording & clinical consultations.
          </p>
        </div>

        <button
          onClick={() => onNavigate('medical-new-visit')}
          className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md shadow-teal-600/20 flex items-center gap-2"
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Patient Consultation</span>
        </button>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        
        <div className="card-clinical p-4 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Today's Total Patients</span>
            <Users className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-800 dark:text-slate-100">{visits.length + 21}</div>
          <span className="text-[10px] text-teal-600 font-semibold">24 Scheduled Consultations</span>
        </div>

        <div className="card-clinical p-4 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Waiting in Lobby</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-extrabold text-amber-600">{waitingCount + 4}</div>
          <span className="text-[10px] text-slate-400">Average wait: 8 mins</span>
        </div>

        <div className="card-clinical p-4 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Completed Today</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-600">{completedCount + 15}</div>
          <span className="text-[10px] text-emerald-600 font-semibold">17 Visited</span>
        </div>

        <div className="card-clinical p-4 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Monitoring Alerts</span>
            <AlertCircle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-extrabold text-rose-600">{alertsCount + 2}</div>
          <span className="text-[10px] text-rose-600 font-bold">Needs Review</span>
        </div>

      </div>

      {/* Patient Queue Roster Table */}
      <div className="card-clinical p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Clock className="w-4 h-4 text-teal-600" /> Today's Consultation Schedule
          </h3>

          <button
            onClick={() => onNavigate('medical-directory')}
            className="text-xs font-bold text-teal-600 hover:text-teal-800 flex items-center gap-1"
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
              <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <td className="p-3 font-mono">09:00 AM</td>
                <td className="p-3">
                  <div className="font-bold text-slate-800 dark:text-slate-100">STU1048 · Sophia Patel</div>
                  <div className="text-[10px] text-slate-400">Biomedical Engineering</div>
                </td>
                <td className="p-3"><span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold">Follow-up</span></td>
                <td className="p-3">Migraine aura follow-up</td>
                <td className="p-3">Dr. Sarah Jenkins</td>
                <td className="p-3"><span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">Completed</span></td>
                <td className="p-3">
                  <button onClick={() => onNavigate('medical-directory')} className="text-teal-600 font-bold hover:underline">View Dossier</button>
                </td>
              </tr>

              <tr className="bg-teal-50/40 dark:bg-teal-950/30 hover:bg-teal-50 dark:hover:bg-teal-950/50">
                <td className="p-3 font-mono font-bold text-teal-700">10:30 AM</td>
                <td className="p-3">
                  <div className="font-extrabold text-teal-900 dark:text-teal-200">STU1023 · Alex Rivera</div>
                  <div className="text-[10px] text-teal-600">Computer Science</div>
                </td>
                <td className="p-3"><span className="px-2 py-0.5 rounded-md bg-teal-100 text-teal-800 font-bold">Consultation</span></td>
                <td className="p-3 font-semibold text-slate-800 dark:text-slate-100">Acute bronchitis symptoms & dry cough</td>
                <td className="p-3">Dr. Sarah Jenkins</td>
                <td className="p-3"><span className="px-2.5 py-0.5 rounded-full bg-teal-600 text-white font-bold text-[10px] animate-pulse">In Consultation</span></td>
                <td className="p-3">
                  <button onClick={() => onNavigate('medical-new-visit')} className="px-2.5 py-1 rounded-lg bg-teal-600 text-white font-bold text-[11px] hover:bg-teal-700 shadow-xs">Record Vitals</button>
                </td>
              </tr>

              <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <td className="p-3 font-mono">11:15 AM</td>
                <td className="p-3">
                  <div className="font-bold text-slate-800 dark:text-slate-100">STU1092 · Jason Vance</div>
                  <div className="text-[10px] text-slate-400">Mechanical Engineering</div>
                </td>
                <td className="p-3"><span className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 font-bold">Reconsultation</span></td>
                <td className="p-3">Sprained ankle evaluation</td>
                <td className="p-3">Dr. Sarah Jenkins</td>
                <td className="p-3"><span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px]">Waiting</span></td>
                <td className="p-3">
                  <button onClick={() => onNavigate('medical-new-visit')} className="text-teal-600 font-bold hover:underline">Start Visit</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
