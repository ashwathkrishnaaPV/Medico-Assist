import React, { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight, X, Clock } from 'lucide-react';

interface FollowUpDatePickerProps {
  value: string; // Stored as YYYY-MM-DD
  onChange: (dateStr: string) => void;
  label?: string;
  placeholder?: string;
  accentColor?: 'purple' | 'sky';
  className?: string;
}

export const FollowUpDatePicker: React.FC<FollowUpDatePickerProps> = ({
  value,
  onChange,
  label = 'Follow-up Consultation Date (Optional)',
  placeholder = 'dd-mm-yyyy',
  accentColor = 'purple',
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize view month to selected date or today
  const [viewDate, setViewDate] = useState<Date>(() => {
    if (value && value.includes('-')) {
      const parts = value.split('-');
      if (parts.length === 3) {
        return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      }
    }
    return new Date();
  });

  // Sync viewDate when value changes externally
  const [prevValue, setPrevValue] = useState(value);
  if (value !== prevValue) {
    setPrevValue(value);
    if (value && value.includes('-')) {
      const parts = value.split('-');
      if (parts.length === 3) {
        setViewDate(new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10)));
      }
    }
  }

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);

  // Format value into dd-mm-yyyy for display
  const formatDisplay = (isoStr: string): string => {
    if (!isoStr || !isoStr.includes('-')) return '';
    const parts = isoStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`; // dd-mm-yyyy
    }
    return isoStr;
  };

  const toIsoDate = (d: Date): string => {
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  };

  const currentYear = viewDate.getFullYear();
  const currentMonth = viewDate.getMonth();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const daysOfWeek = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  // Calculate days for the calendar grid
  const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setViewDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setViewDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const handleSelectDay = (day: number) => {
    const selected = new Date(currentYear, currentMonth, day);
    onChange(toIsoDate(selected));
    setIsOpen(false);
  };

  const handleQuickAddDays = (days: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const target = new Date();
    target.setDate(target.getDate() + days);
    onChange(toIsoDate(target));
    setViewDate(target);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setIsOpen(false);
  };

  // Determine today string
  const today = new Date();
  const todayIso = toIsoDate(today);

  const isSelected = (day: number) => {
    if (!value) return false;
    const check = `${currentYear}-${pad(currentMonth + 1)}-${pad(day)}`;
    return check === value;
  };

  const isToday = (day: number) => {
    const check = `${currentYear}-${pad(currentMonth + 1)}-${pad(day)}`;
    return check === todayIso;
  };

  const isPast = (day: number) => {
    const check = new Date(currentYear, currentMonth, day);
    const t = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    return check < t;
  };

  const isSky = accentColor === 'sky';

  return (
    <div ref={containerRef} className={`relative space-y-1 ${className}`}>
      {label && (
        <label
          onClick={() => setIsOpen(!isOpen)}
          className={`text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center justify-between cursor-pointer select-none`}
        >
          <span className="flex items-center gap-1.5">
            <Calendar className={`w-3.5 h-3.5 ${isSky ? 'text-sky-600' : 'text-purple-600'}`} />
            {label}
          </span>
          <span className={`text-[10px] font-extrabold ${isSky ? 'text-sky-600' : 'text-purple-600'}`}>
            dd-mm-yyyy
          </span>
        </label>
      )}

      {/* Input Field Display */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer select-none ${
          isOpen
            ? isSky
              ? 'border-sky-500 ring-2 ring-sky-500/20 bg-white dark:bg-slate-800'
              : 'border-purple-500 ring-2 ring-purple-500/20 bg-white dark:bg-slate-800'
            : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600'
        }`}
      >
        <div className="flex items-center gap-2">
          <Calendar
            className={`w-4 h-4 shrink-0 ${
              value ? (isSky ? 'text-sky-600' : 'text-purple-600') : 'text-slate-400'
            }`}
          />
          {value ? (
            <span className="text-xs font-extrabold text-slate-800 dark:text-slate-100 tracking-wide font-mono">
              {formatDisplay(value)}
            </span>
          ) : (
            <span className="text-xs font-medium text-slate-400 dark:text-slate-500">
              {placeholder}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {value && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 text-slate-400 hover:text-rose-500 rounded-md transition-colors"
              title="Clear date"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
              isSky
                ? 'bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300'
                : 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300'
            }`}
          >
            {isOpen ? 'Close' : 'Show Calendar'}
          </span>
        </div>
      </div>

      {/* Interactive Calendar Popover */}
      {isOpen && (
        <div className="absolute z-50 left-0 mt-2 w-72 sm:w-80 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl space-y-3 animate-fade-in">
          {/* Header Month / Year Navigation */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
              title="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="text-xs font-extrabold text-slate-800 dark:text-slate-100">
              {monthNames[currentMonth]} {currentYear}
            </span>

            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
              title="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Preset Buttons */}
          <div className="flex flex-wrap gap-1 pb-1">
            <button
              type="button"
              onClick={e => handleQuickAddDays(0, e)}
              className="px-2 py-1 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 transition-colors"
            >
              Today
            </button>
            <button
              type="button"
              onClick={e => handleQuickAddDays(3, e)}
              className="px-2 py-1 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 transition-colors"
            >
              +3 Days
            </button>
            <button
              type="button"
              onClick={e => handleQuickAddDays(5, e)}
              className="px-2 py-1 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 transition-colors"
            >
              +5 Days
            </button>
            <button
              type="button"
              onClick={e => handleQuickAddDays(7, e)}
              className={`px-2 py-1 rounded-md text-[10px] font-bold transition-colors ${
                isSky
                  ? 'bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 hover:bg-sky-200'
                  : 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 hover:bg-purple-200'
              }`}
            >
              +1 Week
            </button>
            <button
              type="button"
              onClick={e => handleQuickAddDays(14, e)}
              className="px-2 py-1 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 transition-colors"
            >
              +2 Weeks
            </button>
          </div>

          {/* Days of Week Header */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {daysOfWeek.map((day, idx) => (
              <span
                key={day}
                className={`text-[10px] font-bold ${
                  idx === 0 || idx === 6
                    ? 'text-rose-500'
                    : 'text-slate-400 dark:text-slate-500'
                }`}
              >
                {day}
              </span>
            ))}
          </div>

          {/* Calendar Day Grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Previous month trailing days */}
            {Array.from({ length: firstDayOfWeek }).map((_, idx) => {
              const prevMonthDay = daysInPrevMonth - firstDayOfWeek + idx + 1;
              return (
                <div
                  key={`prev-${idx}`}
                  className="h-8 flex items-center justify-center text-[11px] text-slate-300 dark:text-slate-700 select-none"
                >
                  {prevMonthDay}
                </div>
              );
            })}

            {/* Current month days */}
            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const day = idx + 1;
              const selected = isSelected(day);
              const todayMark = isToday(day);
              const past = isPast(day);

              return (
                <button
                  key={`day-${day}`}
                  type="button"
                  onClick={() => handleSelectDay(day)}
                  className={`h-8 rounded-lg text-xs font-bold transition-all flex items-center justify-center relative cursor-pointer ${
                    selected
                      ? isSky
                        ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
                        : 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                      : todayMark
                      ? isSky
                        ? 'border border-sky-500 text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/40'
                        : 'border border-purple-500 text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40'
                      : past
                      ? 'text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                      : 'text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {day}
                  {todayMark && !selected && (
                    <span
                      className={`absolute bottom-0.5 w-1 h-1 rounded-full ${
                        isSky ? 'bg-sky-600' : 'bg-purple-600'
                      }`}
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Footer with format confirmation */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
            <span className="text-slate-400 flex items-center gap-1">
              <Clock className="w-3 h-3" /> Format: <strong className="text-slate-600 dark:text-slate-300">dd-mm-yyyy</strong>
            </span>
            {value && (
              <button
                type="button"
                onClick={handleClear}
                className="text-rose-500 hover:text-rose-600 font-bold transition-colors"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
