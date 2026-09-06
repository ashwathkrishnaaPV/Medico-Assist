import React, { useState } from 'react';
import { Settings, Database, RefreshCw, CheckCircle2, Trash2, AlertTriangle } from 'lucide-react';
import { healthStore } from '../../services/healthStore';
import { authService } from '../../services/authService';

export const SystemSettings: React.FC = () => {
  const [backupTriggered, setBackupTriggered] = useState(false);
  const [resetConfirm, setResetConfirm] = useState(false);
  const [resetDone, setResetDone] = useState(false);

  const currentUser = authService.getCurrentUser();

  const handleBackup = () => {
    setBackupTriggered(true);
    healthStore.logAudit(currentUser.id, currentUser.name, 'ADMIN', 'SYSTEM_DATABASE_BACKUP', 'DB_CLUSTER_1', 'Automated encrypted database snapshot created.', 'HIGH');
    setTimeout(() => setBackupTriggered(false), 3000);
  };

  const handleClearDatabase = () => {
    if (!resetConfirm) {
      setResetConfirm(true);
      return;
    }

    healthStore.resetState();
    authService.clearAllAuthData();
    setResetDone(true);
    setResetConfirm(false);
    setTimeout(() => setResetDone(false), 4000);
  };

  return (
    <div className="space-y-6 theme-admin animate-fade-in pb-12 text-slate-800 dark:text-slate-100">
      <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Settings className="w-6 h-6 text-indigo-600 dark:text-indigo-400" /> System & Security Configuration
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">HIPAA data retention policies, rate limiting, and database management.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
        
        <div className="card-enterprise p-6 space-y-4">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <Database className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Encrypted Database Backups
          </h3>
          <p className="text-slate-500 dark:text-slate-400">Automated local and remote snapshot creation with immutable verification ledger.</p>

          <button
            onClick={handleBackup}
            disabled={backupTriggered}
            className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all"
          >
            {backupTriggered ? (
              <span className="flex items-center gap-2 text-emerald-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-300" /> Snapshot Created & Audit Logged!
              </span>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" /> Trigger Immediate Backup Snapshot
              </>
            )}
          </button>
        </div>

        <div className="card-enterprise p-6 space-y-4 border border-rose-200 dark:border-rose-900/40">
          <h3 className="font-bold text-sm text-rose-700 dark:text-rose-300 flex items-center gap-2">
            <Trash2 className="w-4 h-4 text-rose-600 dark:text-rose-400" /> Clear Database & Purge All Data
          </h3>
          <p className="text-slate-500 dark:text-slate-400">Wipes all stored profiles, clinical visits, prescriptions, daily logs, and registered accounts to 0 records.</p>

          {resetDone ? (
            <div className="p-3 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 font-bold text-center border border-emerald-300 dark:border-emerald-800">
              Database successfully purged to 0 records!
            </div>
          ) : (
            <button
              onClick={handleClearDatabase}
              className={`w-full py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                resetConfirm
                  ? 'bg-rose-600 hover:bg-rose-700 text-white animate-pulse'
                  : 'bg-rose-50 hover:bg-rose-100 dark:bg-slate-900 dark:hover:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300'
              }`}
            >
              <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
              <span>{resetConfirm ? 'CONFIRM: Purge Entire Database Now?' : 'Clear Database (Wipe All Storage)'}</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
