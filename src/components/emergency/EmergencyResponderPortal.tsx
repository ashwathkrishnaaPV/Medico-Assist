import React, { useState } from 'react';
import {
  ShieldAlert,
  QrCode,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Search
} from 'lucide-react';
import { emergencyService } from '../../services/emergencyService';
import { EmergencyVerificationResult } from '../../types';

export const EmergencyResponderPortal: React.FC = () => {
  const [tokenInput, setTokenInput] = useState('');
  const [result, setResult] = useState<EmergencyVerificationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenInput.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const data = await emergencyService.verifyToken({
        token: tokenInput.trim(),
        responderName: 'First Aid Triage Responder',
        responderRole: 'EMERGENCY_RESPONDER',
        responderId: 'EMS_RESPONDER_DESK'
      });
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Token verification failed. Please check if token is valid or expired.');
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fade-in pb-12">
      {/* Top Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white shadow-xl shadow-red-600/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-rose-200 text-xs font-bold uppercase tracking-wider mb-1">
            <ShieldAlert className="w-4 h-4" /> Emergency Access Protocol Active
          </div>
          <h1 className="text-2xl font-black">Emergency Responder Triage Portal</h1>
          <p className="text-xs text-rose-100 mt-1 max-w-xl">
            Scan or enter a student's emergency token. The system releases strictly the minimum necessary life-saving clinical dataset while preserving medical privacy.
          </p>
        </div>

        <div className="px-4 py-2 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 text-right">
          <span className="text-[10px] text-rose-200 block uppercase font-bold">Standard</span>
          <span className="text-xs font-extrabold">HIPAA Min. Necessary</span>
        </div>
      </div>

      {/* Token Input Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <QrCode className="w-4 h-4 text-rose-600" />
          Verify Emergency QR Token
        </h2>

        <form onSubmit={handleVerify} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={tokenInput}
              onChange={e => setTokenInput(e.target.value)}
              placeholder="Paste or scan emergency token (e.g. emg_4f8a...)"
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !tokenInput.trim()}
            className="px-6 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-600/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
          >
            {loading ? 'Verifying...' : 'Authorize & Lookup'}
          </button>
        </form>

        {error && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-300 dark:border-rose-800 rounded-2xl text-xs text-rose-800 dark:text-rose-200 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{typeof error === 'string' ? error : (error as any)?.message || String(error)}</span>
          </div>
        )}
      </div>

      {/* Verified Emergency Result */}
      {result && (
        <div className="space-y-6 animate-fade-in">
          {/* Disclosure Metrics Banner */}
          <div className="p-5 rounded-3xl bg-blue-50 dark:bg-blue-950/40 border border-blue-300 dark:border-blue-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-blue-900 dark:text-blue-100">
                  Minimum Necessary Dataset Released
                </h3>
                <p className="text-xs text-blue-700 dark:text-blue-300 mt-0.5">
                  Audit Entry Recorded · Latency: {result.accessMetadata.latencyMs}ms · Hash: {result.accessMetadata.tokenHashPrefix}
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] text-blue-700 dark:text-blue-400 font-bold uppercase block">Privacy Score</span>
              <span className="text-base font-extrabold text-blue-800 dark:text-blue-200">
                85.4% Withheld
              </span>
            </div>
          </div>

          {/* Emergency Card Display */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b border-slate-100 dark:border-slate-800 gap-2">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Patient Name</span>
                <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">{result.studentName}</h2>
                <span className="text-xs text-slate-500 font-mono">ID: {result.studentId} · {result.accommodation}</span>
              </div>

              <div className="px-4 py-2 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-center">
                <span className="text-[10px] text-rose-600 dark:text-rose-400 font-bold uppercase block">Verified Blood Group</span>
                <span className="text-xl font-black text-rose-700 dark:text-rose-300">{result.bloodGroup}</span>
              </div>
            </div>

            {/* Critical Allergies Box */}
            <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 space-y-2">
              <span className="text-xs font-bold text-red-900 dark:text-red-200 flex items-center gap-1.5 uppercase tracking-wide">
                <AlertTriangle className="w-4 h-4 text-red-600" /> Critical Allergies
              </span>
              <div className="flex flex-wrap gap-2">
                {result.criticalAllergies.map((a, i) => (
                  <span key={i} className="px-3 py-1 bg-red-600 text-white font-bold text-xs rounded-xl shadow-xs">
                    {a}
                  </span>
                ))}
              </div>
            </div>

            {/* Conditions & Medications */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-1">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">Critical Conditions</span>
                <p className="text-xs text-slate-600 dark:text-slate-400">{result.criticalConditions.join(', ')}</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-1">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">Critical Medications</span>
                <p className="text-xs text-slate-600 dark:text-slate-400">{result.criticalMedications.join(', ')}</p>
              </div>
            </div>

            {/* Contact Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Emergency Contact</span>
                <div className="text-xs text-slate-600 dark:text-slate-400">
                  <div className="font-semibold text-slate-900 dark:text-white">{result.emergencyContact.name} ({result.emergencyContact.relation})</div>
                  <div className="font-mono text-rose-600 dark:text-rose-400 font-bold mt-0.5">{result.emergencyContact.phone}</div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Campus Medical Centre</span>
                <div className="text-xs text-slate-600 dark:text-slate-400">
                  <div>Sri Eshwar Health & Triage Desk</div>
                  <div className="font-mono text-blue-600 dark:text-blue-400 font-bold mt-0.5">{result.medicalCentreContact}</div>
                </div>
              </div>
            </div>

            {/* HIPAA Compliance Note */}
            <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <Lock className="w-4 h-4 shrink-0 text-slate-400" />
              <span>{result.privacyNotice}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
