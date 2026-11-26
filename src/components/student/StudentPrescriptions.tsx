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
      {/* ─── PRINT-ONLY CLASSIC MEDICAL PRESCRIPTION PAD ─── */}
      <div
        className="hidden print:flex print:min-h-screen print:w-full print:items-center print:justify-center print:p-10 bg-white text-slate-900"
        style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}
      >
        <div className="w-full max-w-2xl min-h-[82vh] border-2 border-slate-800 rounded-2xl p-8 flex flex-col justify-between relative overflow-hidden bg-white">
          {/* Subtle Caduceus Watermark in Center */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center z-0">
            <svg
              viewBox="0 0 200 260"
              className="w-80 h-auto text-slate-900 opacity-[0.07]"
              fill="currentColor"
              aria-hidden="true"
            >
              {/* Top Staff Sphere */}
              <circle cx="100" cy="24" r="10" />
              {/* Central Staff */}
              <rect x="97" y="32" width="6" height="210" rx="3" />
              {/* Wings */}
              <path d="M97 44 C70 28, 34 32, 12 46 C26 54, 42 56, 56 56 C44 62, 34 65, 24 67 C42 74, 68 70, 97 56 Z" />
              <path d="M103 44 C130 28, 166 32, 188 46 C174 54, 158 56, 144 56 C156 62, 166 65, 176 67 C158 74, 132 70, 103 56 Z" />
              {/* Intertwined Serpents */}
              <path
                d="M100 66 C66 76, 66 102, 100 112 C134 122, 134 148, 100 158 C74 166, 74 188, 100 198 C118 205, 118 220, 100 228"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                strokeLinecap="round"
              />
              <path
                d="M100 66 C134 76, 134 102, 100 112 C66 122, 66 148, 100 158 C126 166, 126 188, 100 198 C82 205, 82 220, 100 228"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                strokeLinecap="round"
              />
            </svg>
          </div>

          {/* Top Section: Doctor Header + Patient Info */}
          <div className="relative z-10 space-y-5">
            {/* Doctor & Clinic Header */}
            <div className="flex justify-between items-start gap-6 border-b border-slate-300 pb-4">
              <div>
                <div className="text-lg font-extrabold text-slate-900">{activeRx.doctorName}</div>
                <div className="text-xs text-slate-700 font-medium">Campus Medical Centre Officer</div>
              </div>
              <div className="text-left text-xs text-slate-800 leading-relaxed min-w-[210px]">
                <div className="font-semibold">Clinic Hours:</div>
                <div>Mon–Fri: 09:00 – 17:00</div>
                <div>Sat: 09:00 – 13:00</div>
                <div className="mt-1 text-slate-700">Campus Health Medical Centre, SECE</div>
              </div>
            </div>

            {/* Rx Symbol + Underlined Patient Fields */}
            <div className="flex items-start gap-4 pt-1">
              <div className="text-4xl font-black font-serif leading-none text-slate-900 select-none pt-1">
                ℞
              </div>
              <div className="flex-1 space-y-3 text-xs">
                <div className="flex items-end gap-2">
                  <span className="font-bold text-slate-900 shrink-0">Patient&apos;s Name:</span>
                  <div className="flex-1 border-b border-slate-900 pb-0.5 px-1 font-semibold text-sm text-slate-900">
                    {patientName}
                    {studentId ? <span className="text-xs font-normal text-slate-600 ml-2">({studentId})</span> : null}
                  </div>
                </div>

                <div className="grid grid-cols-12 gap-3">
                  <div className="col-span-3 flex items-end gap-1.5">
                    <span className="font-bold text-slate-900 shrink-0">Sex:</span>
                    <div className="flex-1 border-b border-slate-900 pb-0.5 px-1 font-medium text-slate-900">
                      {profile?.gender || '—'}
                    </div>
                  </div>
                  <div className="col-span-3 flex items-end gap-1.5">
                    <span className="font-bold text-slate-900 shrink-0">Age:</span>
                    <div className="flex-1 border-b border-slate-900 pb-0.5 px-1 font-medium text-slate-900">
                      {profile?.age ? `${profile.age}` : '—'}
                    </div>
                  </div>
                  <div className="col-span-6 flex items-end gap-1.5">
                    <span className="font-bold text-slate-900 shrink-0">Date:</span>
                    <div className="flex-1 border-b border-slate-900 pb-0.5 px-1 font-medium text-slate-900">
                      {currentVer.createdAt}
                    </div>
                  </div>
                </div>

                <div className="flex items-end gap-2">
                  <span className="font-bold text-slate-900 shrink-0">Cause / Diagnosis:</span>
                  <div className="flex-1 border-b border-slate-900 pb-0.5 px-1 font-medium text-slate-900">
                    {visitCause}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Center Body: Prescribed Medicines Centered Vertically */}
          <div className="relative z-10 flex-1 flex flex-col justify-center py-6 px-6 space-y-4">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 text-center">
              Prescribed Medications
            </div>
            <div className="space-y-3.5">
              {currentVer.items.map((item, idx) => (
                <div key={idx} className="border-b border-slate-200 pb-2.5">
                  <div className="flex items-baseline justify-between gap-4">
                    <div className="font-bold text-sm text-slate-900">
                      {idx + 1}. {item.medicineName}{' '}
                      <span className="font-semibold text-xs text-slate-700">({item.dosage})</span>
                    </div>
                    <div className="text-xs font-bold text-slate-800 shrink-0">
                      {item.durationDays} Days
                    </div>
                  </div>
                  <div className="text-xs text-slate-700 mt-0.5 pl-4">
                    {item.frequency}
                    {item.instructions ? <span className="italic text-slate-600"> — {item.instructions}</span> : null}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom-Right Signature */}
          <div className="relative z-10 pt-6 flex justify-end">
            <div className="w-52 text-center">
              <div className="border-t-2 border-slate-900 pt-1.5 text-xs font-semibold text-slate-800">
                Signature
              </div>
            </div>
          </div>
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
