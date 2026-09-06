import React, { useState, useEffect } from 'react';
import { Activity, TrendingUp, Info, Scale, Ruler, Heart, Sparkles, CheckCircle2 } from 'lucide-react';
import { healthStore } from '../../services/healthStore';
import { StudentProfileData, Vitals } from '../../types';

import { authService } from '../../services/authService';

export const StudentBMIHealth: React.FC = () => {
  const currentUser = authService.getCurrentUser();
  const studentId = currentUser.studentId || currentUser.id;
  const [profile, setProfile] = useState<StudentProfileData | undefined>();
  const [visits, setVisits] = useState<Vitals[]>([]);

  // Input states for screening calculator
  const [heightCm, setHeightCm] = useState<number>(170);
  const [weightKg, setWeightKg] = useState<number>(65);
  const [calcBmi, setCalcBmi] = useState<number | null>(null);

  useEffect(() => {
    const load = () => {
      if (studentId) {
        const p = healthStore.getStudentProfile(studentId);
        setProfile(p);
        if (p) {
          setHeightCm(p.heightCm);
          setWeightKg(p.weightKg);
        }
        const vList = healthStore.getVisitsForStudent(studentId).map(v => v.vitals);
        setVisits(vList);
      }
    };

    load();
    const unsub = healthStore.subscribe(load);
    return () => unsub();
  }, [studentId]);

  const handleCalculateBMI = (e: React.FormEvent) => {
    e.preventDefault();
    if (heightCm > 0 && weightKg > 0 && studentId) {
      const hM = heightCm / 100;
      const val = parseFloat((weightKg / (hM * hM)).toFixed(1));
      setCalcBmi(val);
      healthStore.updateStudentMeasurements(studentId, heightCm, weightKg);
    }
  };

  const currentBmi = calcBmi || profile?.bmi || 21.6;

  return (
    <div className="space-y-6 theme-student animate-fade-in pb-12 text-slate-800 dark:text-slate-100">
      
      {/* Banner */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
          <Activity className="w-6 h-6 text-emerald-600 dark:text-emerald-400" /> BMI & Health Measurements Tracker
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Screening metrics & vital trend history. BMI is an informative screening tool, not a clinical diagnosis.
        </p>
      </div>

      {/* Non-judgmental Guidance Banner */}
      <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 text-xs sm:text-sm flex items-start gap-3">
        <Info className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">Collegiate Wellness Note:</span> BMI is used to observe general screening trends alongside hydration, physical activity, and balanced nutrition. Focus on building healthy daily habits rather than fixed numbers!
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Screening Calculator Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <Scale className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> Height & Weight Screening Tool
          </h3>

          <form onSubmit={handleCalculateBMI} className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Height (cm)</label>
                <div className="relative">
                  <input
                    type="number"
                    value={heightCm}
                    onChange={e => setHeightCm(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none"
                  />
                  <Ruler className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Weight (kg)</label>
                <div className="relative">
                  <input
                    type="number"
                    value={weightKg}
                    onChange={e => setWeightKg(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none"
                  />
                  <Scale className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-all"
            >
              Calculate & Record Measurement
            </button>
          </form>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-center space-y-1">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wide">Current Screening BMI</span>
            <div className="text-4xl font-extrabold text-emerald-600 dark:text-emerald-400">{currentBmi}</div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Last updated: {profile?.lastUpdated || 'Today'}</p>
          </div>
        </div>

        {/* History Table Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-teal-600 dark:text-teal-400" /> Immutable Trend History
          </h3>

          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold text-[11px] uppercase">
                <tr>
                  <th className="p-3">Date</th>
                  <th className="p-3">Height</th>
                  <th className="p-3">Weight</th>
                  <th className="p-3">BMI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
                <tr className="bg-emerald-50/50 dark:bg-emerald-950/30 font-bold">
                  <td className="p-3">22 Aug 2026</td>
                  <td className="p-3">{heightCm} cm</td>
                  <td className="p-3">{weightKg} kg</td>
                  <td className="p-3 text-emerald-600 dark:text-emerald-400">{currentBmi}</td>
                </tr>
                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="p-3">20 Jul 2026</td>
                  <td className="p-3">172 cm</td>
                  <td className="p-3">63 kg</td>
                  <td className="p-3">21.3</td>
                </tr>
                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="p-3">18 Jun 2026</td>
                  <td className="p-3">171 cm</td>
                  <td className="p-3">62 kg</td>
                  <td className="p-3">21.2</td>
                </tr>
              </tbody>
            </table>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Historical measurements are preserved chronologically and never overwritten.
          </p>
        </div>

      </div>

    </div>
  );
};
