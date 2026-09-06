import React, { useState, useEffect } from 'react';
import { Stethoscope } from 'lucide-react';
import { authService } from '../../services/authService';
import { User } from '../../types';

export const MedicalStaffManagement: React.FC = () => {
  const [staff, setStaff] = useState<User[]>([]);

  useEffect(() => {
    const load = () => {
      authService.getUsers().then(all => setStaff(all.filter(u => u.role === 'MEDICAL_STAFF')));
    };
    load();
    const unsub = authService.subscribe(load);
    return () => unsub();
  }, []);

  return (
    <div className="space-y-6 theme-admin animate-fade-in pb-12 text-slate-800 dark:text-slate-100">
      <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Stethoscope className="w-6 h-6 text-teal-600 dark:text-teal-400" /> Medical Centre Staff & Clinicians
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Manage clinician accounts, credentials, and prescription authorization levels.</p>
        </div>
      </div>

      <div className="card-enterprise p-6">
        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
          <table className="w-full text-left font-sans">
            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 uppercase text-[10px]">
              <tr>
                <th className="p-3">Staff ID</th>
                <th className="p-3">Clinician Name</th>
                <th className="p-3">Email Address</th>
                <th className="p-3">Title & Specialty</th>
                <th className="p-3">Department</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-700 dark:text-slate-300 font-medium">
              {staff.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-slate-400">
                    No medical staff accounts registered in database.
                  </td>
                </tr>
              ) : (
                staff.map(s => (
                  <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="p-3 font-mono font-bold text-teal-600 dark:text-teal-400">{s.staffId || 'DOC001'}</td>
                    <td className="p-3 font-bold text-slate-900 dark:text-white">{s.name}</td>
                    <td className="p-3">{s.email}</td>
                    <td className="p-3">{s.title || 'Campus Physician'}</td>
                    <td className="p-3">{s.department || 'General Medicine'}</td>
                    <td className="p-3">
                      <span className="px-2.5 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold text-[10px] border border-emerald-200 dark:border-emerald-800">AUTHORIZED</span>
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
