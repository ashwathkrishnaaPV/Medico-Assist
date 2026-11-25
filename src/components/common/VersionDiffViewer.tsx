import React from 'react';
import { X, History, CheckCircle2 } from 'lucide-react';
import { Prescription, PrescriptionVersion } from '../../types';

interface VersionDiffViewerProps {
  isOpen: boolean;
  onClose: () => void;
  prescription: Prescription;
  v1: PrescriptionVersion;
  v2: PrescriptionVersion;
}

export const VersionDiffViewer: React.FC<VersionDiffViewerProps> = ({
  isOpen,
  onClose,
  prescription,
  v1,
  v2
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
      <div className="w-full max-w-3xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-sky-700 via-blue-700 to-sky-800 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-white/20 backdrop-blur-md">
              <History className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg leading-tight">Prescription Audit & Version Diff</h3>
              <p className="text-xs text-sky-100">
                Prescription #{prescription.id} · Comparing Version {v1.version} vs Version {v2.version}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-white/20 text-white/80 hover:text-white transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          
          {/* Reason Badge */}
          {v2.changeReason && (
            <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-2xl text-xs text-amber-900 dark:text-amber-300">
              <span className="font-bold">Reason for Modification:</span> {v2.changeReason}
            </div>
          )}

          {/* Grid Side-by-side comparison */}
          <div className="grid grid-cols-2 gap-4">
            
            {/* Version 1 */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
                <span className="font-bold text-xs text-slate-500 uppercase">Version {v1.version} (Previous)</span>
                <span className="text-[10px] text-slate-400">{v1.createdAt}</span>
              </div>
              <div className="space-y-2">
                {v1.items.map((item, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs">
                    <div className="font-bold text-slate-800 dark:text-slate-200">{item.medicineName}</div>
                    <div className="text-slate-600 dark:text-slate-400 mt-0.5">{item.dosage} · {item.frequency}</div>
                    <div className="text-[10px] text-slate-400 italic mt-1">{item.instructions}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Version 2 */}
            <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 space-y-3">
              <div className="flex items-center justify-between border-b border-blue-200 dark:border-blue-800 pb-2">
                <span className="font-bold text-xs text-blue-800 dark:text-blue-300 uppercase flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" /> Version {v2.version} (Latest Approved)
                </span>
                <span className="text-[10px] text-blue-600 dark:text-blue-400">{v2.createdAt}</span>
              </div>
              <div className="space-y-2">
                {v2.items.map((item, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-blue-300 dark:border-blue-800 text-xs shadow-xs">
                    <div className="font-bold text-blue-900 dark:text-blue-200 flex items-center justify-between">
                      <span>{item.medicineName}</span>
                      <span className="text-[9px] bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 font-bold px-1.5 py-0.5 rounded-md">
                        {item.durationDays} Days
                      </span>
                    </div>
                    <div className="text-slate-700 dark:text-slate-300 font-semibold mt-0.5">{item.dosage} · {item.frequency}</div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 italic mt-1">{item.instructions}</div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          <div className="text-center text-xs text-slate-400">
            Immutable EHR version ledger: Version {v1.version} remains preserved in medical record audit logs.
          </div>

        </div>

      </div>
    </div>
  );
};
