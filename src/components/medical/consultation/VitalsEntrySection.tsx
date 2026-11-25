import React from 'react';
import { Activity } from 'lucide-react';
import { Vitals } from '../../../types';

interface VitalsEntrySectionProps {
  bpSys: number;
  setBpSys: (val: number) => void;
  bpDia: number;
  setBpDia: (val: number) => void;
  hrBpm: number;
  setHrBpm: (val: number) => void;
  spo2: number;
  setSpo2: (val: number) => void;
  heightCm: number;
  setHeightCm: (val: number) => void;
  weightKg: number;
  setWeightKg: (val: number) => void;
  tempF: number;
  setTempF: (val: number) => void;
  prevVitalsLatest: Vitals | null;
}

const preventNonNumeric = (e: React.KeyboardEvent<HTMLInputElement>) => {
  if (e.key === '-' || e.key === '+' || e.key === 'e') {
    e.preventDefault();
  }
};

export const VitalsEntrySection: React.FC<VitalsEntrySectionProps> = ({
  bpSys,
  setBpSys,
  bpDia,
  setBpDia,
  hrBpm,
  setHrBpm,
  spo2,
  setSpo2,
  heightCm,
  setHeightCm,
  weightKg,
  setWeightKg,
  tempF,
  setTempF,
  prevVitalsLatest
}) => {
  return (
    <div className="card-clinical p-6 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
        <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <Activity className="w-4 h-4 text-sky-600" /> Vitals Recording (Side-by-Side History Comparison)
        </h3>
        <span className="text-[10px] text-sky-600 font-bold uppercase bg-sky-50 dark:bg-sky-950 px-2 py-0.5 rounded-md">
          EHR Rule: Previous Vitals Preserved
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
        {/* BP Entry with side-by-side previous */}
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-2">
          <span className="font-bold text-slate-700 dark:text-slate-300 block">Blood Pressure (mmHg)</span>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              min="0"
              placeholder="Sys"
              value={bpSys || ''}
              onKeyDown={preventNonNumeric}
              onChange={(e) => setBpSys(Math.max(0, Number(e.target.value)))}
              className="p-2 rounded-lg bg-white dark:bg-slate-600 border border-slate-300 dark:border-slate-500 font-bold text-slate-900 dark:text-white"
            />
            <input
              type="number"
              min="0"
              placeholder="Dia"
              value={bpDia || ''}
              onKeyDown={preventNonNumeric}
              onChange={(e) => setBpDia(Math.max(0, Number(e.target.value)))}
              className="p-2 rounded-lg bg-white dark:bg-slate-600 border border-slate-300 dark:border-slate-500 font-bold text-slate-900 dark:text-white"
            />
          </div>
          <div className="p-2 rounded-lg bg-sky-50/60 dark:bg-sky-950/40 text-[10px] text-sky-800 dark:text-sky-300">
            <span className="font-bold">Previous:</span>{' '}
            {prevVitalsLatest
              ? `${prevVitalsLatest.bloodPressureSys || '—'}/${prevVitalsLatest.bloodPressureDia || '—'} mmHg`
              : 'No prior record'}
          </div>
        </div>

        {/* Pulse & SpO2 */}
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-2">
          <span className="font-bold text-slate-700 dark:text-slate-300 block">Pulse &amp; Oxygen (SpO2)</span>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              min="0"
              placeholder="BPM"
              value={hrBpm || ''}
              onKeyDown={preventNonNumeric}
              onChange={(e) => setHrBpm(Math.max(0, Number(e.target.value)))}
              className="p-2 rounded-lg bg-white dark:bg-slate-600 border border-slate-300 dark:border-slate-500 font-bold text-slate-900 dark:text-white"
            />
            <input
              type="number"
              min="0"
              max="100"
              placeholder="SpO2%"
              value={spo2 || ''}
              onKeyDown={preventNonNumeric}
              onChange={(e) => setSpo2(Math.max(0, Number(e.target.value)))}
              className="p-2 rounded-lg bg-white dark:bg-slate-600 border border-slate-300 dark:border-slate-500 font-bold text-slate-900 dark:text-white"
            />
          </div>
          <div className="p-2 rounded-lg bg-sky-50/60 dark:bg-sky-950/40 text-[10px] text-sky-800 dark:text-sky-300">
            <span className="font-bold">Previous:</span>{' '}
            {prevVitalsLatest
              ? `HR: ${prevVitalsLatest.heartRateBpm || '—'} bpm · SpO2: ${prevVitalsLatest.spo2Percent || '—'}%`
              : 'No prior record'}
          </div>
        </div>

        {/* Height & Weight */}
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-2">
          <span className="font-bold text-slate-700 dark:text-slate-300 block">Height (cm) &amp; Weight (kg)</span>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              min="0"
              value={heightCm || ''}
              onKeyDown={preventNonNumeric}
              onChange={(e) => setHeightCm(Math.max(0, Number(e.target.value)))}
              className="p-2 rounded-lg bg-white dark:bg-slate-600 border border-slate-300 dark:border-slate-500 font-bold text-slate-900 dark:text-white"
            />
            <input
              type="number"
              min="0"
              value={weightKg || ''}
              onKeyDown={preventNonNumeric}
              onChange={(e) => setWeightKg(Math.max(0, Number(e.target.value)))}
              className="p-2 rounded-lg bg-white dark:bg-slate-600 border border-slate-300 dark:border-slate-500 font-bold text-slate-900 dark:text-white"
            />
          </div>
          <div className="p-2 rounded-lg bg-sky-50/60 dark:bg-sky-950/40 text-[10px] text-sky-800 dark:text-sky-300">
            <span className="font-bold">Previous Weight:</span>{' '}
            {prevVitalsLatest?.weightKg ? `${prevVitalsLatest.weightKg} kg` : 'No prior record'}
          </div>
        </div>

        {/* Temperature */}
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-2">
          <span className="font-bold text-slate-700 dark:text-slate-300 block">Body Temperature (°F)</span>
          <input
            type="number"
            min="0"
            step="0.1"
            value={tempF || ''}
            onKeyDown={preventNonNumeric}
            onChange={(e) => setTempF(Math.max(0, Number(e.target.value)))}
            className="w-full p-2 rounded-lg bg-white dark:bg-slate-600 border border-slate-300 dark:border-slate-500 font-bold text-slate-900 dark:text-white"
          />
          <div className="p-2 rounded-lg bg-sky-50/60 dark:bg-sky-950/40 text-[10px] text-sky-800 dark:text-sky-300">
            <span className="font-bold">Normal Range:</span> 98.4°F - 99.5°F
          </div>
        </div>
      </div>
    </div>
  );
};
