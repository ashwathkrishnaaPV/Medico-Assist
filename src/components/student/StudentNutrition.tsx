import React, { useState, useEffect } from 'react';
import { Apple, ShieldCheck, CheckCircle2, AlertTriangle, Coffee, Sun, Utensils, Moon, Sparkles, Heart } from 'lucide-react';
import { healthStore } from '../../services/healthStore';
import { NutritionPlan } from '../../types';

import { authService } from '../../services/authService';

export const StudentNutrition: React.FC = () => {
  const currentUser = authService.getCurrentUser();
  const studentId = currentUser.studentId || currentUser.id;
  const [plan, setPlan] = useState<NutritionPlan | undefined>();

  useEffect(() => {
    const load = () => {
      if (studentId) {
        setPlan(healthStore.getNutritionPlanForStudent(studentId));
      }
    };

    load();
    const unsub = healthStore.subscribe(load);
    return () => unsub();
  }, [studentId]);

  if (!plan) {
    return (
      <div className="p-12 text-center text-slate-400 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
        <Apple className="w-12 h-12 mx-auto mb-3 text-emerald-400" />
        <h3 className="font-bold text-slate-700 dark:text-slate-200">No Nutrition Plan Published</h3>
        <p className="text-xs">Your medical centre doctor has not published a nutrition plan yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 theme-student animate-fade-in pb-12">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <Apple className="w-6 h-6 text-emerald-600" />
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Personalized Nutrition Plan</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Build healthy habits with clinician-approved daily fuel tailored for recovery and vitality.
          </p>
        </div>

        <div className={`px-4 py-2 rounded-2xl font-bold text-xs flex items-center gap-2 border ${
          plan.doctorApproved
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
            : 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800'
        }`}>
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>{plan.doctorApproved ? `Clinician Approved by ${plan.approvedBy || 'Doctor'}` : 'Pending Doctor Approval'}</span>
        </div>
      </div>

      {/* Goal & Microcopy Note */}
      <div className="card-wellness p-6 bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 dark:from-emerald-950/40 dark:via-teal-950/40 dark:to-emerald-950/40 space-y-2">
        <span className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-400">Nutritional Goal</span>
        <h3 className="font-extrabold text-base text-slate-800 dark:text-slate-100">{plan.goal}</h3>
        <p className="text-xs text-slate-600 dark:text-slate-300 italic">{plan.encouragingNotes}</p>
      </div>

      {/* Daily Meals Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Breakfast */}
        <div className="card-wellness p-5 space-y-3">
          <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-bold text-sm">
            <Coffee className="w-5 h-5" />
            <span>Breakfast Options</span>
          </div>
          <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
            {plan.meals.breakfast.map((m, i) => (
              <li key={i} className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>{m}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Mid-Morning */}
        <div className="card-wellness p-5 space-y-3">
          <div className="flex items-center gap-2 text-orange-700 dark:text-orange-400 font-bold text-sm">
            <Sun className="w-5 h-5" />
            <span>Mid-Morning Boost</span>
          </div>
          <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
            {plan.meals.midMorning.map((m, i) => (
              <li key={i} className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>{m}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Lunch */}
        <div className="card-wellness p-5 space-y-3">
          <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold text-sm">
            <Utensils className="w-5 h-5" />
            <span>Nourishing Lunch</span>
          </div>
          <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
            {plan.meals.lunch.map((m, i) => (
              <li key={i} className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>{m}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Dinner */}
        <div className="card-wellness p-5 space-y-3">
          <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-400 font-bold text-sm">
            <Moon className="w-5 h-5" />
            <span>Restorative Dinner</span>
          </div>
          <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
            {plan.meals.dinner.map((m, i) => (
              <li key={i} className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>{m}</span>
              </li>
            ))}
          </ul>
        </div>

      </div>

      {/* Foods to Limit */}
      <div className="p-5 rounded-3xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 space-y-3">
        <h4 className="font-bold text-xs uppercase text-rose-800 dark:text-rose-300 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-600" /> Foods & Beverages to Limit or Avoid (Clinician Guidance)
        </h4>
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-rose-950 dark:text-rose-200">
          {plan.foodsToLimit.map((item, idx) => (
            <li key={idx} className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

    </div>
  );
};
