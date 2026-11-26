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
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-white text-sm">
            {(profile?.name || currentUser.name || 'S').charAt(0)}
          </div>
          <div>
            <div className="font-bold text-slate-900 dark:text-white text-sm">{profile?.name || currentUser.name}</div>
            <div className="text-slate-500 dark:text-slate-400 text-xs">{profile?.studentId || 'ID: STU1023'} · {profile?.department || 'Student'}</div>
          </div>
        </div>
      </div>

      {/* Active Monitoring Alert — Automatically dismissed once submitted for today */}
      {monitoringPlan && !submittedToday && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-3xl bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-300 dark:border-amber-800 text-amber-950 dark:text-amber-200 shadow-sm animate-fade-in">
          <div className="flex items-center gap-3">
            <Activity className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
            <div>
              <div className="font-bold text-sm text-amber-900 dark:text-amber-100">
                Active Monitoring: {monitoringPlan.conditionName}
              </div>
              <div className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">
                Day {monitoringPlan.currentDay} of {monitoringPlan.durationDays} — Daily check-in required for today
              </div>
            </div>
          </div>
          <button
            onClick={() => onNavigate('student-daily-check')}
            className="px-5 py-2.5 rounded-full bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white font-bold text-xs shrink-0 shadow-md shadow-amber-600/25 transition-all cursor-pointer"
          >
            Submit Today's Log
          </button>
        </div>
      )}

      {/* AI Campus Health Assistant Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 sm:p-5 rounded-3xl bg-linear-to-r from-blue-500/10 via-indigo-500/10 to-purple-500/10 border border-blue-200 dark:border-blue-900/60 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white shrink-0 shadow-md shadow-blue-500/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-slate-900 dark:text-white">Ask MedicoAssist AI Health Guide</span>
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                Educational
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
              Instant explanations of medical terms, BMI measurements, nutrition guidelines &amp; vitals.
            </p>
          </div>
        </div>
        <button
          onClick={() => setIsAiModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shrink-0 flex items-center gap-1.5 shadow-md shadow-blue-600/20 transition-all cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Launch AI Assistant</span>
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Medical Visits', value: visits.length, icon: FileText, iconColor: 'text-sky-600 dark:text-sky-400', bgColor: 'bg-sky-50 dark:bg-sky-950/50', border: 'border-slate-200 dark:border-slate-800' },
          { label: 'Active Prescriptions', value: prescriptions.filter(p => p.status === 'ACTIVE').length, icon: Pill, iconColor: 'text-purple-600 dark:text-purple-400', bgColor: 'bg-purple-50 dark:bg-purple-950/50', border: 'border-slate-200 dark:border-slate-800' },
          { label: 'BMI Score', value: profile?.bmi ?? '—', icon: TrendingUp, iconColor: 'text-blue-600 dark:text-blue-400', bgColor: 'bg-blue-50 dark:bg-blue-950/50', border: 'border-slate-200 dark:border-slate-800' },
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
              <Apple className="w-4 h-4 text-blue-600 dark:text-blue-400" /> Nutrition Plan
            </div>
            {nutritionPlan && (
              <span className="px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 text-[10px] font-bold border border-blue-200 dark:border-blue-800">
                {nutritionPlan.doctorApproved ? 'Approved' : 'Pending'}
              </span>
            )}
          </div>
          {nutritionPlan ? (
            <div className="space-y-2 text-xs">
              <p className="text-slate-700 dark:text-slate-300 font-medium">{nutritionPlan.goal}</p>
              <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800">
                <div className="font-bold text-blue-800 dark:text-blue-300 text-[11px] uppercase mb-1">Breakfast</div>
                <p className="text-slate-700 dark:text-slate-300">{nutritionPlan.meals?.breakfast?.[0] || 'Personalized wellness plan'}</p>
              </div>
              <button onClick={() => onNavigate('student-nutrition')} className="flex items-center gap-1 text-blue-600 dark:text-blue-400 font-bold text-xs pt-1 hover:underline">
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
              <div className="space-y-2 text-xs">
                <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800">
                  <div className="font-bold text-slate-900 dark:text-white">{upcomingEvent.title || 'Appointment'}</div>
                  <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400 mt-1 font-bold">
                    <Clock className="w-3 h-3" /> {formattedDate} {upcomingEvent.time ? `· ${upcomingEvent.time}` : ''}
                  </div>
                  {upcomingEvent.notes && <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-1">{upcomingEvent.notes}</p>}
                </div>
                <button onClick={() => onNavigate('student-calendar')} className="flex items-center gap-1 text-blue-600 dark:text-blue-400 font-bold text-xs pt-1 hover:underline">
                  View health calendar <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            );
          })()}
        </div>

      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Recent Visit */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-3 shadow-sm">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <FileText className="w-4 h-4 text-sky-600 dark:text-sky-400" /> Most Recent Consultation
          </h3>
          {recentVisit ? (
            <div className="text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sky-700 dark:text-sky-400">{recentVisit.diagnosis}</span>
                <span className="text-slate-500 dark:text-slate-400 font-medium">
                  {(() => {
                    const parts = (recentVisit.visitDate || '').split('-');
                    return (parts.length === 3 && parts[0].length === 4)
                      ? `${parts[2]}-${parts[1]}-${parts[0]}`
                      : recentVisit.visitDate;
                  })()}
                </span>
              </div>
              <p className="text-slate-700 dark:text-slate-300"><span className="font-bold text-slate-900 dark:text-white">Complaint:</span> {recentVisit.chiefComplaint}</p>
              <p className="text-slate-600 dark:text-slate-400">{recentVisit.clinicalNotes}</p>
              <button onClick={() => onNavigate('student-history')} className="flex items-center gap-1 text-sky-600 dark:text-sky-400 font-bold text-xs pt-1 hover:underline">
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

      <AiHealthAssistantModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
      />
    </div>
  );
};
