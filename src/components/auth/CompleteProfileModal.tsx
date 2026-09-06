import React, { useState } from 'react';
import {
  HeartPulse, User, Phone, Home, BookOpen, Droplets,
  AlertTriangle, ChevronDown, ChevronRight, CheckCircle2,
  PhoneCall, Building, Hash, Ruler, Weight
} from 'lucide-react';
import { healthStore } from '../../services/healthStore';
import { StudentProfileData } from '../../types';

interface CompleteProfileModalProps {
  studentId: string;
  existingProfile: StudentProfileData;
  onComplete: () => void;
}

const BLOOD_GROUPS = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'Unknown'];

type Step = 1 | 2 | 3;

export const CompleteProfileModal: React.FC<CompleteProfileModalProps> = ({
  studentId, existingProfile, onComplete
}) => {
  const [step, setStep] = useState<Step>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Step 1 — Academic & Accommodation
  const [ugOrPg, setUgOrPg] = useState<'UG' | 'PG' | ''>('');
  const [accommodation, setAccommodation] = useState<'Hosteller' | 'Day Scholar' | ''>('');
  const [hostelBlock, setHostelBlock] = useState('');
  const [hostelRoom, setHostelRoom] = useState('');
  const [phone, setPhone] = useState('');
  const [dob, setDob] = useState('');

  // Step 2 — Medical
  const [bloodGroup, setBloodGroup] = useState('');
  const [heightCm, setHeightCm] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [criticalAllergies, setCriticalAllergies] = useState('None');
  const [criticalConditions, setCriticalConditions] = useState('None');
  const [criticalMedications, setCriticalMedications] = useState('None');

  // Step 3 — Emergency Contact
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyRelation, setEmergencyRelation] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');

  const totalSteps = 3;

  const validateStep = (s: Step): string => {
    if (s === 1) {
      if (!ugOrPg) return 'Please select UG or PG.';
      if (!accommodation) return 'Please select Hosteller or Day Scholar.';
      if (accommodation === 'Hosteller' && (!hostelBlock.trim() || !hostelRoom.trim())) return 'Please enter your hostel block and room number.';
      if (!phone.trim()) return 'Please enter your phone number.';
      if (!dob) return 'Please enter your date of birth.';
    }
    if (s === 2) {
      if (!bloodGroup) return 'Please select your blood group.';
    }
    if (s === 3) {
      if (!emergencyName.trim()) return 'Please enter emergency contact name.';
      if (!emergencyRelation.trim()) return 'Please enter the relation.';
      if (!emergencyPhone.trim()) return 'Please enter emergency contact phone.';
    }
    return '';
  };

  const handleNext = () => {
    const err = validateStep(step);
    if (err) { setError(err); return; }
    setError('');
    setStep((step + 1) as Step);
  };

  const handleSubmit = () => {
    const err = validateStep(3);
    if (err) { setError(err); return; }
    setError('');
    setIsSubmitting(true);

    const h = parseFloat(heightCm) || 0;
    const w = parseFloat(weightKg) || 0;
    const bmi = h > 0 ? parseFloat((w / ((h / 100) * (h / 100))).toFixed(1)) : 0;

    const updated: StudentProfileData = {
      ...existingProfile,
      dob,
      phone,
      ugOrPg,
      accommodation,
      hostelBlock: accommodation === 'Hosteller' ? hostelBlock : '',
      hostelRoom: accommodation === 'Hosteller' ? hostelRoom : '',
      bloodGroup,
      heightCm: h,
      weightKg: w,
      bmi,
      criticalAllergies: criticalAllergies.split(',').map(s => s.trim()).filter(Boolean),
      criticalConditions: criticalConditions.split(',').map(s => s.trim()).filter(Boolean),
      criticalMedications: criticalMedications.split(',').map(s => s.trim()).filter(Boolean),
      emergencyContact: { name: emergencyName, relation: emergencyRelation, phone: emergencyPhone },
      lastUpdated: new Date().toISOString().split('T')[0],
      profileComplete: true
    };

    setTimeout(() => {
      healthStore.createOrUpdateStudentProfile(updated);
      setIsSubmitting(false);
      onComplete();
    }, 600);
  };

  const stepLabels = ['Academic & Stay', 'Medical Details', 'Emergency Contact'];

  return (
    <div className="fixed inset-0 z-50 bg-gray-950/90 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-gray-900 border border-gray-700 rounded-3xl shadow-2xl overflow-hidden">

        {/* Top Banner */}
        <div className="bg-gradient-to-r from-emerald-700 to-teal-700 p-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-white/15">
              <HeartPulse className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-white font-bold text-lg leading-tight">Complete Your Health Profile</h2>
              <p className="text-emerald-100 text-xs mt-0.5">This helps us keep you safe. Takes less than 2 minutes.</p>
            </div>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center gap-2 mt-5">
            {stepLabels.map((label, idx) => {
              const s = (idx + 1) as Step;
              const isDone = s < step;
              const isActive = s === step;
              return (
                <React.Fragment key={s}>
                  <div className="flex-1">
                    <div className={`h-1.5 rounded-full transition-all ${isDone || isActive ? 'bg-white' : 'bg-white/25'}`} />
                    <p className={`text-[10px] mt-1 font-semibold truncate ${isActive ? 'text-white' : isDone ? 'text-emerald-200' : 'text-white/40'}`}>
                      {label}
                    </p>
                  </div>
                  {idx < stepLabels.length - 1 && <div className="w-3" />}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        <div className="p-6 space-y-5 max-h-[65vh] overflow-y-auto">

          {/* Error */}
          {error && (
            <div className="p-3 rounded-xl bg-red-950 border border-red-700 text-red-200 text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          {/* ─── STEP 1: Academic & Accommodation ─── */}
          {step === 1 && (
            <div className="space-y-4 animate-fade-in">
              <p className="text-base font-bold text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-emerald-400" /> Academic & Accommodation
              </p>

              {/* UG / PG */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-200">Programme Level <span className="text-red-400">*</span></label>
                <div className="grid grid-cols-2 gap-3">
                  {(['UG', 'PG'] as const).map(opt => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setUgOrPg(opt)}
                      className={`py-3 rounded-xl border text-sm font-bold transition-all ${
                        ugOrPg === opt
                          ? 'bg-emerald-900 border-emerald-500 text-emerald-200'
                          : 'bg-gray-800 border-gray-600 text-gray-300 hover:border-gray-400'
                      }`}
                    >
                      {opt === 'UG' ? 'UG (Undergraduate)' : 'PG (Postgraduate)'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Hosteller / Day Scholar */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-200">Accommodation Type <span className="text-red-400">*</span></label>
                <div className="grid grid-cols-2 gap-3">
                  {(['Hosteller', 'Day Scholar'] as const).map(opt => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setAccommodation(opt)}
                      className={`py-3 rounded-xl border text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                        accommodation === opt
                          ? 'bg-teal-900 border-teal-500 text-teal-200'
                          : 'bg-gray-800 border-gray-600 text-gray-300 hover:border-gray-400'
                      }`}
                    >
                      {opt === 'Hosteller' ? <Building className="w-4 h-4" /> : <Home className="w-4 h-4" />}
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Hostel Block & Room — shown only if Hosteller */}
              {accommodation === 'Hosteller' && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="block text-sm font-semibold text-gray-200">Hostel Block <span className="text-red-400">*</span></label>
                    <div className="relative">
                      <Building className="w-4 h-4 text-gray-500 absolute left-3 top-3.5" />
                      <input
                        type="text"
                        placeholder="e.g. Block A"
                        value={hostelBlock}
                        onChange={e => setHostelBlock(e.target.value)}
                        className="w-full pl-9 pr-3 py-3 rounded-xl bg-gray-800 border border-gray-600 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-teal-500"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-sm font-semibold text-gray-200">Room Number <span className="text-red-400">*</span></label>
                    <div className="relative">
                      <Hash className="w-4 h-4 text-gray-500 absolute left-3 top-3.5" />
                      <input
                        type="text"
                        placeholder="e.g. 214"
                        value={hostelRoom}
                        onChange={e => setHostelRoom(e.target.value)}
                        className="w-full pl-9 pr-3 py-3 rounded-xl bg-gray-800 border border-gray-600 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-teal-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Phone & DOB */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-sm font-semibold text-gray-200">Phone Number <span className="text-red-400">*</span></label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-gray-500 absolute left-3 top-3.5" />
                    <input
                      type="tel"
                      placeholder="+91 9876543210"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      className="w-full pl-9 pr-3 py-3 rounded-xl bg-gray-800 border border-gray-600 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-semibold text-gray-200">Date of Birth <span className="text-red-400">*</span></label>
                  <input
                    type="date"
                    value={dob}
                    onChange={e => setDob(e.target.value)}
                    max={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-3 rounded-xl bg-gray-800 border border-gray-600 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ─── STEP 2: Medical Details ─── */}
          {step === 2 && (
            <div className="space-y-4 animate-fade-in">
              <p className="text-base font-bold text-white flex items-center gap-2">
                <Droplets className="w-5 h-5 text-rose-400" /> Medical Details
              </p>

              {/* Blood Group */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-200">Blood Group <span className="text-red-400">*</span></label>
                <div className="grid grid-cols-4 gap-2">
                  {BLOOD_GROUPS.map(bg => (
                    <button
                      key={bg}
                      type="button"
                      onClick={() => setBloodGroup(bg)}
                      className={`py-2.5 rounded-xl border text-sm font-bold transition-all ${
                        bloodGroup === bg
                          ? 'bg-rose-900 border-rose-500 text-rose-200'
                          : 'bg-gray-800 border-gray-600 text-gray-300 hover:border-rose-600/50'
                      }`}
                    >
                      {bg}
                    </button>
                  ))}
                </div>
              </div>

              {/* Height & Weight */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-sm font-semibold text-gray-200">Height (cm)</label>
                  <div className="relative">
                    <Ruler className="w-4 h-4 text-gray-500 absolute left-3 top-3.5" />
                    <input
                      type="number"
                      placeholder="e.g. 170"
                      value={heightCm}
                      onChange={e => setHeightCm(e.target.value)}
                      className="w-full pl-9 pr-3 py-3 rounded-xl bg-gray-800 border border-gray-600 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-semibold text-gray-200">Weight (kg)</label>
                  <div className="relative">
                    <Weight className="w-4 h-4 text-gray-500 absolute left-3 top-3.5" />
                    <input
                      type="number"
                      placeholder="e.g. 65"
                      value={weightKg}
                      onChange={e => setWeightKg(e.target.value)}
                      className="w-full pl-9 pr-3 py-3 rounded-xl bg-gray-800 border border-gray-600 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* Allergies, Conditions, Medications */}
              <div className="space-y-3">
                <p className="text-xs font-bold text-amber-400 uppercase tracking-widest">Critical Medical Info (type "None" if not applicable)</p>
                {[
                  { label: 'Critical Allergies', value: criticalAllergies, set: setCriticalAllergies, placeholder: 'e.g. Penicillin, Peanuts', color: 'rose' },
                  { label: 'Medical Conditions', value: criticalConditions, set: setCriticalConditions, placeholder: 'e.g. Asthma, Diabetes', color: 'amber' },
                  { label: 'Current Medications', value: criticalMedications, set: setCriticalMedications, placeholder: 'e.g. Inhaler, Metformin', color: 'blue' },
                ].map(({ label, value, set, placeholder, color }) => (
                  <div key={label} className="space-y-1.5">
                    <label className="block text-sm font-semibold text-gray-200">{label}</label>
                    <input
                      type="text"
                      placeholder={placeholder}
                      value={value}
                      onChange={e => set(e.target.value)}
                      className={`w-full px-3 py-3 rounded-xl bg-gray-800 border border-gray-600 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-${color}-500`}
                    />
                    <p className="text-xs text-gray-500">Separate multiple entries with commas.</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ─── STEP 3: Emergency Contact ─── */}
          {step === 3 && (
            <div className="space-y-4 animate-fade-in">
              <p className="text-base font-bold text-white flex items-center gap-2">
                <PhoneCall className="w-5 h-5 text-amber-400" /> Emergency Contact
              </p>
              <p className="text-sm text-gray-400">This person will be contacted in case of a medical emergency on campus.</p>

              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="block text-sm font-semibold text-gray-200">Contact Name <span className="text-red-400">*</span></label>
                  <div className="relative">
                    <User className="w-4 h-4 text-gray-500 absolute left-3 top-3.5" />
                    <input
                      type="text"
                      placeholder="e.g. Ramesh Sharma"
                      value={emergencyName}
                      onChange={e => setEmergencyName(e.target.value)}
                      className="w-full pl-9 pr-3 py-3 rounded-xl bg-gray-800 border border-gray-600 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-sm font-semibold text-gray-200">Relation <span className="text-red-400">*</span></label>
                  <div className="relative">
                    <select
                      value={emergencyRelation}
                      onChange={e => setEmergencyRelation(e.target.value)}
                      className="w-full px-3 py-3 rounded-xl bg-gray-800 border border-gray-600 text-sm text-white focus:outline-none focus:border-amber-500 appearance-none"
                    >
                      <option value="">Select relation…</option>
                      {['Father', 'Mother', 'Parent', 'Guardian', 'Sibling', 'Spouse', 'Friend', 'Other'].map(r => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 text-gray-500 absolute right-3 top-3.5 pointer-events-none" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-sm font-semibold text-gray-200">Phone Number <span className="text-red-400">*</span></label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-gray-500 absolute left-3 top-3.5" />
                    <input
                      type="tel"
                      placeholder="+91 9876543210"
                      value={emergencyPhone}
                      onChange={e => setEmergencyPhone(e.target.value)}
                      className="w-full pl-9 pr-3 py-3 rounded-xl bg-gray-800 border border-gray-600 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-amber-950/50 border border-amber-800/50 text-amber-200 text-xs flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                <span>This contact will be visible when your emergency QR card is scanned by first responders.</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer Buttons */}
        <div className="px-6 pb-6 flex items-center gap-3">
          {step > 1 && (
            <button
              type="button"
              onClick={() => { setStep((step - 1) as Step); setError(''); }}
              className="px-4 py-3 rounded-xl bg-gray-800 border border-gray-600 text-sm font-semibold text-gray-200 hover:bg-gray-700 transition-all"
            >
              ← Back
            </button>
          )}

          {step < totalSteps ? (
            <button
              type="button"
              onClick={handleNext}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm transition-all flex items-center justify-center gap-2"
            >
              <span>Continue</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm transition-all flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <span>Saving Profile…</span>
              ) : (
                <><CheckCircle2 className="w-4 h-4" /><span>Save & Enter Dashboard</span></>
              )}
            </button>
          )}
        </div>

        {/* Step indicator */}
        <div className="pb-4 text-center text-xs text-gray-500">
          Step {step} of {totalSteps}
        </div>
      </div>
    </div>
  );
};
