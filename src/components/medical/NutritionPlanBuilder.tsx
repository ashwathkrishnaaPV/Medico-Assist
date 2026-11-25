import React, { useState, useEffect } from 'react';
import { Apple, ShieldCheck, Sparkles, Coffee, Sun, Utensils, Moon, Bot } from 'lucide-react';
import { healthStore } from '../../services/healthStore';
import { authService } from '../../services/authService';
import { generateAINutritionRecommendation } from '../../services/nutritionEngine';
import { aiService, AiResponse } from '../../services/aiService';
import { StudentProfileData, NutritionPlan } from '../../types';

export const NutritionPlanBuilder: React.FC = () => {
  const currentDoctor = authService.getCurrentUser();
  const doctorName = currentDoctor.name || 'Campus Physician';

  const [allProfiles, setAllProfiles] = useState<StudentProfileData[]>([]);
  const [studentId, setStudentId] = useState<string>(() => healthStore.getActiveDoctorPatientId() || '');
  const [profile, setProfile] = useState<StudentProfileData | undefined>();
  const [plan, setPlan] = useState<NutritionPlan | undefined>();
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiAdvice, setAiAdvice] = useState<AiResponse | null>(null);

  useEffect(() => {
    const load = () => {
      const list = healthStore.getAllStudentProfiles();
      setAllProfiles(list);

      const activeId = healthStore.getActiveDoctorPatientId();
      setStudentId(activeId);

      if (activeId) {
        const p = healthStore.getStudentProfile(activeId);
        setProfile(p);
        const existing = healthStore.getNutritionPlanForStudent(activeId);
        setPlan(existing);
      } else {
        setProfile(undefined);
        setPlan(undefined);
      }
    };

    load();
    const unsub = healthStore.subscribe(load);
    return () => unsub();
  }, []);

  const handleGenerateAI = async () => {
    if (!profile) return;
    setIsGenerating(true);
    try {
      const aiRec = generateAINutritionRecommendation({
        student: profile,
        conditionName: 'General Clinical Wellness Support',
        doctorNotes: 'Balanced high vitamin diet & hydration'
      });
      setPlan(aiRec);

      const advice = await aiService.getNutritionAdvice({
        goal: 'General campus clinical wellness and study recovery',
        allergies: profile.criticalAllergies || [],
        preferences: 'Balanced collegiate',
        currentBmi: profile.bmi || 22
      });
      setAiAdvice(advice);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApprovePlan = async () => {
    if (!plan) return;
    const approvedPlan: NutritionPlan = {
      ...plan,
      doctorApproved: true,
      approvedBy: doctorName,
      approvedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    try {
      await healthStore.saveNutritionPlan(approvedPlan);
      setPlan(approvedPlan);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to save nutrition plan on server.');
    }
  };

  return (
    <div className="space-y-6 theme-medical animate-fade-in pb-12">
      
      {/* Header & Patient Selector */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <Apple className="w-6 h-6 text-blue-600" />
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Nutrition Plan Builder</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Tailored nutrition plan builder for active recovery. Clinician approval publishes directly to student portal.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <label className="text-xs font-bold text-slate-400">Patient:</label>
          <select
            value={studentId}
            onChange={e => {
              const val = e.target.value;
              setStudentId(val);
              healthStore.setActiveDoctorPatientId(val);
            }}
            className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold"
          >
            <option value="">-- Select Patient --</option>
            {allProfiles.map(p => (
              <option key={p.studentId} value={p.studentId}>
                {p.studentId} — {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {!studentId ? (
        <div className="p-12 text-center text-slate-400 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-2">
          <Apple className="w-12 h-12 mx-auto text-blue-400" />
          <h3 className="font-bold text-slate-700 dark:text-slate-200 text-base">No Patient Selected</h3>
          <p className="text-xs">Please select a student from the dropdown above to view or build their nutrition plan.</p>
        </div>
      ) : allProfiles.length === 0 ? (
        <div className="p-12 text-center text-slate-400 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-2">
          <Apple className="w-12 h-12 mx-auto text-blue-400" />
          <h3 className="font-bold text-slate-700 dark:text-slate-200 text-base">No Students Registered</h3>
          <p className="text-xs">Register student profiles to generate tailored nutrition plans.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Action Column */}
          <div className="lg:col-span-4 space-y-4">
            <div className="card-clinical p-6 space-y-4">
              <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-600" /> AI Recommendation Engine
              </h3>
              <p className="text-xs text-slate-500">
                Generate a dietary recovery plan tailored for {profile?.name || studentId}.
              </p>
              <button
                onClick={handleGenerateAI}
                disabled={isGenerating}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-sky-600 text-white font-bold text-xs shadow-md shadow-blue-600/20 disabled:opacity-60 cursor-pointer flex items-center justify-center gap-2"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isGenerating ? 'Generating AI Nutrition Guidance…' : 'Generate AI Nutrition Plan'}</span>
              </button>
            </div>

            {aiAdvice && (
              <div className="card-clinical p-5 space-y-2 text-xs border border-blue-200 dark:border-blue-900/60 bg-blue-50/40 dark:bg-slate-850">
                <div className="flex items-center justify-between text-blue-700 dark:text-blue-300 font-bold">
                  <span className="flex items-center gap-1.5">
                    <Bot className="w-4 h-4" /> AI Dietary Guidance
                  </span>
                  <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                    {aiAdvice.source === 'LLM' ? 'LLM' : 'Rule Engine'}
                  </span>
                </div>
                <div className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed text-[11px] max-h-48 overflow-y-auto pr-1">
                  {aiAdvice.text}
                </div>
              </div>
            )}

            {plan && !plan.doctorApproved && (
              <div className="p-5 rounded-3xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-xs space-y-3">
                <div className="font-bold text-blue-900 dark:text-blue-200">Clinician Review Required</div>
                <p className="text-slate-600 dark:text-slate-300">
                  Review the meal recommendations on the right before publishing to student.
                </p>
                <button
                  onClick={handleApprovePlan}
                  className="w-full py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md"
                >
                  <ShieldCheck className="w-4 h-4" /> Approve & Publish Plan
                </button>
              </div>
            )}
          </div>

          {/* Right Meal Plan Display */}
          <div className="lg:col-span-8 space-y-4">
            {plan ? (
              <div className="card-clinical p-6 space-y-5">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Target Goal</span>
                    <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">{plan.goal}</h3>
                  </div>
                  <span className={`px-3 py-1 rounded-full font-bold text-xs ${
                    plan.doctorApproved ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {plan.doctorApproved ? `Approved by ${plan.approvedBy}` : 'Draft (Unapproved)'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-2">
                    <div className="font-bold text-blue-600 flex items-center gap-2">
                      <Coffee className="w-4 h-4" /> Breakfast Options
                    </div>
                    {plan.meals.breakfast.map((item, idx) => (
                      <div key={idx} className="text-slate-700 dark:text-slate-300 font-semibold">• {item}</div>
                    ))}
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-2">
                    <div className="font-bold text-amber-600 flex items-center gap-2">
                      <Sun className="w-4 h-4" /> Lunch Options
                    </div>
                    {plan.meals.lunch.map((item, idx) => (
                      <div key={idx} className="text-slate-700 dark:text-slate-300 font-semibold">• {item}</div>
                    ))}
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-2">
                    <div className="font-bold text-sky-600 flex items-center gap-2">
                      <Utensils className="w-4 h-4" /> Evening Snacks
                    </div>
                    {(plan.meals.evening || []).map((item: string, idx: number) => (
                      <div key={idx} className="text-slate-700 dark:text-slate-300 font-semibold">• {item}</div>
                    ))}
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-2">
                    <div className="font-bold text-purple-600 flex items-center gap-2">
                      <Moon className="w-4 h-4" /> Dinner Options
                    </div>
                    {plan.meals.dinner.map((item, idx) => (
                      <div key={idx} className="text-slate-700 dark:text-slate-300 font-semibold">• {item}</div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center text-slate-400 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
                <p className="text-xs">Click "Generate AI Nutrition Plan" on the left to create a meal schedule.</p>
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
};
