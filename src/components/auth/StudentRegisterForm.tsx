import React, { useState } from 'react';
import {
  GraduationCap,
  ArrowRight,
  Lock,
  CheckCircle2,
  Mail,
  Eye,
  EyeOff,
  User,
  ChevronDown
} from 'lucide-react';
import { authService } from '../../services/authService';
import { healthStore } from '../../services/healthStore';
import { Role } from '../../types';
import { DEPARTMENTS } from '../../constants/departments';

interface StudentRegisterFormProps {
  onSuccess: (role: Role) => void;
  onError: (msg: string | null) => void;
  onStatus: (msg: string | null) => void;
  formatError: (err: unknown, fallback: string) => string;
}

const YEARS = ['1st Year', '2nd Year', '3rd Year', '4th Year'];
const PASSWORD_POLICY = /^(?=.*[A-Za-z])(?=.*\d).{8,128}$/;

export const StudentRegisterForm: React.FC<StudentRegisterFormProps> = ({
  onSuccess,
  onError,
  onStatus,
  formatError
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [studentRollNo, setStudentRollNo] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [year, setYear] = useState('1st Year');
  const [department, setDepartment] = useState(DEPARTMENTS[0]);
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirm, setShowRegConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    onError(null);
    onStatus(null);
    setIsSubmitting(true);

    if (password !== confirmPassword) {
      setIsSubmitting(false);
      onError('Passwords do not match.');
      return;
    }

    if (!PASSWORD_POLICY.test(password)) {
      setIsSubmitting(false);
      onError('Password must be at least 8 characters and include both letters and numbers.');
      return;
    }

    try {
      if (!name.trim() || !email.trim() || !password) {
        throw new Error('Please fill in all required fields.');
      }
      const parsedAge = parseInt(age, 10);
      if (!parsedAge || parsedAge < 15 || parsedAge > 60) {
        throw new Error('Please enter a valid age between 15 and 60.');
      }

      const assignedStudentId = studentRollNo.trim()
        ? studentRollNo.trim().toUpperCase()
        : `STU${Math.floor(1000 + Math.random() * 9000)}`;

      const newUser = await authService.registerUser({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        studentId: assignedStudentId,
        department,
        phone: contactPhone.trim() || undefined,
        age: parsedAge,
        gender,
        year
      });

      await healthStore.loadFromAPI();
      setIsSubmitting(false);
      onStatus('Account created! Redirecting…');
      setTimeout(() => onSuccess(newUser.role), 400);
    } catch (err: unknown) {
      setIsSubmitting(false);
      onError(formatError(err, 'Registration failed.'));
    }
  };

  return (
    <form onSubmit={handleRegister} className="space-y-4">
      <div className="px-4 py-2.5 rounded-full bg-[#F6FAFD] border-2 border-[#B3CFE5] text-xs font-semibold text-[#1A3D63] flex items-center gap-2">
        <GraduationCap className="w-4 h-4 shrink-0 text-[#4A7FA7]" />
        <span>Student Self-Registration · Staff accounts are admin-provisioned</span>
      </div>

      <div className="space-y-1.5">
        <label className="block text-xs font-bold uppercase tracking-wider text-[#1A3D63] pl-2">
          Full Name <span className="text-rose-500">*</span>
        </label>
        <div className="relative">
          <User className="w-4 h-4 text-[#4A7FA7] absolute left-4 top-3.5 pointer-events-none" />
          <input
            type="text"
            required
            placeholder="e.g. Arjun Sharma"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full pl-11 pr-5 py-3.5 rounded-full bg-white border-2 border-[#B3CFE5] text-[#0A1931] placeholder-[#4A7FA7]/60 text-sm focus:outline-none focus:border-[#1A3D63] focus:ring-4 focus:ring-[#1A3D63]/10 transition-all shadow-xs"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="block text-xs font-bold uppercase tracking-wider text-[#1A3D63] pl-2">
          Email Address <span className="text-rose-500">*</span>
        </label>
        <div className="relative">
          <Mail className="w-4 h-4 text-[#4A7FA7] absolute left-4 top-3.5 pointer-events-none" />
          <input
            type="email"
            required
            placeholder="arjun@sece.ac.in"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full pl-11 pr-5 py-3.5 rounded-full bg-white border-2 border-[#B3CFE5] text-[#0A1931] placeholder-[#4A7FA7]/60 text-sm focus:outline-none focus:border-[#1A3D63] focus:ring-4 focus:ring-[#1A3D63]/10 transition-all shadow-xs"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="block text-xs font-bold uppercase tracking-wider text-[#1A3D63] pl-2">
            Password <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-[#4A7FA7] absolute left-4 top-3.5 pointer-events-none" />
            <input
              type={showRegPassword ? 'text' : 'password'}
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-11 pr-11 py-3.5 rounded-full bg-white border-2 border-[#B3CFE5] text-[#0A1931] placeholder-[#4A7FA7]/60 text-sm focus:outline-none focus:border-[#1A3D63] focus:ring-4 focus:ring-[#1A3D63]/10 transition-all shadow-xs"
            />
            <button
              type="button"
              onClick={() => setShowRegPassword(!showRegPassword)}
              className="absolute right-3.5 top-3.5 text-[#4A7FA7] hover:text-[#0A1931]"
            >
              {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-bold uppercase tracking-wider text-[#1A3D63] pl-2">
            Confirm <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-[#4A7FA7] absolute left-4 top-3.5 pointer-events-none" />
            <input
              type={showRegConfirm ? 'text' : 'password'}
              required
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full pl-11 pr-11 py-3.5 rounded-full bg-white border-2 border-[#B3CFE5] text-[#0A1931] placeholder-[#4A7FA7]/60 text-sm focus:outline-none focus:border-[#1A3D63] focus:ring-4 focus:ring-[#1A3D63]/10 transition-all shadow-xs"
            />
            <button
              type="button"
              onClick={() => setShowRegConfirm(!showRegConfirm)}
              className="absolute right-3.5 top-3.5 text-[#4A7FA7] hover:text-[#0A1931]"
            >
              {showRegConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      <p className="text-[11px] text-[#4A7FA7] pl-2">
        Password must be at least 8 characters with letters and numbers.
      </p>

      <div className="space-y-3 pt-3 border-t border-[#B3CFE5]/50">
        <p className="text-[11px] font-bold text-[#1A3D63] uppercase tracking-wider pl-2">
          Basic Student Info
        </p>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-[#1A3D63] pl-2">
              Roll Number / ID
            </label>
            <input
              type="text"
              placeholder="e.g. 24CC006"
              value={studentRollNo}
              onChange={(e) => setStudentRollNo(e.target.value)}
              className="w-full px-5 py-3.5 rounded-full bg-white border-2 border-[#B3CFE5] text-[#0A1931] text-sm focus:outline-none focus:border-[#1A3D63] focus:ring-4 focus:ring-[#1A3D63]/10 transition-all shadow-xs uppercase"
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-[#1A3D63] pl-2">
              Contact Phone
            </label>
            <input
              type="tel"
              placeholder="10-digit mobile"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              className="w-full px-5 py-3.5 rounded-full bg-white border-2 border-[#B3CFE5] text-[#0A1931] text-sm focus:outline-none focus:border-[#1A3D63] focus:ring-4 focus:ring-[#1A3D63]/10 transition-all shadow-xs"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-[#1A3D63] pl-2">
              Age <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              required
              placeholder="e.g. 19"
              min={15}
              max={60}
              value={age}
              onChange={(e) => setAge(e.target.value)}
              className="w-full px-5 py-3.5 rounded-full bg-white border-2 border-[#B3CFE5] text-[#0A1931] text-sm focus:outline-none focus:border-[#1A3D63] focus:ring-4 focus:ring-[#1A3D63]/10 transition-all shadow-xs"
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-[#1A3D63] pl-2">
              Gender <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <select
                required
                value={gender}
                onChange={(e) => setGender(e.target.value as 'Male' | 'Female' | 'Other')}
                className="w-full px-5 py-3.5 rounded-full bg-white border-2 border-[#B3CFE5] text-[#0A1931] text-sm focus:outline-none focus:border-[#1A3D63] focus:ring-4 focus:ring-[#1A3D63]/10 transition-all appearance-none shadow-xs"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
              <ChevronDown className="w-4 h-4 text-[#4A7FA7] absolute right-4 top-4 pointer-events-none" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-[#1A3D63] pl-2">
              Class / Year <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <select
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="w-full px-5 py-3.5 rounded-full bg-white border-2 border-[#B3CFE5] text-[#0A1931] text-sm focus:outline-none focus:border-[#1A3D63] focus:ring-4 focus:ring-[#1A3D63]/10 transition-all appearance-none shadow-xs"
              >
                {YEARS.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-[#4A7FA7] absolute right-4 top-4 pointer-events-none" />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-[#1A3D63] pl-2">
              Department <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-5 py-3.5 rounded-full bg-white border-2 border-[#B3CFE5] text-[#0A1931] text-sm focus:outline-none focus:border-[#1A3D63] focus:ring-4 focus:ring-[#1A3D63]/10 transition-all appearance-none shadow-xs"
              >
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-[#4A7FA7] absolute right-4 top-4 pointer-events-none" />
            </div>
          </div>
        </div>

        <div className="px-5 py-3 rounded-full bg-[#B3CFE5]/20 border-2 border-[#B3CFE5] text-[#1A3D63] text-xs flex items-center gap-2.5">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-[#1A3D63]" />
          <span>Medical details, blood group &amp; hostel room collected after login.</span>
        </div>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full py-4 rounded-full bg-gradient-to-r from-[#1A3D63] via-[#1A3D63] to-[#4A7FA7] hover:from-[#0A1931] hover:to-[#1A3D63] text-white font-bold text-sm shadow-[0_10px_25px_rgba(26,61,99,0.3)] transition-all flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.01] active:scale-[0.99] disabled:opacity-70 mt-2"
      >
        {isSubmitting ? 'Creating Account…' : <><span>Create Account</span><ArrowRight className="w-4 h-4" /></>}
      </button>
    </form>
  );
};
