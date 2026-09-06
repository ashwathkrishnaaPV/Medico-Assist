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
  BarChart3
} from 'lucide-react';
import { Role } from '../../types';

interface SidebarProps {
  role: Role;
  currentTab: string;
  onNavigate: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ role, currentTab, onNavigate }) => {
  const getNavItems = () => {
    if (role === 'STUDENT') {
      return [
        { id: 'student-dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'student-profile', label: 'Medical Profile', icon: User },
        { id: 'student-history', label: 'Medical History', icon: History },
        { id: 'student-prescriptions', label: 'Prescriptions', icon: Pill },
        { id: 'student-bmi', label: 'BMI & Measurements', icon: Activity },
        { id: 'student-nutrition', label: 'Nutrition Plan', icon: Apple },
        { id: 'student-daily-check', label: 'Daily Health Check', icon: CheckSquare, badge: 'Active' },
        { id: 'student-calendar', label: 'Health Calendar', icon: Calendar },
        { id: 'student-emergency', label: 'Emergency Medical Card', icon: AlertTriangle }
      ];
    } else if (role === 'MEDICAL_STAFF') {
      return [
        { id: 'medical-dashboard', label: 'Clinical Queue', icon: LayoutDashboard },
        { id: 'medical-directory', label: 'Student Search & Directory', icon: Users },
        { id: 'medical-new-visit', label: 'New Visit Consultation', icon: Stethoscope, badge: 'EHR' },
        { id: 'medical-prescriptions', label: 'Prescription Management', icon: Pill },
        { id: 'medical-monitoring', label: 'Daily Monitoring Triage', icon: Activity, badge: 'Alerts' },
        { id: 'medical-nutrition', label: 'AI Nutrition Builder', icon: Apple },
        { id: 'medical-calendar', label: 'Medical Centre Calendar', icon: Calendar }
      ];
    } else {
      // ADMIN
      return [
        { id: 'admin-dashboard', label: 'Executive Dashboard', icon: BarChart3 },
        { id: 'admin-students', label: 'Student Management', icon: Users },
        { id: 'admin-staff', label: 'Medical Staff & Doctors', icon: Stethoscope },
        { id: 'admin-roles', label: 'RBAC & Access Control', icon: KeyRound },
        { id: 'admin-emergency-logs', label: 'Emergency Access Audit', icon: AlertTriangle, badge: 'Restricted' },
        { id: 'admin-audit-logs', label: 'Audit & Compliance Logs', icon: FileCheck },
        { id: 'admin-settings', label: 'System & Security Settings', icon: Settings }
      ];
    }
  };

  const navItems = getNavItems();

  return (
    <aside className="w-64 shrink-0 sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 p-4 flex flex-col justify-between transition-colors">
      
      <div className="space-y-1">
        <div className="px-3 py-2 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          {role === 'STUDENT' ? 'Wellness Portal' : role === 'MEDICAL_STAFF' ? 'Clinical Workspace' : 'Enterprise Administration'}
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
                      : 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
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
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Footer Info Box */}
      <div className="p-3 rounded-xl text-xs border bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-800 transition-colors">
        <div className="flex items-center gap-2 font-semibold mb-1">
          <Shield className="w-3.5 h-3.5 text-emerald-500" />
          <span className="text-slate-800 dark:text-slate-200 font-bold">CampusHealth v2.4</span>
        </div>
        <p className="text-slate-500 dark:text-slate-400 text-[10px] leading-tight">HIPAA/GDPR Security Architecture · RBAC Protected</p>
      </div>

    </aside>
  );
};
