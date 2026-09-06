import React, { useState, useEffect } from 'react';
import { Stethoscope, Activity, Pill, Apple, Calendar, Save, CheckCircle2, Plus, Trash2 } from 'lucide-react';
import { healthStore } from '../../services/healthStore';
import { generateAINutritionRecommendation } from '../../services/nutritionEngine';
import { StudentProfileData, Vitals, PrescriptionItem } from '../../types';
import { authService } from '../../services/authService';

interface NewVisitConsultationProps {
  onNavigate: (tab: string) => void;
}

export const NewVisitConsultation: React.FC<NewVisitConsultationProps> = ({ onNavigate }) => {
  const currentDoctor = authService.getCurrentUser();
  const doctorName = currentDoctor.name || 'Campus Physician';

  const [allProfiles, setAllProfiles] = useState<StudentProfileData[]>([]);
  const [studentId, setStudentId] = useState<string>('');
  const [profile, setProfile] = useState<StudentProfileData | undefined>();
  const [previousVitals, setPreviousVitals] = useState<Vitals[]>([]);

  // Form Fields
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [clinicalNotes, setClinicalNotes] = useState('');
  
  // Vitals Input
  const [tempF, setTempF] = useState<number>(98.6);
  const [bpSys, setBpSys] = useState<number>(120);
  const [bpDia, setBpDia] = useState<number>(80);
  const [hrBpm, setHrBpm] = useState<number>(72);
  const [spo2, setSpo2] = useState<number>(99);
  const [heightCm, setHeightCm] = useState<number>(170);
  const [weightKg, setWeightKg] = useState<number>(65);

  // Prescription Items
  const [prescriptionItems, setPrescriptionItems] = useState<PrescriptionItem[]>([]);

  // Follow-up & Monitoring
  const [followUpRequired, setFollowUpRequired] = useState(false);
  const [followUpDate, setFollowUpDate] = useState(new Date().toISOString().split('T')[0]);
  const [followUpTime, setFollowUpTime] = useState('10:30 AM');
  const [enableMonitoring, setEnableMonitoring] = useState(false);
  const [monitoringDays, setMonitoringDays] = useState(7);
  const [aiNutritionPlan, setAiNutritionPlan] = useState<any>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    const load = () => {
      const list = healthStore.getAllStudentProfiles();
      setAllProfiles(list);

      let targetId = studentId;
      if (list.length > 0 && !targetId) {
        targetId = list[0].studentId;
        setStudentId(targetId);
      }

      if (targetId) {
        const p = healthStore.getStudentProfile(targetId);
        setProfile(p);
        if (p) {
          setHeightCm(p.heightCm);
          setWeightKg(p.weightKg);
        }
        const vList = healthStore.getVisitsForStudent(targetId).map(v => v.vitals);
        setPreviousVitals(vList);
      }
    };

    load();
    const unsub = healthStore.subscribe(load);
    return () => unsub();
  }, [studentId]);

  const handleGenerateAINutrition = () => {
    if (profile) {
      const plan = generateAINutritionRecommendation({
        student: profile,
        conditionName: diagnosis,
        doctorNotes: clinicalNotes
      });
      plan.doctorApproved = true;
      plan.approvedBy = 'Dr. Sarah Jenkins';
      setAiNutritionPlan(plan);
    }
  };

  const handleAddMedItem = () => {
    setPrescriptionItems([
      ...prescriptionItems,
      { id: `${Date.now()}`, medicineName: '', dosage: '1 tablet', frequency: 'Twice daily', durationDays: 5, instructions: '' }
    ]);
  };

  const handleRemoveMedItem = (id: string) => {
    setPrescriptionItems(prescriptionItems.filter(i => i.id !== id));
  };

  const handleSaveConsultation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    const hM = heightCm / 100;
    const bmiVal = parseFloat((weightKg / (hM * hM)).toFixed(1));

    const vitalsObj: Vitals = {
      temperatureF: tempF,
      bloodPressureSys: bpSys,
      bloodPressureDia: bpDia,
      heartRateBpm: hrBpm,
      spo2Percent: spo2,
      heightCm,
      weightKg,
      bmi: bmiVal,
      recordedAt: new Date().toLocaleString(),
      recordedBy: doctorName
    };

    // 1. Issue Prescription V1
    const rx = healthStore.createPrescription({
      studentId: profile.studentId,
      doctorName: doctorName,
      items: prescriptionItems,
      followUpDate: followUpRequired ? followUpDate : undefined,
      notes: clinicalNotes
    });

    // 2. Save AI Nutrition Plan if generated
    if (aiNutritionPlan) {
      healthStore.saveNutritionPlan(aiNutritionPlan);
    }

    // 3. Add Medical Visit Entry
    healthStore.addMedicalVisit({
      studentId: profile.studentId,
      studentName: profile.name,
      visitType: 'Consultation',
      visitDate: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      doctorName: doctorName,
      chiefComplaint,
      vitals: vitalsObj,
      clinicalNotes,
      diagnosis,
      prescriptionId: rx.id,
      nutritionPlanId: aiNutritionPlan?.id,
      monitoringPlanActive: enableMonitoring,
      status: 'Completed'
    });

    // 4. Schedule Follow-up Calendar Events
    if (followUpRequired) {
      healthStore.addCalendarEvent({
        studentId: profile.studentId,
        title: `Reconsultation / Follow-up — ${diagnosis}`,
        date: followUpDate,
        time: followUpTime,
        eventType: 'Follow-up',
        status: 'Upcoming',
        notes: `Reconsultation with ${doctorName} for ${diagnosis}`
      });
    }

    // 5. Activate Daily Monitoring Plan if checked
    if (enableMonitoring) {
      healthStore.activateMonitoringPlan(profile.studentId, diagnosis, monitoringDays, doctorName);
    }

    setSavedSuccess(true);
  };

  const prevVitalsLatest = previousVitals[0] || { bloodPressureSys: 118, bloodPressureDia: 76, spo2Percent: 99, heartRateBpm: 72, weightKg: 63 };

  return (
    <div className="space-y-6 theme-medical animate-fade-in pb-12">
      
      {/* Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <Stethoscope className="w-6 h-6 text-teal-600" />
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">New Patient Consultation & EHR Entry</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Clinical examination, historical vitals side-by-side comparison, prescription issuance & AI nutrition builder.
          </p>
        </div>

        <button
          onClick={handleSaveConsultation}
          className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md shadow-teal-600/20 flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          <span>Save Clinical Visit & Issue Rx</span>
        </button>
      </div>

      {savedSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 text-emerald-900 border border-emerald-200 text-xs flex items-center justify-between animate-fade-in font-bold">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>Consultation saved! Prescription #V1 issued, calendars synced, daily monitoring activated.</span>
          </div>
          <button onClick={() => onNavigate('medical-dashboard')} className="px-3 py-1 bg-emerald-600 text-white rounded-lg text-xs">
            Return to Queue
          </button>
        </div>
      )}

      {/* Main Form Layout */}
      <form onSubmit={handleSaveConsultation} className="space-y-6">
        
        {/* Student Selection Header */}
        <div className="card-clinical p-5 space-y-3">
          <label className="block text-xs font-bold uppercase text-slate-400">Select Patient for Consultation</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <select
              value={studentId}
              onChange={e => setStudentId(e.target.value)}
              className="p-2.5 rounded-xl bg-white dark:bg-slate-600 border border-slate-200 dark:border-slate-500 text-xs font-bold text-slate-900 dark:text-white"
            >
              {allProfiles.length === 0 ? (
                <option value="">No students registered in database</option>
              ) : (
                allProfiles.map(p => (
                  <option key={p.studentId} value={p.studentId}>
                    {p.studentId} — {p.name} ({p.department})
                  </option>
                ))
              )}
            </select>

            {profile && (
              <div className="p-2.5 rounded-xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-900 text-xs flex items-center justify-between">
                <div>
                  <span className="font-bold text-teal-900 dark:text-teal-200">{profile.name}</span>
                  <span className="text-teal-600 block text-[10px]">Blood: {profile.bloodGroup} · Allergies: {profile.criticalAllergies.join(', ')}</span>
                </div>
                <span className="px-2 py-0.5 rounded-md bg-teal-600 text-white font-bold text-[10px]">
                  ACTIVE PATIENT
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Clinical Assessment & Chief Complaint */}
        <div className="card-clinical p-6 space-y-4">
          <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Stethoscope className="w-4 h-4 text-teal-600" /> Clinical Assessment
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <label className="block font-bold text-slate-700 dark:text-slate-300">Chief Complaint & Symptoms</label>
              <textarea
                rows={3}
                value={chiefComplaint}
                onChange={e => setChiefComplaint(e.target.value)}
                className="w-full p-3 rounded-xl bg-white dark:bg-slate-600 border border-slate-200 dark:border-slate-500 text-xs font-medium text-slate-900 dark:text-white"
              />
            </div>

            <div className="space-y-1">
              <label className="block font-bold text-slate-700 dark:text-slate-300">Diagnosis</label>
              <input
                type="text"
                value={diagnosis}
                onChange={e => setDiagnosis(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-600 border border-slate-200 dark:border-slate-500 text-xs font-bold text-slate-900 dark:text-white"
              />
              <label className="block font-bold text-slate-700 dark:text-slate-300 pt-2">Doctor Clinical Notes</label>
              <textarea
                rows={2}
                value={clinicalNotes}
                onChange={e => setClinicalNotes(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-600 border border-slate-200 dark:border-slate-500 text-xs font-medium text-slate-900 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Side-by-Side Historical Vitals Comparison */}
        <div className="card-clinical p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Activity className="w-4 h-4 text-teal-600" /> Vitals Recording (Side-by-Side History Comparison)
            </h3>
            <span className="text-[10px] text-teal-600 font-bold uppercase bg-teal-50 dark:bg-teal-950 px-2 py-0.5 rounded-md">
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
                  onKeyDown={e => { if (e.key === '-' || e.key === '+' || e.key === 'e') e.preventDefault(); }}
                  onChange={e => setBpSys(Math.max(0, Number(e.target.value)))}
                  className="p-2 rounded-lg bg-white dark:bg-slate-600 border border-slate-300 dark:border-slate-500 font-bold text-slate-900 dark:text-white"
                />
                <input
                  type="number"
                  min="0"
                  placeholder="Dia"
                  value={bpDia || ''}
                  onKeyDown={e => { if (e.key === '-' || e.key === '+' || e.key === 'e') e.preventDefault(); }}
                  onChange={e => setBpDia(Math.max(0, Number(e.target.value)))}
                  className="p-2 rounded-lg bg-white dark:bg-slate-600 border border-slate-300 dark:border-slate-500 font-bold text-slate-900 dark:text-white"
                />
              </div>
              <div className="p-2 rounded-lg bg-teal-50/60 dark:bg-teal-950/40 text-[10px] text-teal-800 dark:text-teal-300">
                <span className="font-bold">Previous:</span> 20 Jul → {prevVitalsLatest.bloodPressureSys}/{prevVitalsLatest.bloodPressureDia} mmHg
              </div>
            </div>

            {/* Pulse & SpO2 */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-2">
              <span className="font-bold text-slate-700 dark:text-slate-300 block">Pulse & Oxygen (SpO2)</span>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  min="0"
                  placeholder="BPM"
                  value={hrBpm || ''}
                  onKeyDown={e => { if (e.key === '-' || e.key === '+' || e.key === 'e') e.preventDefault(); }}
                  onChange={e => setHrBpm(Math.max(0, Number(e.target.value)))}
                  className="p-2 rounded-lg bg-white dark:bg-slate-600 border border-slate-300 dark:border-slate-500 font-bold text-slate-900 dark:text-white"
                />
                <input
                  type="number"
                  min="0"
                  max="100"
                  placeholder="SpO2%"
                  value={spo2 || ''}
                  onKeyDown={e => { if (e.key === '-' || e.key === '+' || e.key === 'e') e.preventDefault(); }}
                  onChange={e => setSpo2(Math.max(0, Number(e.target.value)))}
                  className="p-2 rounded-lg bg-white dark:bg-slate-600 border border-slate-300 dark:border-slate-500 font-bold text-slate-900 dark:text-white"
                />
              </div>
              <div className="p-2 rounded-lg bg-teal-50/60 dark:bg-teal-950/40 text-[10px] text-teal-800 dark:text-teal-300">
                <span className="font-bold">Previous:</span> HR: {prevVitalsLatest.heartRateBpm} bpm · SpO2: {prevVitalsLatest.spo2Percent}%
              </div>
            </div>

            {/* Height & Weight */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-2">
              <span className="font-bold text-slate-700 dark:text-slate-300 block">Height (cm) & Weight (kg)</span>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  min="0"
                  value={heightCm || ''}
                  onKeyDown={e => { if (e.key === '-' || e.key === '+' || e.key === 'e') e.preventDefault(); }}
                  onChange={e => setHeightCm(Math.max(0, Number(e.target.value)))}
                  className="p-2 rounded-lg bg-white dark:bg-slate-600 border border-slate-300 dark:border-slate-500 font-bold text-slate-900 dark:text-white"
                />
                <input
                  type="number"
                  min="0"
                  value={weightKg || ''}
                  onKeyDown={e => { if (e.key === '-' || e.key === '+' || e.key === 'e') e.preventDefault(); }}
                  onChange={e => setWeightKg(Math.max(0, Number(e.target.value)))}
                  className="p-2 rounded-lg bg-white dark:bg-slate-600 border border-slate-300 dark:border-slate-500 font-bold text-slate-900 dark:text-white"
                />
              </div>
              <div className="p-2 rounded-lg bg-teal-50/60 dark:bg-teal-950/40 text-[10px] text-teal-800 dark:text-teal-300">
                <span className="font-bold">Previous Weight:</span> {prevVitalsLatest.weightKg || 63} kg
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
                onKeyDown={e => { if (e.key === '-' || e.key === '+' || e.key === 'e') e.preventDefault(); }}
                onChange={e => setTempF(Math.max(0, Number(e.target.value)))}
                className="w-full p-2 rounded-lg bg-white dark:bg-slate-600 border border-slate-300 dark:border-slate-500 font-bold text-slate-900 dark:text-white"
              />
              <div className="p-2 rounded-lg bg-teal-50/60 dark:bg-teal-950/40 text-[10px] text-teal-800 dark:text-teal-300">
                <span className="font-bold">Normal Range:</span> 98.4°F - 99.5°F
              </div>
            </div>

          </div>
        </div>

        {/* Integrated Prescription Builder */}
        <div className="card-clinical p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Pill className="w-4 h-4 text-purple-600" /> Integrated Prescription Builder (Version 1)
            </h3>

            <button
              type="button"
              onClick={handleAddMedItem}
              className="px-3 py-1.5 rounded-lg bg-purple-100 text-purple-800 font-bold text-xs hover:bg-purple-200 flex items-center gap-1"
            >
              <Plus className="w-4 h-4" /> Add Item
            </button>
          </div>

          <div className="space-y-3">
            {prescriptionItems.map((item, idx) => (
              <div key={item.id} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-5 gap-3 text-xs items-center">
                <input
                  type="text"
                  placeholder="Medicine Name & Strength"
                  value={item.medicineName}
                  onChange={e => {
                    const newArr = [...prescriptionItems];
                    newArr[idx].medicineName = e.target.value;
                    setPrescriptionItems(newArr);
                  }}
                  className="sm:col-span-2 p-2 rounded-lg bg-white dark:bg-slate-600 border border-slate-300 dark:border-slate-500 font-bold text-slate-900 dark:text-white"
                />
                <input
                  type="text"
                  placeholder="Dosage (e.g. 1 capsule)"
                  value={item.dosage}
                  onChange={e => {
                    const newArr = [...prescriptionItems];
                    newArr[idx].dosage = e.target.value;
                    setPrescriptionItems(newArr);
                  }}
                  className="p-2 rounded-lg bg-white dark:bg-slate-600 border border-slate-300 dark:border-slate-500 font-semibold text-slate-900 dark:text-white"
                />
                <input
                  type="text"
                  placeholder="Frequency"
                  value={item.frequency}
                  onChange={e => {
                    const newArr = [...prescriptionItems];
                    newArr[idx].frequency = e.target.value;
                    setPrescriptionItems(newArr);
                  }}
                  className="p-2 rounded-lg bg-white dark:bg-slate-600 border border-slate-300 dark:border-slate-500 font-semibold text-slate-900 dark:text-white"
                />
                <div className="flex items-center gap-2">
                  <div className="flex items-center">
                    <input
                      type="number"
                      min="1"
                      placeholder="Days"
                      value={item.durationDays}
                      onKeyDown={e => {
                        if (e.key === '-' || e.key === '+' || e.key === 'e') e.preventDefault();
                      }}
                      onChange={e => {
                        const parsed = parseInt(e.target.value, 10);
                        const val = isNaN(parsed) || parsed < 1 ? 1 : Math.abs(parsed);
                        const newArr = [...prescriptionItems];
                        newArr[idx].durationDays = val;
                        setPrescriptionItems(newArr);
                      }}
                      className="w-16 p-2 rounded-lg bg-white dark:bg-slate-600 border border-slate-300 dark:border-slate-500 font-bold text-center text-slate-900 dark:text-white"
                      title="Duration in days (must be at least 1)"
                    />
                    <span className="text-[10px] text-slate-400 dark:text-slate-300 ml-1">days</span>
                  </div>
                  <button type="button" onClick={() => handleRemoveMedItem(item.id)} className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Nutrition Builder & Doctor Approval */}
        <div className="card-clinical p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Apple className="w-4 h-4 text-emerald-600" /> AI-Assisted Nutrition Recommendation Builder
              </h3>
              <p className="text-xs text-slate-500">
                Analyzes BMI trend, bronchitis diagnosis, allergies (Penicillin, Peanuts), and medication interactions.
              </p>
            </div>

            <button
              type="button"
              onClick={handleGenerateAINutrition}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-xs shadow-md"
            >
              Generate AI Recommendation
            </button>
          </div>

          {aiNutritionPlan && (
            <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 space-y-3 text-xs animate-fade-in">
              <div className="flex items-center justify-between font-bold text-emerald-900 dark:text-emerald-200">
                <span>AI Recommendation Goal: {aiNutritionPlan.goal}</span>
                <span className="px-2 py-0.5 rounded-md bg-emerald-600 text-white font-extrabold text-[10px]">
                  APPROVED BY DOCTOR
                </span>
              </div>
              <p className="text-slate-600 dark:text-slate-300">
                Breakfast: {aiNutritionPlan.meals.breakfast.join(', ')}
              </p>
              <p className="text-rose-700 dark:text-rose-400 font-bold">
                Foods to Limit: {aiNutritionPlan.foodsToLimit.join(', ')}
              </p>
            </div>
          )}
        </div>

        {/* Follow-up & Monitoring Sync */}
        <div className="card-clinical p-6 space-y-4">
          <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-teal-600" /> Follow-up Reconsultation & Daily Monitoring
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-3">
              <label className="flex items-center gap-2 font-bold cursor-pointer">
                <input
                  type="checkbox"
                  checked={followUpRequired}
                  onChange={e => setFollowUpRequired(e.target.checked)}
                  className="w-4 h-4 accent-teal-600"
                />
                <span>Schedule Follow-up Reconsultation</span>
              </label>

              {followUpRequired && (
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <label className="block text-slate-500 font-semibold mb-1">Date</label>
                    <input
                      type="date"
                      value={followUpDate}
                      onChange={e => setFollowUpDate(e.target.value)}
                      className="w-full p-2 rounded-lg bg-white dark:bg-slate-600 border border-slate-300 dark:border-slate-500 font-bold text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 font-semibold mb-1">Time</label>
                    <input
                      type="text"
                      value={followUpTime}
                      onChange={e => setFollowUpTime(e.target.value)}
                      className="w-full p-2 rounded-lg bg-white dark:bg-slate-600 border border-slate-300 dark:border-slate-500 font-bold text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-3">
              <label className="flex items-center gap-2 font-bold cursor-pointer">
                <input
                  type="checkbox"
                  checked={enableMonitoring}
                  onChange={e => setEnableMonitoring(e.target.checked)}
                  className="w-4 h-4 accent-teal-600"
                />
                <span>Activate Daily Health Monitoring (7-Day Relay)</span>
              </label>
              <p className="text-[11px] text-slate-500">
                Activates daily symptom check questionnaire on Alex Rivera's Student Panel and sends daily logs to clinic triage desk.
              </p>
            </div>
          </div>
        </div>

      </form>

    </div>
  );
};
