import React, { useState } from 'react';
import {
  HeartPulse, User, Phone, Home, Building, Hash,
  Ruler, Weight, AlertTriangle, CheckCircle2, X
} from 'lucide-react';
import { healthStore } from '../../services/healthStore';
import { StudentProfileData } from '../../types';

interface CompleteProfileModalProps {
  studentId: string;
  existingProfile: StudentProfileData;
  onComplete: () => void;
  onClose?: () => void;
}

const YEARS = ['1st Year', '2nd Year', '3rd Year', '4th Year'] as const;
const RELATIONS = ['Father', 'Mother', 'Guardian', 'Sibling', 'Relative', 'Other'] as const;
const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-', 'Unknown'] as const;
const HOSTEL_BLOCKS = ['Block A', 'Block B', 'Block C', 'Block D', 'Block D2', 'Block E', 'Block F'] as const;

export const CompleteProfileModal: React.FC<CompleteProfileModalProps> = ({
  studentId,
  existingProfile,
  onComplete,
  onClose
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // 1. Year of Study
  const [year, setYear] = useState<string>(existingProfile.year || '1st Year');

  // 2. Accommodation
  const [accommodation, setAccommodation] = useState<'Hosteller' | 'Day Scholar' | ''>(
    existingProfile.accommodation || ''
  );
  const [hostelBlock, setHostelBlock] = useState<string>(existingProfile.hostelBlock || '');
  const [hostelRoom, setHostelRoom] = useState<string>(existingProfile.hostelRoom || '');

  // 3. Physical Vitals
  const [heightCm, setHeightCm] = useState<string>(
    existingProfile.heightCm ? String(existingProfile.heightCm) : ''
  );
  const [weightKg, setWeightKg] = useState<string>(
    existingProfile.weightKg ? String(existingProfile.weightKg) : ''
  );
  const [bloodGroup, setBloodGroup] = useState<string>(
    existingProfile.bloodGroup || ''
  );

  // 4. Emergency Contact
  const [emergencyName, setEmergencyName] = useState<string>(
    existingProfile.emergencyContact?.name || ''
  );
  const [emergencyRelation, setEmergencyRelation] = useState<string>(
    existingProfile.emergencyContact?.relation || 'Father'
  );
  const [emergencyPhone, setEmergencyPhone] = useState<string>(
    existingProfile.emergencyContact?.phone || ''
  );

  // Optional Student personal phone
  const [studentPhone, setStudentPhone] = useState<string>(existingProfile.phone || '');

  // Live BMI calculation
  const parsedH = parseFloat(heightCm) || 0;
  const parsedW = parseFloat(weightKg) || 0;
  const liveBmi =
    parsedH > 50 && parsedW > 20
      ? parseFloat((parsedW / ((parsedH / 100) * (parsedH / 100))).toFixed(1))
      : 0;

  const getBmiCategory = (bmi: number) => {
    if (bmi === 0) return null;
    if (bmi < 18.5) {
      return { label: 'Underweight', color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800' };
    }
    if (bmi < 25) {
      return { label: 'Normal weight', color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800' };
    }
    if (bmi < 30) {
      return { label: 'Overweight', color: 'text-orange-600 bg-orange-50 dark:bg-orange-950/40 border-orange-200 dark:border-orange-800' };
    }
    return { label: 'Obese', color: 'text-rose-600 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800' };
  };

  const bmiCat = getBmiCategory(liveBmi);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // 1. Year Validation
    if (!year) {
      setError('Please select your academic year.');
      return;
    }

    // 2. Accommodation Validation
    if (!accommodation) {
      setError('Please select your accommodation type (Hosteller or Day Scholar).');
      return;
    }

    if (accommodation === 'Hosteller') {
      if (!hostelBlock.trim()) {
        setError('Please select your Hostel Block.');
        return;
      }
      if (!hostelRoom.trim()) {
        setError('Please enter your Hostel Room Number.');
        return;
      }
    }

    // 3. Height & Weight Validation
    if (!parsedH || parsedH < 50 || parsedH > 250) {
      setError('Please enter a valid height between 50 cm and 250 cm.');
      return;
    }

    if (!parsedW || parsedW < 20 || parsedW > 250) {
      setError('Please enter a valid weight between 20 kg and 250 kg.');
      return;
    }

    if (!bloodGroup.trim()) {
      setError('Please select your blood group.');
      return;
    }

    // 4. Emergency Contact Validation
    if (!emergencyName.trim()) {
      setError('Please provide your emergency contact person name.');
      return;
    }

    if (!emergencyRelation.trim()) {
      setError('Please select the relationship with your emergency contact.');
      return;
    }

    const cleanEmergencyPhone = emergencyPhone.trim().replace(/\D/g, '');
    if (cleanEmergencyPhone.length < 10) {
      setError('Please enter a valid 10-digit emergency contact phone number.');
      return;
    }

    setIsSubmitting(true);

    const updatedProfile: StudentProfileData = {
      ...existingProfile,
      studentId: existingProfile.studentId || studentId,
      name: existingProfile.name,
      email: existingProfile.email,
      department: existingProfile.department || 'Computer and Communication Engineering (CCE)',
      year,
      accommodation,
      hostelBlock: accommodation === 'Hosteller' ? hostelBlock.trim() : '',
      hostelRoom: accommodation === 'Hosteller' ? hostelRoom.trim() : '',
      heightCm: parsedH,
      weightKg: parsedW,
      bmi: liveBmi,
      bloodGroup: bloodGroup.trim(),
      phone: studentPhone.trim() || existingProfile.phone || '',
      emergencyContact: {
        name: emergencyName.trim(),
        relation: emergencyRelation.trim(),
        phone: emergencyPhone.trim()
      },
      lastUpdated: new Date().toISOString(),
      profileComplete: true
    };

    try {
      await healthStore.createOrUpdateStudentProfile(updatedProfile);
      setIsSubmitting(false);
      onComplete();
    } catch (err: unknown) {
      setIsSubmitting(false);
      setError(err instanceof Error ? err.message : 'Failed to save student profile.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-auto animate-fade-in text-slate-800 dark:text-slate-100">
        
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-sky-700 via-sky-600 to-indigo-700 p-5 sm:p-6 text-white relative">
          {existingProfile.profileComplete && onClose && (
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}

          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-white/15 backdrop-blur-xs shadow-inner shrink-0">
              <HeartPulse className="w-7 h-7 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-widest bg-white/20 px-2.5 py-0.5 rounded-full">
                  Student Medical Onboarding
                </span>
              </div>
              <h2 className="text-xl font-extrabold mt-1">Complete Health Profile</h2>
              <p className="text-sky-100 text-xs mt-0.5">
                {existingProfile.name} · {existingProfile.studentId || studentId}
              </p>
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mx-6 mt-4 p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs flex items-center gap-2.5 animate-shake">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
            <span className="font-semibold">{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          
          {/* Section 1: Year of Study */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              1. Year of Study <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {YEARS.map(y => (
                <button
                  key={y}
                  type="button"
                  onClick={() => setYear(y)}
                  className={`py-2.5 px-3 rounded-2xl border text-xs font-bold transition-all cursor-pointer text-center ${
                    year === y
                      ? 'bg-sky-600 border-sky-600 text-white shadow-md shadow-sky-600/25 scale-[1.02]'
                      : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-sky-400'
                  }`}
                >
                  {y}
                </button>
              ))}
            </div>
          </div>

          {/* Section 2: Accommodation */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              2. Accommodation <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setAccommodation('Hosteller')}
                className={`p-3.5 rounded-2xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                  accommodation === 'Hosteller'
                    ? 'bg-sky-50 dark:bg-sky-950/40 border-sky-500 text-sky-900 dark:text-sky-200 shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-sky-400'
                }`}
              >
                <div className={`p-2 rounded-xl ${accommodation === 'Hosteller' ? 'bg-sky-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
                  <Building className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-xs">Hosteller</div>
                  <div className="text-[10px] text-slate-400">Staying on campus</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setAccommodation('Day Scholar')}
                className={`p-3.5 rounded-2xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                  accommodation === 'Day Scholar'
                    ? 'bg-sky-50 dark:bg-sky-950/40 border-sky-500 text-sky-900 dark:text-sky-200 shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-sky-400'
                }`}
              >
                <div className={`p-2 rounded-xl ${accommodation === 'Day Scholar' ? 'bg-sky-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
                  <Home className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-xs">Day Scholar</div>
                  <div className="text-[10px] text-slate-400">Day scholar / Commuter</div>
                </div>
              </button>
            </div>

            {/* If Hosteller: Block and Room Number */}
            {accommodation === 'Hosteller' && (
              <div className="grid grid-cols-2 gap-3 mt-2 p-3 bg-sky-50/50 dark:bg-sky-950/20 rounded-2xl border border-sky-100 dark:border-sky-900 animate-fade-in">
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    Hostel Block <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Building className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                    <select
                      value={hostelBlock}
                      onChange={e => setHostelBlock(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none cursor-pointer"
                    >
                      <option value="">Select Block...</option>
                      {HOSTEL_BLOCKS.map(b => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    Room Number <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Hash className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      placeholder="e.g. 214"
                      value={hostelRoom}
                      onChange={e => setHostelRoom(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section 3: Height & Weight (Physical Vitals) */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              3. Physical Vitals & Blood Group <span className="text-rose-500">*</span>
            </label>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Height */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                  Height (cm) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Ruler className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="number"
                    min="50"
                    max="250"
                    step="0.5"
                    placeholder="e.g. 172"
                    value={heightCm}
                    onChange={e => setHeightCm(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Weight */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                  Weight (kg) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Weight className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="number"
                    min="20"
                    max="250"
                    step="0.5"
                    placeholder="e.g. 64"
                    value={weightKg}
                    onChange={e => setWeightKg(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Blood Group */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                  Blood Group <span className="text-rose-500">*</span>
                </label>
                <select
                  value={bloodGroup}
                  onChange={e => setBloodGroup(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
                >
                  <option value="">Select Blood Group...</option>
                  {BLOOD_GROUPS.map(bg => (
                    <option key={bg} value={bg}>{bg}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Real-time BMI Display */}
            {liveBmi > 0 && bmiCat && (
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Calculated BMI:</span>
                  <span className="text-sm font-black text-slate-900 dark:text-white">{liveBmi} kg/m²</span>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${bmiCat.color}`}>
                  {bmiCat.label}
                </span>
              </div>
            )}
          </div>

          {/* Section 4: Emergency Contact */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              4. Emergency Contact Details <span className="text-rose-500">*</span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Contact Name */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                  Contact Person Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    placeholder="e.g. Parent Name"
                    value={emergencyName}
                    onChange={e => setEmergencyName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Relation */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                  Relationship <span className="text-rose-500">*</span>
                </label>
                <select
                  value={emergencyRelation}
                  onChange={e => setEmergencyRelation(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
                >
                  {RELATIONS.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              {/* Phone */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                  Contact Phone Number <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="tel"
                    placeholder="10-digit mobile"
                    value={emergencyPhone}
                    onChange={e => setEmergencyPhone(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Student Personal Mobile (if not present) */}
          {!existingProfile.phone && (
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                Your Contact Phone Number
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="tel"
                  placeholder="Your 10-digit mobile"
                  value={studentPhone}
                  onChange={e => setStudentPhone(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* Submit Action */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white font-bold text-sm shadow-lg shadow-sky-600/25 flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Saving Profile...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Complete Health Profile</span>
                </>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
