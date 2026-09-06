import React, { useState, useEffect } from 'react';
import { Apple, ShieldCheck, Sparkles, Coffee, Sun, Utensils, Moon } from 'lucide-react';
import { healthStore } from '../../services/healthStore';
import { authService } from '../../services/authService';
import { generateAINutritionRecommendation } from '../../services/nutritionEngine';
import { StudentProfileData, NutritionPlan } from '../../types';

export const NutritionPlanBuilder: React.FC = () => {
  const currentDoctor = authService.getCurrentUser();
  const doctorName = currentDoctor.name || 'Campus Physician';

  const [allProfiles, setAllProfiles] = useState<StudentProfileData[]>([]);
  const [studentId, setStudentId] = useState<string>('');
  const [profile, setProfile] = useState<StudentProfileData | undefined>();
  const [plan, setPlan] = useState<NutritionPlan | undefined>();

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
        const existing = healthStore.getNutritionPlanForStudent(targetId);
        setPlan(existing);
      }
    };

    load();
    const unsub = healthStore.subscribe(load);
    return () => unsub();
  }, [studentId]);

  const handleGenerateAI = () => {
    if (!profile) return;
    const aiRec = generateAINutritionRecommendation({
      student: profile,
      conditionName: 'General Clinical Wellness Support',
      doctorNotes: 'Balanced high vitamin diet & hydration'
    });
    setPlan(aiRec);
  };

  const handleApprovePlan = () => {
    if (!plan) return;
    const approvedPlan: NutritionPlan = {
      ...plan,
      doctorApproved: true,
      approvedBy: doctorName,
      approvedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    healthStore.saveNutritionPlan(approvedPlan);
    setPlan(approvedPlan);
  };

  return (
    <div className="space-y-6 theme-medical animate-fade-in pb-12">
      
      {/* Header & Patient Selector */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <Apple className="w-6 h-6 text-emerald-600" />
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
            onChange={e => setStudentId(e.target.value)}
            className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold"
          >
            {allProfiles.length === 0 ? (
              <option value="">No students in database</option>
            ) : (
              allProfiles.map(p => (
                <option key={p.studentId} value={p.studentId}>
                  {p.studentId} — {p.name}
                </option>
              ))
            )}
          </select>
        </div>
      </div>

      {allProfiles.length === 0 ? (
        <div className="p-12 text-center text-slate-400 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-2">
          <Apple className="w-12 h-12 mx-auto text-emerald-400" />
          <h3 className="font-bold text-slate-700 dark:text-slate-200 text-base">No Students Registered</h3>
          <p className="text-xs">Register student profiles to generate tailored nutrition plans.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Action Column */}
          <div className="lg:col-span-4 space-y-4">
            <div className="card-clinical p-6 space-y-4">
              <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600" /> AI Recommendation Engine
              </h3>
              <p className="text-xs text-slate-500">
                Generate a dietary recovery plan tailored for {profile?.name || studentId}.
              </p>
              <button
                onClick={handleGenerateAI}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-xs shadow-md shadow-emerald-600/20"
              >
                Generate AI Nutrition Plan
              </button>
            </div>

            {plan && !plan.doctorApproved && (
              <div className="p-5 rounded-3xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-xs space-y-3">
                <div className="font-bold text-emerald-900 dark:text-emerald-200">Clinician Review Required</div>
                <p className="text-slate-600 dark:text-slate-300">
                  Review the meal recommendations on the right before publishing to student.
                </p>
                <button
                  onClick={handleApprovePlan}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md"
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
                    plan.doctorApproved ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {plan.doctorApproved ? `Approved by ${plan.approvedBy}` : 'Draft (Unapproved)'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-2">
                    <div className="font-bold text-emerald-600 flex items-center gap-2">
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
                    <div className="font-bold text-teal-600 flex items-center gap-2">
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
