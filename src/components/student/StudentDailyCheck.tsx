import React, { useState, useEffect } from 'react';
import { CheckSquare, Activity, CheckCircle2, AlertTriangle, Send, Sparkles } from 'lucide-react';
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (studentId) {
      healthStore.submitDailyResponse(studentId, {
        studentId,
        date: new Date().toISOString().split('T')[0],
        feeling,
        symptomsImproving: improving,
        newSymptoms,
        studentFeedback: feedback
      });
      setSubmitted(true);
    }
  };

  return (
    <div className="space-y-6 theme-student animate-fade-in pb-12 text-slate-800 dark:text-slate-100">
      
      {/* Banner */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
          <CheckSquare className="w-6 h-6 text-emerald-600 dark:text-emerald-400" /> Daily Health Check Questionnaire
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Direct progress monitoring relay to your campus medical centre.
        </p>
      </div>

      {monitoringPlan ? (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-sm text-emerald-900 dark:text-emerald-200">
          <div>
            <span className="font-bold">Active Monitoring:</span> {monitoringPlan.conditionName}
            <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-0.5">
              Day {monitoringPlan.currentDay} of {monitoringPlan.durationDays} · Initiated by {monitoringPlan.createdBy}
            </p>
          </div>
          <span className="px-2.5 py-1 bg-emerald-600 text-white font-bold rounded-lg text-xs shadow-xs">
            ACTIVE MONITORING
          </span>
        </div>
      ) : (
        <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium">
          General daily health check-in mode.
        </div>
      )}

      {submitted ? (
        <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-emerald-300 dark:border-emerald-800 shadow-sm space-y-3">
          <div className="w-12 h-12 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h3 className="font-bold text-lg text-slate-900 dark:text-white">Thank You! Today's Check Received.</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            Your response has been transmitted to Dr. Sarah Jenkins & the Medical Centre triage desk.
          </p>
          <button
            onClick={() => setSubmitted(false)}
            className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-sm font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
          >
            Submit Another Update
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
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:border-emerald-400'
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
                <input type="radio" name="improving" checked={improving === true} onChange={() => setImproving(true)} className="w-4 h-4 accent-emerald-600" />
                Yes, symptoms are lessening
              </label>
              <label className="flex items-center gap-2.5 text-sm font-semibold text-slate-800 dark:text-slate-200 cursor-pointer">
                <input type="radio" name="improving" checked={improving === false} onChange={() => setImproving(false)} className="w-4 h-4 accent-emerald-600" />
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
                <input type="radio" name="newSymptoms" checked={newSymptoms === false} onChange={() => setNewSymptoms(false)} className="w-4 h-4 accent-emerald-600" />
                No new symptoms
              </label>
              <label className="flex items-center gap-2.5 text-sm font-semibold text-slate-800 dark:text-slate-200 cursor-pointer">
                <input type="radio" name="newSymptoms" checked={newSymptoms === true} onChange={() => setNewSymptoms(true)} className="w-4 h-4 accent-emerald-600" />
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
              className="w-full p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-sm flex items-center justify-center gap-2 transition-all"
          >
            <Send className="w-4 h-4" /> Submit Today's Check
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
                  ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
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
