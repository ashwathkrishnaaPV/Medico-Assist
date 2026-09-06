import React, { useState, useEffect } from 'react';
import { AlertTriangle, ShieldCheck, Lock, QrCode } from 'lucide-react';
import { healthStore } from '../../services/healthStore';
import { AuditLogEntry, RestrictedEmergencyView } from '../../types';

export const RestrictedEmergencyAccessLog: React.FC = () => {
  const [emergencyLogs, setEmergencyLogs] = useState<AuditLogEntry[]>([]);
  const [simulatedView, setSimulatedView] = useState<RestrictedEmergencyView | null>(null);

  useEffect(() => {
    const load = () => {
      const all = healthStore.getAuditLogs();
      setEmergencyLogs(all.filter(a => a.action.includes('EMERGENCY')));
    };

    load();
    const unsub = healthStore.subscribe(load);
    return () => unsub();
  }, []);

  const handleSimulateScan = () => {
    const res = healthStore.getRestrictedEmergencyView('STU1023', 'Campus Ambulance Unit 2');
    setSimulatedView(res || null);
  };

  return (
    <div className="space-y-6 theme-admin animate-fade-in pb-12 text-slate-800 dark:text-slate-100">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-rose-600 dark:text-rose-500" />
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Restricted Emergency Access Control</h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Emergency QR Scan Log & Triage Isolation Tester. Strictly minimum necessary medical fields are exposed.
          </p>
        </div>

        <button
          onClick={handleSimulateScan}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white font-bold text-xs shadow-md shadow-rose-600/30 flex items-center gap-2 transition-all"
        >
          <QrCode className="w-4 h-4" /> Simulate First-Responder Scan
        </button>
      </div>

      {/* Restricted View Demonstration Card */}
      {simulatedView && (
        <div className="card-enterprise p-6 space-y-4 border-2 border-rose-500/50 bg-white dark:bg-slate-900 animate-fade-in shadow-md">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
            <span className="font-extrabold text-xs text-rose-600 dark:text-rose-400 flex items-center gap-2">
              <Lock className="w-4 h-4" /> Restricted Emergency View (Exposed Data Only)
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">Token: {simulatedView.token}</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-semibold">Student Name</span>
              <span className="font-bold text-slate-900 dark:text-slate-100">{simulatedView.studentName} ({simulatedView.studentId})</span>
            </div>
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl">
              <span className="text-[10px] text-rose-700 dark:text-rose-400 block font-bold">Blood Group</span>
              <span className="font-extrabold text-rose-800 dark:text-rose-200 text-base">{simulatedView.bloodGroup}</span>
            </div>
            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-xl">
              <span className="text-[10px] text-amber-800 dark:text-amber-400 block font-bold">Critical Allergies</span>
              <span className="font-bold text-amber-900 dark:text-amber-200">{simulatedView.criticalAllergies.length > 0 ? simulatedView.criticalAllergies.join(', ') : 'None Reported'}</span>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-semibold">Emergency Phone</span>
              <span className="font-bold text-teal-700 dark:text-teal-300">{simulatedView.emergencyContact.phone}</span>
            </div>
          </div>

          <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl text-xs text-rose-800 dark:text-rose-300">
            <strong>Security Verification:</strong> Clinical history notes, diagnosis history, and lab files are masked. Access attempt was written to audit log.
          </div>
        </div>
      )}

      {/* Emergency Audit Log Table */}
      <div className="card-enterprise p-6 space-y-4">
        <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> Audit Log of Emergency Scans ({emergencyLogs.length})
        </h3>

        <div className="space-y-2 text-xs font-mono">
          {emergencyLogs.map(log => (
            <div key={log.id} className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-rose-600 dark:text-rose-400">{log.action}</span>
                <span className="text-slate-400">{log.timestamp}</span>
              </div>
              <p className="text-slate-700 dark:text-slate-300 text-[11px] font-sans">{log.details}</p>
              <div className="flex justify-between text-[9px] text-slate-500 pt-0.5">
                <span>Requestor: {log.userName}</span>
                <span>IP: {log.ipAddress}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
