import React from 'react';
import {
  LayoutDashboard,
  User,
  History,
  Pill,
  Activity,
  Apple,
  Calendar,
  CheckSquare,
  AlertTriangle,
  Users,
  Stethoscope,
  Shield,
  FileText,
  FileCheck,
  Bell,
  Settings,
  Flame,
  KeyRound,
  BarChart3,
  Brain,
  ShieldAlert,
  QrCode
} from 'lucide-react';
import { Role } from '../../types';
import { healthStore } from '../../services/healthStore';
import { authService } from '../../services/authService';

interface SidebarProps {
  role: Role;
  currentTab: string;
  onNavigate: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ role, currentTab, onNavigate }) => {
  const currentUser = authService.getCurrentUser();
  const studentId = currentUser.studentId || currentUser.id;
  const monitoringPlan = role === 'STUDENT' && studentId ? healthStore.getMonitoringPlan(studentId) : null;
  const todayStr = new Date().toISOString().split('T')[0];
  const responses = role === 'STUDENT' && studentId ? healthStore.getMonitoringResponses(studentId) : [];
  const submittedToday = responses.some(r => r.date === todayStr);

  const getNavItems = () => {
    if (role === 'STUDENT') {
      return [
        { id: 'student-dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'student-profile', label: 'Medical Profile', icon: User },
        { id: 'student-history', label: 'Medical History & Ledger', icon: History },
        { id: 'student-prescriptions', label: 'Prescriptions', icon: Pill },
        { id: 'student-bmi', label: 'BMI & Measurements', icon: Activity },
        { id: 'student-nutrition', label: 'Nutrition Plan', icon: Apple },
        { id: 'student-daily-check', label: 'Daily Health Check', icon: CheckSquare, badge: monitoringPlan ? (submittedToday ? 'Done' : 'Active') : undefined },
        { id: 'student-calendar', label: 'Health Calendar', icon: Calendar },
        { id: 'student-emergency', label: 'Emergency Medical Card', icon: AlertTriangle, badge: 'Protected' }
      ];
    } else if (role === 'MEDICAL_STAFF') {
      return [
        { id: 'medical-dashboard', label: 'Clinical Queue', icon: LayoutDashboard },
        { id: 'medical-directory', label: 'Student Search & Directory', icon: Users },
        { id: 'medical-new-visit', label: 'New Consultation & EHR', icon: Stethoscope, badge: 'CDSS AI' },
        { id: 'medical-prescriptions', label: 'Prescription Management', icon: Pill },
        { id: 'medical-monitoring', label: 'Daily Monitoring Triage', icon: Activity, badge: 'Alerts' },
        { id: 'medical-nutrition', label: 'Nutrition Plan Builder', icon: Apple },
        { id: 'medical-calendar', label: 'Medical Centre Calendar', icon: Calendar }
      ];
    } else if (role === 'RESEARCHER') {
      return [
        { id: 'research-dashboard', label: 'Model Evaluation (AI)', icon: Brain, badge: 'XAI' },
        { id: 'research-experiments', label: 'Benchmark Experiments', icon: BarChart3, badge: 'A/B/C' },
        { id: 'research-cohort', label: 'De-identified Cohort', icon: Users, badge: 'k-Anon' }
      ];
    } else if (role === 'EMERGENCY_RESPONDER') {
      return [
        { id: 'emergency-responder-portal', label: 'Emergency Scanner Desk', icon: ShieldAlert, badge: 'Triage' },
        { id: 'emergency-responder-metrics', label: 'Disclosure Score Metrics', icon: Activity }
      ];
    } else {
      // ADMIN
      return [
        { id: 'admin-dashboard', label: 'Executive Dashboard', icon: BarChart3 },
        { id: 'admin-students', label: 'Student Management', icon: Users },
        { id: 'admin-staff', label: 'Medical Staff & Doctors', icon: Stethoscope },
        { id: 'admin-roles', label: 'RBAC & Access Control', icon: KeyRound },
        { id: 'admin-research', label: 'Research & Model Analytics', icon: Brain, badge: 'Research' },
        { id: 'admin-emergency-logs', label: 'Emergency Access Audit', icon: AlertTriangle, badge: 'Restricted' },
        { id: 'admin-audit-logs', label: 'Audit & Compliance Logs', icon: FileCheck },
        { id: 'admin-settings', label: 'System & Security Settings', icon: Settings }
      ];
    }
  };

  const navItems = getNavItems();

  const getWorkspaceTitle = () => {
    switch (role) {
      case 'STUDENT': return 'Wellness Portal';
      case 'MEDICAL_STAFF': return 'Clinical Workspace (EHR)';
      case 'RESEARCHER': return 'Academic Research Portal';
      case 'EMERGENCY_RESPONDER': return 'Emergency Triage Console';
      default: return 'Enterprise Administration';
    }
  };

  return (
    <aside className="w-64 shrink-0 sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 p-4 flex flex-col justify-between transition-colors">
      
      <div className="space-y-1">
        <div className="px-3 py-2 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          {getWorkspaceTitle()}
        </div>

        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                isActive
                  ? role === 'STUDENT'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                    : role === 'MEDICAL_STAFF'
                      ? 'bg-teal-600 text-white shadow-md shadow-teal-600/20'
                      : role === 'RESEARCHER'
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                        : role === 'EMERGENCY_RESPONDER'
                          ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
                          : 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-md'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400 dark:text-slate-500'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className={`px-1.5 py-0.5 text-[9px] font-bold uppercase rounded-md ${
                  isActive
                    ? 'bg-white/20 text-white'
                    : item.badge === 'Done'
                      ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                      : item.badge === 'Active' || item.badge === 'Alerts'
                        ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                        : 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Footer Info Box */}
      <div className="p-3 rounded-xl text-xs border bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-800 transition-colors mt-6">
        <div className="flex items-center gap-2 font-semibold mb-1">
          <Shield className="w-3.5 h-3.5 text-emerald-500" />
          <span className="text-slate-800 dark:text-slate-200 font-bold">MedicoAssist v2.5</span>
        </div>
        <p className="text-slate-500 dark:text-slate-400 text-[10px] leading-tight">
          Research-Grade Clinical Decision Support · HIPAA Minimum Necessary Standard
        </p>
      </div>

    </aside>
  );
};
