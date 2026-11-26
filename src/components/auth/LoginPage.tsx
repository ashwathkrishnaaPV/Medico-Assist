import React, { useState } from 'react';
import {
  GraduationCap,
  Stethoscope,
  ShieldCheck,
  ArrowRight,
  Lock,
  CheckCircle2,
  AlertTriangle,
  Mail,
  Eye,
  EyeOff,
  Sparkles,
  PlusCircle,
  LogIn,
  Database
} from 'lucide-react';
import { authService } from '../../services/authService';
import { healthStore } from '../../services/healthStore';
import { Role } from '../../types';
import { StudentRegisterForm } from './StudentRegisterForm';

import { DEPARTMENTS } from '../../constants/departments';
export { DEPARTMENTS };

interface LoginPageProps {
  onLoginSuccess: (role: Role) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [authMode, setAuthMode] = useState<'SIGN_IN' | 'CREATE_ACCOUNT'>('SIGN_IN');

  // Sign In
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const passwordInputRef = React.useRef<HTMLInputElement | null>(null);

  const formatError = (err: unknown, fallback: string): string => {
    if (!err) return fallback;
    if (typeof err === 'string') return err;
    const maybeAxios = err as {
      response?: { data?: { error?: string | { message?: string }; message?: string } };
      message?: string;
    };
    const apiErr = maybeAxios.response?.data?.error;
    if (typeof apiErr === 'string') return apiErr;
    if (typeof apiErr === 'object' && apiErr !== null && apiErr.message) {
      return String(apiErr.message);
    }
    if (maybeAxios.response?.data?.message) {
      return String(maybeAxios.response.data.message);
    }
    if (maybeAxios.message && typeof maybeAxios.message === 'string') {
      return maybeAxios.message;
    }
    return fallback;
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsSubmitting(true);
    try {
      if (!loginEmail.trim()) throw new Error('Please enter your email address.');
      if (!loginPassword) throw new Error('Please enter your password.');
      const user = await authService.login(loginEmail, loginPassword);
      await healthStore.loadFromAPI();
      setIsSubmitting(false);
      onLoginSuccess(user.role);
    } catch (err: unknown) {
      setIsSubmitting(false);
      setErrorMessage(formatError(err, 'Failed to authenticate.'));
    }
  };

  const handlePrefillDevPersona = (emailToLogin: string, label: string) => {
    setErrorMessage(null);
    setLoginEmail(emailToLogin);
    setLoginPassword('');
    setSuccessMessage(`Email pre-filled for ${label}. Enter password to sign in.`);
    passwordInputRef.current?.focus();
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row font-sans selection:bg-[#1A3D63] selection:text-white">

      {/* ════════════════════════════════════════════════════════════
          LEFT 50% — PRISTINE WHITE (#FFFFFF) WITH SECE BRAND ACCENTS
      ════════════════════════════════════════════════════════════ */}
      <div className="w-full lg:w-1/2 bg-white text-[#0A1931] relative flex flex-col justify-between p-8 sm:p-12 lg:p-16 border-r border-[#B3CFE5]/50 overflow-hidden">

        {/* Ambient Decorative Background Glows matching #B3CFE5 & #4A7FA7 */}
        <div className="absolute -top-32 -left-32 w-80 h-80 rounded-full bg-[#B3CFE5]/20 blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 -right-32 w-96 h-96 rounded-full bg-[#E8F2FA] blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 left-1/4 w-80 h-80 rounded-full bg-[#B3CFE5]/25 blur-3xl pointer-events-none" />

        {/* Top Header & College Logo (No shape, blends seamlessly with white background) */}
        <div className="relative z-10">
          <div className="flex items-center gap-5">
            <img
              src="/college-logo.png"
              alt="Sri Eshwar College of Engineering"
              className="h-24 sm:h-28 md:h-32 w-auto object-contain"
            />
            <div className="h-16 w-px bg-[#B3CFE5] hidden sm:block" />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-2xl sm:text-3xl tracking-tight text-[#0A1931]">
                  CampusHealth
                </span>
                <span className="px-3 py-0.5 rounded-full bg-[#1A3D63] text-white text-[10px] font-bold uppercase tracking-wider">
                  v2.5
                </span>
              </div>
              <p className="text-sm text-[#1A3D63] font-semibold mt-0.5">Sri Eshwar College of Engineering</p>
            </div>
          </div>
        </div>

        {/* Center Hero Content */}
        <div className="relative z-10 py-10 lg:py-0 space-y-8 my-auto">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-[#F6FAFD] border border-[#B3CFE5] text-[#1A3D63] text-xs font-semibold shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-[#1A3D63]" />
              <span>CarePlus Integrated Clinical Intelligence</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-[#0A1931] leading-tight">
              Your Campus<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#1A3D63] via-[#4A7FA7] to-[#1A3D63]">
                Medical Companion.
              </span>
            </h1>

            <p className="text-[#4A7FA7] text-sm sm:text-base leading-relaxed max-w-lg">
              Prescriptions, visits, clinical triage, nutrition plans, and emergency QR cards — unified in one secure healthcare workspace.
            </p>
          </div>

          {/* 3 Medical Pillar Cards (Cylindrical Capsule Horizontal Layout) */}
          <div className="space-y-3.5">
            {[
              {
                icon: <GraduationCap className="w-5 h-5 text-white" />,
                title: 'Student Wellness Portal',
                desc: 'Electronic health ledger, active prescriptions & check-ins.'
              },
              {
                icon: <Stethoscope className="w-5 h-5 text-white" />,
                title: 'Medical Centre EHR',
                desc: 'Clinical consults, triage & CDSS prescription logs.'
              },
              {
                icon: <ShieldCheck className="w-5 h-5 text-white" />,
                title: 'Admin Enterprise Console',
                desc: 'RBAC controls, user directory & HIPAA audit trails.'
              }
            ].map((card) => (
              <div
                key={card.title}
                className="p-2.5 pr-6 rounded-full bg-[#F6FAFD] border-2 border-[#B3CFE5]/60 hover:bg-[#EBF3FA] hover:border-[#1A3D63]/40 transition-all flex items-center gap-4 group shadow-xs"
              >
                <div className="w-12 h-12 rounded-full bg-[#1A3D63] border border-[#B3CFE5]/40 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-xs">
                  {card.icon}
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#0A1931]">{card.title}</h3>
                  <p className="text-[#4A7FA7] text-xs leading-snug">{card.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Left Trust Indicators (Cylinder Capsules) */}
        <div className="relative z-10 pt-6 border-t border-[#B3CFE5]/40 flex flex-wrap items-center justify-between gap-3 text-xs text-[#4A7FA7]">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#F6FAFD] border border-[#B3CFE5] font-medium text-[#1A3D63]">
            <Lock className="w-4 h-4 text-[#1A3D63]" />
            <span>TLS 1.3 · HIPAA Certified</span>
          </div>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#F6FAFD] border border-[#B3CFE5] font-medium text-[#1A3D63]">
            <Database className="w-4 h-4 text-[#1A3D63]" />
            <span>MongoDB Database Connected</span>
          </div>
        </div>

      </div>

      {/* ════════════════════════════════════════════════════════════
          RIGHT 50% — PRISTINE ICE WHITE (#F6FAFD) WITH CYLINDER SHAPES
      ════════════════════════════════════════════════════════════ */}
      <div className="w-full lg:w-1/2 bg-[#F6FAFD] text-[#0A1931] flex flex-col justify-between p-6 sm:p-10 lg:p-14 overflow-y-auto">
        <div />

        {/* Form Container (Centered Vertically) */}
        <div className="max-w-md w-full mx-auto my-auto py-6 space-y-6">

          {/* Form Header */}
          <div className="space-y-1">
            <h2 className="text-2xl sm:text-3xl font-black text-[#0A1931] tracking-tight">
              {authMode === 'SIGN_IN' ? 'Sign In to Portal' : 'Create an Account'}
            </h2>
            <p className="text-sm text-[#4A7FA7]">
              {authMode === 'SIGN_IN'
                ? 'Enter your institutional email and password to continue.'
                : 'Get started in under a minute. Quick setup for campus members.'}
            </p>
          </div>

          {/* Cylindrical Mode Switcher (Segmented Cylinder Bar like image) */}
          <div className="p-1.5 bg-white rounded-full border-2 border-[#B3CFE5] shadow-[0_6px_20px_rgba(10,25,49,0.06)] grid grid-cols-2 gap-1.5">
            {(['SIGN_IN', 'CREATE_ACCOUNT'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => { setAuthMode(mode); setErrorMessage(null); setSuccessMessage(null); }}
                className={`py-3 px-6 rounded-full transition-all flex items-center justify-center gap-2 cursor-pointer font-bold text-sm ${
                  authMode === mode
                    ? 'bg-gradient-to-r from-[#1A3D63] to-[#4A7FA7] text-white shadow-md shadow-[#1A3D63]/30 scale-[1.01]'
                    : 'text-[#1A3D63] hover:bg-[#B3CFE5]/20'
                }`}
              >
                {mode === 'SIGN_IN' ? <LogIn className="w-4 h-4" /> : <PlusCircle className="w-4 h-4" />}
                <span>{mode === 'SIGN_IN' ? 'Sign In' : 'Create Account'}</span>
              </button>
            ))}
          </div>

          {/* Feedback Banners (Cylinder Pill Shape) */}
          {errorMessage && (
            <div className="px-5 py-3 rounded-full bg-rose-50 border-2 border-rose-200 text-rose-800 text-sm flex items-center gap-3 animate-fade-in shadow-xs">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
              <span className="font-semibold text-xs">
                {typeof errorMessage === 'string' ? errorMessage : (errorMessage as any)?.message || String(errorMessage)}
              </span>
            </div>
          )}
          {successMessage && (
            <div className="px-5 py-3 rounded-full bg-[#B3CFE5]/30 border-2 border-[#B3CFE5] text-[#0A1931] text-sm flex items-center gap-3 animate-fade-in shadow-xs">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-[#1A3D63]" />
              <span className="font-semibold text-xs">
                {typeof successMessage === 'string' ? successMessage : (successMessage as any)?.message || String(successMessage)}
              </span>
            </div>
          )}

          {/* ─── SIGN IN FORM (All Inputs & Buttons in Cylindrical Shapes) ─── */}
          {authMode === 'SIGN_IN' ? (
            <form onSubmit={handleSignIn} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#1A3D63] pl-2">
                  Institutional Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#4A7FA7] absolute left-4 top-3.5 pointer-events-none" />
                  <input
                    type="email"
                    required
                    placeholder="e.g. ashwathkrishnaa.pv2024cce@sece.ac.in"
                    value={loginEmail}
                    onChange={e => setLoginEmail(e.target.value)}
                    className="w-full pl-11 pr-5 py-3.5 rounded-full bg-white border-2 border-[#B3CFE5] text-[#0A1931] placeholder-[#4A7FA7]/60 text-sm focus:outline-none focus:border-[#1A3D63] focus:ring-4 focus:ring-[#1A3D63]/10 transition-all shadow-xs"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#1A3D63] pl-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#4A7FA7] absolute left-4 top-3.5 pointer-events-none" />
                  <input
                    ref={passwordInputRef}
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={e => setLoginPassword(e.target.value)}
                    className="w-full pl-11 pr-12 py-3.5 rounded-full bg-white border-2 border-[#B3CFE5] text-[#0A1931] placeholder-[#4A7FA7]/60 text-sm focus:outline-none focus:border-[#1A3D63] focus:ring-4 focus:ring-[#1A3D63]/10 transition-all shadow-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-3.5 text-[#4A7FA7] hover:text-[#0A1931] transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Cylindrical Primary Action Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 rounded-full bg-gradient-to-r from-[#1A3D63] via-[#1A3D63] to-[#4A7FA7] hover:from-[#0A1931] hover:to-[#1A3D63] text-white font-bold text-sm shadow-[0_10px_25px_rgba(26,61,99,0.3)] transition-all flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.01] active:scale-[0.99] disabled:opacity-70 mt-2"
              >
                {isSubmitting ? (
                  <span>Authenticating…</span>
                ) : (
                  <>
                    <span>Sign In to Workspace</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* Development-only Email Prefill Helper (strict bcrypt auth required) */}
              {import.meta.env.DEV && (
                <div className="pt-4 border-t border-[#B3CFE5]/50 space-y-2.5">
                  <div className="flex items-center justify-between text-xs font-bold text-[#4A7FA7] px-2">
                    <span>Dev Account Email Prefill:</span>
                    <span className="text-[10px] text-[#1A3D63] font-bold bg-white px-3 py-1 rounded-full border border-[#B3CFE5] shadow-xs">
                      DEV Mode
                    </span>
                  </div>

                  <div className="p-1.5 bg-white rounded-full border-2 border-[#B3CFE5] shadow-xs grid grid-cols-3 gap-1.5">
                    <button
                      type="button"
                      onClick={() => handlePrefillDevPersona('nivetha@sece.ac.in', 'Dr. Nivetha')}
                      className="py-2.5 px-2 rounded-full bg-[#F6FAFD] hover:bg-[#B3CFE5]/30 text-[#1A3D63] font-bold text-[11px] text-center transition-all cursor-pointer shadow-2xs hover:scale-[1.02] truncate"
                      title="Pre-fill Dr. Nivetha email"
                    >
                      🩺 Dr. Nivetha
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePrefillDevPersona('admin@sece.ac.in', 'Campus Admin')}
                      className="py-2.5 px-2 rounded-full bg-[#F6FAFD] hover:bg-[#B3CFE5]/30 text-[#1A3D63] font-bold text-[11px] text-center transition-all cursor-pointer shadow-2xs hover:scale-[1.02] truncate"
                      title="Pre-fill Admin email"
                    >
                      🛡️ Admin
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePrefillDevPersona('ashwathkrishnaa.pv2024cce@sece.ac.in', 'Ashwath (24CC006)')}
                      className="py-2.5 px-2 rounded-full bg-[#F6FAFD] hover:bg-[#B3CFE5]/30 text-[#1A3D63] font-bold text-[11px] text-center transition-all cursor-pointer shadow-2xs hover:scale-[1.02] truncate"
                      title="Pre-fill Student (Ashwath) email"
                    >
                      🎓 Student
                    </button>
                  </div>
                </div>
              )}
            </form>
          ) : (
            <StudentRegisterForm
              onSuccess={onLoginSuccess}
              onError={setErrorMessage}
              onStatus={setSuccessMessage}
              formatError={formatError}
            />
          )}

        </div>

        {/* Footer */}
        <footer className="pt-4 border-t border-[#B3CFE5]/50 text-center text-xs text-[#4A7FA7]">
          CampusHealth Integrated Medical Platform © 2026 · Sri Eshwar College of Engineering
        </footer>

      </div>

    </div>
  );
};
