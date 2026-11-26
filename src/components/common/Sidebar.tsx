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
  Users,
  Stethoscope,
  Shield,
  Settings,
  BarChart3,
  Brain
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
        { id: 'student-calendar', label: 'Health Calendar', icon: Calendar }
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
    } else {
      // ADMIN
      return [
        { id: 'admin-dashboard', label: 'Executive Dashboard', icon: BarChart3 },
        { id: 'admin-inventory', label: 'Pharmacy & Stock Inventory', icon: Pill, badge: 'Stock' },
        { id: 'admin-students', label: 'Student Management', icon: Users },
        { id: 'admin-staff', label: 'Doctor Profile (Dr. Nivetha)', icon: Stethoscope },
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
    <aside className="w-64 shrink-0 h-full overflow-y-auto bg-white dark:bg-[#0A1931] border-r border-[#B3CFE5]/40 dark:border-[#1A3D63] text-[#0A1931] dark:text-[#F6FAFD] p-4 flex flex-col justify-between transition-colors">
      
      <div className="space-y-1">
        <div className="px-3 py-2 text-[10px] font-extrabold uppercase tracking-wider text-[#4A7FA7] dark:text-[#B3CFE5]/70">
          {getWorkspaceTitle()}
        </div>

        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#1A3D63] text-white shadow-md shadow-[#1A3D63]/25'
                  : 'text-[#4A7FA7] dark:text-[#B3CFE5]/80 hover:bg-[#B3CFE5]/20 hover:text-[#0A1931] dark:hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-[#4A7FA7] dark:text-[#B3CFE5]/60'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className={`px-1.5 py-0.5 text-[9px] font-bold uppercase rounded-md ${
                  isActive
                    ? 'bg-white/20 text-white'
                    : item.badge === 'Done'
                      ? 'bg-[#B3CFE5]/30 text-[#1A3D63] border border-[#B3CFE5]'
                      : item.badge === 'Active' || item.badge === 'Alerts'
                        ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                        : 'bg-[#B3CFE5]/30 text-[#1A3D63] border border-[#B3CFE5]'
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Footer Info Box */}
      <div className="p-3 rounded-xl text-xs border bg-[#F6FAFD] dark:bg-[#0A1931]/60 border-[#B3CFE5]/40 dark:border-[#1A3D63] transition-colors mt-6">
        <div className="flex items-center gap-2 font-semibold mb-1">
          <Shield className="w-3.5 h-3.5 text-[#1A3D63]" />
          <span className="text-[#0A1931] dark:text-[#F6FAFD] font-bold">MedicoAssist v2.5</span>
        </div>
        <p className="text-[#4A7FA7] dark:text-[#B3CFE5]/70 text-[10px] leading-tight">
          Research-Grade Clinical Decision Support · HIPAA Minimum Necessary Standard
        </p>
      </div>

    </aside>
  );
};
