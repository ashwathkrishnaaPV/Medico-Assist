import React, { useState } from 'react';
import { KeyRound, Shield, CheckCircle2, Lock, Users, Stethoscope } from 'lucide-react';

export const RoleManagement: React.FC = () => {
  return (
    <div className="space-y-6 theme-admin animate-fade-in pb-12 text-slate-800 dark:text-slate-100">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <KeyRound className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">RBAC Role & Granular Permission Matrix</h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Enforce least-privilege security controls across Student, Medical Centre, Admin, and Emergency roles.
          </p>
        </div>
      </div>

      {/* Permission Matrix Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
        
        {/* Student Permissions */}
        <div className="card-enterprise p-6 space-y-4">
          <div className="flex items-center gap-2 font-bold text-emerald-600 dark:text-emerald-400 text-sm">
            <Shield className="w-5 h-5" /> Student Role Controls
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <span className="font-semibold text-slate-800 dark:text-slate-200">View Own Medical & Prescription History</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">ALLOWED</span>
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Modify Doctor-Entered Records</span>
              <span className="text-rose-600 dark:text-rose-400 font-bold">STRICTLY BLOCKED</span>
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <span className="font-semibold text-slate-800 dark:text-slate-200">Submit Daily Health Check Symptoms</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">ALLOWED</span>
            </div>
          </div>
        </div>

        {/* Medical Staff Permissions */}
        <div className="card-enterprise p-6 space-y-4">
          <div className="flex items-center gap-2 font-bold text-teal-600 dark:text-teal-400 text-sm">
            <Stethoscope className="w-5 h-5" /> Medical Centre Clinician Controls
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <span className="font-semibold text-slate-800 dark:text-slate-200">Issue & Version Prescriptions</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">ALLOWED</span>
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <span className="font-semibold text-slate-800 dark:text-slate-200">Approve AI Nutrition Recommendations</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">ALLOWED</span>
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <span className="font-semibold text-slate-800 dark:text-slate-200">Search Student Directory & Record Vitals</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">ALLOWED</span>
            </div>
          </div>
        </div>

        {/* Admin Permissions */}
        <div className="card-enterprise p-6 space-y-4">
          <div className="flex items-center gap-2 font-bold text-indigo-600 dark:text-indigo-400 text-sm">
            <Lock className="w-5 h-5" /> Admin Role Controls
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <span className="font-semibold text-slate-800 dark:text-slate-200">View Aggregated Non-Clinical Metrics</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">ALLOWED</span>
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <span className="text-slate-500 dark:text-slate-400 font-medium">View Detailed Individual Medical Notes</span>
              <span className="text-amber-600 dark:text-amber-400 font-bold">RESTRICTED (RBAC)</span>
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <span className="font-semibold text-slate-800 dark:text-slate-200">Inspect Security & Audit Logs</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">ALLOWED</span>
            </div>
          </div>
        </div>

        {/* Emergency Responder Permissions */}
        <div className="card-enterprise p-6 space-y-4">
          <div className="flex items-center gap-2 font-bold text-rose-600 dark:text-rose-400 text-sm">
            <Shield className="w-5 h-5" /> Emergency Responder QR Access Controls
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <span className="font-semibold text-slate-800 dark:text-slate-200">View Critical Triage Info (Blood Group, Allergies)</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">ALLOWED</span>
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <span className="text-slate-500 dark:text-slate-400 font-medium">View Full Consultation History</span>
              <span className="text-rose-600 dark:text-rose-400 font-bold">MASKED</span>
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <span className="font-semibold text-slate-800 dark:text-slate-200">Audit Log Mandatory Emission</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">ENFORCED</span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
