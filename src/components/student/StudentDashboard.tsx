import React, { useState, useEffect } from 'react';
import {
  Calendar, Pill, Apple, Activity, AlertTriangle,
  ChevronRight, FileText, User, Clock, TrendingUp
} from 'lucide-react';

import { authService } from '../../services/authService';
import { healthStore } from '../../services/healthStore';
import { StudentProfileData, MedicalVisit, Prescription, NutritionPlan, DailyMonitoringPlan, HealthCalendarEvent } from '../../types';

interface StudentDashboardProps {
  onNavigate: (tab: string) => void;
  onOpenEmergencyModal: () => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({ onNavigate, onOpenEmergencyModal }) => {
  const [profile, setProfile] = useState<StudentProfileData | undefined>();
  const [visits, setVisits] = useState<MedicalVisit[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [nutritionPlan, setNutritionPlan] = useState<NutritionPlan | undefined>();
  const [monitoringPlan, setMonitoringPlan] = useState<DailyMonitoringPlan | undefined>();
  const [calendarEvents, setCalendarEvents] = useState<HealthCalendarEvent[]>([]);

  const currentUser = authService.getCurrentUser();
  const studentId = currentUser.studentId || currentUser.id;

  useEffect(() => {
    const load = () => {
      if (studentId) {
        setProfile(healthStore.getStudentProfile(studentId));
        setVisits(healthStore.getVisitsForStudent(studentId));
        setPrescriptions(healthStore.getPrescriptionsForStudent(studentId));
        setNutritionPlan(healthStore.getNutritionPlanForStudent(studentId));
        setMonitoringPlan(healthStore.getMonitoringPlan(studentId));
        setCalendarEvents(healthStore.getCalendarEvents(studentId));
      }
    };
    load();
    const unsub = healthStore.subscribe(load);
    return () => unsub();
  }, [studentId]);

  const activeRx = prescriptions.find(p => p.status === 'ACTIVE' || p.status === 'MODIFIED');
  const recentVisit = visits[0];

  return (
    <div className="space-y-6 animate-fade-in pb-12 text-slate-800 dark:text-slate-100">

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Student Health Portal</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center font-bold text-white text-sm">
            {(profile?.name || currentUser.name || 'S').charAt(0)}
          </div>
          <div>
            <div className="font-bold text-slate-900 dark:text-white text-sm">{profile?.name || currentUser.name}</div>
            <div className="text-slate-500 dark:text-slate-400 text-xs">{profile?.studentId || 'ID: STU1023'} · {profile?.department || 'Student'}</div>
          </div>
        </div>
      </div>

      {/* Active Monitoring Alert */}
      {monitoringPlan && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-950 dark:text-amber-200">
          <div className="flex items-center gap-3">
            <Activity className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
            <div>
              <div className="font-bold text-sm text-amber-900 dark:text-amber-100">
                Active Monitoring: {monitoringPlan.conditionName}
              </div>
              <div className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">
                Day {monitoringPlan.currentDay} of {monitoringPlan.durationDays} — Daily log required
              </div>
            </div>
          </div>
          <button
            onClick={() => onNavigate('student-daily-check')}
            className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shrink-0 shadow-sm transition-all"
          >
            Submit Today's Log
          </button>
        </div>
      )}

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Medical Visits', value: visits.length, icon: FileText, iconColor: 'text-teal-600 dark:text-teal-400', bgColor: 'bg-teal-50 dark:bg-teal-950/50', border: 'border-slate-200 dark:border-slate-800' },
          { label: 'Active Prescriptions', value: prescriptions.filter(p => p.status === 'ACTIVE').length, icon: Pill, iconColor: 'text-purple-600 dark:text-purple-400', bgColor: 'bg-purple-50 dark:bg-purple-950/50', border: 'border-slate-200 dark:border-slate-800' },
          { label: 'BMI Score', value: profile?.bmi ?? '—', icon: TrendingUp, iconColor: 'text-emerald-600 dark:text-emerald-400', bgColor: 'bg-emerald-50 dark:bg-emerald-950/50', border: 'border-slate-200 dark:border-slate-800' },
          { label: 'Upcoming Events', value: calendarEvents.length, icon: Calendar, iconColor: 'text-blue-600 dark:text-blue-400', bgColor: 'bg-blue-50 dark:bg-blue-950/50', border: 'border-slate-200 dark:border-slate-800' },
        ].map(stat => (
          <div key={stat.label} className={`p-4 rounded-2xl bg-white dark:bg-slate-900 border ${stat.border} shadow-sm flex items-center gap-3.5 transition-all`}>
            <div className={`p-2.5 rounded-xl ${stat.bgColor}`}>
              <stat.icon className={`w-5 h-5 ${stat.iconColor}`} />
            </div>
            <div>
              <div className="text-2xl font-extrabold text-slate-900 dark:text-white">{stat.value}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Current Prescription */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-3.5 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2 font-bold text-sm text-slate-900 dark:text-white">
              <Pill className="w-4 h-4 text-purple-600 dark:text-purple-400" /> Current Prescription
            </div>
            {activeRx && (
              <span className="px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 text-[10px] font-bold border border-purple-200 dark:border-purple-800">
                Active v{activeRx.currentVersion?.version || 1}
              </span>
            )}
          </div>
          {activeRx && activeRx.currentVersion ? (
            <div className="space-y-2 text-xs">
              <p className="text-slate-500 dark:text-slate-400">Issued by <span className="font-bold text-slate-800 dark:text-slate-200">{activeRx.doctorName}</span></p>
              {(activeRx.currentVersion.items || []).slice(0, 2).map((item, i) => (
                <div key={i} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <div className="font-bold text-slate-900 dark:text-white">{item.medicineName}</div>
                  <div className="text-slate-600 dark:text-slate-300 text-[11px] mt-0.5">{item.dosage} · {item.frequency}</div>
                </div>
              ))}
              {(activeRx.currentVersion.items?.length || 0) > 2 && (
                <p className="text-[11px] text-purple-600 dark:text-purple-400 font-bold">+{(activeRx.currentVersion.items?.length || 0) - 2} more item(s)</p>
              )}
              <button onClick={() => onNavigate('student-prescriptions')} className="flex items-center gap-1 text-purple-600 dark:text-purple-400 font-bold text-xs pt-1 hover:underline">
                View full prescription <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <p className="text-xs text-slate-400 py-4 text-center">No active prescriptions.</p>
          )}
        </div>

        {/* Nutrition Plan */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-3.5 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2 font-bold text-sm text-slate-900 dark:text-white">
              <Apple className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> Nutrition Plan
            </div>
            {nutritionPlan && (
              <span className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold border border-emerald-200 dark:border-emerald-800">
                {nutritionPlan.doctorApproved ? 'Approved' : 'Pending'}
              </span>
            )}
          </div>
          {nutritionPlan ? (
            <div className="space-y-2 text-xs">
              <p className="text-slate-700 dark:text-slate-300 font-medium">{nutritionPlan.goal}</p>
              <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
                <div className="font-bold text-emerald-800 dark:text-emerald-300 text-[11px] uppercase mb-1">Breakfast</div>
                <p className="text-slate-700 dark:text-slate-300">{nutritionPlan.meals?.breakfast?.[0] || 'Personalized wellness plan'}</p>
              </div>
              <button onClick={() => onNavigate('student-nutrition')} className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold text-xs pt-1 hover:underline">
                View full meal plan <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <p className="text-xs text-slate-400 py-4 text-center">No nutrition plan assigned.</p>
          )}
        </div>

        {/* Upcoming Appointment */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-3.5 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2 font-bold text-sm text-slate-900 dark:text-white">
              <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" /> Next Appointment
            </div>
          </div>
          {calendarEvents && calendarEvents.length > 0 && calendarEvents[0] ? (
            <div className="space-y-2 text-xs">
              <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800">
                <div className="font-bold text-slate-900 dark:text-white">{calendarEvents[0].title || 'Appointment'}</div>
                <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400 mt-1 font-bold">
                  <Clock className="w-3 h-3" /> {calendarEvents[0].date || ''} {calendarEvents[0].time ? `· ${calendarEvents[0].time}` : ''}
                </div>
                {calendarEvents[0].notes && <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-1">{calendarEvents[0].notes}</p>}
              </div>
              <button onClick={() => onNavigate('student-calendar')} className="flex items-center gap-1 text-blue-600 dark:text-blue-400 font-bold text-xs pt-1 hover:underline">
                View health calendar <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <p className="text-xs text-slate-400 py-4 text-center">No upcoming appointments.</p>
          )}
        </div>

      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Recent Visit */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-3 shadow-sm">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <FileText className="w-4 h-4 text-teal-600 dark:text-teal-400" /> Most Recent Consultation
          </h3>
          {recentVisit ? (
            <div className="text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-teal-700 dark:text-teal-400">{recentVisit.diagnosis}</span>
                <span className="text-slate-500 dark:text-slate-400 font-medium">{recentVisit.visitDate}</span>
              </div>
              <p className="text-slate-700 dark:text-slate-300"><span className="font-bold text-slate-900 dark:text-white">Complaint:</span> {recentVisit.chiefComplaint}</p>
              <p className="text-slate-600 dark:text-slate-400">{recentVisit.clinicalNotes}</p>
              <button onClick={() => onNavigate('student-history')} className="flex items-center gap-1 text-teal-600 dark:text-teal-400 font-bold text-xs pt-1 hover:underline">
                Full medical history <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <p className="text-xs text-slate-400 py-4 text-center">No consultation records found.</p>
          )}
        </div>

        {/* Health Profile Summary */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-3 shadow-sm">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <User className="w-4 h-4 text-slate-500 dark:text-slate-400" /> Health Profile Summary
          </h3>
          {profile ? (
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900">
                <div className="text-[10px] text-rose-700 dark:text-rose-400 uppercase font-bold mb-0.5">Blood Group</div>
                <div className="font-bold text-rose-800 dark:text-rose-200">{profile.bloodGroup || '—'}</div>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold mb-0.5">Height / Weight</div>
                <div className="font-bold text-slate-900 dark:text-white">{profile.heightCm} cm / {profile.weightKg} kg</div>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold mb-0.5">Year</div>
                <div className="font-bold text-slate-900 dark:text-white">{profile.year}</div>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold mb-0.5">Gender</div>
                <div className="font-bold text-slate-900 dark:text-white">{profile.gender}</div>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-400 py-4 text-center">Profile not yet complete.</p>
          )}
        </div>

      </div>

      {/* Emergency Card Banner */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900 dark:bg-slate-900 border border-slate-700 dark:border-slate-800 shadow-md">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-rose-600 border border-rose-500">
            <AlertTriangle className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="font-bold text-sm text-white">Digital Emergency Medical Card</div>
            <p className="text-xs text-slate-300 mt-0.5">Provides first responders with critical blood group & allergy data.</p>
          </div>
        </div>
        <button
          onClick={onOpenEmergencyModal}
          className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shrink-0 transition-colors shadow-sm"
        >
          View Emergency Card
        </button>
      </div>

    </div>
  );
};
