import React, { useState, useEffect } from 'react';
import { CheckSquare, CheckCircle2, Send } from 'lucide-react';
import { healthStore } from '../../services/healthStore';
import { DailyMonitoringPlan, DailyMonitoringResponse } from '../../types';

import { authService } from '../../services/authService';

export const StudentDailyCheck: React.FC = () => {
  const currentUser = authService.getCurrentUser();
  const studentId = currentUser.studentId || currentUser.id;
  const [monitoringPlan, setMonitoringPlan] = useState<DailyMonitoringPlan | undefined>();
  const [responses, setResponses] = useState<DailyMonitoringResponse[]>([]);
  const [feeling, setFeeling] = useState<'Better' | 'Same' | 'Worse'>('Better');
  const [improving, setImproving] = useState<boolean>(true);
  const [newSymptoms, setNewSymptoms] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<string>('');
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [editing, setEditing] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    const load = () => {
      if (studentId) {
        setMonitoringPlan(healthStore.getMonitoringPlan(studentId));
        setResponses(healthStore.getMonitoringResponses(studentId));
      }
    };

    load();
    const unsub = healthStore.subscribe(load);
    return () => unsub();
  }, [studentId]);

  const todayStr = new Date().toISOString().split('T')[0];
  const alreadySubmittedToday = responses.some(r => r.date === todayStr);
  const isCompleted = (submitted || alreadySubmittedToday) && !editing;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await healthStore.submitDailyResponse(studentId, {
        studentId,
        date: todayStr,
        feeling,
        symptomsImproving: improving,
        newSymptoms,
        studentFeedback: feedback
      });
      setSubmitted(true);
      setEditing(false);
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to record check-in.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 theme-student animate-fade-in pb-12 text-slate-800 dark:text-slate-100">
      
      {/* Banner */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
          <CheckSquare className="w-6 h-6 text-blue-600 dark:text-blue-400" /> Daily Health Check Questionnaire
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Direct progress monitoring relay to your campus medical centre.
        </p>
      </div>

      {monitoringPlan ? (
        <div className="p-5 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border-2 border-blue-300 dark:border-blue-800 space-y-3 text-blue-900 dark:text-blue-200">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-sm">
            <div>
              <span className="font-bold">Active Monitoring:</span> {monitoringPlan.conditionName}
              <p className="text-xs text-blue-700 dark:text-blue-300 mt-0.5">
                Day {monitoringPlan.currentDay} of {monitoringPlan.durationDays} · Initiated by {monitoringPlan.createdBy}
              </p>
            </div>
            <span className="px-3 py-1 bg-blue-600 text-white font-bold rounded-full text-xs shadow-xs tracking-wider">
              DAY {monitoringPlan.currentDay} OF {monitoringPlan.durationDays}
            </span>
          </div>

          {/* Day Progress Tracker */}
          <div className="pt-2 border-t border-blue-200 dark:border-blue-900/60">
            <div className="flex items-center gap-1.5 flex-wrap">
              {Array.from({ length: monitoringPlan.durationDays }, (_, i) => {
                const dayNum = i + 1;
                const isCompletedDay = dayNum < monitoringPlan.currentDay || (dayNum === monitoringPlan.currentDay && alreadySubmittedToday);
                const isCurrentActiveDay = dayNum === monitoringPlan.currentDay && !alreadySubmittedToday;
                return (
                  <div
                    key={dayNum}
                    className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 border transition-all ${
                      isCompletedDay
                        ? 'bg-[#1A3D63] text-white border-[#1A3D63] shadow-xs'
                        : isCurrentActiveDay
                        ? 'bg-amber-500 text-white border-amber-500 animate-pulse shadow-xs'
                        : 'bg-white/80 dark:bg-slate-800 text-slate-400 border-slate-300 dark:border-slate-700'
                    }`}
                  >
                    {isCompletedDay ? '✓ ' : ''}Day {dayNum}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium">
          General daily health check-in mode.
        </div>
      )}

      {isCompleted ? (
        <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-3xl border-2 border-[#B3CFE5] shadow-sm space-y-4 animate-fade-in">
          <div className="w-14 h-14 mx-auto rounded-full bg-[#B3CFE5]/30 text-[#1A3D63] flex items-center justify-center shadow-inner">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h3 className="font-bold text-xl text-[#0A1931] dark:text-white">Today's Health Check Completed!</h3>
          <p className="text-sm text-[#4A7FA7] max-w-md mx-auto leading-relaxed">
            Your daily monitoring response for <strong>Day {monitoringPlan?.currentDay || 1} of {monitoringPlan?.durationDays || 3}</strong> has been logged and forwarded to your medical team. You are all set for today.
          </p>
          <button
            onClick={() => setEditing(true)}
            className="px-6 py-2.5 rounded-full bg-white dark:bg-slate-800 border-2 border-[#B3CFE5] text-xs font-bold text-[#1A3D63] dark:text-slate-200 hover:bg-[#B3CFE5]/20 transition-all cursor-pointer shadow-xs"
          >
            Update Today's Response
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-6 shadow-sm">
          
          {/* Question 1 */}
          <div className="space-y-2">
            <label className="block text-sm font-bold text-slate-900 dark:text-white">
              1. How are you feeling today compared to yesterday?
            </label>
            <div className="grid grid-cols-3 gap-3">
              {(['Better', 'Same', 'Worse'] as const).map(option => (
                <button
                  type="button"
                  key={option}
                  onClick={() => setFeeling(option)}
                  className={`py-3 rounded-xl font-bold text-sm border-2 transition-all ${
                    feeling === option
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:border-blue-400'
                  }`}
                >
                  {option === 'Better' ? '😊 Better' : option === 'Same' ? '😐 Same' : '😟 Worse'}
                </button>
              ))}
            </div>
          </div>

          {/* Question 2 */}
          <div className="space-y-2">
            <label className="block text-sm font-bold text-slate-900 dark:text-white">
              2. Are your primary symptoms improving?
            </label>
            <div className="flex flex-col sm:flex-row gap-4">
              <label className="flex items-center gap-2.5 text-sm font-semibold text-slate-800 dark:text-slate-200 cursor-pointer">
                <input type="radio" name="improving" checked={improving === true} onChange={() => setImproving(true)} className="w-4 h-4 accent-blue-600" />
                Yes, symptoms are lessening
              </label>
              <label className="flex items-center gap-2.5 text-sm font-semibold text-slate-800 dark:text-slate-200 cursor-pointer">
                <input type="radio" name="improving" checked={improving === false} onChange={() => setImproving(false)} className="w-4 h-4 accent-blue-600" />
                No, symptoms persist or feel unchanged
              </label>
            </div>
          </div>

          {/* Question 3 */}
          <div className="space-y-2">
            <label className="block text-sm font-bold text-slate-900 dark:text-white">
              3. Any new or worsening symptoms (e.g. fever, acute cough, headache)?
            </label>
            <div className="flex flex-col sm:flex-row gap-4">
              <label className="flex items-center gap-2.5 text-sm font-semibold text-slate-800 dark:text-slate-200 cursor-pointer">
                <input type="radio" name="newSymptoms" checked={newSymptoms === false} onChange={() => setNewSymptoms(false)} className="w-4 h-4 accent-blue-600" />
                No new symptoms
              </label>
              <label className="flex items-center gap-2.5 text-sm font-semibold text-slate-800 dark:text-slate-200 cursor-pointer">
                <input type="radio" name="newSymptoms" checked={newSymptoms === true} onChange={() => setNewSymptoms(true)} className="w-4 h-4 accent-blue-600" />
                Yes, I have new symptoms
              </label>
            </div>
          </div>

          {/* Feedback */}
          <div className="space-y-1.5">
            <label className="block text-sm font-bold text-slate-900 dark:text-white">
              4. Anything specific you would like the medical centre doctor to know?
            </label>
            <textarea
              rows={3}
              value={feedback}
              onChange={e => setFeedback(e.target.value)}
              placeholder="e.g. Coughing is much lighter today after taking morning tea..."
              className="w-full p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-blue-500 focus:outline-none"
            />
          </div>

          {submitError && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-bold">
              {submitError}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-60"
          >
            <Send className="w-4 h-4" /> {isSubmitting ? 'Recording Check-in…' : `Submit Day ${monitoringPlan?.currentDay || 1} Check`}
          </button>

        </form>
      )}

      {/* History of Responses */}
      <div className="space-y-3">
        <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">Previous Daily Log Responses</h3>
        <div className="space-y-2">
          {responses.map(r => (
            <div key={r.id} className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm text-sm flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-900 dark:text-white">{r.date}</span>
                <span className="ml-2 text-slate-600 dark:text-slate-400">Feeling: <span className="font-semibold text-slate-800 dark:text-slate-200">{r.feeling}</span></span>
                {r.studentFeedback && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">"{r.studentFeedback}"</p>
                )}
              </div>
              <span className={`px-2.5 py-1 rounded-md font-bold text-xs border ${
                r.status === 'Improving'
                  ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-800'
                  : 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800'
              }`}>
                {r.status}
              </span>
            </div>
          ))}
          {responses.length === 0 && (
            <p className="text-sm text-slate-400 py-4 text-center">No previous responses recorded.</p>
          )}
        </div>
      </div>

    </div>
  );
};
