import React, { useState, useEffect } from 'react';
import { FileCheck, Search } from 'lucide-react';
import { healthStore } from '../../services/healthStore';
import { AuditLogEntry } from '../../types';

export const AuditLogViewer: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [search, setSearch] = useState('');
  const [filterSensitivity, setFilterSensitivity] = useState<string>('ALL');

  useEffect(() => {
    const load = () => {
      setLogs(healthStore.getAuditLogs());
    };

    load();
    const unsub = healthStore.subscribe(load);
    return () => unsub();
  }, []);

  const filteredLogs = logs.filter(log => {
    const matchSearch =
      log.action.toLowerCase().includes(search.toLowerCase()) ||
      log.userName.toLowerCase().includes(search.toLowerCase()) ||
      log.details.toLowerCase().includes(search.toLowerCase()) ||
      log.resource.toLowerCase().includes(search.toLowerCase());

    const matchSens = filterSensitivity === 'ALL' || log.sensitivity === filterSensitivity;
    return matchSearch && matchSens;
  });

  return (
    <div className="space-y-6 theme-admin animate-fade-in pb-12 text-slate-800 dark:text-slate-100">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <FileCheck className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Enterprise Audit & Security Logs</h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Immutable system activity log recording consultations, prescription updates, emergency access, and login events.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={filterSensitivity}
            onChange={e => setFilterSensitivity(e.target.value)}
            className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none"
          >
            <option value="ALL">All Sensitivity Levels</option>
            <option value="LOW">LOW</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="HIGH">HIGH</option>
            <option value="CRITICAL">CRITICAL</option>
          </select>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="card-enterprise p-4">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search audit logs by action, user name, resource ID, or details..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="card-enterprise p-6 space-y-4">
        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase text-[10px]">
              <tr>
                <th className="p-3">Timestamp</th>
                <th className="p-3">User & Role</th>
                <th className="p-3">Action</th>
                <th className="p-3">Resource Target</th>
                <th className="p-3">Audit Details</th>
                <th className="p-3">IP Address</th>
                <th className="p-3">Sensitivity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {filteredLogs.map(log => (
                <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="p-3 font-semibold text-slate-400">{log.timestamp}</td>
                  <td className="p-3">
                    <div className="font-bold text-slate-900 dark:text-slate-100">{log.userName}</div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400">{log.userRole}</div>
                  </td>
                  <td className="p-3 font-bold text-indigo-600 dark:text-indigo-300">{log.action}</td>
                  <td className="p-3 font-bold text-emerald-600 dark:text-emerald-400">{log.resource}</td>
                  <td className="p-3 font-sans text-xs text-slate-600 dark:text-slate-300 max-w-xs">{log.details}</td>
                  <td className="p-3 text-slate-500 dark:text-slate-400">{log.ipAddress}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold ${
                      log.sensitivity === 'CRITICAL'
                        ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-200 border border-rose-300 dark:border-rose-700 animate-pulse'
                        : log.sensitivity === 'HIGH'
                          ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}>
                      {log.sensitivity}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
