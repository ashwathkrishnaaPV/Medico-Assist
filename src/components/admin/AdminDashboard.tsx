import React, { useState, useEffect } from 'react';
import { ShieldCheck, Users, Stethoscope, Activity, FileCheck, BarChart3, AlertTriangle, KeyRound, Server } from 'lucide-react';
import { healthStore } from '../../services/healthStore';
import { AuditLogEntry } from '../../types';

interface AdminDashboardProps {
  onNavigate: (tab: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigate }) => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);

  useEffect(() => {
    const load = () => {
      setLogs(healthStore.getAuditLogs());
    };

    load();
    const unsub = healthStore.subscribe(load);
    return () => unsub();
  }, []);

  return (
    <div className="space-y-6 theme-admin animate-fade-in pb-12 text-slate-800 dark:text-slate-100">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Executive Admin Dashboard</h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Aggregated non-clinical operational metrics, system health, RBAC security, and HIPAA audit trails.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold border border-indigo-200 dark:border-indigo-800">
            SYSTEM STATUS: ONLINE
          </span>
        </div>
      </div>

      {/* Aggregated Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
        
        <div className="card-enterprise p-4 space-y-1">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="font-bold uppercase text-[10px]">Total Enrolled Students</span>
            <Users className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white">4,280</div>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">+140 this semester</span>
        </div>

        <div className="card-enterprise p-4 space-y-1">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="font-bold uppercase text-[10px]">Active Medical Staff</span>
            <Stethoscope className="w-4 h-4 text-teal-600 dark:text-teal-400" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white">18</div>
          <span className="text-[10px] text-slate-500 dark:text-slate-400">4 Doctors · 14 Nurses</span>
        </div>

        <div className="card-enterprise p-4 space-y-1">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="font-bold uppercase text-[10px]">Daily Consultation Volume</span>
            <Activity className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white">24</div>
          <span className="text-[10px] text-purple-600 dark:text-purple-400 font-semibold">Peak hours: 10 AM - 2 PM</span>
        </div>

        <div className="card-enterprise p-4 space-y-1">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="font-bold uppercase text-[10px]">Audit Logs Recorded</span>
            <FileCheck className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white">{logs.length + 1420}</div>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">100% HIPAA Logged</span>
        </div>

      </div>

      {/* Department Analytics Charts & Aggregates */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* SVG Department Visit Workload Bar Visualizer */}
        <div className="card-enterprise p-6 space-y-4">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Department Medical Centre Workload
          </h3>

          <div className="space-y-3 text-xs">
            <div>
              <div className="flex justify-between text-slate-700 dark:text-slate-300 font-semibold mb-1">
                <span>Computer Science & Engineering</span>
                <span>38% (9 visits)</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                <div className="bg-indigo-500 h-2.5 rounded-full" style={{ width: '38%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-slate-700 dark:text-slate-300 font-semibold mb-1">
                <span>Biomedical Engineering</span>
                <span>25% (6 visits)</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                <div className="bg-teal-500 h-2.5 rounded-full" style={{ width: '25%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-slate-700 dark:text-slate-300 font-semibold mb-1">
                <span>Mechanical Engineering</span>
                <span>20% (5 visits)</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                <div className="bg-purple-500 h-2.5 rounded-full" style={{ width: '20%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-slate-700 dark:text-slate-300 font-semibold mb-1">
                <span>Business Administration</span>
                <span>17% (4 visits)</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                <div className="bg-amber-500 h-2.5 rounded-full" style={{ width: '17%' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Audit Trail Preview */}
        <div className="card-enterprise p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> Recent Compliance Audit Logs
            </h3>
            <button onClick={() => onNavigate('admin-audit-logs')} className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
              View All Logs →
            </button>
          </div>

          <div className="space-y-2 text-xs">
            {logs.slice(0, 4).map(log => (
              <div key={log.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-slate-200">{log.action}</span>
                  <span className="text-[10px] text-slate-400">{log.timestamp}</span>
                </div>
                <p className="text-slate-600 dark:text-slate-400 text-[11px]">{log.details}</p>
                <div className="flex items-center justify-between text-[9px] text-slate-500 pt-0.5 font-mono">
                  <span>User: {log.userName} ({log.userRole})</span>
                  <span>IP: {log.ipAddress}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};
