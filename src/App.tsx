import React, { useState, useEffect } from 'react';

// Common Components
import { Navbar } from './components/common/Navbar';
import { Sidebar } from './components/common/Sidebar';
import { EmergencyModal } from './components/common/EmergencyModal';
import { VersionDiffViewer } from './components/common/VersionDiffViewer';

// Student Views
import { StudentDashboard } from './components/student/StudentDashboard';
import { StudentProfile } from './components/student/StudentProfile';
import { StudentMedicalHistory } from './components/student/StudentMedicalHistory';
import { StudentPrescriptions } from './components/student/StudentPrescriptions';
import { StudentBMIHealth } from './components/student/StudentBMIHealth';
import { StudentNutrition } from './components/student/StudentNutrition';
import { StudentDailyCheck } from './components/student/StudentDailyCheck';
import { StudentCalendar } from './components/student/StudentCalendar';

// Medical Centre Views
import { MedicalDashboard } from './components/medical/MedicalDashboard';
import { StudentSearchDirectory } from './components/medical/StudentSearchDirectory';
import { NewVisitConsultation } from './components/medical/NewVisitConsultation';
import { PrescriptionManager } from './components/medical/PrescriptionManager';
import { DailyMonitoringTriage } from './components/medical/DailyMonitoringTriage';
import { NutritionPlanBuilder } from './components/medical/NutritionPlanBuilder';
import { MedicalCalendar } from './components/medical/MedicalCalendar';

// Admin Views
import { AdminDashboard } from './components/admin/AdminDashboard';
import { StudentManagement } from './components/admin/StudentManagement';
import { MedicalStaffManagement } from './components/admin/MedicalStaffManagement';
import { RoleManagement } from './components/admin/RoleManagement';
import { AuditLogViewer } from './components/admin/AuditLogViewer';
import { RestrictedEmergencyAccessLog } from './components/admin/RestrictedEmergencyAccessLog';
import { SystemSettings } from './components/admin/SystemSettings';

// Researcher & Emergency Responder Views
import { ResearcherDashboard } from './components/researcher/ResearcherDashboard';
import { EmergencyResponderPortal } from './components/emergency/EmergencyResponderPortal';

// Services & Types
import { authService } from './services/authService';
import { healthStore } from './services/healthStore';
import { User } from './types';

import { LoginPage } from './components/auth/LoginPage';
import { CompleteProfileModal } from './components/auth/CompleteProfileModal';

export function App() {
  const [currentUser, setCurrentUser] = useState<User>(authService.getCurrentUser());
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(authService.isAuthenticated());
  const [currentTab, setCurrentTab] = useState<string>('student-dashboard');
  const [showCompleteProfile, setShowCompleteProfile] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Modals
  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false);
  const [isDiffViewerOpen, setIsDiffViewerOpen] = useState(false);

  useEffect(() => {
    const unsub = authService.subscribe((user, auth) => {
      if (user) setCurrentUser(user);
      setIsAuthenticated(auth);
      if (!auth) {
        setCurrentTab('login');
      } else {
        if (user?.role === 'STUDENT' && !currentTab.startsWith('student-')) {
          setCurrentTab('student-dashboard');
        } else if (user?.role === 'MEDICAL_STAFF' && !currentTab.startsWith('medical-')) {
          setCurrentTab('medical-dashboard');
        } else if (user?.role === 'ADMIN' && !currentTab.startsWith('admin-')) {
          setCurrentTab('admin-dashboard');
        } else if (user?.role === 'RESEARCHER' && !currentTab.startsWith('research-')) {
          setCurrentTab('research-dashboard');
        } else if (user?.role === 'EMERGENCY_RESPONDER' && !currentTab.startsWith('emergency-')) {
          setCurrentTab('emergency-responder-portal');
        }
      }
    });

    return () => unsub();
  }, [currentTab]);

  const handleNavigate = (tab: string) => {
    if (tab === 'login') {
      authService.logout();
      setCurrentTab('login');
      return;
    }

    // Role-based Route Protection Guards
    if (currentUser.role === 'STUDENT' && !tab.startsWith('student-')) {
      healthStore.logAudit(
        currentUser.studentId || currentUser.id,
        currentUser.name,
        'STUDENT',
        'UNAUTHORIZED_ROUTE_ATTEMPT',
        tab,
        `Student blocked from accessing ${tab}`,
        'HIGH'
      );
      alert(`RBAC Access Denied: Student accounts cannot access ${tab}.`);
      setCurrentTab('student-dashboard');
      return;
    }

    if (currentUser.role === 'RESEARCHER' && (tab.startsWith('student-') || tab.startsWith('medical-') || tab === 'admin-students')) {
      alert(`Privacy Rule Denied: Researchers are restricted to de-identified population analytics.`);
      setCurrentTab('research-dashboard');
      return;
    }

    if (currentUser.role === 'EMERGENCY_RESPONDER' && (tab.startsWith('student-') || tab.startsWith('medical-') || tab.startsWith('admin-'))) {
      alert(`Role Access Denied: Emergency responders can only access the emergency triage desk.`);
      setCurrentTab('emergency-responder-portal');
      return;
    }

    setCurrentTab(tab);
  };

  const renderActiveView = () => {
    switch (currentTab) {
      // Student Views
      case 'student-dashboard':
        return <StudentDashboard onNavigate={handleNavigate} onOpenEmergencyModal={() => setIsEmergencyModalOpen(true)} />;
      case 'student-profile':
        return <StudentProfile />;
      case 'student-history':
        return <StudentMedicalHistory />;
      case 'student-prescriptions':
        return <StudentPrescriptions onOpenDiffViewer={() => setIsDiffViewerOpen(true)} />;
      case 'student-bmi':
        return <StudentBMIHealth />;
      case 'student-nutrition':
        return <StudentNutrition />;
      case 'student-daily-check':
        return <StudentDailyCheck />;
      case 'student-calendar':
        return <StudentCalendar />;
      case 'student-emergency':
        return (
          <div className="p-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 text-center space-y-4">
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Emergency Digital Card</h2>
            <p className="text-xs text-slate-500">Launch restricted emergency card & cryptographic token view.</p>
            <button
              onClick={() => setIsEmergencyModalOpen(true)}
              className="px-5 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs"
            >
              Open Digital Emergency Card
            </button>
          </div>
        );

      // Medical Centre Views
      case 'medical-dashboard':
        return <MedicalDashboard onNavigate={handleNavigate} />;
      case 'medical-directory':
        return <StudentSearchDirectory onNavigate={handleNavigate} />;
      case 'medical-new-visit':
        return <NewVisitConsultation onNavigate={handleNavigate} />;
      case 'medical-prescriptions':
        return <PrescriptionManager />;
      case 'medical-monitoring':
        return <DailyMonitoringTriage onNavigate={handleNavigate} />;
      case 'medical-nutrition':
        return <NutritionPlanBuilder />;
      case 'medical-calendar':
        return <MedicalCalendar />;

      // Admin Views
      case 'admin-dashboard':
        return <AdminDashboard onNavigate={handleNavigate} />;
      case 'admin-students':
        return <StudentManagement />;
      case 'admin-staff':
        return <MedicalStaffManagement />;
      case 'admin-roles':
        return <RoleManagement />;
      case 'admin-research':
        return <ResearcherDashboard />;
      case 'admin-emergency-logs':
        return <RestrictedEmergencyAccessLog />;
      case 'admin-audit-logs':
        return <AuditLogViewer />;
      case 'admin-settings':
        return <SystemSettings />;

      // Researcher Views
      case 'research-dashboard':
      case 'research-experiments':
      case 'research-cohort':
        return <ResearcherDashboard />;

      // Emergency Responder Views
      case 'emergency-responder-portal':
      case 'emergency-responder-metrics':
        return <EmergencyResponderPortal />;

      default:
        return <StudentDashboard onNavigate={handleNavigate} onOpenEmergencyModal={() => setIsEmergencyModalOpen(true)} />;
    }
  };

  const getThemeClass = () => {
    if (currentUser.role === 'STUDENT') return 'theme-student';
    if (currentUser.role === 'MEDICAL_STAFF') return 'theme-medical';
    if (currentUser.role === 'RESEARCHER') return 'theme-researcher';
    if (currentUser.role === 'EMERGENCY_RESPONDER') return 'theme-emergency';
    return 'theme-admin';
  };

  const studentId = currentUser.studentId || '';
  const activeRx = studentId ? healthStore.getPrescriptionsForStudent(studentId)[0] : undefined;
  const v1 = activeRx?.history[activeRx.history.length - 1];
  const v2 = activeRx?.currentVersion;

  if (!isAuthenticated || currentTab === 'login') {
    return (
      <LoginPage
        onLoginSuccess={role => {
          if (role === 'STUDENT') {
            const user = authService.getCurrentUser();
            const sid = user.studentId || user.id;
            const profile = sid ? healthStore.getStudentProfile(sid) : undefined;
            if (profile && !profile.profileComplete) {
              setShowCompleteProfile(true);
            }
          }
        }}
      />
    );
  }

  return (
    <div className={`min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 ${getThemeClass()} transition-colors duration-200`}>
      <Navbar
        currentTab={currentTab}
        onOpenEmergencyModal={() => setIsEmergencyModalOpen(true)}
        onNavigate={handleNavigate}
        darkMode={darkMode}
        onToggleDark={() => setDarkMode(!darkMode)}
      />

      <div className="flex">
        <Sidebar
          role={currentUser.role}
          currentTab={currentTab}
          onNavigate={handleNavigate}
        />

        <main className="flex-1 p-6 max-w-7xl mx-auto overflow-x-hidden">
          {renderActiveView()}
        </main>
      </div>

      {/* Emergency Card Modal */}
      <EmergencyModal
        isOpen={isEmergencyModalOpen}
        onClose={() => setIsEmergencyModalOpen(false)}
        studentId={currentUser.studentId || currentUser.id}
      />

      {/* Prescription Version Diff Viewer Modal */}
      {v1 && v2 && activeRx && (
        <VersionDiffViewer
          isOpen={isDiffViewerOpen}
          onClose={() => setIsDiffViewerOpen(false)}
          prescription={activeRx}
          v1={v1}
          v2={v2}
        />
      )}

      {/* Complete Medical Profile Modal for First-time Students */}
      {showCompleteProfile && studentId && healthStore.getStudentProfile(studentId) && (
        <CompleteProfileModal
          studentId={studentId}
          existingProfile={healthStore.getStudentProfile(studentId)!}
          onComplete={() => {
            setShowCompleteProfile(false);
          }}
        />
      )}
    </div>
  );
}

export default App;
