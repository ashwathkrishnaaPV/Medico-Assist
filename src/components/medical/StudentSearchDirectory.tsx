import React, { useState, useEffect } from 'react';
import { Search, User, Stethoscope, Pill, Plus } from 'lucide-react';
import { healthStore } from '../../services/healthStore';
import { authService } from '../../services/authService';
import { StudentProfileData, MedicalVisit, Prescription } from '../../types';
import { VitalsChart } from '../common/VitalsChart';

interface StudentSearchDirectoryProps {
  onNavigate: (tab: string) => void;
}

export const StudentSearchDirectory: React.FC<StudentSearchDirectoryProps> = ({ onNavigate }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [profiles, setProfiles] = useState<StudentProfileData[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<StudentProfileData | undefined>();
  
  // Clinical Dossier States
  const [visits, setVisits] = useState<MedicalVisit[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);

  // Add Student Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentEmail, setNewStudentEmail] = useState('');
  const [newStudentId, setNewStudentId] = useState('');
  const [newDepartment, setNewDepartment] = useState('Computer Science');
  const [newYear] = useState('1st Year');
  const [newGender] = useState('Female');
  const [newDob] = useState('2005-01-01');
  const [newPhone] = useState('+1 (555) 000-0000');
  const [newBloodGroup, setNewBloodGroup] = useState('O+');
  const [newHeightCm] = useState(170);
  const [newWeightKg] = useState(65);

  useEffect(() => {
    const load = () => {
      const all = healthStore.getAllStudentProfiles();
      setProfiles(all);
      
      let targetId = selectedStudentId;
      if (all.length > 0 && !targetId) {
        targetId = all[0].studentId;
        setSelectedStudentId(targetId);
      }

      if (targetId) {
        const found = healthStore.getStudentProfile(targetId);
        setSelectedProfile(found);
        setVisits(healthStore.getVisitsForStudent(targetId));
        setPrescriptions(healthStore.getPrescriptionsForStudent(targetId));
      }
    };

    load();
    const unsub = healthStore.subscribe(load);
    return () => unsub();
  }, [selectedStudentId]);

  const handleAddStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentName || !newStudentEmail) return;

    const generatedId = newStudentId.trim() || `STU${Math.floor(1000 + Math.random() * 9000)}`;
    const heightM = newHeightCm / 100;
    const bmi = parseFloat((newWeightKg / (heightM * heightM)).toFixed(1));

    // Register User account
    authService.registerUser({
      name: newStudentName,
      email: newStudentEmail,
      role: 'STUDENT',
      studentId: generatedId,
      department: newDepartment
    });

    // Create Student Profile with full type compliance
    const profile = healthStore.createOrUpdateStudentProfile({
      id: `prof_${generatedId}`,
      studentId: generatedId,
      name: newStudentName,
      email: newStudentEmail,
      dob: newDob,
      gender: newGender,
      department: newDepartment,
      year: newYear,
      ugOrPg: 'UG',
      accommodation: 'Day Scholar',
      phone: newPhone,
      bloodGroup: newBloodGroup,
      emergencyContact: {
        name: 'Emergency Relay',
        relation: 'Parent',
        phone: newPhone
      },
      medicalCentreContact: '+1 (555) 432-1000',
      criticalAllergies: [],
      criticalConditions: [],
      criticalMedications: [],
      heightCm: newHeightCm,
      weightKg: newWeightKg,
      bmi,
      lastUpdated: new Date().toISOString().split('T')[0],
      profileComplete: true
    });

    setSelectedStudentId(profile.studentId);
    setIsAddModalOpen(false);
    setNewStudentName('');
    setNewStudentEmail('');
    setNewStudentId('');
  };

  const filteredProfiles = profiles.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 theme-medical animate-fade-in pb-12">
      
      {/* Search Header Bar */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Search className="w-6 h-6 text-teal-600" /> Student Directory & Clinical Dossier
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Select or search a student to inspect complete medical history, vitals charts, prescriptions, and daily check logs.
            </p>
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-teal-600/20 shrink-0"
          >
            <Plus className="w-4 h-4" /> Add New Student Profile
          </button>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            placeholder="Search by student name, ID (e.g. STU1023), or department..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-teal-500 placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* Directory Layout */}
      {profiles.length === 0 ? (
        <div className="p-12 text-center text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
          <User className="w-12 h-12 mx-auto text-teal-500" />
          <h3 className="font-bold text-slate-700 dark:text-slate-200 text-base">No Student Profiles in Database</h3>
          <p className="text-xs max-w-md mx-auto">
            Your database currently has 0 registered student profiles. Click <strong>"Add New Student Profile"</strong> above or register via Create Account.
          </p>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-5 py-2.5 rounded-xl bg-teal-600 text-white font-bold text-xs shadow-sm hover:bg-teal-700 transition-all"
          >
            Create First Student Profile
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column: Student List Selection */}
          <div className="lg:col-span-4 space-y-3">
            <h3 className="font-bold text-xs text-slate-500 uppercase tracking-wider px-1">
              Registered Students ({filteredProfiles.length})
            </h3>

            <div className="space-y-2 max-h-[650px] overflow-y-auto pr-1">
              {filteredProfiles.map(p => (
                <div
                  key={p.studentId}
                  onClick={() => setSelectedStudentId(p.studentId)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    selectedStudentId === p.studentId
                      ? 'bg-teal-900/40 border-teal-500 text-slate-900 dark:text-white shadow-md'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-teal-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-bold text-sm text-slate-900 dark:text-white">{p.name}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">{p.studentId} · {p.department}</div>
                    </div>
                    <span className="px-2 py-0.5 rounded-md bg-teal-100 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 font-extrabold text-[10px] border border-teal-200 dark:border-teal-800">
                      {p.bloodGroup}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Selected Student Dossier */}
          {selectedProfile && (
            <div className="lg:col-span-8 space-y-6">
              
              {/* Profile Card Header */}
              <div className="card-clinical p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">{selectedProfile.name}</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{selectedProfile.studentId} · {selectedProfile.department} · {selectedProfile.year}</p>
                  </div>
                  <button
                    onClick={() => onNavigate('medical-new-visit')}
                    className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md shadow-teal-600/20 transition-all"
                  >
                    + New Clinical Visit
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                    <span className="text-slate-400 text-[10px] uppercase font-bold block">Height & Weight</span>
                    <span className="font-extrabold text-slate-800 dark:text-slate-200">{selectedProfile.heightCm} cm / {selectedProfile.weightKg} kg</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                    <span className="text-slate-400 text-[10px] uppercase font-bold block">BMI Score</span>
                    <span className="font-extrabold text-teal-600 dark:text-teal-400">{selectedProfile.bmi}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                    <span className="text-slate-400 text-[10px] uppercase font-bold block">Blood Group</span>
                    <span className="font-extrabold text-rose-600 dark:text-rose-400">{selectedProfile.bloodGroup}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                    <span className="text-slate-400 text-[10px] uppercase font-bold block">Emergency Phone</span>
                    <span className="font-extrabold text-slate-800 dark:text-slate-200">{selectedProfile.emergencyContact?.phone || '—'}</span>
                  </div>
                </div>
              </div>

              {/* Vitals History Chart */}
              {visits.length > 0 && (
                <VitalsChart vitalsHistory={visits.map(v => v.vitals)} />
              )}

              {/* Clinical Visits Timeline */}
              <div className="card-clinical p-6 space-y-4">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <Stethoscope className="w-4 h-4 text-teal-600 dark:text-teal-400" /> Historical Consultations ({visits.length})
                </h3>

                {visits.length === 0 ? (
                  <p className="text-xs text-slate-400 py-3">No medical visits logged yet for this student.</p>
                ) : (
                  <div className="space-y-3">
                    {visits.map(v => (
                      <div key={v.id} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs space-y-1">
                        <div className="flex items-center justify-between font-bold">
                          <span className="text-teal-600 dark:text-teal-400">{v.diagnosis}</span>
                          <span className="text-slate-400">{v.visitDate}</span>
                        </div>
                        <p className="text-slate-600 dark:text-slate-300"><strong>Chief Complaint:</strong> {v.chiefComplaint}</p>
                        <p className="text-slate-500 dark:text-slate-400 italic"><strong>Clinical Notes:</strong> {v.clinicalNotes}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Active Prescriptions */}
              <div className="card-clinical p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <Pill className="w-4 h-4 text-purple-600 dark:text-purple-400" /> Prescriptions ({prescriptions.length})
                  </h3>
                  <button onClick={() => onNavigate('medical-prescriptions')} className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline">
                    Manage Prescriptions →
                  </button>
                </div>

                {prescriptions.length === 0 ? (
                  <p className="text-xs text-slate-400 py-3">No prescriptions recorded for this student.</p>
                ) : (
                  prescriptions.map(rx => (
                    <div key={rx.id} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs space-y-2">
                      <div className="flex items-center justify-between font-bold">
                        <span className="text-slate-900 dark:text-white">Rx #{rx.id} — Status: {rx.status} (v{rx.currentVersion.version})</span>
                        <span className="text-purple-600 dark:text-purple-400 font-normal">{rx.createdAt}</span>
                      </div>
                      <div className="space-y-1">
                        {rx.currentVersion.items.map((item, idx) => (
                          <div key={idx} className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200">
                            <span className="font-bold text-slate-900 dark:text-white">{item.medicineName}</span> ({item.dosage}) — {item.frequency} for {item.durationDays} days
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>

            </div>
          )}

        </div>
      )}

      {/* Add Student Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-lg w-full space-y-4 text-xs shadow-2xl">
            <h3 className="font-bold text-base text-slate-900 dark:text-white">Add New Student Profile</h3>

            <form onSubmit={handleAddStudent} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={newStudentName}
                    onChange={e => setNewStudentName(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={newStudentEmail}
                    onChange={e => setNewStudentEmail(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Student ID</label>
                  <input
                    type="text"
                    placeholder="Auto-assigned"
                    value={newStudentId}
                    onChange={e => setNewStudentId(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Department</label>
                  <input
                    type="text"
                    value={newDepartment}
                    onChange={e => setNewDepartment(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Blood Group</label>
                  <select
                    value={newBloodGroup}
                    onChange={e => setNewBloodGroup(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                  >
                    <option value="O+">O Positive (O+)</option>
                    <option value="O-">O Negative (O-)</option>
                    <option value="A+">A Positive (A+)</option>
                    <option value="A-">A Negative (A-)</option>
                    <option value="B+">B Positive (B+)</option>
                    <option value="B-">B Negative (B-)</option>
                    <option value="AB+">AB Positive (AB+)</option>
                    <option value="AB-">AB Negative (AB-)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold transition-all shadow-sm"
                >
                  Create Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
