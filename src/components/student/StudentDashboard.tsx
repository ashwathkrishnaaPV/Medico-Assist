import React, { useState, useEffect } from 'react';
import {
  Calendar, Pill, Apple, Activity,
  ChevronRight, FileText, User, Clock, TrendingUp, Sparkles
} from 'lucide-react';

import { authService } from '../../services/authService';
import { healthStore } from '../../services/healthStore';
import { StudentProfileData, MedicalVisit, Prescription, NutritionPlan, DailyMonitoringPlan, DailyMonitoringResponse, HealthCalendarEvent } from '../../types';
import { AiHealthAssistantModal } from '../common/AiHealthAssistantModal';

interface StudentDashboardProps {
  onNavigate: (tab: string) => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({ onNavigate }) => {
  const [profile, setProfile] = useState<StudentProfileData | undefined>();
  const [visits, setVisits] = useState<MedicalVisit[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [nutritionPlan, setNutritionPlan] = useState<NutritionPlan | undefined>();
  const [monitoringPlan, setMonitoringPlan] = useState<DailyMonitoringPlan | undefined>();
  const [monitoringResponses, setMonitoringResponses] = useState<DailyMonitoringResponse[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<HealthCalendarEvent[]>([]);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);

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
        setMonitoringResponses(healthStore.getMonitoringResponses(studentId));
        setCalendarEvents(healthStore.getCalendarEvents(studentId));
      }
    };
    load();
    const unsub = healthStore.subscribe(load);
    return () => unsub();
  }, [studentId]);

  const activeRx = prescriptions.find(p => p.status === 'ACTIVE' || p.status === 'MODIFIED');
  const recentVisit = visits[0];
  const todayStr = new Date().toISOString().split('T')[0];
  const submittedToday = monitoringResponses.some(r => r.date === todayStr);

  return (
    <div className="lg:h-[calc(100vh-8rem)] lg:overflow-hidden flex flex-col justify-between gap-3 animate-fade-in text-slate-800 dark:text-slate-100">

      {/* Compact Top Header + AI Assistant Trigger */}
      <div className="shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2.5 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Student Health Portal</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => setIsAiModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Ask AI Health Guide</span>
          </button>
          <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-white text-xs">
              {(profile?.name || currentUser.name || 'S').charAt(0)}
            </div>
            <div>
              <div className="font-bold text-slate-900 dark:text-white text-xs">{profile?.name || currentUser.name}</div>
              <div className="text-slate-500 dark:text-slate-400 text-[11px]">{profile?.studentId || 'ID: STU1023'} · {profile?.department || 'Student'}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Active Monitoring Alert — Automatically dismissed once submitted for today */}
      {monitoringPlan && !submittedToday && (
        <div className="shrink-0 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 px-4 py-2.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-950 dark:text-amber-200 shadow-xs animate-fade-in">
          <div className="flex items-center gap-2.5">
            <Activity className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <div className="text-xs">
              <span className="font-bold text-amber-900 dark:text-amber-100">Active Monitoring: {monitoringPlan.conditionName}</span>
              <span className="text-amber-700 dark:text-amber-300 ml-2">
                Day {monitoringPlan.currentDay}/{monitoringPlan.durationDays} — Daily check-in required
              </span>
            </div>
          </div>
          <button
            onClick={() => onNavigate('student-daily-check')}
            className="px-4 py-1.5 rounded-full bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] shrink-0 transition-all cursor-pointer"
          >
            Submit Today's Log
          </button>
        </div>
      )}

      {/* Compact Stats Row */}
      <div className="shrink-0 grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Medical Visits', value: visits.length, icon: FileText, iconColor: 'text-sky-600 dark:text-sky-400', bgColor: 'bg-sky-50 dark:bg-sky-950/50', border: 'border-slate-200 dark:border-slate-800' },
          { label: 'Active Prescriptions', value: prescriptions.filter(p => p.status === 'ACTIVE').length, icon: Pill, iconColor: 'text-purple-600 dark:text-purple-400', bgColor: 'bg-purple-50 dark:bg-purple-950/50', border: 'border-slate-200 dark:border-slate-800' },
          { label: 'BMI Score', value: profile?.bmi ?? '—', icon: TrendingUp, iconColor: 'text-blue-600 dark:text-blue-400', bgColor: 'bg-blue-50 dark:bg-blue-950/50', border: 'border-slate-200 dark:border-slate-800' },
          { label: 'Upcoming Events', value: calendarEvents.length, icon: Calendar, iconColor: 'text-blue-600 dark:text-blue-400', bgColor: 'bg-blue-50 dark:bg-blue-950/50', border: 'border-slate-200 dark:border-slate-800' },
        ].map(stat => (
          <div key={stat.label} className={`px-3.5 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border ${stat.border} shadow-xs flex items-center gap-3`}>
            <div className={`p-2 rounded-xl ${stat.bgColor}`}>
              <stat.icon className={`w-4 h-4 ${stat.iconColor}`} />
            </div>
            <div>
              <div className="text-xl font-extrabold text-slate-900 dark:text-white leading-none">{stat.value}</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-1">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Upper Row: Most Recent Consultation & Health Profile Summary */}
      <div className="shrink-0 grid grid-cols-1 lg:grid-cols-2 gap-3.5">

        {/* Recent Visit */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-2 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-sky-600 dark:text-sky-400" /> Most Recent Consultation
            </h3>
            <button onClick={() => onNavigate('student-history')} className="flex items-center gap-0.5 text-sky-600 dark:text-sky-400 font-bold text-[11px] hover:underline cursor-pointer">
              Full history <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          {recentVisit ? (
            <div className="text-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sky-700 dark:text-sky-400">{recentVisit.diagnosis}</span>
                <span className="text-slate-500 dark:text-slate-400 font-medium text-[11px]">
                  {(() => {
                    const parts = (recentVisit.visitDate || '').split('-');
                    return (parts.length === 3 && parts[0].length === 4)
                      ? `${parts[2]}-${parts[1]}-${parts[0]}`
                      : recentVisit.visitDate;
                  })()}
                </span>
              </div>
              <p className="text-slate-700 dark:text-slate-300 truncate"><span className="font-bold text-slate-900 dark:text-white">Complaint:</span> {recentVisit.chiefComplaint}</p>
              <p className="text-slate-500 dark:text-slate-400 line-clamp-2 text-[11px]">{recentVisit.clinicalNotes}</p>
            </div>
          ) : (
            <p className="text-xs text-slate-400 py-3 text-center">No consultation records found.</p>
          )}
        </div>

        {/* Health Profile Summary */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-2 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
              <User className="w-4 h-4 text-slate-500 dark:text-slate-400" /> Health Profile Summary
            </h3>
            <button onClick={() => onNavigate('student-profile')} className="flex items-center gap-0.5 text-blue-600 dark:text-blue-400 font-bold text-[11px] hover:underline cursor-pointer">
              View profile <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          {profile ? (
            <div className="grid grid-cols-4 gap-2 text-xs">
              <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900">
                <div className="text-[10px] text-rose-700 dark:text-rose-400 uppercase font-bold">Blood</div>
                <div className="font-bold text-rose-800 dark:text-rose-200 mt-0.5">{profile.bloodGroup || '—'}</div>
              </div>
              <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold">Height / Wt</div>
                <div className="font-bold text-slate-900 dark:text-white mt-0.5">{profile.heightCm}cm / {profile.weightKg}kg</div>
              </div>
              <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold">Year</div>
                <div className="font-bold text-slate-900 dark:text-white mt-0.5">{profile.year}</div>
              </div>
              <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold">Gender</div>
                <div className="font-bold text-slate-900 dark:text-white mt-0.5">{profile.gender}</div>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-400 py-3 text-center">Profile not yet complete.</p>
          )}
        </div>

      </div>

      {/* Lower Row: Current Prescription, Nutrition Plan & Next Appointment */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-3 gap-3.5">

        {/* Current Prescription */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col justify-between shadow-xs overflow-hidden">
          <div className="space-y-2">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-slate-900 dark:text-white">
                <Pill className="w-4 h-4 text-purple-600 dark:text-purple-400" /> Current Prescription
              </div>
              {activeRx && (
                <span className="px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 text-[10px] font-bold border border-purple-200 dark:border-purple-800">
                  Active v{activeRx.currentVersion?.version || 1}
                </span>
              )}
            </div>
            {activeRx && activeRx.currentVersion ? (
              <div className="space-y-1.5 text-xs">
                <p className="text-slate-500 dark:text-slate-400 text-[11px]">Issued by <span className="font-bold text-slate-800 dark:text-slate-200">{activeRx.doctorName}</span></p>
                {(activeRx.currentVersion.items || []).slice(0, 2).map((item, i) => (
                  <div key={i} className="px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2">
                    <span className="font-bold text-slate-900 dark:text-white truncate">{item.medicineName}</span>
                    <span className="text-slate-500 dark:text-slate-300 text-[11px] shrink-0">{item.dosage} · {item.frequency}</span>
                  </div>
                ))}
                {(activeRx.currentVersion.items?.length || 0) > 2 && (
                  <p className="text-[11px] text-purple-600 dark:text-purple-400 font-bold">+{(activeRx.currentVersion.items?.length || 0) - 2} more item(s)</p>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-400 py-4 text-center">No active prescriptions.</p>
            )}
          </div>
          {activeRx && (
            <button onClick={() => onNavigate('student-prescriptions')} className="flex items-center gap-1 text-purple-600 dark:text-purple-400 font-bold text-xs pt-2 hover:underline cursor-pointer">
              View full prescription <ChevronRight className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Nutrition Plan */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col justify-between shadow-xs overflow-hidden">
          <div className="space-y-2">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-slate-900 dark:text-white">
                <Apple className="w-4 h-4 text-blue-600 dark:text-blue-400" /> Nutrition Plan
              </div>
              {nutritionPlan && (
                <span className="px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 text-[10px] font-bold border border-blue-200 dark:border-blue-800">
                  {nutritionPlan.doctorApproved ? 'Approved' : 'Pending'}
                </span>
              )}
            </div>
            {nutritionPlan ? (
              <div className="space-y-1.5 text-xs">
                <p className="text-slate-700 dark:text-slate-300 font-medium line-clamp-2 text-[11px]">{nutritionPlan.goal}</p>
                <div className="px-2.5 py-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800">
                  <div className="font-bold text-blue-800 dark:text-blue-300 text-[10px] uppercase">Breakfast</div>
                  <p className="text-slate-700 dark:text-slate-300 truncate mt-0.5">{nutritionPlan.meals?.breakfast?.[0] || 'Personalized wellness plan'}</p>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400 py-4 text-center">No nutrition plan assigned.</p>
            )}
          </div>
          {nutritionPlan && (
            <button onClick={() => onNavigate('student-nutrition')} className="flex items-center gap-1 text-blue-600 dark:text-blue-400 font-bold text-xs pt-2 hover:underline cursor-pointer">
              View full meal plan <ChevronRight className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Upcoming Appointment */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col justify-between shadow-xs overflow-hidden">
          <div className="space-y-2">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-slate-900 dark:text-white">
                <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" /> Next Appointment
              </div>
            </div>
            {(() => {
              const upcomingEvent = calendarEvents.find(e => e.status === 'Upcoming' || e.eventType === 'Follow-up') || calendarEvents[0];
              if (!upcomingEvent) {
                return <p className="text-xs text-slate-400 py-4 text-center">No upcoming appointments.</p>;
              }
              const dateParts = (upcomingEvent.date || '').split('-');
              const formattedDate = (dateParts.length === 3 && dateParts[0].length === 4)
                ? `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`
                : upcomingEvent.date;

              return (
                <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-xs">
                  <div className="font-bold text-slate-900 dark:text-white truncate">{upcomingEvent.title || 'Appointment'}</div>
                  <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400 mt-1 font-bold text-[11px]">
                    <Clock className="w-3 h-3" /> {formattedDate} {upcomingEvent.time ? `· ${upcomingEvent.time}` : ''}
                  </div>
                  {upcomingEvent.notes && <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-1 line-clamp-1">{upcomingEvent.notes}</p>}
                </div>
              );
            })()}
          </div>
          <button onClick={() => onNavigate('student-calendar')} className="flex items-center gap-1 text-blue-600 dark:text-blue-400 font-bold text-xs pt-2 hover:underline cursor-pointer">
            View health calendar <ChevronRight className="w-3 h-3" />
          </button>
        </div>

      </div>

      <AiHealthAssistantModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
      />
    </div>
  );
};
