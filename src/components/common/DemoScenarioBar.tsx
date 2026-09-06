import React, { useState } from 'react';
import { Play, SkipForward, RotateCcw, CheckCircle2, ChevronRight, Sparkles, Layers } from 'lucide-react';
import { authService } from '../../services/authService';
import { healthStore } from '../../services/healthStore';

interface DemoScenarioBarProps {
  currentTab: string;
  onNavigate: (tab: string) => void;
  onOpenEmergencyModal: () => void;
  onOpenDiffViewer: () => void;
}

export const DemoScenarioBar: React.FC<DemoScenarioBarProps> = ({
  currentTab,
  onNavigate,
  onOpenEmergencyModal,
  onOpenDiffViewer
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [collapsed, setCollapsed] = useState(false);

  const steps = [
    { num: 1, label: 'Student Login', tab: 'student-dashboard', role: 'STUDENT', desc: 'Alex Rivera logs into Student Dashboard' },
    { num: 2, label: 'Doctor Search Student', tab: 'medical-directory', role: 'MEDICAL_STAFF', desc: 'Dr. Jenkins searches Alex Rivera (STU1023)' },
    { num: 3, label: 'Past Vitals Comparison', tab: 'medical-new-visit', role: 'MEDICAL_STAFF', desc: 'View historical BP (118/76) vs current vitals entry' },
    { num: 4, label: 'Create Prescription V1', tab: 'medical-prescriptions', role: 'MEDICAL_STAFF', desc: 'Doctor issues Prescription #rx_101 for Bronchitis' },
    { num: 5, label: 'AI Nutrition Approved', tab: 'medical-nutrition', role: 'MEDICAL_STAFF', desc: 'AI meal plan generated & doctor approves it' },
    { num: 6, label: 'Follow-up Scheduled', tab: 'medical-calendar', role: 'MEDICAL_STAFF', desc: 'Reconsultation scheduled for Aug 28' },
    { num: 7, label: 'Calendar & Notifs Sync', tab: 'student-calendar', role: 'STUDENT', desc: 'Both calendars & notification drawers updated' },
    { num: 8, label: 'Student Views Rx & Diet', tab: 'student-prescriptions', role: 'STUDENT', desc: 'Student reviews active Rx V1 & approved nutrition plan' },
    { num: 9, label: 'Daily Check Submission', tab: 'student-daily-check', role: 'STUDENT', desc: 'Student submits daily monitoring response' },
    { num: 10, label: 'Doctor Monitoring Triage', tab: 'medical-monitoring', role: 'MEDICAL_STAFF', desc: 'Medical centre receives response & reviews 7-day summary' },
    { num: 11, label: 'Prescription V2 Issued', tab: 'medical-prescriptions', role: 'MEDICAL_STAFF', desc: 'Doctor updates Rx to Version 2 with new instructions' },
    { num: 12, label: 'Rx V1 vs V2 Version Diff', tab: 'student-prescriptions', role: 'STUDENT', action: 'DIFF', desc: 'Student alerted; compares Version 1 vs Version 2 diff' },
    { num: 13, label: 'Emergency QR Scan Audit', tab: 'admin-emergency-logs', role: 'ADMIN', action: 'QR', desc: 'Scan emergency token; minimal info exposed & logged' },
    { num: 14, label: 'Admin Enterprise Audit', tab: 'admin-audit-logs', role: 'ADMIN', desc: 'Admin reviews full compliance audit trail' }
  ];

  const goToStep = (stepNum: number) => {
    const step = steps.find(s => s.num === stepNum);
    if (!step) return;

    setCurrentStep(stepNum);
    authService.switchRole(step.role as any);
    onNavigate(step.tab);

    if (step.action === 'QR') {
      setTimeout(() => onOpenEmergencyModal(), 300);
    } else if (step.action === 'DIFF') {
      setTimeout(() => onOpenDiffViewer(), 300);
    }
  };

  const handleNext = () => {
    if (currentStep < steps.length) {
      goToStep(currentStep + 1);
    }
  };

  const handleReset = () => {
    healthStore.resetState();
    goToStep(1);
  };

  const activeStep = steps.find(s => s.num === currentStep) || steps[0];

  return (
    <div className="fixed bottom-3 left-1/2 -translate-x-1/2 z-40 w-full max-w-4xl px-4 animate-fade-in">
      <div className="bg-slate-950/95 text-slate-100 rounded-2xl p-3 shadow-2xl border border-emerald-500/40 backdrop-blur-md">
        
        {/* Top Control Header */}
        <div className="flex items-center justify-between gap-3 text-xs mb-2">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="font-extrabold uppercase tracking-wider bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
              End-to-End Workflow Scenario Simulator
            </span>
            <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[10px] text-slate-400 font-mono">
              Step {currentStep} of {steps.length}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleReset}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold flex items-center gap-1 transition-all"
              title="Reset state and return to Step 1"
            >
              <RotateCcw className="w-3 h-3 text-slate-400" /> Reset Scenario
            </button>
            
            <button
              onClick={handleNext}
              disabled={currentStep >= steps.length}
              className="px-3 py-1 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-[11px] font-bold flex items-center gap-1 shadow-md shadow-emerald-500/20 disabled:opacity-50 transition-all"
            >
              <span>Next Step</span> <ChevronRight className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => setCollapsed(!collapsed)}
              className="text-slate-400 hover:text-slate-200 text-[10px] underline ml-1"
            >
              {collapsed ? 'Expand' : 'Hide Bar'}
            </button>
          </div>
        </div>

        {!collapsed && (
          <div className="space-y-2">
            {/* Step Description */}
            <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-bold text-emerald-400">{activeStep.label}:</span>
                <span className="text-slate-300">{activeStep.desc}</span>
              </div>
              <span className="text-[10px] font-semibold text-slate-500 uppercase">
                Panel: {activeStep.role}
              </span>
            </div>

            {/* Step Pill Buttons */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              {steps.map(s => {
                const isActive = s.num === currentStep;
                const isPassed = s.num < currentStep;
                return (
                  <button
                    key={s.num}
                    onClick={() => goToStep(s.num)}
                    className={`shrink-0 px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 ${
                      isActive
                        ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30'
                        : isPassed
                          ? 'bg-slate-800 text-emerald-400 hover:bg-slate-700'
                          : 'bg-slate-900/80 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    {isPassed ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : <span>{s.num}.</span>}
                    <span>{s.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
