import React, { useState, useEffect } from 'react';
import {
  Stethoscope,
  Pill,
  Apple,
  Calendar,
  Save,
  CheckCircle2,
  Plus,
  AlertCircle,
  Sparkles
} from 'lucide-react';
import { healthStore } from '../../services/healthStore';
import { generateAINutritionRecommendation } from '../../services/nutritionEngine';
import { aiService } from '../../services/aiService';
import { StudentProfileData, Vitals, PrescriptionItem, Prescription } from '../../types';
import { authService } from '../../services/authService';
import { FollowUpDatePicker } from '../common/FollowUpDatePicker';
import { WhatsAppShareModal } from '../common/WhatsAppShareModal';
import { VitalsEntrySection } from './consultation/VitalsEntrySection';
import { PrescriptionItemBuilder } from './consultation/PrescriptionItemBuilder';

interface NewVisitConsultationProps {
  onNavigate: (tab: string) => void;
}

export const NewVisitConsultation: React.FC<NewVisitConsultationProps> = ({ onNavigate }) => {
  const currentDoctor = authService.getCurrentUser();
  const doctorName = currentDoctor.name || 'Campus Physician';

  const [allProfiles, setAllProfiles] = useState<StudentProfileData[]>([]);
  const [studentId, setStudentId] = useState<string>(() => healthStore.getActiveDoctorPatientId() || '');
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
  const [monitoringDays] = useState(3);
  const [aiNutritionPlan, setAiNutritionPlan] = useState<any>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [issuedPrescription, setIssuedPrescription] = useState<Prescription | null>(null);
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
  const [isAiDrafting, setIsAiDrafting] = useState(false);

  const handleAiDraftSummary = async () => {
    if (isAiDrafting) return;
    setIsAiDrafting(true);
    try {
      const draft = await aiService.draftVisitSummary({
        chiefComplaint: chiefComplaint.trim() || 'General campus clinical evaluation',
        diagnosis: diagnosis.trim() || 'Provisional assessment',
        vitals: {
          bloodPressureSys: bpSys,
          bloodPressureDia: bpDia,
          heartRateBpm: hrBpm,
          temperatureF: tempF,
          spo2Percent: spo2
        },
        clinicalNotes: clinicalNotes.trim()
      });
      if (draft && draft.text) {
        setClinicalNotes(draft.text);
        if (studentId) {
          healthStore.setActiveClinicalAssessment({
            studentId,
            chiefComplaint,
            diagnosis,
            clinicalNotes: draft.text
          });
        }
      }
    } catch (err) {
      console.warn('AI summary draft failed:', err);
    } finally {
      setIsAiDrafting(false);
    }
  };

  useEffect(() => {
    const load = () => {
      const list = healthStore.getAllStudentProfiles();
      setAllProfiles(list);

      const activeId = healthStore.getActiveDoctorPatientId();
      setStudentId(activeId);

      if (activeId) {
        const p = healthStore.getStudentProfile(activeId);
        setProfile(p);
        if (p) {
          setHeightCm(p.heightCm || 170);
          setWeightKg(p.weightKg || 65);
        }
        const vList = healthStore.getVisitsForStudent(activeId).map(v => v.vitals);
        setPreviousVitals(vList);

        const currentAssessment = healthStore.getActiveClinicalAssessment(activeId);
        if (currentAssessment.chiefComplaint) {
          setChiefComplaint(currentAssessment.chiefComplaint);
        }
        if (currentAssessment.diagnosis) {
          setDiagnosis(currentAssessment.diagnosis);
        }
        if (currentAssessment.clinicalNotes) {
          setClinicalNotes(currentAssessment.clinicalNotes);
        }
      } else {
        setProfile(undefined);
        setPreviousVitals([]);
        setChiefComplaint('');
        setDiagnosis('');
        setClinicalNotes('');
      }
    };

    load();
    const unsub = healthStore.subscribe(load);
    return () => unsub();
  }, []);

  const handleGenerateAINutrition = () => {
    if (profile) {
      const plan = generateAINutritionRecommendation({
        student: profile,
        conditionName: diagnosis,
        doctorNotes: clinicalNotes
      });
      plan.doctorApproved = true;
      plan.approvedBy = doctorName || 'Dr. Nivetha M.B.B.S';
      setAiNutritionPlan(plan);
    }
  };

  const handleAddMedItem = () => {
    setPrescriptionItems([
      ...prescriptionItems,
      {
        id: `${Date.now()}`,
        medicineName: '',
        dosage: '1 tablet',
        frequency: 'Twice daily',
        durationDays: 3,
        quantity: 6,
        instructions: ''
      }
    ]);
  };

  const handleRemoveMedItem = (id: string) => {
    setPrescriptionItems(prescriptionItems.filter(i => i.id !== id));
  };

  const handleSaveConsultation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) {
      alert('Please select a patient from the dropdown first before saving consultation.');
      return;
    }

    setIsSaving(true);
    setSaveError(null);

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

    try {
      // 1. Issue Prescription V1 if medications prescribed (deducts stock in real time on server)
      let rxId: string | undefined;
      let rx: Prescription | undefined;
      if (prescriptionItems && prescriptionItems.length > 0) {
        rx = await healthStore.createPrescription({
          studentId: profile.studentId,
          doctorName: doctorName,
          diagnosis: diagnosis,
          items: prescriptionItems,
          followUpDate: followUpRequired ? followUpDate : undefined,
          notes: clinicalNotes
        });
        rxId = rx.id;
        setIssuedPrescription(rx);
      }

      // 2. Save AI Nutrition Plan if generated
      let nutritionPlanId: string | undefined;
      if (aiNutritionPlan) {
        const savedNutr = await healthStore.saveNutritionPlan(aiNutritionPlan);
        nutritionPlanId = savedNutr.id;
      }

      // 3. Add Medical Visit Entry
      await healthStore.addMedicalVisit({
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
        prescriptionId: rxId,
        nutritionPlanId,
        monitoringPlanActive: enableMonitoring,
        status: 'Completed'
      });

      // 4. Schedule Follow-up Calendar Events
      if (followUpRequired) {
        await healthStore.addCalendarEvent({
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
        await healthStore.activateMonitoringPlan(profile.studentId, diagnosis, monitoringDays, doctorName);
      }

      setSavedSuccess(true);
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : 'Failed to persist consultation. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const prevVitalsLatest = previousVitals.length > 0 ? previousVitals[0] : null;

  return (
    <div className="space-y-6 theme-medical animate-fade-in pb-12">
      
      {/* Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <Stethoscope className="w-6 h-6 text-sky-600" />
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">New Patient Consultation & EHR Entry</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Clinical examination, historical vitals side-by-side comparison, prescription issuance & AI nutrition builder.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSaveConsultation}
          disabled={!studentId || isSaving}
          className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 ${
            studentId && !isSaving
              ? 'bg-sky-600 hover:bg-sky-700 text-white shadow-md shadow-sky-600/20 cursor-pointer'
              : 'bg-slate-300 dark:bg-slate-800 text-slate-500 dark:text-slate-400 cursor-not-allowed opacity-70'
          }`}
        >
          <Save className="w-4 h-4" />
          <span>{isSaving ? 'Persisting Clinical Consultation…' : 'Save Clinical Visit & Issue Rx'}</span>
        </button>
      </div>

      {saveError && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200 border border-rose-200 dark:border-rose-800 text-xs font-bold animate-fade-in flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{saveError}</span>
        </div>
      )}

      {savedSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fade-in font-bold">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>Consultation saved &amp; Prescription #{issuedPrescription?.id || 'V1'} issued successfully!</span>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {issuedPrescription && profile && (
              <button
                type="button"
                onClick={() => setIsWhatsAppModalOpen(true)}
                className="flex-1 sm:flex-initial px-4 py-2 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
              >
                <span>💬 Share via WhatsApp</span>
                {profile.phone && <span className="opacity-90 font-normal">(+91 {profile.phone})</span>}
              </button>
            )}
            <button onClick={() => onNavigate('medical-dashboard')} className="px-3 py-2 bg-slate-700 hover:bg-slate-800 text-white rounded-xl text-xs font-bold cursor-pointer">
              Return to Queue
            </button>
          </div>
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
              onChange={e => {
                const val = e.target.value;
                setStudentId(val);
                healthStore.setActiveDoctorPatientId(val);
                if (val) {
                  const assess = healthStore.getActiveClinicalAssessment(val);
                  setChiefComplaint(assess.chiefComplaint || '');
                  setDiagnosis(assess.diagnosis || '');
                  setClinicalNotes(assess.clinicalNotes || '');
                } else {
                  setChiefComplaint('');
                  setDiagnosis('');
                  setClinicalNotes('');
                }
              }}
              className="p-2.5 rounded-xl bg-white dark:bg-slate-600 border border-slate-200 dark:border-slate-500 text-xs font-bold text-slate-900 dark:text-white"
            >
              <option value="">-- Select Patient for Consultation --</option>
              {allProfiles.map(p => (
                <option key={p.studentId} value={p.studentId}>
                  {p.studentId} — {p.name} ({p.department})
                </option>
              ))}
            </select>

            {profile ? (
              <div className="p-2.5 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-900 text-xs flex items-center justify-between">
                <div>
                  <span className="font-bold text-sky-900 dark:text-sky-200">{profile.name}</span>
                  <span className="text-sky-600 block text-[10px]">Blood: {profile.bloodGroup || 'Not Recorded'} · Allergies: {profile.criticalAllergies && profile.criticalAllergies.length > 0 ? profile.criticalAllergies.join(', ') : 'None'}</span>
                </div>
                <span className="px-2 py-0.5 rounded-md bg-sky-600 text-white font-bold text-[10px]">
                  ACTIVE PATIENT
                </span>
              </div>
            ) : (
              <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 text-xs flex items-center gap-2 text-amber-800 dark:text-amber-300">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-500" />
                <span className="font-medium text-[11px]">No patient selected. Choose a student from dropdown above to begin.</span>
              </div>
            )}
          </div>
        </div>


        {/* Side-by-Side Historical Vitals Comparison */}
        <VitalsEntrySection
          bpSys={bpSys}
          setBpSys={setBpSys}
          bpDia={bpDia}
          setBpDia={setBpDia}
          hrBpm={hrBpm}
          setHrBpm={setHrBpm}
          spo2={spo2}
          setSpo2={setSpo2}
          heightCm={heightCm}
          setHeightCm={setHeightCm}
          weightKg={weightKg}
          setWeightKg={setWeightKg}
          tempF={tempF}
          setTempF={setTempF}
          prevVitalsLatest={prevVitalsLatest}
        />



        {/* Integrated Prescription Builder */}
        <div className="card-clinical p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Pill className="w-4 h-4 text-purple-600" /> Integrated Prescription Builder (Version 1)
            </h3>

            <button
              type="button"
              onClick={handleAddMedItem}
              className="px-3 py-1.5 rounded-lg bg-purple-100 text-purple-800 font-bold text-xs hover:bg-purple-200 flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Add Item
            </button>
          </div>

          {/* Prescription Diagnosis & Doctor Clinical Notes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1.5">
              <label className="block font-bold text-slate-700 dark:text-slate-300">Diagnosis</label>
              <input
                type="text"
                placeholder="e.g. Acute Bronchitis, Seasonal Rhinitis, Tension Headache..."
                value={diagnosis}
                onChange={e => {
                const val = e.target.value;
                setDiagnosis(val);
                if (studentId) {
                  healthStore.setActiveClinicalAssessment({
                    studentId,
                    chiefComplaint,
                    diagnosis: val,
                    clinicalNotes
                  });
                }
              }}
                className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-600 border border-slate-200 dark:border-slate-500 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block font-bold text-slate-700 dark:text-slate-300">Doctor Clinical Notes & Instructions</label>
                <button
                  type="button"
                  onClick={handleAiDraftSummary}
                  disabled={isAiDrafting || (!chiefComplaint && !diagnosis)}
                  className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-900/40 hover:bg-blue-100 dark:hover:bg-blue-800/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                  title="Generate a structured consultation summary draft using clinical AI"
                >
                  <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span>{isAiDrafting ? 'Drafting Summary…' : 'AI Draft Summary'}</span>
                </button>
              </div>
              <textarea
                rows={2}
                placeholder="Doctor's notes, dosage instructions, patient advice, or clinical remarks..."
                value={clinicalNotes}
                onChange={e => {
                const val = e.target.value;
                setClinicalNotes(val);
                if (studentId) {
                  healthStore.setActiveClinicalAssessment({
                    studentId,
                    chiefComplaint,
                    diagnosis,
                    clinicalNotes: val
                  });
                }
              }}
                className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-600 border border-slate-200 dark:border-slate-500 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          
          <PrescriptionItemBuilder
            items={prescriptionItems}
            onChange={setPrescriptionItems}
            onRemove={handleRemoveMedItem}
          />
        </div>

        {/* AI Nutrition Builder & Doctor Approval */}
        <div className="card-clinical p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Apple className="w-4 h-4 text-blue-600" /> AI-Assisted Nutrition Recommendation Builder
              </h3>
              <p className="text-xs text-slate-500">
                Analyzes BMI trend, bronchitis diagnosis, allergies (Penicillin, Peanuts), and medication interactions.
              </p>
            </div>

            <button
              type="button"
              onClick={handleGenerateAINutrition}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-sky-600 text-white font-bold text-xs shadow-md"
            >
              Generate AI Recommendation
            </button>
          </div>

          {aiNutritionPlan && (
            <div className="p-4 rounded-2xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 space-y-3 text-xs animate-fade-in">
              <div className="flex items-center justify-between font-bold text-blue-900 dark:text-blue-200">
                <span>AI Recommendation Goal: {aiNutritionPlan.goal}</span>
                <span className="px-2 py-0.5 rounded-md bg-blue-600 text-white font-extrabold text-[10px]">
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
            <Calendar className="w-4 h-4 text-sky-600" /> Follow-up Reconsultation & Daily Monitoring
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-3">
              <label className="flex items-center gap-2 font-bold cursor-pointer">
                <input
                  type="checkbox"
                  checked={followUpRequired}
                  onChange={e => setFollowUpRequired(e.target.checked)}
                  className="w-4 h-4 accent-sky-600"
                />
                <span>Schedule Follow-up Reconsultation</span>
              </label>

              {followUpRequired && (
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <FollowUpDatePicker
                      value={followUpDate}
                      onChange={setFollowUpDate}
                      label="Follow-up Date"
                      placeholder="dd-mm-yyyy"
                      accentColor="sky"
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
                  className="w-4 h-4 accent-sky-600"
                />
                <span>Activate Daily Health Monitoring (3-Day Relay)</span>
              </label>
              <p className="text-[11px] text-slate-500">
                Activates daily symptom check questionnaire on the student's panel and sends daily logs to clinic triage desk.
              </p>
            </div>
          </div>
        </div>

      </form>

      {/* WhatsApp Share Modal */}
      {issuedPrescription && profile && (
        <WhatsAppShareModal
          isOpen={isWhatsAppModalOpen}
          onClose={() => setIsWhatsAppModalOpen(false)}
          prescription={issuedPrescription}
          profile={profile}
        />
      )}

    </div>
  );
};
