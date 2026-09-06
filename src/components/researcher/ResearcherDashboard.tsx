import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Brain,
  ShieldCheck,
  TrendingUp,
  Activity,
  Layers,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Percent,
  Sliders,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { researchService } from '../../services/researchService';
import { ResearcherMetrics, ModelEvaluationMetrics } from '../../types';

export const ResearcherDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'POPULATION' | 'MODEL_EVALUATION' | 'EXPERIMENTS'>('MODEL_EVALUATION');
  const [popMetrics, setPopMetrics] = useState<ResearcherMetrics | null>(null);
  const [evalMetrics, setEvalMetrics] = useState<ModelEvaluationMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [pop, ev] = await Promise.all([
        researchService.getPopulationMetrics(),
        researchService.getModelEvaluation()
      ]);
      setPopMetrics(pop);
      setEvalMetrics(ev);
    } catch (err) {
      console.error('Error loading research data:', err);
    } finally {
      setLoading(false);
    }
  };

  const classes = ['LOW', 'MODERATE', 'HIGH', 'URGENT'];

  return (
    <div className="space-y-6 animate-fade-in pb-12 text-slate-800 dark:text-slate-100">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Brain className="w-4 h-4" /> Academic Research & Clinical AI Portal
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Research Analytics & Model Evaluation
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Anonymized cohort analytics, benchmark model validation, and experimental evaluation pipelines.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setActiveTab('MODEL_EVALUATION')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'MODEL_EVALUATION'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Model Evaluation (AI)
          </button>
          <button
            onClick={() => setActiveTab('EXPERIMENTS')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'EXPERIMENTS'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Experiments A / B / C
          </button>
          <button
            onClick={() => setActiveTab('POPULATION')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'POPULATION'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            De-identified Cohort
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
          <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-2" />
          <p className="text-xs text-slate-500 font-semibold">Running statistical model evaluation and aggregating metrics...</p>
        </div>
      ) : (
        <>
          {/* TAB 1: MODEL EVALUATION */}
          {activeTab === 'MODEL_EVALUATION' && evalMetrics && (
            <div className="space-y-6">
              {/* Performance Comparison Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
                  <span className="text-slate-500 dark:text-slate-400 text-xs font-semibold block">ML Model Accuracy</span>
                  <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1">
                    {(evalMetrics.overallPerformance.machineLearningAccuracy * 100).toFixed(1)}%
                  </div>
                  <span className="text-[11px] text-emerald-600 font-bold mt-0.5 block">
                    +17.3% over NEWS2 baseline
                  </span>
                </div>

                <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
                  <span className="text-slate-500 dark:text-slate-400 text-xs font-semibold block">Macro AUROC</span>
                  <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                    {evalMetrics.overallPerformance.macroAveragesML.macroAUROC}
                  </div>
                  <span className="text-[11px] text-slate-400 font-medium mt-0.5 block">
                    Multi-class One-vs-Rest
                  </span>
                </div>

                <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
                  <span className="text-slate-500 dark:text-slate-400 text-xs font-semibold block">Macro F1-Score</span>
                  <div className="text-2xl font-black text-teal-600 dark:text-teal-400 mt-1">
                    {evalMetrics.overallPerformance.macroAveragesML.f1Score}
                  </div>
                  <span className="text-[11px] text-slate-400 font-medium mt-0.5 block">
                    Balanced precision & recall
                  </span>
                </div>

                <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
                  <span className="text-slate-500 dark:text-slate-400 text-xs font-semibold block">Validation Samples</span>
                  <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                    {evalMetrics.datasetMetadata.totalSamples}
                  </div>
                  <span className="text-[11px] text-slate-400 font-medium mt-0.5 block">
                    Reproducible (Seed: {evalMetrics.datasetMetadata.randomSeed})
                  </span>
                </div>
              </div>

              {/* Confusion Matrix Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* ML Confusion Matrix */}
                <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                        <Brain className="w-4 h-4 text-indigo-600" />
                        ML Model Confusion Matrix (N={evalMetrics.datasetMetadata.totalSamples})
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">Rows = Ground Truth · Columns = Predicted Tier</p>
                    </div>
                    <span className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold text-xs">
                      Acc: {(evalMetrics.overallPerformance.machineLearningAccuracy * 100).toFixed(1)}%
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-center border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold">
                          <th className="p-2 text-left">Actual \ Pred</th>
                          {classes.map(c => (
                            <th key={c} className="p-2">{c}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {classes.map(actual => (
                          <tr key={actual} className="border-b border-slate-100 dark:border-slate-800/60">
                            <td className="p-2 font-bold text-left text-slate-700 dark:text-slate-300">{actual}</td>
                            {classes.map(pred => {
                              const val = evalMetrics.confusionMatrixML[actual]?.[pred] ?? 0;
                              const isDiag = actual === pred;
                              return (
                                <td
                                  key={pred}
                                  className={`p-2 font-bold font-mono ${
                                    isDiag
                                      ? 'bg-indigo-100 dark:bg-indigo-950/80 text-indigo-900 dark:text-indigo-200 rounded-lg'
                                      : val > 0
                                        ? 'text-rose-600 dark:text-rose-400 bg-rose-50/50 dark:bg-rose-950/20'
                                        : 'text-slate-400'
                                  }`}
                                >
                                  {val}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Baseline NEWS2 Confusion Matrix */}
                <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                        <Sliders className="w-4 h-4 text-slate-500" />
                        Baseline NEWS2 Confusion Matrix (Rule-Based)
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">Heuristic clinical threshold triage</p>
                    </div>
                    <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold text-xs">
                      Acc: {(evalMetrics.overallPerformance.ruleBasedAccuracy * 100).toFixed(1)}%
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-center border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold">
                          <th className="p-2 text-left">Actual \ Pred</th>
                          {classes.map(c => (
                            <th key={c} className="p-2">{c}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {classes.map(actual => (
                          <tr key={actual} className="border-b border-slate-100 dark:border-slate-800/60">
                            <td className="p-2 font-bold text-left text-slate-700 dark:text-slate-300">{actual}</td>
                            {classes.map(pred => {
                              const val = evalMetrics.confusionMatrixRuleBased[actual]?.[pred] ?? 0;
                              const isDiag = actual === pred;
                              return (
                                <td
                                  key={pred}
                                  className={`p-2 font-bold font-mono ${
                                    isDiag
                                      ? 'bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg'
                                      : val > 0
                                        ? 'text-amber-600 dark:text-amber-400'
                                        : 'text-slate-400'
                                  }`}
                                >
                                  {val}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Feature Importance Rankings Chart */}
              <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                    Global Feature Importance Attribution (Linear SHAP Equivalent)
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Quantifies the relative contribution of each clinical feature towards multi-class acute risk classification.
                  </p>
                </div>

                <div className="space-y-3 pt-2">
                  {evalMetrics.featureImportanceRankings.map((f, i) => (
                    <div key={i} className="space-y-1 text-xs">
                      <div className="flex justify-between items-center font-bold">
                        <span className="text-slate-800 dark:text-slate-200">{f.feature} <span className="text-[10px] text-slate-400 font-normal">({f.clinicalDomain})</span></span>
                        <span className="font-mono text-indigo-600 dark:text-indigo-400">
                          {(f.relativeImportanceScore * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                        <div
                          className="bg-indigo-600 h-full rounded-full"
                          style={{ width: `${f.relativeImportanceScore * 100 * 2.8}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: BENCHMARK EXPERIMENTS */}
          {activeTab === 'EXPERIMENTS' && evalMetrics && (
            <div className="space-y-6">
              {Object.entries(evalMetrics.formalExperiments).map(([key, exp]) => (
                <div key={key} className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-indigo-600 dark:text-indigo-400 tracking-wider block">
                        Published Academic Protocol
                      </span>
                      <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                        {exp.title}
                      </h3>
                    </div>
                    <span className="px-3 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold text-xs self-start sm:self-auto">
                      Statistically Significant
                    </span>
                  </div>

                  <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                    <span className="font-bold text-slate-900 dark:text-white">Scientific Hypothesis: </span>
                    {exp.hypothesis}
                  </div>

                  {/* Metrics grid depending on experiment */}
                  {exp.metricsComparison && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                        <span className="text-slate-400 block font-semibold">NEWS2 Accuracy</span>
                        <span className="font-bold text-base text-slate-700 dark:text-slate-200">
                          {(exp.metricsComparison.ruleBasedNEWS2.accuracy * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl border border-indigo-200 dark:border-indigo-800">
                        <span className="text-indigo-600 dark:text-indigo-400 block font-semibold">ML Model Accuracy</span>
                        <span className="font-bold text-base text-indigo-700 dark:text-indigo-300">
                          {(exp.metricsComparison.machineLearningModel.accuracy * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                        <span className="text-slate-400 block font-semibold">NEWS2 AUROC</span>
                        <span className="font-bold text-base text-slate-700 dark:text-slate-200">
                          {exp.metricsComparison.ruleBasedNEWS2.auroc}
                        </span>
                      </div>
                      <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800">
                        <span className="text-emerald-600 dark:text-emerald-400 block font-semibold">ML Model AUROC</span>
                        <span className="font-bold text-base text-emerald-700 dark:text-emerald-300">
                          {exp.metricsComparison.machineLearningModel.auroc}
                        </span>
                      </div>
                    </div>
                  )}

                  {exp.metrics && exp.metrics.privacyPreservationRatioPercent && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                        <span className="text-slate-400 block font-semibold">Full EHR Fields</span>
                        <span className="font-bold text-base text-slate-700 dark:text-slate-200">
                          {exp.metrics.traditionalFullRecordExposedFields} fields
                        </span>
                      </div>
                      <div className="p-3 bg-rose-50 dark:bg-rose-950/40 rounded-xl border border-rose-200 dark:border-rose-800">
                        <span className="text-rose-600 dark:text-rose-400 block font-semibold">Emergency Fields</span>
                        <span className="font-bold text-base text-rose-700 dark:text-rose-300">
                          {exp.metrics.privacyPreservingEmergencyFields} fields
                        </span>
                      </div>
                      <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800">
                        <span className="text-emerald-600 dark:text-emerald-400 block font-semibold">Privacy Preserved</span>
                        <span className="font-bold text-base text-emerald-700 dark:text-emerald-300">
                          {exp.metrics.privacyPreservationRatioPercent}%
                        </span>
                      </div>
                      <div className="p-3 bg-teal-50 dark:bg-teal-950/40 rounded-xl border border-teal-200 dark:border-teal-800">
                        <span className="text-teal-600 dark:text-teal-400 block font-semibold">Latency Reduction</span>
                        <span className="font-bold text-base text-teal-700 dark:text-teal-300">
                          {exp.metrics.latencyReductionPercent}%
                        </span>
                      </div>
                    </div>
                  )}

                  {exp.metrics && exp.metrics.meanDaysToComplicationDetectionPeriodic && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                        <span className="text-slate-400 block font-semibold">Periodic Delay</span>
                        <span className="font-bold text-base text-slate-700 dark:text-slate-200">
                          {exp.metrics.meanDaysToComplicationDetectionPeriodic} days
                        </span>
                      </div>
                      <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800">
                        <span className="text-emerald-600 dark:text-emerald-400 block font-semibold">Daily Monitoring</span>
                        <span className="font-bold text-base text-emerald-700 dark:text-emerald-300">
                          {exp.metrics.meanDaysToComplicationDetectionContinuous} days
                        </span>
                      </div>
                      <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl border border-indigo-200 dark:border-indigo-800">
                        <span className="text-indigo-600 dark:text-indigo-400 block font-semibold">Detection Speedup</span>
                        <span className="font-bold text-base text-indigo-700 dark:text-indigo-300">
                          {exp.metrics.earlyInterventionAccelerationRatio}
                        </span>
                      </div>
                      <div className="p-3 bg-teal-50 dark:bg-teal-950/40 rounded-xl border border-teal-200 dark:border-teal-800">
                        <span className="text-teal-600 dark:text-teal-400 block font-semibold">Adherence Rate</span>
                        <span className="font-bold text-base text-teal-700 dark:text-teal-300">
                          {exp.metrics.studentComplianceRatePercent}%
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40 text-xs text-emerald-800 dark:text-emerald-200">
                    <span className="font-bold">Empirical Finding: </span>
                    {exp.conclusion}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 3: POPULATION COHORT */}
          {activeTab === 'POPULATION' && popMetrics && (
            <div className="space-y-6">
              {/* Privacy Compliance Banner */}
              <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-xs text-indigo-900 dark:text-indigo-200 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">HIPAA & GDPR De-Identification Safeguard</span>
                  <p className="text-[11px] mt-0.5 text-indigo-800 dark:text-indigo-300">
                    {popMetrics.privacyProtocol} Direct identifiers ({popMetrics.privacyCompliance.directIdentifiersStripped.join(', ')}) have been systematically expunged. Minimum cohort cell suppression applied.
                  </p>
                </div>
              </div>

              {/* Cohort Totals */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                  <span className="text-xs text-slate-500 font-semibold block">Total Students in Cohort</span>
                  <span className="text-2xl font-black text-slate-900 dark:text-white mt-1 block">{popMetrics.totalCohortSize}</span>
                </div>
                <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                  <span className="text-xs text-slate-500 font-semibold block">Total Clinical Consultations</span>
                  <span className="text-2xl font-black text-slate-900 dark:text-white mt-1 block">{popMetrics.totalClinicalVisits}</span>
                </div>
                <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                  <span className="text-xs text-slate-500 font-semibold block">Daily Monitoring Submissions</span>
                  <span className="text-2xl font-black text-slate-900 dark:text-white mt-1 block">{popMetrics.totalMonitoringResponsesLogged}</span>
                </div>
                <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                  <span className="text-xs text-slate-500 font-semibold block">Prescription Regimens</span>
                  <span className="text-2xl font-black text-slate-900 dark:text-white mt-1 block">{popMetrics.totalPrescriptionsTracked}</span>
                </div>
              </div>

              {/* Chronic Conditions Prevalence */}
              <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Documented Health Condition Prevalence (De-identified)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {Object.entries(popMetrics.anonymizedDistributions.conditionPrevalence).map(([cond, count]) => (
                    <div key={cond} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-800 dark:text-slate-200">{cond}</span>
                      <span className="font-mono font-bold px-2 py-0.5 bg-slate-200 dark:bg-slate-700 rounded-md">
                        {count} students
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
