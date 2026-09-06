import React, { useState } from 'react';
import { X, ShieldAlert, QrCode, PhoneCall, Lock, FileText, CheckCircle2 } from 'lucide-react';
import { healthStore } from '../../services/healthStore';
import { RestrictedEmergencyView } from '../../types';

interface EmergencyModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentId?: string;
}

import { authService } from '../../services/authService';

export const EmergencyModal: React.FC<EmergencyModalProps> = ({ isOpen, onClose, studentId }) => {
  const currentUser = authService.getCurrentUser();
  const targetStudentId = studentId || currentUser.studentId || healthStore.getAllStudentProfiles()[0]?.studentId || '';
  const [scannedData, setScannedData] = useState<RestrictedEmergencyView | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  if (!isOpen) return null;

  const handleSimulateQRScan = () => {
    setIsScanning(true);
    setTimeout(() => {
      // Trigger restricted emergency access in HealthStore (which logs audit entry)
      const data = healthStore.getRestrictedEmergencyView(targetStudentId, 'Campus First Responder / Paramedic Unit 4');
      setScannedData(data || null);
      setIsScanning(false);
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-rose-200 dark:border-rose-900/50">
        
        {/* Banner */}
        <div className="bg-gradient-to-r from-rose-600 via-red-600 to-rose-700 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-white/20 backdrop-blur-md">
              <ShieldAlert className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h3 className="font-bold text-lg leading-tight">Restricted Emergency Medical Card</h3>
              <p className="text-xs text-rose-100">Encrypted QR Token Access · Audit Logging Enforced</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-white/20 text-white/80 hover:text-white transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {!scannedData ? (
            <div className="text-center space-y-4">
              <div className="w-48 h-48 mx-auto p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-2 border-dashed border-rose-300 dark:border-rose-800 flex flex-col items-center justify-center gap-2">
                <QrCode className="w-24 h-24 text-rose-600 dark:text-rose-400" />
                <span className="text-[11px] font-mono font-semibold text-slate-500 dark:text-slate-400">
                  TOKEN: CH-QR-STU1023-SECURE
                </span>
              </div>

              <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 p-3.5 rounded-2xl text-left text-xs text-amber-900 dark:text-amber-300 flex items-start gap-2.5">
                <Lock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Privacy & HIPAA Security Rule:</span> This QR code contains only a secure lookup token. Scanning exposes strictly critical emergency triage data (Blood Group, Allergies, Contacts). Full clinical history remains locked.
                </div>
              </div>

              <button
                onClick={handleSimulateQRScan}
                disabled={isScanning}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-rose-600 to-red-600 text-white font-bold text-sm shadow-lg shadow-rose-500/30 hover:opacity-95 transition-all flex items-center justify-center gap-2"
              >
                {isScanning ? (
                  <span>Authenticating & Scanning Token...</span>
                ) : (
                  <>
                    <QrCode className="w-4 h-4" />
                    <span>Simulate Emergency Scanner Access</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-4 animate-fade-in">
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 rounded-2xl flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 font-bold text-emerald-800 dark:text-emerald-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Token Authorized & Access Logged</span>
                </div>
                <span className="font-mono text-xs text-emerald-700 dark:text-emerald-400">AUDIT ACTIVE</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                  <span className="text-xs text-gray-500 dark:text-gray-400 block font-semibold uppercase mb-1">Student Name</span>
                  <span className="font-bold text-sm text-gray-900 dark:text-white">{scannedData.studentName}</span>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                  <span className="text-xs text-gray-500 dark:text-gray-400 block font-semibold uppercase mb-1">Student ID</span>
                  <span className="font-bold text-sm text-gray-900 dark:text-white">{scannedData.studentId}</span>
                </div>
              </div>

              {/* Location — helps responders find the student */}
              {scannedData.accommodation && (
                <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-xl border border-blue-200 dark:border-blue-800 flex items-center gap-3">
                  <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                  <div>
                    <span className="text-xs text-blue-600 dark:text-blue-400 font-semibold uppercase block">Location / Accommodation</span>
                    <p className="font-bold text-sm text-blue-900 dark:text-blue-100">
                      {scannedData.accommodation}
                      {scannedData.hostelBlock && ` · Block ${scannedData.hostelBlock}`}
                      {scannedData.hostelRoom && ` · Room ${scannedData.hostelRoom}`}
                    </p>
                  </div>
                </div>
              )}

              {/* Critical Triage Badge */}
              <div className="p-4 bg-rose-50 dark:bg-rose-950 rounded-2xl border border-rose-200 dark:border-rose-800 space-y-3">
                <div>
                  <span className="text-xs uppercase font-bold tracking-wider text-rose-600 dark:text-rose-400">Blood Group</span>
                  <p className="text-2xl font-extrabold text-rose-800 dark:text-rose-200 mt-0.5">{scannedData.bloodGroup || '—'}</p>
                </div>
                <div>
                  <span className="text-xs uppercase font-bold tracking-wider text-rose-600 dark:text-rose-400">Critical Allergies</span>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {scannedData.criticalAllergies.length > 0
                      ? scannedData.criticalAllergies.map((alg, i) => (
                        <span key={i} className="px-2.5 py-1 bg-rose-200 dark:bg-rose-900 text-rose-900 dark:text-rose-100 font-bold text-xs rounded-lg">{alg}</span>
                      ))
                      : <span className="text-sm text-rose-700 dark:text-rose-300">None</span>}
                  </div>
                </div>
                <div>
                  <span className="text-xs uppercase font-bold tracking-wider text-rose-600 dark:text-rose-400">Medical Conditions & Current Meds</span>
                  <p className="text-sm font-semibold text-rose-900 dark:text-rose-100 mt-1">
                    {scannedData.criticalConditions.join(', ') || 'None'} — ({scannedData.criticalMedications.join(', ') || 'None'})
                  </p>
                </div>
              </div>

              {/* Contacts */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                  <span className="text-xs text-gray-500 dark:text-gray-400 block font-semibold uppercase mb-1">Emergency Contact</span>
                  <p className="font-bold text-sm text-gray-900 dark:text-white">{scannedData.emergencyContact.name} ({scannedData.emergencyContact.relation})</p>
                  <a href={`tel:${scannedData.emergencyContact.phone}`} className="text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-1 mt-1 text-sm">
                    <PhoneCall className="w-3.5 h-3.5" /> {scannedData.emergencyContact.phone}
                  </a>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                  <span className="text-xs text-gray-500 dark:text-gray-400 block font-semibold uppercase mb-1">Medical Centre</span>
                  <p className="font-bold text-sm text-gray-900 dark:text-white">Campus Health Dispatch</p>
                  <a href={`tel:${scannedData.medicalCentreContact}`} className="text-teal-700 dark:text-teal-400 font-bold flex items-center gap-1 mt-1 text-sm">
                    <PhoneCall className="w-3.5 h-3.5" /> {scannedData.medicalCentreContact}
                  </a>
                </div>
              </div>

              <button
                onClick={() => setScannedData(null)}
                className="w-full py-2 text-sm font-bold text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-all"
              >
                ← Back to Token View
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
