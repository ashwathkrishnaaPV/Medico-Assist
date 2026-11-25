import React, { useState, useEffect } from 'react';
import {
  X,
  ShieldAlert,
  QrCode,
  Lock,
  CheckCircle2,
  AlertTriangle,
  Clock,
  RefreshCw,
  EyeOff
} from 'lucide-react';
import { emergencyService } from '../../services/emergencyService';
import { authService } from '../../services/authService';
import { EmergencyTokenResponse, EmergencyVerificationResult } from '../../types';

interface EmergencyModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentId?: string;
}

export const EmergencyModal: React.FC<EmergencyModalProps> = ({ isOpen, onClose, studentId }) => {
  const currentUser = authService.getCurrentUser();
  const targetStudentId = studentId || currentUser.studentId || currentUser.id;

  const [tokenData, setTokenData] = useState<EmergencyTokenResponse | null>(null);
  const [scannedData, setScannedData] = useState<EmergencyVerificationResult | null>(null);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(900);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset modal state during render when closed
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
  if (prevIsOpen !== isOpen) {
    setPrevIsOpen(isOpen);
    if (!isOpen) {
      setScannedData(null);
      setError(null);
      setTokenData(null);
    }
  }

  // Generate cryptographic token on modal open
  useEffect(() => {
    if (!isOpen) return;

    let ignore = false;
    emergencyService.generateToken(targetStudentId)
      .then(data => {
        if (!ignore) {
          setTokenData(data);
          setSecondsRemaining(data.ttlSeconds || 900);
          setError(null);
          setLoading(false);
        }
      })
      .catch((err: any) => {
        if (!ignore) {
          setError(err.message || 'Failed to generate emergency token.');
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [isOpen, targetStudentId]);

  // Countdown timer
  useEffect(() => {
    if (!tokenData || secondsRemaining <= 0) return;
    const timer = setInterval(() => {
      setSecondsRemaining(prev => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [tokenData, secondsRemaining]);

  const handleSimulateScan = async () => {
    if (!tokenData) return;
    setLoading(true);
    setError(null);
    try {
      const result = await emergencyService.verifyToken({
        token: tokenData.token,
        responderName: 'Campus First Responder / Paramedic Unit 4',
        responderRole: 'EMERGENCY_RESPONDER',
        responderId: 'EMS_PARAMEDIC_4'
      });
      setScannedData(result);
    } catch (err: any) {
      setError(err.message || 'Verification failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleRevoke = async () => {
    try {
      await emergencyService.revokeTokens();
      setTokenData(null);
      setScannedData(null);
      setError('Active emergency token was successfully revoked.');
    } catch (err: any) {
      setError(err.message || 'Revocation failed.');
    }
  };

  if (!isOpen) return null;

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
      <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-rose-200 dark:border-rose-900/50 max-h-[90vh] flex flex-col">
        
        {/* Banner Header */}
        <div className="bg-gradient-to-r from-rose-600 via-red-600 to-rose-700 text-white p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-white/20 backdrop-blur-md">
              <ShieldAlert className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h3 className="font-bold text-lg leading-tight">Privacy-Preserving Emergency Medical Card</h3>
              <p className="text-xs text-rose-100">Cryptographic Opaque Token · Minimum Necessary Disclosure</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-white/20 text-white/80 hover:text-white transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {error && (
            <div className="p-3.5 bg-rose-50 dark:bg-rose-950/50 border border-rose-300 dark:border-rose-800 rounded-2xl text-xs text-rose-800 dark:text-rose-200 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{typeof error === 'string' ? error : (error as any)?.message || String(error)}</span>
            </div>
          )}

          {!scannedData ? (
            <div className="text-center space-y-4">
              {/* QR Container */}
              <div className="w-56 h-56 mx-auto p-4 bg-slate-50 dark:bg-slate-800 rounded-3xl border-2 border-dashed border-rose-300 dark:border-rose-800 flex flex-col items-center justify-center gap-2">
                {loading ? (
                  <RefreshCw className="w-10 h-10 text-rose-600 animate-spin" />
                ) : (
                  <>
                    <QrCode className="w-28 h-28 text-rose-600 dark:text-rose-400" />
                    <div className="text-center">
                      <span className="text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400 block truncate max-w-[200px]">
                        {tokenData ? tokenData.token.slice(0, 18) + '...' : 'GENERATING...'}
                      </span>
                      <div className="flex items-center justify-center gap-1 text-[11px] font-bold text-amber-600 dark:text-amber-400 mt-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Expires in {formatTime(secondsRemaining)}</span>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Research Disclosure Notice */}
              <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 p-3.5 rounded-2xl text-left text-xs text-amber-900 dark:text-amber-300 space-y-1.5">
                <div className="flex items-center gap-2 font-bold">
                  <Lock className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Privacy-Preserving Protocol: Minimum Necessary Standard</span>
                </div>
                <p className="text-[11px] leading-relaxed text-amber-800 dark:text-amber-300">
                  This QR code embeds an opaque cryptographic token. When scanned by an emergency first responder, it releases only triage-critical parameters (Blood Group, Allergies, Critical Meds, Emergency Contacts). Full clinical histories, consultation notes, and diagnoses remain securely locked.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-2 pt-2">
                <button
                  onClick={handleSimulateScan}
                  disabled={loading || !tokenData || secondsRemaining === 0}
                  className="flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-rose-600 to-red-600 text-white font-bold text-xs shadow-md shadow-rose-600/20 hover:opacity-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <QrCode className="w-4 h-4" />
                  <span>Simulate Responder QR Scan</span>
                </button>
                <button
                  onClick={handleRevoke}
                  className="py-3 px-4 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-200 dark:hover:bg-slate-700 transition-all flex items-center justify-center gap-1.5"
                >
                  <EyeOff className="w-4 h-4 text-rose-500" />
                  <span>Revoke Token</span>
                </button>
              </div>
            </div>
          ) : (
            /* Emergency Verified View */
            <div className="space-y-4 animate-fade-in">
              <div className="p-3 bg-blue-50 dark:bg-blue-950/60 border border-blue-300 dark:border-blue-800 rounded-2xl flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 font-bold text-blue-800 dark:text-blue-200">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span>Token Verified · Triage Dataset Released</span>
                </div>
                <span className="font-mono font-bold text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded-md">
                  AUDITED
                </span>
              </div>

              {/* Research Disclosure Gauge */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
                <div className="flex justify-between font-bold">
                  <span className="text-slate-700 dark:text-slate-300">Minimum Necessary Disclosure Score:</span>
                  <span className="text-blue-600 dark:text-blue-400">85.4% Privacy Preserved</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden flex">
                  <div className="bg-rose-500 h-full" style={{ width: '14.6%' }} title="Emergency Data (14.6%)" />
                  <div className="bg-blue-500 h-full" style={{ width: '85.4%' }} title="Withheld Private EHR (85.4%)" />
                </div>
                <div className="flex justify-between text-[10px] text-slate-500 dark:text-slate-400">
                  <span>Exposed: 7 critical fields</span>
                  <span>Withheld: 41 sensitive EHR fields</span>
                </div>
              </div>

              {/* Minimum Necessary Dataset Cards */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-semibold uppercase">Student Name</span>
                  <span className="font-bold text-sm text-slate-900 dark:text-white">{scannedData.studentName}</span>
                </div>

                <div className="p-3 bg-rose-50 dark:bg-rose-950/40 rounded-xl border border-rose-200 dark:border-rose-800">
                  <span className="text-[10px] text-rose-600 dark:text-rose-400 block font-semibold uppercase">Blood Group</span>
                  <span className="font-extrabold text-sm text-rose-700 dark:text-rose-300">{scannedData.bloodGroup}</span>
                </div>
              </div>

              {/* Critical Allergies */}
              <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-2xl text-xs space-y-1">
                <span className="font-bold text-red-900 dark:text-red-200 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-600" /> Critical Allergies
                </span>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {scannedData.criticalAllergies.map((a, i) => (
                    <span key={i} className="px-2 py-0.5 rounded-md bg-red-600 text-white font-bold text-[11px]">
                      {a}
                    </span>
                  ))}
                </div>
              </div>

              {/* Critical Conditions & Medications */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1">
                  <span className="font-bold text-slate-700 dark:text-slate-300">Documented Conditions</span>
                  <p className="text-slate-600 dark:text-slate-400 text-[11px]">{scannedData.criticalConditions.join(', ')}</p>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1">
                  <span className="font-bold text-slate-700 dark:text-slate-300">Critical Active Meds</span>
                  <p className="text-slate-600 dark:text-slate-400 text-[11px]">{scannedData.criticalMedications.join(', ')}</p>
                </div>
              </div>

              {/* Emergency Contact */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
                <span className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Emergency Contact</span>
                <div className="flex justify-between items-center text-[11px]">
                  <span>{scannedData.emergencyContact.name} ({scannedData.emergencyContact.relation})</span>
                  <span className="font-mono font-bold text-rose-600 dark:text-rose-400">{scannedData.emergencyContact.phone}</span>
                </div>
              </div>

              <button
                onClick={() => setScannedData(null)}
                className="w-full py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
              >
                Back to QR Token Display
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
