import React, { useState } from 'react';
import {
  Stethoscope,
  Pill,
  CheckSquare,
  ShieldAlert,
  Apple,
  Calendar,
  Clock,
  User,
  Filter,
  ArrowUpRight
} from 'lucide-react';
import { HealthTimelineEvent } from '../../types';

interface StudentHealthTimelineProps {
  events: HealthTimelineEvent[];
  studentName?: string;
  studentId?: string;
}

export const StudentHealthTimeline: React.FC<StudentHealthTimelineProps> = ({
  events,
  studentName,
  studentId
}) => {
  const [filterType, setFilterType] = useState<string>('ALL');

  const filteredEvents = events.filter(e => {
    if (filterType === 'ALL') return true;
    if (filterType === 'VISIT') return e.type === 'VISIT';
    if (filterType === 'PRESCRIPTION') return e.type.startsWith('PRESCRIPTION');
    if (filterType === 'MONITORING') return e.type === 'DAILY_MONITORING';
    if (filterType === 'EMERGENCY') return e.type === 'EMERGENCY_ACCESS';
    return true;
  });

  const getEventIcon = (type: HealthTimelineEvent['type']) => {
    switch (type) {
      case 'VISIT':
        return <Stethoscope className="w-4 h-4 text-teal-600 dark:text-teal-400" />;
      case 'PRESCRIPTION_V1':
      case 'PRESCRIPTION_MODIFIED':
        return <Pill className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />;
      case 'DAILY_MONITORING':
        return <CheckSquare className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
      case 'EMERGENCY_ACCESS':
        return <ShieldAlert className="w-4 h-4 text-rose-600 dark:text-rose-400" />;
      case 'NUTRITION':
        return <Apple className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
      default:
        return <Calendar className="w-4 h-4 text-slate-600 dark:text-slate-400" />;
    }
  };

  const getEventBadgeClass = (type: HealthTimelineEvent['type'], severity?: string) => {
    if (type === 'EMERGENCY_ACCESS') return 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-300';
    if (severity === 'URGENT') return 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-300';
    if (severity === 'HIGH') return 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300';
    if (type.startsWith('PRESCRIPTION')) return 'bg-indigo-50 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-200';
    if (type === 'VISIT') return 'bg-teal-50 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300 border-teal-200';
    return 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200';
  };

  return (
    <div className="space-y-4">
      {/* Timeline Controls & Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div>
          <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            Longitudinal Health Timeline
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {studentName ? `${studentName} (${studentId})` : 'Comprehensive chronological health event stream'}
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {[
            { id: 'ALL', label: 'All Records' },
            { id: 'VISIT', label: 'Consultations' },
            { id: 'PRESCRIPTION', label: 'Prescriptions' },
            { id: 'MONITORING', label: 'Daily Logs' },
            { id: 'EMERGENCY', label: 'Emergency Audits' }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFilterType(f.id)}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                filterType === f.id
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Events List */}
      {filteredEvents.length === 0 ? (
        <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 text-slate-500 text-xs">
          No chronological health events recorded for this category yet.
        </div>
      ) : (
        <div className="relative pl-6 space-y-6 before:content-[''] before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
          {filteredEvents.map(event => (
            <div key={event.id} className="relative group">
              {/* Dot Icon */}
              <div className="absolute -left-6 top-1 w-5 h-5 rounded-full bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-700 flex items-center justify-center group-hover:border-emerald-500 transition-colors">
                <div className="w-2 h-2 rounded-full bg-slate-400 group-hover:bg-emerald-500" />
              </div>

              {/* Event Card */}
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800">
                      {getEventIcon(event.type)}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white leading-tight">
                        {event.title}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {event.subtitle}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    {event.badge && (
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md border ${getEventBadgeClass(event.type, event.severity)}`}>
                        {event.badge}
                      </span>
                    )}
                    <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {event.date} {event.time ? `· ${event.time}` : ''}
                    </span>
                  </div>
                </div>

                {event.details && (
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs text-slate-600 dark:text-slate-300 leading-relaxed border border-slate-100 dark:border-slate-800/80">
                    {event.details}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
