import React, { useState } from 'react';
import { Settings, Database, RefreshCw, CheckCircle2, Trash2, AlertTriangle, FileCheck } from 'lucide-react';
import api, { extractApiError, unwrapData } from '../../services/api';
import { healthStore } from '../../services/healthStore';
import { authService } from '../../services/authService';

interface BackupDetails {
  filename: string;
  path: string;
  timestamp: string;
  stats?: Record<string, number>;
}

export const SystemSettings: React.FC = () => {
  const [backupTriggered, setBackupTriggered] = useState(false);
  const [backupDetails, setBackupDetails] = useState<BackupDetails | null>(null);
  const [backupError, setBackupError] = useState<string | null>(null);
  const [resetConfirm, setResetConfirm] = useState(false);
  const [resetDone, setResetDone] = useState(false);

  const handleBackup = async () => {
    setBackupTriggered(true);
    setBackupError(null);
    try {
      const res = await api.post('/audit/backup');
      const data = unwrapData<BackupDetails>(res);
      setBackupDetails(data);
    } catch (err) {
      setBackupError(extractApiError(err, 'Failed to generate backup.'));
    } finally {
      setBackupTriggered(false);
    }
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
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            HIPAA data retention policies, MongoDB disaster recovery, and database management.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
        <div className="card-enterprise p-6 space-y-4">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <Database className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Database Backup & Snapshot
          </h3>
          <p className="text-slate-500 dark:text-slate-400">
            Automated server-side JSON snapshot creation of all MongoDB collections with immutable verification ledger.
          </p>

          <button
            onClick={handleBackup}
            disabled={backupTriggered}
            className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-60"
          >
            {backupTriggered ? (
              <span className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin" /> Generating Server Snapshot…
              </span>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" /> Trigger Immediate Server Backup
              </>
            )}
          </button>

          {backupDetails && (
            <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-xs">
                <FileCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Snapshot Created: {backupDetails.filename}</span>
              </div>
              <p className="text-[11px] opacity-90">
                Timestamp: {new Date(backupDetails.timestamp).toLocaleString()}
              </p>
              {backupDetails.stats && (
                <p className="text-[10px] font-mono opacity-80">
                  Backed up: {backupDetails.stats.User ?? 0} Users, {backupDetails.stats.StudentProfile ?? 0} Profiles,{' '}
                  {backupDetails.stats.MedicineInventory ?? 0} Medicines.
                </p>
              )}
            </div>
          )}

          {backupError && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 font-medium">
              {backupError}
            </div>
          )}
        </div>

        <div className="card-enterprise p-6 space-y-4 border border-rose-200 dark:border-rose-900/40">
          <h3 className="font-bold text-sm text-rose-700 dark:text-rose-300 flex items-center gap-2">
            <Trash2 className="w-4 h-4 text-rose-600 dark:text-rose-400" /> Session Reset & Local Storage Purge
          </h3>
          <p className="text-slate-500 dark:text-slate-400">
            Clears local browser authentication state, cached memory stores, and active clinician session tokens.
          </p>

          {resetDone ? (
            <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 font-bold text-center border border-blue-300 dark:border-blue-800">
              <CheckCircle2 className="w-4 h-4 inline mr-1" /> Client session successfully purged!
            </div>
          ) : (
            <button
              onClick={handleClearDatabase}
              className={`w-full py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                resetConfirm
                  ? 'bg-rose-600 hover:bg-rose-700 text-white animate-pulse'
                  : 'bg-rose-50 hover:bg-rose-100 dark:bg-slate-900 dark:hover:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300'
              }`}
            >
              <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
              <span>{resetConfirm ? 'CONFIRM: Reset Session State Now?' : 'Reset Browser Session'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
