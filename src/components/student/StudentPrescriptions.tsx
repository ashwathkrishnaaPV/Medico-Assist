import React, { useState, useEffect } from 'react';
import { Pill, History, Printer, ShieldAlert, Share2 } from 'lucide-react';
import { healthStore } from '../../services/healthStore';
import { Prescription } from '../../types';
import { VersionDiffViewer } from '../common/VersionDiffViewer';
import { WhatsAppShareModal } from '../common/WhatsAppShareModal';
import { authService } from '../../services/authService';

interface StudentPrescriptionsProps {
  onOpenDiffViewer?: () => void;
}

export const StudentPrescriptions: React.FC<StudentPrescriptionsProps> = () => {
  const currentUser = authService.getCurrentUser();
  const studentId = currentUser.studentId || currentUser.id;
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [selectedRx, setSelectedRx] = useState<Prescription | null>(null);
  const [showDiff, setShowDiff] = useState(false);
  const [isWhatsAppOpen, setIsWhatsAppOpen] = useState(false);

  useEffect(() => {
    const load = () => {
      if (studentId) {
        const list = healthStore.getPrescriptionsForStudent(studentId);
        setPrescriptions(list);
        if (list.length > 0 && !selectedRx) setSelectedRx(list[0]);
      }
    };

    load();
    const unsub = healthStore.subscribe(load);
    return () => unsub();
  }, [studentId, selectedRx]);

  if (prescriptions.length === 0) {
    return (
      <div className="p-12 text-center text-slate-400 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
        <Pill className="w-12 h-12 mx-auto mb-3 text-purple-400" />
        <h3 className="font-bold text-slate-700 dark:text-slate-200">No Prescriptions Found</h3>
        <p className="text-xs">Your medical centre has not issued any active prescriptions yet.</p>
      </div>
    );
  }

  const activeRx = selectedRx || prescriptions[0];
  const currentVer = activeRx.currentVersion;
  const hasHistory = activeRx.history.length > 1;
  const profile = studentId ? healthStore.getStudentProfile(studentId) : undefined;
  const studentVisits = studentId ? healthStore.getVisitsForStudent(studentId) : [];
  const relatedVisit =
    studentVisits.find((v) => v.prescriptionId === activeRx.id) || studentVisits[0];
  const patientName = profile?.name || currentUser.name || 'Student Patient';
  const visitCause =
    currentVer.diagnosis ||
    relatedVisit?.chiefComplaint ||
    relatedVisit?.diagnosis ||
    'General Medical Consultation';

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 theme-student animate-fade-in pb-12 print:pb-0 print:space-y-0">
      {/* ─── PRINT-ONLY CLEAN PRESCRIPTION SHEET ─── */}
      <div className="hidden print:block bg-white text-slate-900 space-y-6">
        <div className="border-b-2 border-slate-900 pb-4 flex justify-between items-end">
          <div>
            <div className="text-xs font-bold uppercase tracking-widest text-slate-500">
              Campus Health Medical Centre
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 mt-0.5">Prescription</h1>
          </div>
          <div className="text-right text-xs text-slate-600">
            <div>Date: <strong>{currentVer.createdAt}</strong></div>
            <div>Doctor: <strong>{activeRx.doctorName}</strong></div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 p-4 rounded-xl border border-slate-300 bg-slate-50 text-sm">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Patient Name
            </div>
            <div className="font-bold text-slate-900 text-base mt-0.5">
              {patientName}
              {studentId ? <span className="text-xs font-normal text-slate-600 ml-2">({studentId})</span> : null}
            </div>
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Cause / Diagnosis
            </div>
            <div className="font-bold text-slate-900 text-base mt-0.5">{visitCause}</div>
          </div>
        </div>

        <div className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Prescribed Medicines
          </h2>
          <table className="w-full border-collapse border border-slate-300 text-sm">
            <thead>
              <tr className="bg-slate-100 text-left text-xs uppercase text-slate-700">
                <th className="border border-slate-300 px-3 py-2">#</th>
                <th className="border border-slate-300 px-3 py-2">Medicine</th>
                <th className="border border-slate-300 px-3 py-2">Dosage</th>
                <th className="border border-slate-300 px-3 py-2">Frequency</th>
                <th className="border border-slate-300 px-3 py-2">Duration</th>
              </tr>
            </thead>
            <tbody>
              {currentVer.items.map((item, idx) => (
                <tr key={idx}>
                  <td className="border border-slate-300 px-3 py-2 font-semibold">{idx + 1}</td>
                  <td className="border border-slate-300 px-3 py-2">
                    <div className="font-bold text-slate-900">{item.medicineName}</div>
                    {item.instructions ? (
                      <div className="text-xs text-slate-600 italic mt-0.5">{item.instructions}</div>
                    ) : null}
                  </td>
                  <td className="border border-slate-300 px-3 py-2">{item.dosage}</td>
                  <td className="border border-slate-300 px-3 py-2">{item.frequency}</td>
                  <td className="border border-slate-300 px-3 py-2 font-semibold">{item.durationDays} Days</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── SCREEN VIEW (HIDDEN WHEN PRINTING) ─── */}
      <div className="print:hidden space-y-6">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <Pill className="w-6 h-6 text-purple-600" />
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Prescription Manager</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 text-xs font-extrabold">
              {activeRx.status} (Version {currentVer.version})
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Official doctor-issued medical prescriptions with immutable audit version history.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setIsWhatsAppOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-xs shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
            title="Share Prescription via WhatsApp"
          >
            <Share2 className="w-4 h-4" />
            <span>Share via WhatsApp</span>
          </button>

          {hasHistory && (
            <button
              onClick={() => setShowDiff(true)}
              className="px-3.5 py-2 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 font-bold text-xs hover:bg-purple-100 border border-purple-200 dark:border-purple-800 flex items-center gap-1.5 transition-all"
            >
              <History className="w-4 h-4 text-purple-600" />
              <span>Compare Version Diff (v1 vs v{currentVer.version})</span>
            </button>
          )}

          <button
            onClick={handlePrint}
            className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5 transition-all"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span>Print Rx</span>
          </button>
        </div>
      </div>

      {/* Main Prescription Paper Card */}
      <div className="card-wellness p-6 md:p-8 space-y-6 bg-white dark:bg-slate-900 border-2 border-purple-100 dark:border-purple-900/50 relative">
        
        {/* Prescription Header */}
        <div className="flex flex-col sm:flex-row justify-between border-b border-slate-200 dark:border-slate-800 pb-4 gap-2">
          <div>
            <div className="text-xs text-purple-700 dark:text-purple-400 font-extrabold uppercase tracking-wider">
              Campus Health Medical Centre
            </div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Rx #{activeRx.id}</h2>
            <p className="text-xs text-slate-500">Issued by: <strong>{activeRx.doctorName}</strong></p>
          </div>

          <div className="text-right text-xs text-slate-500 space-y-0.5">
            <div>Date Issued: <strong>{currentVer.createdAt}</strong></div>
            <div>Follow-up Date: <strong className="text-blue-600">{currentVer.followUpDate || 'None'}</strong></div>
          </div>
        </div>

        {/* Version Change Alert (if modified) */}
        {activeRx.status === 'MODIFIED' && (
          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-amber-900 dark:text-amber-300 text-xs flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Prescription Updated by Doctor (Version {currentVer.version})</span>
              <p className="mt-0.5 text-amber-800 dark:text-amber-200">{currentVer.notes || 'Dosage / instructions updated by your clinician.'}</p>
            </div>
          </div>
        )}

        {/* Items List */}
        <div className="space-y-4">
          <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400">Prescribed Medications</h3>

          <div className="grid grid-cols-1 gap-3">
            {currentVer.items.map((item, idx) => (
              <div key={idx} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-sm text-slate-800 dark:text-slate-100">{item.medicineName}</span>
                    <span className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 font-bold text-[10px]">
                      {item.dosage}
                    </span>
                  </div>
                  <p className="font-semibold text-slate-600 dark:text-slate-300">{item.frequency}</p>
                  <p className="text-slate-400 italic">{item.instructions}</p>
                </div>

                <div className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-right shrink-0">
                  <span className="text-[10px] text-slate-400 block font-semibold">Duration</span>
                  <span className="font-bold text-purple-700 dark:text-purple-400">{item.durationDays} Days</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Notes & Doctor Sign-off */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center text-xs gap-3">
          <div className="text-slate-500">
            <span className="font-bold text-slate-700 dark:text-slate-300">Special Instructions:</span>
            <p className="italic">{currentVer.notes || 'Take medications regularly as instructed. Keep hydrator bottle near desk.'}</p>
          </div>

          <div className="text-right">
            <div className="font-bold text-slate-800 dark:text-slate-200">{activeRx.doctorName}</div>
            <div className="text-[10px] text-slate-400">Campus Medical Centre Officer</div>
          </div>
        </div>

      </div>

      </div>

      {/* Version History Diff Modal */}
      {hasHistory && (
        <VersionDiffViewer
          isOpen={showDiff}
          onClose={() => setShowDiff(false)}
          prescription={activeRx}
          v1={activeRx.history[activeRx.history.length - 1]}
          v2={currentVer}
        />
      )}

      {/* WhatsApp Share Modal */}
      {activeRx && (
        <WhatsAppShareModal
          isOpen={isWhatsAppOpen}
          onClose={() => setIsWhatsAppOpen(false)}
          prescription={activeRx}
          profile={profile}
        />
      )}

    </div>
  );
};
