import React, { useState } from 'react';
import { GraduationCap, Stethoscope, ShieldCheck, ArrowRight } from 'lucide-react';
import { authService } from '../../services/authService';
import { Role } from '../../types';

interface LoginModalProps {
  isOpen: boolean;
  onLoginSuccess: (role: Role) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onLoginSuccess }) => {
  const [selectedPreset, setSelectedPreset] = useState<Role>('STUDENT');

  if (!isOpen) return null;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    authService.switchRole(selectedPreset);
    onLoginSuccess(selectedPreset);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
        
        {/* Header */}
        <div className="bg-white border-b border-slate-200 p-6 text-center space-y-3">
          <img
            src="/college-logo.png"
            alt="Sri Eshwar College of Engineering"
            className="h-16 sm:h-20 w-auto object-contain mx-auto"
          />
          <div>
            <h2 className="text-xl font-bold text-[#0A1931]">CampusHealth Portal Auth</h2>
            <p className="text-xs text-[#1A3D63] font-medium">Sri Eshwar College of Engineering</p>
          </div>
        </div>

        <form onSubmit={handleLogin} className="p-6 space-y-4 text-slate-800 dark:text-slate-100">
          
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase text-slate-400">Choose Role Preset</label>
            
            <button
              type="button"
              onClick={() => setSelectedPreset('STUDENT')}
              className={`w-full p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all ${
                selectedPreset === 'STUDENT'
                  ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-500 text-blue-950 dark:text-blue-200 font-bold'
                  : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <GraduationCap className="w-5 h-5 text-blue-600" />
                <div>
                  <div className="text-xs">Student Wellness Dashboard</div>
                  <div className="text-[10px] text-slate-400 font-normal">Alex Rivera (STU1023)</div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-blue-600" />
            </button>

            <button
              type="button"
              onClick={() => setSelectedPreset('MEDICAL_STAFF')}
              className={`w-full p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all ${
                selectedPreset === 'MEDICAL_STAFF'
                  ? 'bg-sky-50 dark:bg-sky-950/60 border-sky-500 text-sky-950 dark:text-sky-200 font-bold'
                  : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <Stethoscope className="w-5 h-5 text-sky-600" />
                <div>
                  <div className="text-xs">Medical Centre EHR SaaS</div>
                  <div className="text-[10px] text-slate-400 font-normal">Dr. Nivetha M.B.B.S</div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-sky-600" />
            </button>

            <button
              type="button"
              onClick={() => setSelectedPreset('ADMIN')}
              className={`w-full p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all ${
                selectedPreset === 'ADMIN'
                  ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-500 text-indigo-950 dark:text-indigo-200 font-bold'
                  : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-indigo-600" />
                <div>
                  <div className="text-xs">Admin Enterprise & Audit</div>
                  <div className="text-[10px] text-slate-400 font-normal">Marcus Vance</div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-indigo-600" />
            </button>

          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <span>Authenticate & Launch Dashboard</span>
          </button>

        </form>

      </div>
    </div>
  );
};
