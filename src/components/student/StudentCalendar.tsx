import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Clock, Stethoscope, Pill, Apple, Activity, FileText, CheckCircle2 } from 'lucide-react';
import { healthStore } from '../../services/healthStore';
import { HealthCalendarEvent } from '../../types';

import { authService } from '../../services/authService';

export const StudentCalendar: React.FC = () => {
  const currentUser = authService.getCurrentUser();
  const studentId = currentUser.studentId || currentUser.id;
  const [events, setEvents] = useState<HealthCalendarEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<HealthCalendarEvent | null>(null);
  const [viewMode, setViewMode] = useState<'Month' | 'Week' | 'Day'>('Month');

  useEffect(() => {
    const load = () => {
      if (studentId) {
        setEvents(healthStore.getCalendarEvents(studentId));
      }
    };

    load();
    const unsub = healthStore.subscribe(load);
    return () => unsub();
  }, [studentId]);

  const getEventBadge = (type: string) => {
    switch (type) {
      case 'Medical Consultation':
        return <span className="bg-teal-100 text-teal-800 font-bold px-2 py-0.5 rounded-md text-[10px]">Consultation</span>;
      case 'Follow-up':
        return <span className="bg-purple-100 text-purple-800 font-bold px-2 py-0.5 rounded-md text-[10px]">Follow-up</span>;
      case 'Nutrition Review':
        return <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-md text-[10px]">Nutrition</span>;
      default:
        return <span className="bg-slate-100 text-slate-800 font-bold px-2 py-0.5 rounded-md text-[10px]">{type}</span>;
    }
  };

  return (
    <div className="space-y-6 theme-student animate-fade-in pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <CalendarIcon className="w-6 h-6 text-emerald-600" /> Student Health Calendar
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Integrated schedule of medical consultations, follow-ups, nutrition reviews, and lab appointments.
          </p>
        </div>

        {/* View mode toggle */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold">
          {(['Month', 'Week', 'Day'] as const).map(mode => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                viewMode === mode
                  ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              {mode} View
            </button>
          ))}
        </div>
      </div>

      {/* Events Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Events List */}
        <div className="md:col-span-2 space-y-3">
          <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400">Scheduled Health Events</h3>

          <div className="space-y-3">
            {events.map(ev => (
              <div
                key={ev.id}
                onClick={() => setSelectedEvent(ev)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                  selectedEvent?.id === ev.id
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 shadow-md'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-emerald-200'
                }`}
              >
                <div className="flex items-start justify-between gap-3 text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-800 dark:text-slate-100">{ev.title}</span>
                      {getEventBadge(ev.eventType)}
                    </div>
                    <div className="flex items-center gap-2 text-slate-500 font-semibold">
                      <Clock className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{ev.date} at {ev.time}</span>
                    </div>
                    {ev.notes && <p className="text-slate-400 italic text-[11px]">{ev.notes}</p>}
                  </div>

                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                    ev.status === 'Completed' ? 'bg-slate-100 text-slate-600' : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {ev.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Selected Event Details Panel */}
        <div className="card-wellness p-6 space-y-4">
          <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-600" /> Event Details
          </h3>

          {selectedEvent ? (
            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Event Title</span>
                <span className="font-extrabold text-slate-800 dark:text-slate-100 text-sm">{selectedEvent.title}</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Schedule Time</span>
                <span className="font-bold text-teal-600">{selectedEvent.date} · {selectedEvent.time}</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Location / Note</span>
                <p className="text-slate-600 dark:text-slate-300 font-medium">{selectedEvent.notes || 'Campus Medical Centre'}</p>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-400 py-8 text-center">Click any event from the schedule to inspect details.</p>
          )}
        </div>

      </div>

    </div>
  );
};
