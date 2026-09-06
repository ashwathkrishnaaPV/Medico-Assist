import React, { useState, useEffect } from 'react';
import { Users, Search, UserPlus, CheckCircle2, XCircle } from 'lucide-react';
import { healthStore } from '../../services/healthStore';
import { StudentProfileData } from '../../types';

export const StudentManagement: React.FC = () => {
  const [students, setStudents] = useState<StudentProfileData[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const load = () => {
      setStudents(healthStore.getAllStudentProfiles());
    };
    load();
    const unsub = healthStore.subscribe(load);
    return () => unsub();
  }, []);

  const filtered = students.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.studentId.toLowerCase().includes(search.toLowerCase()) ||
    s.department.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 theme-admin animate-fade-in pb-12 text-slate-800 dark:text-slate-100">
      <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-indigo-600 dark:text-indigo-400" /> Student Roster & Enrollment Management
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Manage student health profiles, department allocations, and account status.</p>
        </div>
      </div>

      <div className="card-enterprise p-4">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search student roster by ID, Name, or Department..."
          className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-indigo-500"
        />
      </div>

      <div className="card-enterprise p-6">
        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
          <table className="w-full text-left text-xs font-sans">
            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 uppercase text-[10px]">
              <tr>
                <th className="p-3">Student ID</th>
                <th className="p-3">Full Name</th>
                <th className="p-3">Department & Year</th>
                <th className="p-3">Blood Group</th>
                <th className="p-3">Emergency Contact</th>
                <th className="p-3">Account Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-700 dark:text-slate-300 font-medium">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-slate-400">
                    No student records found in database.
                  </td>
                </tr>
              ) : (
                filtered.map(s => (
                  <tr key={s.studentId} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="p-3 font-mono font-bold text-indigo-600 dark:text-indigo-400">{s.studentId}</td>
                    <td className="p-3 font-bold text-slate-900 dark:text-white">{s.name}</td>
                    <td className="p-3">{s.department} ({s.year})</td>
                    <td className="p-3 font-extrabold text-rose-600 dark:text-rose-400">{s.bloodGroup}</td>
                    <td className="p-3">{s.emergencyContact?.name} ({s.emergencyContact?.phone})</td>
                    <td className="p-3">
                      <span className="px-2.5 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold text-[10px] border border-emerald-200 dark:border-emerald-800">ACTIVE</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
