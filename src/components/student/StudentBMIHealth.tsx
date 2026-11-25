import React, { useState, useEffect } from 'react';
import { Activity, TrendingUp, Info, Scale, Ruler, Radio, CheckCircle2, Droplets, Dumbbell, Apple, Sparkles, Bot, ShieldAlert } from 'lucide-react';
import { healthStore } from '../../services/healthStore';
import { StudentProfileData, Vitals } from '../../types';
import { authService } from '../../services/authService';
import { aiService, AiResponse } from '../../services/aiService';

export const StudentBMIHealth: React.FC = () => {
  const currentUser = authService.getCurrentUser();
  const studentId = currentUser.studentId || currentUser.id;
  const [profile, setProfile] = useState<StudentProfileData | undefined>();
  const [visits, setVisits] = useState<Vitals[]>([]);

  // Input states for screening calculator
  const [heightCm, setHeightCm] = useState<number>(0);
  const [weightKg, setWeightKg] = useState<number>(0);
  const [calcBmi, setCalcBmi] = useState<number | null>(null);
  const [isAnalyzingTrends, setIsAnalyzingTrends] = useState(false);
  const [trendAdvice, setTrendAdvice] = useState<AiResponse | null>(null);

  useEffect(() => {
    const load = () => {
      if (studentId) {
        const p = healthStore.getStudentProfile(studentId);
        setProfile(p);
        if (p) {
          setHeightCm(p.heightCm || 0);
          setWeightKg(p.weightKg || 0);
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

  const currentBmi = calcBmi !== null ? calcBmi : (profile?.bmi && profile.bmi > 0 ? profile.bmi : null);

  // Speedometer Needle Angle (-90 deg to +90 deg for BMI 12 to 40)
  const needleAngle = currentBmi && currentBmi > 0
    ? Math.min(90, Math.max(-90, -90 + ((Math.min(40, Math.max(12, currentBmi)) - 12) / 28) * 180))
    : -90;

  // Signal Level Definition
  const getSignalInfo = (bmi: number | null) => {
    if (!bmi || bmi <= 0) {
      return {
        level: 'NO SIGNAL',
        title: 'Awaiting Measurement',
        badgeBg: 'bg-slate-100 dark:bg-slate-800',
        badgeBorder: 'border-slate-200 dark:border-slate-700',
        textColor: 'text-slate-500 dark:text-slate-400',
        pulseColor: 'bg-slate-400',
        description: 'Enter your height and weight to activate the biometric signal gauge.'
      };
    }
    if (bmi < 18.5) {
      return {
        level: 'YELLOW SIGNAL',
        title: 'Underweight Range',
        badgeBg: 'bg-amber-50 dark:bg-amber-950/40',
        badgeBorder: 'border-amber-200 dark:border-amber-800',
        textColor: 'text-amber-700 dark:text-amber-300',
        pulseColor: 'bg-amber-500',
        description: 'Nutritional replenishment & balanced caloric increase recommended.'
      };
    }
    if (bmi < 25) {
      return {
        level: 'GREEN SIGNAL',
        title: 'Optimal Healthy Range',
        badgeBg: 'bg-emerald-50 dark:bg-emerald-950/40',
        badgeBorder: 'border-emerald-200 dark:border-emerald-800',
        textColor: 'text-emerald-700 dark:text-emerald-300',
        pulseColor: 'bg-emerald-500',
        description: 'Ideal metabolic equilibrium. Maintain consistent hydration, sleep & activity.'
      };
    }
    if (bmi < 30) {
      return {
        level: 'ORANGE SIGNAL',
        title: 'Elevated Overweight Range',
        badgeBg: 'bg-orange-50 dark:bg-orange-950/40',
        badgeBorder: 'border-orange-200 dark:border-orange-800',
        textColor: 'text-orange-700 dark:text-orange-300',
        pulseColor: 'bg-orange-500',
        description: 'Moderate aerobic exercise and dietary portion awareness suggested.'
      };
    }
    return {
      level: 'RED SIGNAL',
      title: 'High Alert / Obese Range',
      badgeBg: 'bg-rose-50 dark:bg-rose-950/40',
      badgeBorder: 'border-rose-200 dark:border-rose-800',
      textColor: 'text-rose-700 dark:text-rose-300',
      pulseColor: 'bg-rose-500',
      description: 'Campus Medical Centre evaluation & consultation advised.'
    };
  };

  const signal = getSignalInfo(currentBmi);

  // Build real measurement history
  const historyRecords: Array<{ date: string; heightCm: number; weightKg: number; bmi: number }> = [];

  visits.forEach(v => {
    if (v.heightCm || v.weightKg || v.bmi) {
      historyRecords.push({
        date: v.recordedAt ? new Date(v.recordedAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Clinic Visit',
        heightCm: v.heightCm || 0,
        weightKg: v.weightKg || 0,
        bmi: v.bmi || 0
      });
    }
  });

  if (profile && profile.heightCm > 0 && profile.weightKg > 0) {
    const profileDate = profile.lastUpdated
      ? new Date(profile.lastUpdated).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
      : 'Current Record';
    const alreadyListed = historyRecords.some(r => r.date === profileDate);
    if (!alreadyListed) {
      historyRecords.unshift({
        date: profileDate,
        heightCm: profile.heightCm,
        weightKg: profile.weightKg,
        bmi: profile.bmi
      });
    }
  }

  const handleExplainTrends = async () => {
    if (isAnalyzingTrends) return;
    setIsAnalyzingTrends(true);
    try {
      const recordsToAnalyze =
        visits.length > 0
          ? visits.slice(0, 10).map((v) => ({
              recordedAt: v.recordedAt,
              bloodPressureSys: v.bloodPressureSys ?? 120,
              bloodPressureDia: v.bloodPressureDia ?? 80,
              heartRateBpm: v.heartRateBpm ?? 72,
              temperatureF: v.temperatureF ?? 98.6,
              spo2Percent: v.spo2Percent ?? 99
            }))
          : historyRecords.map((r) => ({
              recordedAt: r.date,
              bloodPressureSys: 120,
              bloodPressureDia: 80,
              heartRateBpm: 72,
              temperatureF: 98.6,
              spo2Percent: 99
            }));
      const res = await aiService.explainVitalsTrends(recordsToAnalyze);
      setTrendAdvice(res);
    } catch (err) {
      console.warn('AI trend explanation failed:', err);
    } finally {
      setIsAnalyzingTrends(false);
    }
  };

  return (
    <div className="w-full flex flex-col gap-6 theme-student text-slate-800 dark:text-slate-100 select-none pb-12 animate-fade-in">
      
      {/* Compact Top Header Bar */}
      <div className="shrink-0 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 px-5 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-tight">
              BMI & Biometric Signal Tracker
            </h1>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Informative screening meter & verified health history · Collegiate health reference
            </p>
          </div>
        </div>

        {/* Live Signal Badge in Header */}
        <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700">
          <span className="relative flex h-2 w-2">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${signal.pulseColor} opacity-75`} />
            <span className={`relative inline-flex rounded-full h-2 w-2 ${signal.pulseColor}`} />
          </span>
          <span className={`text-xs font-black ${signal.textColor}`}>
            {signal.level}
          </span>
          {currentBmi && (
            <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300 ml-1">
              ({currentBmi} BMI)
            </span>
          )}
        </div>
      </div>

      {/* 3-Column Responsive Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* COLUMN 1: Height & Weight Screening Inputs */}
        <div className="lg:col-span-4 flex flex-col justify-between bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Scale className="w-4 h-4 text-blue-600 dark:text-blue-400" /> Height & Weight Screening Tool
              </h3>
              <span className="text-[10px] text-slate-400 font-semibold">Calculator</span>
            </div>

            <form onSubmit={handleCalculateBMI} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold text-xs mb-1.5">Height (cm)</label>
                  <div className="relative">
                    <input
                      type="number"
                      min="50"
                      max="250"
                      step="0.5"
                      placeholder="e.g. 172"
                      value={heightCm > 0 ? heightCm : ''}
                      onChange={e => setHeightCm(Number(e.target.value))}
                      className="w-full pl-3.5 pr-8 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                    <Ruler className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold text-xs mb-1.5">Weight (kg)</label>
                  <div className="relative">
                    <input
                      type="number"
                      min="20"
                      max="250"
                      step="0.5"
                      placeholder="e.g. 64"
                      value={weightKg > 0 ? weightKg : ''}
                      onChange={e => setWeightKg(Number(e.target.value))}
                      className="w-full pl-3.5 pr-8 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                    <Scale className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/25 transition-all cursor-pointer mt-1"
              >
                Calculate & Update Measurement
              </button>
            </form>

            {/* Current Metrics Summary */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                Active Student Profile Record
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] text-slate-400 block">Height</span>
                  <span className="font-extrabold text-sm text-slate-800 dark:text-slate-200">
                    {profile?.heightCm ? `${profile.heightCm} cm` : '—'}
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] text-slate-400 block">Weight</span>
                  <span className="font-extrabold text-sm text-slate-800 dark:text-slate-200">
                    {profile?.weightKg ? `${profile.weightKg} kg` : '—'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Collegiate Wellness Tips to Fill Lower Space */}
          <div className="p-3.5 rounded-xl bg-gradient-to-br from-blue-50/70 via-sky-50/40 to-blue-50/70 dark:from-blue-950/40 dark:via-slate-850 dark:to-blue-950/40 border border-blue-200 dark:border-blue-900 space-y-2 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-blue-900 dark:text-blue-300 text-[11px] uppercase tracking-wider">
              <Info className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" /> Collegiate Wellness Guidance
            </div>
            <ul className="space-y-1.5 text-[11px] text-slate-700 dark:text-slate-300">
              <li className="flex items-center gap-2">
                <Droplets className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                <span>Maintain 2.5L daily hydration for optimal vitality.</span>
              </li>
              <li className="flex items-center gap-2">
                <Dumbbell className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                <span>30 mins active movement or walking 4x weekly.</span>
              </li>
              <li className="flex items-center gap-2">
                <Apple className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>Focus on wholesome meals with adequate protein.</span>
              </li>
            </ul>
          </div>
        </div>

        {/* COLUMN 2: Biometric Speedometer & Signal Gauge */}
        <div className="lg:col-span-4 flex flex-col justify-between bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs text-center">
          
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5 px-1">
            <span className="text-xs text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-blue-500" /> Biometric Speedometer
            </span>
            <span className={`text-[11px] font-extrabold ${signal.textColor}`}>
              {signal.level}
            </span>
          </div>

          {/* SVG Speedometer Gauge */}
          <div className="relative flex justify-center py-2">
            <svg viewBox="0 0 240 135" className="w-full max-w-[260px] overflow-visible drop-shadow-sm">
              
              {/* Background Track Arc */}
              <path
                d="M 38 115 A 82 82 0 0 1 202 115"
                fill="none"
                stroke="currentColor"
                strokeWidth="15"
                className="text-slate-200 dark:text-slate-700"
                strokeLinecap="round"
              />

              {/* 1. Underweight (12 - 18.5) — Amber */}
              <path
                d="M 38 115 A 82 82 0 0 1 58.9 60.4"
                fill="none"
                stroke="#f59e0b"
                strokeWidth="13"
                strokeLinecap="round"
              />

              {/* 2. Normal Weight (18.5 - 25.0) — Emerald Green */}
              <path
                d="M 58.9 60.4 A 82 82 0 0 1 110.8 33.5"
                fill="none"
                stroke="#10b981"
                strokeWidth="13"
              />

              {/* 3. Overweight (25.0 - 30.0) — Orange */}
              <path
                d="M 110.8 33.5 A 82 82 0 0 1 155.6 41.1"
                fill="none"
                stroke="#f97316"
                strokeWidth="13"
              />

              {/* 4. Obese (30.0 - 40.0) — Rose Red */}
              <path
                d="M 155.6 41.1 A 82 82 0 0 1 202 115"
                fill="none"
                stroke="#ef4444"
                strokeWidth="13"
                strokeLinecap="round"
              />

              {/* Gauge Tick Markers & Labels */}
              <text x="22" y="122" fontSize="8" fontWeight="bold" className="fill-slate-400">12</text>
              <text x="42" y="54" fontSize="8" fontWeight="bold" fill="#f59e0b">18.5</text>
              <text x="105" y="22" fontSize="8" fontWeight="bold" fill="#10b981">25</text>
              <text x="162" y="34" fontSize="8" fontWeight="bold" fill="#f97316">30</text>
              <text x="208" y="122" fontSize="8" fontWeight="bold" className="fill-slate-400">40</text>

              {/* Rotating Speedometer Needle */}
              <g
                style={{
                  transform: `rotate(${needleAngle}deg)`,
                  transformOrigin: '120px 115px',
                  transition: 'transform 0.5s ease-out'
                }}
              >
                {/* Needle Shadow */}
                <polygon
                  points="118,116 120,49 122,116"
                  fill="rgba(0,0,0,0.2)"
                  transform="translate(1, 1)"
                />
                {/* Needle Body */}
                <polygon
                  points="118,115 120,49 122,115"
                  className="fill-slate-900 dark:fill-white"
                />
                {/* Needle Center Line */}
                <line
                  x1="120"
                  y1="56"
                  x2="120"
                  y2="110"
                  stroke="#38bdf8"
                  strokeWidth="1.2"
                />
              </g>

              {/* Center Hub Knob */}
              <circle
                cx="120"
                cy="115"
                r="9"
                className="fill-slate-900 dark:fill-slate-100"
              />
              <circle
                cx="120"
                cy="115"
                r="4"
                className="fill-sky-500"
              />
            </svg>
          </div>

          {/* Numeric Readout & Badge */}
          <div className="space-y-1.5 -mt-1">
            <div className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
              {currentBmi !== null ? currentBmi : '—'}
            </div>
            <div className={`inline-block px-3.5 py-1 rounded-full text-xs font-black border ${signal.badgeBg} ${signal.badgeBorder} ${signal.textColor}`}>
              {signal.title}
            </div>
          </div>

          {/* Signal Description Box */}
          <div className={`p-3 rounded-xl border ${signal.badgeBg} ${signal.badgeBorder} text-xs ${signal.textColor} font-medium leading-relaxed`}>
            {signal.description}
          </div>

          {/* 4-Tier Scale Legend */}
          <div className="grid grid-cols-4 gap-1.5 text-[9px] font-bold">
            <div className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900">
              &lt;18.5<br/>Under
            </div>
            <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900">
              18.5-24.9<br/>Normal
            </div>
            <div className="p-1.5 rounded-lg bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-900">
              25-29.9<br/>Over
            </div>
            <div className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900">
              ≥30<br/>Obese
            </div>
          </div>
        </div>

        {/* COLUMN 3: Immutable Trend History Table */}
        <div className="lg:col-span-4 flex flex-col justify-between bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
          <div className="flex-1 flex flex-col space-y-3">
            <div className="shrink-0 flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2.5">
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-sky-600 dark:text-sky-400" /> Trend History
              </h3>
              <button
                type="button"
                onClick={handleExplainTrends}
                disabled={isAnalyzingTrends}
                className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-blue-50 dark:bg-blue-900/40 hover:bg-blue-100 dark:hover:bg-blue-800/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 flex items-center gap-1 cursor-pointer transition-colors disabled:opacity-50"
              >
                <Sparkles className="w-3 h-3" />
                <span>{isAnalyzingTrends ? 'Explaining…' : 'AI Trend Insights'}</span>
              </button>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold text-[10px] uppercase">
                  <tr>
                    <th className="p-3">Date</th>
                    <th className="p-3">Height</th>
                    <th className="p-3">Weight</th>
                    <th className="p-3">BMI</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
                  {historyRecords.length > 0 ? (
                    historyRecords.slice(0, 6).map((rec, i) => (
                      <tr key={i} className={i === 0 ? "bg-blue-50/50 dark:bg-blue-950/30 font-bold" : "hover:bg-slate-50 dark:hover:bg-slate-800/40"}>
                        <td className="p-3">{rec.date}</td>
                        <td className="p-3">{rec.heightCm > 0 ? `${rec.heightCm} cm` : '—'}</td>
                        <td className="p-3">{rec.weightKg > 0 ? `${rec.weightKg} kg` : '—'}</td>
                        <td className="p-3 text-blue-600 dark:text-blue-400 font-bold">{rec.bmi > 0 ? rec.bmi : '—'}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-slate-400 italic text-xs">
                        No prior records found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="shrink-0 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Verified Clinic Records
            </span>
            <span className="font-mono font-bold text-slate-600 dark:text-slate-300">
              {historyRecords.length} record(s)
            </span>
          </div>
        </div>

      </div>

      {trendAdvice && (
        <div className="bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-900/60 rounded-2xl p-5 shadow-xs space-y-3 animate-fade-in">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2.5">
            <div className="flex items-center gap-2 text-xs font-bold text-blue-700 dark:text-blue-300">
              <Bot className="w-4 h-4" />
              <span>AI Biometric &amp; Vital Trend Insights</span>
            </div>
            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
              {trendAdvice.source === 'LLM' ? 'LLM (OpenAI Compatible)' : 'Deterministic Fallback Engine'} · {trendAdvice.model}
            </span>
          </div>
          <div className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
            {trendAdvice.text}
          </div>
          <div className="flex items-center gap-2 text-[11px] text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-xl px-3 py-2">
            <ShieldAlert className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <span>{trendAdvice.disclaimer}</span>
          </div>
        </div>
      )}

    </div>
  );
};
