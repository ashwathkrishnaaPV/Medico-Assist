import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Clock } from 'lucide-react';
import { healthStore } from '../../services/healthStore';
import { HealthCalendarEvent } from '../../types';

export const MedicalCalendar: React.FC = () => {
  const [events, setEvents] = useState<HealthCalendarEvent[]>([]);

  useEffect(() => {
    const load = () => {
      setEvents(healthStore.getCalendarEvents());
    };

    load();
    const unsub = healthStore.subscribe(load);
    return () => unsub();
  }, []);

  return (
    <div className="space-y-6 theme-medical animate-fade-in pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-6 h-6 text-sky-600" />
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Medical Centre Clinic Schedule</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Doctor consultation appointments, follow-up slots, and lab test schedules.
          </p>
        </div>
      </div>

      {/* Events Roster */}
      <div className="card-clinical p-6 space-y-4">
        <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <Clock className="w-4 h-4 text-sky-600" /> Clinic Appointments Ledger
        </h3>

        {events.length === 0 ? (
          <p className="text-xs text-slate-400 py-4">No clinic appointments or follow-ups scheduled in database.</p>
        ) : (
          <div className="space-y-3">
            {events.map(ev => (
              <div key={ev.id} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-xs flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-100 text-sm">
                    <span>{ev.title}</span>
                    <span className="px-2 py-0.5 rounded-md bg-sky-100 text-sky-800 text-[10px] font-bold">
                      {ev.eventType}
                    </span>
                  </div>
                  <div className="text-sky-600 font-semibold">{ev.date} at {ev.time}</div>
                  {ev.notes && <p className="text-slate-400 italic text-[11px]">{ev.notes}</p>}
                </div>

                <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold ${
                  ev.status === 'Completed' ? 'bg-slate-200 text-slate-700' : 'bg-sky-600 text-white'
                }`}>
                  {ev.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
