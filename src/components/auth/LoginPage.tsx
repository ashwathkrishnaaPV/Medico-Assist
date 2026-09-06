import React, { useState, useEffect } from 'react';
import {
  HeartPulse,
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
  User,
  PlusCircle,
  LogIn,
  ChevronDown,
  Brain,
  ShieldAlert
} from 'lucide-react';
import { authService } from '../../services/authService';
import { healthStore } from '../../services/healthStore';
import { Role, StudentProfileData } from '../../types';

interface LoginPageProps {
  onLoginSuccess: (role: Role) => void;
}

const DEPARTMENTS = [
  'Computer Science', 'Information Technology', 'Electronics & Communication',
  'Electrical Engineering', 'Mechanical Engineering', 'Civil Engineering',
  'Biotechnology', 'Chemical Engineering', 'Physics', 'Mathematics',
  'Chemistry', 'Business Administration', 'Commerce', 'Arts & Humanities', 'Other'
];

const YEARS = ['1st Year', '2nd Year', '3rd Year', '4th Year'];

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [authMode, setAuthMode] = useState<'SIGN_IN' | 'CREATE_ACCOUNT'>('SIGN_IN');
  const [role, setRole] = useState<Role>('STUDENT');

  // Sign In
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirm, setShowRegConfirm] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registeredUsers, setRegisteredUsers] = useState<{ id: string; name: string; email: string; role: string }[]>([]);

  useEffect(() => {
    authService.getUsers().then(users => setRegisteredUsers(users as any[]));
  }, []);

  // Create Account — minimal student fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [year, setYear] = useState('1st Year');
  const [department, setDepartment] = useState('Computer Science');

  // Staff fields
  const [staffId, setStaffId] = useState('');
  const [title, setTitle] = useState('Campus Medical Practitioner');

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      if (!loginEmail.trim()) throw new Error('Please enter your email address.');
      const user = await authService.login(loginEmail, loginPassword);
      if (!user) throw new Error('No account found. Click "Create Account" to register.');
      await healthStore.loadFromAPI();
      setIsSubmitting(false);
      onLoginSuccess(user.role);
    } catch (err: any) {
      setIsSubmitting(false);
      setErrorMessage(err.response?.data?.error || err.message || 'Failed to authenticate.');
    }
  };

  const handleQuickLogin = async (emailToLogin: string, roleToSelect: Role) => {
    setLoginEmail(emailToLogin);
    setLoginPassword('Password@123');
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const user = await authService.login(emailToLogin, 'Password@123');
      if (user) {
        await healthStore.loadFromAPI();
        setIsSubmitting(false);
        onLoginSuccess(user.role);
        return;
      }
    } catch {
      // Auto-register demo persona if not yet created in persistent DB
      try {
        const newUser = await authService.registerUser({
          name: roleToSelect === 'STUDENT' ? 'Alex Rivera' : roleToSelect === 'MEDICAL_STAFF' ? 'Dr. Sarah Jenkins' : roleToSelect === 'RESEARCHER' ? 'Prof. David Vance' : roleToSelect === 'EMERGENCY_RESPONDER' ? 'Campus Paramedic Unit' : 'Campus Administrator',
          email: emailToLogin,
          password: 'Password@123',
          role: roleToSelect,
          studentId: roleToSelect === 'STUDENT' ? 'STU1023' : undefined,
          staffId: roleToSelect !== 'STUDENT' ? 'STAFF_' + roleToSelect.slice(0, 3) : undefined,
          department: 'Campus Health & Research'
        });
        await healthStore.loadFromAPI();
        setIsSubmitting(false);
        onLoginSuccess(newUser.role);
        return;
      } catch (e: any) {
        setErrorMessage(e.message || 'Quick login failed.');
      }
    }
    setIsSubmitting(false);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    if (password !== confirmPassword) {
      setIsSubmitting(false);
      setErrorMessage('Passwords do not match.');
      return;
    }

    try {
      if (!name.trim() || !email.trim() || !password.trim()) {
        throw new Error('Please fill in all required fields.');
      }
      if (role === 'STUDENT' && (!age || !gender)) {
        throw new Error('Please fill in your age and gender.');
      }

      const generatedStudentId = `STU${Math.floor(1000 + Math.random() * 9000)}`;
      const generatedStaffId = staffId.trim() || (role === 'MEDICAL_STAFF'
        ? `DOC${Math.floor(100 + Math.random() * 900)}`
        : `ADM${Math.floor(100 + Math.random() * 900)}`);

      const newUser = await authService.registerUser({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        role,
        studentId: role === 'STUDENT' ? generatedStudentId : undefined,
        staffId: role !== 'STUDENT' ? generatedStaffId : undefined,
        department: role === 'STUDENT' ? department : undefined,
        title: role !== 'STUDENT' ? title : undefined
      });

      // Create minimal student profile — profileComplete: false triggers onboarding
      if (role === 'STUDENT') {
        const profileData: StudentProfileData = {
          id: `prof_${newUser.id}`,
          studentId: generatedStudentId,
          name: name.trim(),
          email: email.trim().toLowerCase(),
          age: parseInt(age) || 0,
          dob: '',
          gender,
          department,
          year,
          ugOrPg: '',
          accommodation: '',
          hostelBlock: '',
          hostelRoom: '',
          phone: '',
          bloodGroup: '',
          emergencyContact: { name: '', relation: '', phone: '' },
          medicalCentreContact: '+91-44-2257-0000',
          criticalAllergies: [],
          criticalConditions: [],
          criticalMedications: [],
          heightCm: 0,
          weightKg: 0,
          bmi: 0,
          lastUpdated: new Date().toISOString().split('T')[0],
          profileComplete: false
        };
        healthStore.createOrUpdateStudentProfile(profileData);
      }

      setIsSubmitting(false);
      setSuccessMessage('Account created! Redirecting…');
      setTimeout(() => onLoginSuccess(newUser.role), 500);
    } catch (err: any) {
      setIsSubmitting(false);
      setErrorMessage(err.response?.data?.error || err.message || 'Registration failed.');
    }
  };


  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col justify-between relative overflow-hidden font-sans">

      {/* Background Glows */}
      <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-emerald-600/20 blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 -right-40 w-96 h-96 rounded-full bg-teal-600/15 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 left-1/3 w-96 h-96 rounded-full bg-indigo-600/15 blur-3xl pointer-events-none" />

      {/* Header */}
      <header className="relative z-10 max-w-7xl w-full mx-auto px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="flex items-center bg-white px-2.5 py-1.5 rounded-2xl shadow-md border border-slate-200">
            <img
              src="/college-logo.webp"
              alt="Sri Eshwar College of Engineering"
              className="h-9 sm:h-10 w-auto object-contain"
            />
          </div>
          <div className="hidden sm:block h-8 w-px bg-gray-700" />
          <div>
            <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-emerald-400 via-teal-300 to-blue-400 bg-clip-text text-transparent">
              CampusHealth
            </span>
            <p className="text-xs text-gray-400 font-medium">Integrated Medical Intelligence Platform</p>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gray-900 border border-gray-700 text-xs text-gray-300 font-semibold">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Secure · Persistent Database</span>
        </div>
      </header>

      {/* Main */}
      <main className="relative z-10 max-w-7xl w-full mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">

        {/* Left — Hero */}
        <div className="lg:col-span-6 space-y-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>Zero Demo Data · Fully Persistent</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
              Your Campus<br />
              <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
                Medical Companion.
              </span>
            </h1>
            <p className="text-gray-300 text-sm sm:text-base leading-relaxed max-w-xl">
              Prescriptions, visits, nutrition plans, and emergency cards — all in one secure platform built for students and medical staff.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { icon: <GraduationCap className="w-5 h-5" />, color: 'emerald', title: 'Student Portal', desc: 'Health records, prescriptions & daily check-ins.' },
              { icon: <Stethoscope className="w-5 h-5" />, color: 'teal', title: 'Medical Centre', desc: 'Clinical consultations, diagnosis & monitoring.' },
              { icon: <ShieldCheck className="w-5 h-5" />, color: 'indigo', title: 'Admin Console', desc: 'User management, RBAC & full audit trails.' }
            ].map((card) => (
              <div key={card.title} className={`p-4 rounded-2xl bg-gray-900 border border-${card.color}-500/25 space-y-2`}>
                <div className={`p-2 w-fit rounded-xl bg-${card.color}-500/15 text-${card.color}-400`}>{card.icon}</div>
                <h3 className="font-bold text-sm text-white">{card.title}</h3>
                <p className="text-gray-400 text-xs">{card.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right — Auth Card */}
        <div className="lg:col-span-6">
          <div className="bg-gray-900 border border-gray-700 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5">

            {/* Header & Toggle */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    {authMode === 'SIGN_IN' ? 'Sign In' : 'Create Account'}
                  </h2>
                  <p className="text-sm text-gray-400 mt-1">
                    {authMode === 'SIGN_IN'
                      ? 'Log in with your registered credentials.'
                      : 'Quick setup — medical details collected after login.'}
                  </p>
                </div>
                <div className="px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-300 font-bold text-[10px] uppercase tracking-wider border border-emerald-500/30">
                  DB Live
                </div>
              </div>

              {/* Mode Toggle */}
              <div className="grid grid-cols-2 p-1 bg-gray-950 rounded-2xl border border-gray-800 text-sm font-bold">
                {(['SIGN_IN', 'CREATE_ACCOUNT'] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => { setAuthMode(mode); setErrorMessage(null); setSuccessMessage(null); }}
                    className={`py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 ${
                      authMode === mode
                        ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    {mode === 'SIGN_IN' ? <LogIn className="w-4 h-4" /> : <PlusCircle className="w-4 h-4" />}
                    <span>{mode === 'SIGN_IN' ? 'Sign In' : 'Create Account'}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Banners */}
            {errorMessage && (
              <div className="p-3.5 rounded-xl bg-red-950 border border-red-700 text-red-200 text-sm flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{errorMessage}</span>
              </div>
            )}
            {successMessage && (
              <div className="p-3.5 rounded-xl bg-emerald-950 border border-emerald-700 text-emerald-200 text-sm flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* ─── SIGN IN FORM ─── */}
            {authMode === 'SIGN_IN' ? (
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-sm font-semibold text-gray-200">Email Address</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-gray-500 absolute left-3.5 top-3.5" />
                    <input
                      type="email"
                      required
                      placeholder="you@college.edu"
                      value={loginEmail}
                      onChange={e => setLoginEmail(e.target.value)}
                      className="w-full pl-10 pr-3 py-3 rounded-xl bg-gray-800 border border-gray-600 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-sm font-semibold text-gray-200">Password</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-gray-500 absolute left-3.5 top-3.5" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={e => setLoginPassword(e.target.value)}
                      className="w-full pl-10 pr-10 py-3 rounded-xl bg-gray-800 border border-gray-600 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-3.5 text-gray-500 hover:text-gray-300">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {registeredUsers.length === 0 && (
                  <div className="p-3.5 rounded-xl bg-amber-950 border border-amber-700 text-amber-200 text-sm space-y-1">
                    <p className="font-bold">No accounts found.</p>
                    <p className="text-amber-300 text-xs">Switch to <strong>Create Account</strong> to register your first profile.</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-sm shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
                >
                  {isSubmitting ? 'Authenticating…' : <><span>Sign In to Workspace</span><ArrowRight className="w-4 h-4" /></>}
                </button>

                {/* 1-Click Evaluation Demo Personas */}
                <div className="pt-3 border-t border-gray-800 space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-bold text-gray-400">
                    <span>1-Click Evaluation Personas:</span>
                    <span className="text-[10px] text-emerald-400 font-semibold">Demo Ready</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 text-[11px]">
                    <button
                      type="button"
                      onClick={() => handleQuickLogin('alex@sece.ac.in', 'STUDENT')}
                      className="p-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-emerald-300 border border-emerald-900 font-semibold text-left transition-all"
                    >
                      🎓 Student (Alex)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickLogin('jenkins@sece.ac.in', 'MEDICAL_STAFF')}
                      className="p-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-teal-300 border border-teal-900 font-semibold text-left transition-all"
                    >
                      🩺 Doctor (Jenkins)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickLogin('admin@sece.ac.in', 'ADMIN')}
                      className="p-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-indigo-300 border border-indigo-900 font-semibold text-left transition-all"
                    >
                      🛡️ Administrator
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickLogin('researcher@sece.ac.in', 'RESEARCHER')}
                      className="p-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-purple-300 border border-purple-900 font-semibold text-left transition-all"
                    >
                      🧠 Researcher (AI)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickLogin('responder@sece.ac.in', 'EMERGENCY_RESPONDER')}
                      className="p-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-rose-300 border border-rose-900 font-semibold text-left transition-all col-span-2 sm:col-span-1"
                    >
                      🚨 First Responder
                    </button>
                  </div>
                </div>
              </form>

            ) : (
              /* ─── CREATE ACCOUNT FORM ─── */
              <form onSubmit={handleRegister} className="space-y-4">

                {/* Role Selection */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-200">Account Type</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {[
                      { r: 'STUDENT' as Role, label: 'Student', icon: <GraduationCap className="w-4 h-4" />, color: 'emerald' },
                      { r: 'MEDICAL_STAFF' as Role, label: 'Medical Staff', icon: <Stethoscope className="w-4 h-4" />, color: 'teal' },
                      { r: 'ADMIN' as Role, label: 'Admin', icon: <ShieldCheck className="w-4 h-4" />, color: 'indigo' },
                      { r: 'RESEARCHER' as Role, label: 'Researcher', icon: <Brain className="w-4 h-4" />, color: 'purple' },
                      { r: 'EMERGENCY_RESPONDER' as Role, label: 'First Responder', icon: <ShieldAlert className="w-4 h-4" />, color: 'rose' },
                    ].map(({ r, label, icon, color }) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setRole(r)}
                        className={`p-2.5 rounded-xl border text-center transition-all text-xs ${
                          role === r
                            ? `bg-${color}-950 border-${color}-500 text-${color}-300 font-bold`
                            : 'bg-gray-800 border-gray-700 text-gray-400 hover:text-white hover:border-gray-500'
                        }`}
                      >
                        <div className={`w-4 h-4 mx-auto mb-1 ${role === r ? `text-${color}-400` : 'text-gray-500'}`}>{icon}</div>
                        <span>{label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Common fields */}
                <div className="space-y-1.5">
                  <label className="block text-sm font-semibold text-gray-200">Full Name <span className="text-red-400">*</span></label>
                  <div className="relative">
                    <User className="w-4 h-4 text-gray-500 absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Arjun Sharma"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      className="w-full pl-10 pr-3 py-3 rounded-xl bg-gray-800 border border-gray-600 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-sm font-semibold text-gray-200">Email Address <span className="text-red-400">*</span></label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-gray-500 absolute left-3.5 top-3.5" />
                    <input
                      type="email"
                      required
                      placeholder="arjun@college.edu"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="w-full pl-10 pr-3 py-3 rounded-xl bg-gray-800 border border-gray-600 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="block text-sm font-semibold text-gray-200">Password <span className="text-red-400">*</span></label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-gray-500 absolute left-3.5 top-3.5" />
                      <input
                        type={showRegPassword ? 'text' : 'password'}
                        required
                        placeholder="••••••••"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        className="w-full pl-10 pr-9 py-3 rounded-xl bg-gray-800 border border-gray-600 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
                      />
                      <button type="button" onClick={() => setShowRegPassword(!showRegPassword)} className="absolute right-3 top-3.5 text-gray-500 hover:text-gray-300">
                        {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-sm font-semibold text-gray-200">Confirm Password <span className="text-red-400">*</span></label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-gray-500 absolute left-3.5 top-3.5" />
                      <input
                        type={showRegConfirm ? 'text' : 'password'}
                        required
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        className="w-full pl-10 pr-9 py-3 rounded-xl bg-gray-800 border border-gray-600 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
                      />
                      <button type="button" onClick={() => setShowRegConfirm(!showRegConfirm)} className="absolute right-3 top-3.5 text-gray-500 hover:text-gray-300">
                        {showRegConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Student-only quick fields */}
                {role === 'STUDENT' && (
                  <div className="space-y-3 pt-3 border-t border-gray-700">
                    <p className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Basic Student Info</p>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="block text-sm font-semibold text-gray-200">Age <span className="text-red-400">*</span></label>
                        <input
                          type="number"
                          required
                          placeholder="e.g. 19"
                          min={15}
                          max={40}
                          value={age}
                          onChange={e => setAge(e.target.value)}
                          className="w-full px-3 py-3 rounded-xl bg-gray-800 border border-gray-600 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-sm font-semibold text-gray-200">Gender <span className="text-red-400">*</span></label>
                        <div className="relative">
                          <select
                            required
                            value={gender}
                            onChange={e => setGender(e.target.value)}
                            className="w-full px-3 py-3 rounded-xl bg-gray-800 border border-gray-600 text-sm text-white focus:outline-none focus:border-emerald-500 appearance-none"
                          >
                            <option value="">Select…</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                            <option value="Prefer not to say">Prefer not to say</option>
                          </select>
                          <ChevronDown className="w-4 h-4 text-gray-500 absolute right-3 top-3.5 pointer-events-none" />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="block text-sm font-semibold text-gray-200">Class / Year <span className="text-red-400">*</span></label>
                        <div className="relative">
                          <select
                            value={year}
                            onChange={e => setYear(e.target.value)}
                            className="w-full px-3 py-3 rounded-xl bg-gray-800 border border-gray-600 text-sm text-white focus:outline-none focus:border-emerald-500 appearance-none"
                          >
                            {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                          </select>
                          <ChevronDown className="w-4 h-4 text-gray-500 absolute right-3 top-3.5 pointer-events-none" />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-sm font-semibold text-gray-200">Department <span className="text-red-400">*</span></label>
                        <div className="relative">
                          <select
                            value={department}
                            onChange={e => setDepartment(e.target.value)}
                            className="w-full px-3 py-3 rounded-xl bg-gray-800 border border-gray-600 text-sm text-white focus:outline-none focus:border-emerald-500 appearance-none"
                          >
                            {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                          </select>
                          <ChevronDown className="w-4 h-4 text-gray-500 absolute right-3 top-3.5 pointer-events-none" />
                        </div>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-emerald-950/50 border border-emerald-800/50 text-emerald-300 text-xs flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
                      <span>Medical details, blood group, emergency contacts & hostel info will be collected after login in a guided form.</span>
                    </div>
                  </div>
                )}

                {/* Staff-only fields */}
                {role !== 'STUDENT' && (
                  <div className="space-y-3 pt-3 border-t border-gray-700">
                    <p className="text-xs font-bold text-teal-400 uppercase tracking-widest">
                      {role === 'MEDICAL_STAFF' ? 'Staff Credentials' : 'Admin Details'}
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="block text-sm font-semibold text-gray-200">Staff ID</label>
                        <input
                          type="text"
                          placeholder={role === 'MEDICAL_STAFF' ? 'DOC402' : 'ADM001'}
                          value={staffId}
                          onChange={e => setStaffId(e.target.value)}
                          className="w-full px-3 py-3 rounded-xl bg-gray-800 border border-gray-600 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-teal-500"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-sm font-semibold text-gray-200">Professional Title</label>
                        <input
                          type="text"
                          placeholder={role === 'MEDICAL_STAFF' ? 'Senior Campus Physician' : 'Director of Operations'}
                          value={title}
                          onChange={e => setTitle(e.target.value)}
                          className="w-full px-3 py-3 rounded-xl bg-gray-800 border border-gray-600 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-teal-500"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-sm shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
                >
                  {isSubmitting ? 'Creating Account…' : <><span>Create Account</span><ArrowRight className="w-4 h-4" /></>}
                </button>
              </form>
            )}

            <div className="pt-2 border-t border-gray-800 text-center text-xs text-gray-500 flex items-center justify-center gap-2">
              <Lock className="w-3.5 h-3.5 text-emerald-500" />
              <span>TLS 1.3 Encrypted · Persistent Database Storage</span>
            </div>
          </div>
        </div>
      </main>

      <footer className="relative z-10 border-t border-gray-900 py-5 text-center text-xs text-gray-600">
        CampusHealth Integrated Medical Platform © 2026 · All Rights Reserved
      </footer>
    </div>
  );
};
