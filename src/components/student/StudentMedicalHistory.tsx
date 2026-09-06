import React, { useState, useEffect } from 'react';
import { History, Stethoscope, FileText, Activity, Pill, Apple, Calendar, ChevronDown, ChevronUp, Lock } from 'lucide-react';
import { healthStore } from '../../services/healthStore';
import { MedicalVisit, LabReport } from '../../types';

import { authService } from '../../services/authService';

export const StudentMedicalHistory: React.FC = () => {
  const currentUser = authService.getCurrentUser();
  const studentId = currentUser.studentId || currentUser.id;
  const [visits, setVisits] = useState<MedicalVisit[]>([]);
  const [labReports, setLabReports] = useState<LabReport[]>([]);
  const [expandedVisitId, setExpandedVisitId] = useState<string | null>(null);

  useEffect(() => {
    const load = () => {
      if (studentId) {
        const v = healthStore.getVisitsForStudent(studentId);
        setVisits(v);
        if (v.length > 0 && !expandedVisitId) {
          setExpandedVisitId(v[0].id);
        }
        setLabReports(healthStore.getLabReports(studentId));
      }
    };

    load();
    const unsub = healthStore.subscribe(load);
    return () => unsub();
  }, [studentId]);

  return (
    <div className="space-y-6 theme-student animate-fade-in pb-12">
      
      {/* Banner */}
      <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <History className="w-6 h-6 text-emerald-600" /> Chronological Medical Timeline
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Complete record of consultations, vitals, prescriptions, lab reports, and follow-ups.
          </p>
        </div>
        <div className="flex items-center gap-1 text-xs text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl">
          <Lock className="w-3.5 h-3.5" /> Read-Only Patient Ledger
        </div>
      </div>

      {/* Timeline List */}
      <div className="space-y-6 relative before:absolute before:left-6 before:top-4 before:bottom-4 before:w-0.5 before:bg-emerald-200 dark:before:bg-emerald-900">
        
        {visits.map(visit => {
          const isExpanded = expandedVisitId === visit.id;
          return (
            <div key={visit.id} className="relative pl-12">
              
              {/* Timeline Node Icon */}
              <div className="absolute left-3 top-1 -translate-x-1/2 w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-md">
                <Stethoscope className="w-4 h-4" />
              </div>

              {/* Visit Card */}
              <div className="card-wellness p-5 space-y-4">
                <div className="flex items-center justify-between cursor-pointer" onClick={() => setExpandedVisitId(isExpanded ? null : visit.id)}>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm text-slate-800 dark:text-slate-100">
                        🩺 Medical Consultation — {visit.diagnosis}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                        {visit.visitType}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {visit.visitDate} at {visit.time} · Clinician: {visit.doctorName}
                    </p>
                  </div>

                  <button className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400">
                    {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </button>
                </div>

                {/* Sub-steps Summary */}
                <div className="flex flex-wrap gap-2 text-xs pt-1 border-t border-slate-100 dark:border-slate-800">
                  <span className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold flex items-center gap-1">
                    <Activity className="w-3.5 h-3.5 text-teal-600" /> Vitals Recorded
                  </span>
                  {visit.prescriptionId && (
                    <span className="px-2.5 py-1 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 font-semibold flex items-center gap-1">
                      <Pill className="w-3.5 h-3.5 text-purple-600" /> Prescription Issued
                    </span>
                  )}
                  {visit.nutritionPlanId && (
                    <span className="px-2.5 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-semibold flex items-center gap-1">
                      <Apple className="w-3.5 h-3.5 text-emerald-600" /> Nutrition Plan Approved
                    </span>
                  )}
                  <span className="px-2.5 py-1 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 font-semibold flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-teal-600" /> Follow-up Scheduled
                  </span>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs animate-fade-in">
                    
                    {/* Chief Complaint */}
                    <div>
                      <span className="font-bold text-slate-700 dark:text-slate-300">Chief Complaint & Symptoms:</span>
                      <p className="text-slate-600 dark:text-slate-400 mt-0.5">{visit.chiefComplaint}</p>
                    </div>

                    {/* Vitals Summary */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <div className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl">
                        <span className="text-[10px] text-slate-400 block font-semibold">Blood Pressure</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">{visit.vitals.bloodPressureSys}/{visit.vitals.bloodPressureDia} mmHg</span>
                      </div>
                      <div className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl">
                        <span className="text-[10px] text-slate-400 block font-semibold">Heart Rate</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">{visit.vitals.heartRateBpm} bpm</span>
                      </div>
                      <div className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl">
                        <span className="text-[10px] text-slate-400 block font-semibold">SpO2 Oxygen</span>
                        <span className="font-bold text-emerald-600">{visit.vitals.spo2Percent}%</span>
                      </div>
                      <div className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl">
                        <span className="text-[10px] text-slate-400 block font-semibold">Temperature</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">{visit.vitals.temperatureF}°F</span>
                      </div>
                    </div>

                    {/* Clinical Notes */}
                    <div>
                      <span className="font-bold text-slate-700 dark:text-slate-300">Doctor Clinical Notes:</span>
                      <p className="text-slate-600 dark:text-slate-400 mt-0.5 italic">{visit.clinicalNotes}</p>
                    </div>

                  </div>
                )}

              </div>
            </div>
          );
        })}

        {/* Lab Reports Section */}
        {labReports.map(lab => (
          <div key={lab.id} className="relative pl-12">
            <div className="absolute left-3 top-1 -translate-x-1/2 w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-md">
              <FileText className="w-4 h-4" />
            </div>
            <div className="card-wellness p-5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-slate-800 dark:text-slate-100">
                  🧪 Lab Report — {lab.testName}
                </span>
                <span className="text-xs text-slate-400">{lab.date}</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">{lab.summary}</p>
            </div>
          </div>
        ))}

      </div>

    </div>
  );
};
