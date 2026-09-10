import React, { useState, useEffect } from 'react';
import {
  User, Lock, Phone, BookOpen, Edit3, ShieldCheck
} from 'lucide-react';
import { authService } from '../../services/authService';
import { healthStore } from '../../services/healthStore';
import { StudentProfileData } from '../../types';
import { CompleteProfileModal } from '../auth/CompleteProfileModal';

const InfoRow = ({ label, value }: { label: string; value: string | number | undefined }) => (
  <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-700 pb-2.5">
    <span className="text-sm text-gray-500 dark:text-gray-400">{label}</span>
    <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{value || '—'}</span>
  </div>
);

export const StudentProfile: React.FC = () => {
  const currentUser = authService.getCurrentUser();
  const studentId = currentUser.studentId || currentUser.id;
  const [profile, setProfile] = useState<StudentProfileData | undefined>(() => studentId ? healthStore.getStudentProfile(studentId) : undefined);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    const unsub = healthStore.subscribe(() => {
      if (studentId) setProfile(healthStore.getStudentProfile(studentId));
    });
    return () => unsub();
  }, [studentId]);

  if (!profile) {
    return (
      <div className="p-8 bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-700 text-center space-y-3">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Profile Not Found</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          No clinical student profile found for ID <strong className="text-gray-900 dark:text-white">{studentId || 'Unknown'}</strong>.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-12">

      {/* Header Banner */}
      <div className="flex items-center justify-between bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 font-extrabold text-2xl flex items-center justify-center border border-emerald-200 dark:border-emerald-700">
            {(profile?.name || 'Student').charAt(0)}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{profile.name}</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 flex flex-wrap items-center gap-2 mt-0.5">
              <span className="font-medium text-gray-700 dark:text-gray-300">{profile.studentId}</span>
              <span className="text-gray-300 dark:text-gray-600">·</span>
              <span>{profile.department}</span>
              <span className="text-gray-300 dark:text-gray-600">·</span>
              <span>{profile.year}</span>
              {profile.ugOrPg && (
                <>
                  <span className="text-gray-300 dark:text-gray-600">·</span>
                  <span className="px-2 py-0.5 rounded-full bg-teal-100 dark:bg-teal-900 text-teal-700 dark:text-teal-300 text-xs font-bold">{profile.ugOrPg}</span>
                </>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!profile.profileComplete && (
            <button
              onClick={() => setShowEditModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-100 dark:bg-amber-900 border border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-200 text-sm font-semibold hover:bg-amber-200 dark:hover:bg-amber-800 transition-all"
            >
              <Edit3 className="w-4 h-4" />
              <span>Complete Profile</span>
            </button>
          )}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 text-xs font-semibold">
            <Lock className="w-4 h-4 text-amber-500" />
            <span>Doctor-entered fields are read-only</span>
          </div>
        </div>
      </div>

      {/* Incomplete banner */}
      {!profile.profileComplete && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950 border border-amber-300 dark:border-amber-700 flex items-center gap-3">
          <div className="p-2 rounded-xl bg-amber-200 dark:bg-amber-800">
            <Edit3 className="w-4 h-4 text-amber-700 dark:text-amber-200" />
          </div>
          <div>
            <p className="text-sm font-bold text-amber-900 dark:text-amber-100">Your profile is incomplete</p>
            <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">Please add your medical details, emergency contact, and accommodation info.</p>
          </div>
          <button
            onClick={() => setShowEditModal(true)}
            className="ml-auto px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-sm font-bold transition-all"
          >
            Fill Now
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Personal Details */}
        <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-200 dark:border-gray-700 space-y-4">
          <h3 className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-2">
            <User className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Personal Information</span>
          </h3>
          <div className="space-y-2.5">
            {profile.age && <InfoRow label="Age" value={`${profile.age} years`} />}
            <InfoRow label="Date of Birth" value={profile.dob || '—'} />
            <InfoRow label="Gender" value={profile.gender} />
            <InfoRow label="Email" value={profile.email} />
            <InfoRow label="Phone" value={profile.phone || '—'} />
          </div>
        </div>

        {/* Academic & Accommodation */}
        <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-200 dark:border-gray-700 space-y-4">
          <h3 className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            <span>Academic & Accommodation</span>
          </h3>
          <div className="space-y-2.5">
            <InfoRow label="Programme" value={profile.ugOrPg || '—'} />
            <InfoRow label="Year / Class" value={profile.year} />
            <InfoRow label="Department" value={profile.department} />
            <InfoRow label="Accommodation" value={profile.accommodation || '—'} />
            {profile.accommodation === 'Hosteller' && (
              <>
                <InfoRow label="Hostel Block" value={profile.hostelBlock || '—'} />
                <InfoRow label="Room Number" value={profile.hostelRoom || '—'} />
              </>
            )}
          </div>
        </div>

        {/* Emergency Contact */}
        <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-200 dark:border-gray-700 space-y-4">
          <h3 className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-2">
            <Phone className="w-4 h-4 text-rose-600 dark:text-rose-400" />
            <span>Emergency & Medical Contacts</span>
          </h3>

          <div className="space-y-3">
            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950 border border-rose-200 dark:border-rose-800 space-y-1">
              <span className="text-xs uppercase font-bold text-rose-600 dark:text-rose-400 tracking-wider">Primary Emergency Contact</span>
              {profile.emergencyContact?.name ? (
                <>
                  <p className="font-bold text-gray-900 dark:text-white">
                    {profile.emergencyContact.name}
                    <span className="font-normal text-gray-500 dark:text-gray-400 ml-1">({profile.emergencyContact.relation})</span>
                  </p>
                  <p className="text-rose-700 dark:text-rose-300 font-semibold text-sm">{profile.emergencyContact.phone}</p>
                </>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400 italic">Not provided — please complete your profile.</p>
              )}
            </div>

            <div className="p-4 rounded-2xl bg-teal-50 dark:bg-teal-950 border border-teal-200 dark:border-teal-800 space-y-1">
              <span className="text-xs uppercase font-bold text-teal-600 dark:text-teal-400 tracking-wider">Campus Medical Centre</span>
              <p className="font-semibold text-gray-900 dark:text-white text-sm">{profile.medicalCentreContact}</p>
            </div>
          </div>
        </div>

        {/* Clinical Summary */}
        <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-200 dark:border-gray-700 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span>Clinical Summary</span>
            </h3>
            <span className="text-xs text-gray-400">Last updated: {profile.lastUpdated}</span>
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Blood Group</p>
              <span className="px-3 py-1.5 rounded-xl bg-rose-100 dark:bg-rose-900 text-rose-800 dark:text-rose-200 font-bold text-sm">
                {profile.bloodGroup || '—'}
              </span>
            </div>

            {/* Height / Weight / BMI */}
            {profile.heightCm > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'Height', value: `${profile.heightCm} cm` },
                  { label: 'Weight', value: `${profile.weightKg} kg` },
                  { label: 'BMI', value: `${profile.bmi}` }
                ].map(({ label, value }) => (
                  <div key={label} className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-center">
                    <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
                    <p className="font-bold text-gray-900 dark:text-white text-sm mt-0.5">{value}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Allergies */}
            <div>
              <p className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider mb-1.5">Critical Allergies</p>
              <div className="flex flex-wrap gap-1.5">
                {profile.criticalAllergies?.length > 0
                  ? profile.criticalAllergies.map((a, i) => (
                    <span key={i} className="px-2.5 py-1 bg-rose-100 dark:bg-rose-900 text-rose-800 dark:text-rose-200 font-semibold rounded-lg text-xs">{a}</span>
                  ))
                  : <span className="text-sm text-gray-400">None listed</span>}
              </div>
            </div>

            {/* Conditions */}
            <div>
              <p className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-1.5">Medical Conditions</p>
              <div className="space-y-0.5">
                {profile.criticalConditions?.length > 0
                  ? profile.criticalConditions.map((c, i) => (
                    <p key={i} className="text-sm font-semibold text-gray-800 dark:text-gray-200">• {c}</p>
                  ))
                  : <span className="text-sm text-gray-400">None listed</span>}
              </div>
            </div>

            {/* Medications */}
            <div>
              <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1.5">Active Medications</p>
              <div className="space-y-0.5">
                {profile.criticalMedications?.length > 0
                  ? profile.criticalMedications.map((m, i) => (
                    <p key={i} className="text-sm font-semibold text-gray-800 dark:text-gray-200">• {m}</p>
                  ))
                  : <span className="text-sm text-gray-400">None listed</span>}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit modal */}
      {showEditModal && (
        <CompleteProfileModal
          studentId={studentId}
          existingProfile={profile}
          onComplete={() => setShowEditModal(false)}
        />
      )}
    </div>
  );
};
