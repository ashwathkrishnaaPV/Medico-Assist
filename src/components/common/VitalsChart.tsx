import React from 'react';
import { Activity, Heart, Thermometer, Droplets } from 'lucide-react';
import { Vitals } from '../../types';

interface VitalsChartProps {
  vitalsHistory: Vitals[];
}

export const VitalsChart: React.FC<VitalsChartProps> = ({ vitalsHistory }) => {
  if (!vitalsHistory || vitalsHistory.length === 0) return null;

  const latest = vitalsHistory[0];

  return (
    <div className="space-y-4">
      {/* Vitals Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="font-semibold text-[10px] uppercase">Blood Pressure</span>
            <Activity className="w-4 h-4 text-sky-500" />
          </div>
          <div className="text-base font-extrabold text-slate-800 dark:text-slate-100">
            {latest.bloodPressureSys}/{latest.bloodPressureDia} <span className="text-[10px] font-normal text-slate-400">mmHg</span>
          </div>
          <span className="text-[10px] font-semibold text-blue-600">Optimal Range</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="font-semibold text-[10px] uppercase">Heart Rate</span>
            <Heart className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-base font-extrabold text-slate-800 dark:text-slate-100">
            {latest.heartRateBpm} <span className="text-[10px] font-normal text-slate-400">bpm</span>
          </div>
          <span className="text-[10px] font-semibold text-blue-600">Normal Rhythm</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="font-semibold text-[10px] uppercase">SpO2 Level</span>
            <Droplets className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-base font-extrabold text-slate-800 dark:text-slate-100">
            {latest.spo2Percent}%
          </div>
          <span className="text-[10px] font-semibold text-blue-600">Excellent Oxygenation</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="font-semibold text-[10px] uppercase">Temperature</span>
            <Thermometer className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-base font-extrabold text-slate-800 dark:text-slate-100">
            {latest.temperatureF}°F
          </div>
          <span className="text-[10px] font-semibold text-slate-500">Recorded during visit</span>
        </div>
      </div>

      {/* Historical Vitals Table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-100 dark:bg-slate-800 text-slate-500 font-semibold uppercase text-[10px]">
            <tr>
              <th className="p-3">Date & Time</th>
              <th className="p-3">Blood Pressure</th>
              <th className="p-3">Pulse</th>
              <th className="p-3">SpO2</th>
              <th className="p-3">Weight</th>
              <th className="p-3">BMI</th>
              <th className="p-3">Clinician</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
            {vitalsHistory.map((v, i) => (
              <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <td className="p-3 font-semibold">{v.recordedAt}</td>
                <td className="p-3 font-mono">{v.bloodPressureSys}/{v.bloodPressureDia} mmHg</td>
                <td className="p-3">{v.heartRateBpm} bpm</td>
                <td className="p-3 font-semibold text-sky-600 dark:text-sky-400">{v.spo2Percent}%</td>
                <td className="p-3">{v.weightKg} kg</td>
                <td className="p-3 font-bold">{v.bmi}</td>
                <td className="p-3 text-slate-400">{v.recordedBy}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
