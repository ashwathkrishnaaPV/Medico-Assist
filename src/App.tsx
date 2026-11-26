import { useState, useEffect, lazy, Suspense } from 'react';

// Common Components
import { Navbar } from './components/common/Navbar';
import { Sidebar } from './components/common/Sidebar';
import { VersionDiffViewer } from './components/common/VersionDiffViewer';

// Lazy-loaded Route Views (Code Splitting)
const StudentDashboard = lazy(() => import('./components/student/StudentDashboard').then(m => ({ default: m.StudentDashboard })));
const StudentProfile = lazy(() => import('./components/student/StudentProfile').then(m => ({ default: m.StudentProfile })));
const StudentMedicalHistory = lazy(() => import('./components/student/StudentMedicalHistory').then(m => ({ default: m.StudentMedicalHistory })));
const StudentPrescriptions = lazy(() => import('./components/student/StudentPrescriptions').then(m => ({ default: m.StudentPrescriptions })));
const StudentBMIHealth = lazy(() => import('./components/student/StudentBMIHealth').then(m => ({ default: m.StudentBMIHealth })));
const StudentNutrition = lazy(() => import('./components/student/StudentNutrition').then(m => ({ default: m.StudentNutrition })));
const StudentDailyCheck = lazy(() => import('./components/student/StudentDailyCheck').then(m => ({ default: m.StudentDailyCheck })));
const StudentCalendar = lazy(() => import('./components/student/StudentCalendar').then(m => ({ default: m.StudentCalendar })));

const MedicalDashboard = lazy(() => import('./components/medical/MedicalDashboard').then(m => ({ default: m.MedicalDashboard })));
const StudentSearchDirectory = lazy(() => import('./components/medical/StudentSearchDirectory').then(m => ({ default: m.StudentSearchDirectory })));
const NewVisitConsultation = lazy(() => import('./components/medical/NewVisitConsultation').then(m => ({ default: m.NewVisitConsultation })));
const PrescriptionManager = lazy(() => import('./components/medical/PrescriptionManager').then(m => ({ default: m.PrescriptionManager })));
const DailyMonitoringTriage = lazy(() => import('./components/medical/DailyMonitoringTriage').then(m => ({ default: m.DailyMonitoringTriage })));
const NutritionPlanBuilder = lazy(() => import('./components/medical/NutritionPlanBuilder').then(m => ({ default: m.NutritionPlanBuilder })));
const MedicalCalendar = lazy(() => import('./components/medical/MedicalCalendar').then(m => ({ default: m.MedicalCalendar })));

const AdminDashboard = lazy(() => import('./components/admin/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
const MedicineInventoryManager = lazy(() => import('./components/admin/MedicineInventoryManager').then(m => ({ default: m.MedicineInventoryManager })));
const StudentManagement = lazy(() => import('./components/admin/StudentManagement').then(m => ({ default: m.StudentManagement })));
const MedicalStaffManagement = lazy(() => import('./components/admin/MedicalStaffManagement').then(m => ({ default: m.MedicalStaffManagement })));
const RoleManagement = lazy(() => import('./components/admin/RoleManagement').then(m => ({ default: m.RoleManagement })));
const AuditLogViewer = lazy(() => import('./components/admin/AuditLogViewer').then(m => ({ default: m.AuditLogViewer })));
const SystemSettings = lazy(() => import('./components/admin/SystemSettings').then(m => ({ default: m.SystemSettings })));

const ResearcherDashboard = lazy(() => import('./components/researcher/ResearcherDashboard').then(m => ({ default: m.ResearcherDashboard })));

// Services & Types
import { authService } from './services/authService';
import { healthStore } from './services/healthStore';
import { User } from './types';
import { resolveTabFromUrl, updateBrowserUrl, getDefaultTabForRole, PATH_TO_TAB } from './services/router';

import { LoginPage } from './components/auth/LoginPage';
import { CompleteProfileModal } from './components/auth/CompleteProfileModal';

export function App() {
  const [currentUser, setCurrentUser] = useState<User>(authService.getCurrentUser());
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(authService.isAuthenticated());
  const [isRestoringSession, setIsRestoringSession] = useState<boolean>(!authService.isInitialized());
  const [currentTab, setCurrentTab] = useState<string>(() =>
    resolveTabFromUrl(authService.getCurrentUser().role, authService.isAuthenticated())
  );
  const [darkMode, setDarkMode] = useState(false);
  const [profileDismissed, setProfileDismissed] = useState(false);
  const [prevUserId, setPrevUserId] = useState(currentUser.id);
  const [storeRevision, setStoreRevision] = useState(0);

  if (prevUserId !== currentUser.id) {
    setPrevUserId(currentUser.id);
    setProfileDismissed(false);
  }

  // Subscribe to healthStore changes to re-evaluate when student completes profile
  useEffect(() => {
    return healthStore.subscribe(() => {
      setStoreRevision(r => r + 1);
    });
  }, []);

  const isStudent = isAuthenticated && currentUser.role === 'STUDENT';
  const sid = currentUser.studentId || currentUser.id;
  // Read profile using storeRevision dependency
  const studentProf = isStudent && storeRevision >= 0 ? healthStore.getStudentProfile(sid) : null;
  const hasCompleteData = Boolean(
    studentProf && (
      studentProf.profileComplete === true || (
        studentProf.accommodation &&
        studentProf.heightCm &&
        studentProf.weightKg &&
        studentProf.bloodGroup
      )
    )
  );
  // Never show onboarding popup on reload if student profile already has complete data, or store is still loading
  const isProfileIncomplete = isStudent && healthStore.isInitialized() && !hasCompleteData;
  const showCompleteProfile = Boolean(isProfileIncomplete && !profileDismissed);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Sync initial URL on mount (wait until cookie session check completes)
  useEffect(() => {
    if (isRestoringSession) return;
    if (isAuthenticated) {
      updateBrowserUrl(currentTab, true);
    } else {
      updateBrowserUrl('login', true);
    }
  }, [isAuthenticated, currentTab, isRestoringSession]);

  // Listen to browser Back / Forward buttons
  useEffect(() => {
    const onPopState = () => {
      const tab = resolveTabFromUrl(currentUser.role, isAuthenticated);
      setCurrentTab(tab);
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [currentUser.role, isAuthenticated]);

  // Modals
  const [isDiffViewerOpen, setIsDiffViewerOpen] = useState(false);

  useEffect(() => {
    const unsub = authService.subscribe((user, auth) => {
      if (user) setCurrentUser(user);
      setIsAuthenticated(auth);
      if (!auth) {
        healthStore.resetState();
        setCurrentTab('login');
        updateBrowserUrl('login');
      } else {
        void healthStore.loadFromAPI();
        const nextTab = resolveTabFromUrl(user?.role || 'STUDENT', true);
        setCurrentTab(nextTab);
        updateBrowserUrl(nextTab);
      }
    });

    authService.initSession().finally(() => {
      setIsRestoringSession(false);
    });

    return () => unsub();
  }, []);

  const handleNavigate = (target: string) => {
    const tab = PATH_TO_TAB[target.toLowerCase()] || target;
    if (tab === 'login') {
      void authService.logout();
      setCurrentTab('login');
      updateBrowserUrl('login');
      return;
    }

    // Role-based Route Protection Guards
    if (currentUser.role === 'STUDENT' && !tab.startsWith('student-')) {
      setCurrentTab('student-dashboard');
      updateBrowserUrl('student-dashboard', true);
      return;
    }

    if (currentUser.role === 'MEDICAL_STAFF' && !tab.startsWith('medical-')) {
      setCurrentTab('medical-dashboard');
      updateBrowserUrl('medical-dashboard', true);
      return;
    }

    if (currentUser.role === 'ADMIN' && !tab.startsWith('admin-')) {
      setCurrentTab('admin-dashboard');
      updateBrowserUrl('admin-dashboard', true);
      return;
    }

    if (currentUser.role === 'RESEARCHER' && (tab.startsWith('student-') || tab.startsWith('medical-') || tab === 'admin-students')) {
      alert(`Privacy Rule Denied: Researchers are restricted to de-identified population analytics.`);
      setCurrentTab('research-dashboard');
      updateBrowserUrl('research-dashboard', true);
      return;
    }

    setCurrentTab(tab);
    updateBrowserUrl(tab);
  };

  const renderActiveView = () => {
    switch (currentTab) {
      // Student Views
      case 'student-dashboard':
        return <StudentDashboard onNavigate={handleNavigate} />;
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
      case 'admin-inventory':
        return <MedicineInventoryManager onNavigate={handleNavigate} />;
      case 'admin-students':
        return <StudentManagement />;
      case 'admin-staff':
        return <MedicalStaffManagement />;
      case 'admin-roles':
        return <RoleManagement />;
      case 'admin-research':
        return <ResearcherDashboard />;
      case 'admin-audit-logs':
        return <AuditLogViewer />;
      case 'admin-settings':
        return <SystemSettings />;

      // Researcher Views
      case 'research-dashboard':
      case 'research-experiments':
      case 'research-cohort':
        return <ResearcherDashboard />;

      default:
        return <StudentDashboard onNavigate={handleNavigate} />;
    }
  };

  const getThemeClass = () => {
    if (currentUser.role === 'STUDENT') return 'theme-student';
    if (currentUser.role === 'MEDICAL_STAFF') return 'theme-medical';
    if (currentUser.role === 'RESEARCHER') return 'theme-researcher';
    return 'theme-admin';
  };

  const studentId = currentUser?.studentId || '';
  const rxList = studentId ? healthStore.getPrescriptionsForStudent(studentId) : [];
  const activeRx = Array.isArray(rxList) && rxList.length > 0 ? rxList[0] : undefined;
  const v1 = activeRx?.history && Array.isArray(activeRx.history) && activeRx.history.length > 0
    ? activeRx.history[activeRx.history.length - 1]
    : undefined;
  const v2 = activeRx?.currentVersion;

  if (isRestoringSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F6FAFD] text-[#1A3D63]">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-[#B3CFE5] border-t-[#1A3D63] rounded-full animate-spin mx-auto" />
          <p className="text-xs font-bold uppercase tracking-wider">Verifying secure session…</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || currentTab === 'login') {
    return (
      <LoginPage
        onLoginSuccess={role => {
          const defaultTab = getDefaultTabForRole(role);
          setCurrentTab(defaultTab);
          updateBrowserUrl(defaultTab);
          if (role === 'STUDENT') {
            const user = authService.getCurrentUser();
            const sid = user.studentId || user.id;
            const profile = sid ? healthStore.getStudentProfile(sid) : undefined;
            if (!profile || !profile.profileComplete) {
              setProfileDismissed(false);
            }
          }
        }}
      />
    );
  }

  return (
    <div className={`h-screen overflow-hidden print:h-auto print:overflow-visible flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 ${getThemeClass()} transition-colors duration-200`}>
      <Navbar
        currentTab={currentTab}
        onNavigate={handleNavigate}
        darkMode={darkMode}
        onToggleDark={() => setDarkMode(!darkMode)}
      />

      <div className="flex flex-1 min-h-0 overflow-hidden print:overflow-visible">
        <Sidebar
          role={currentUser.role}
          currentTab={currentTab}
          onNavigate={handleNavigate}
        />

        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 print:overflow-visible print:p-0">
          <div className="max-w-7xl mx-auto w-full">
            <Suspense
              fallback={
                <div className="flex items-center justify-center py-20 text-slate-400">
                  <div className="text-center space-y-2">
                    <div className="w-8 h-8 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin mx-auto" />
                    <p className="text-xs font-bold uppercase tracking-wider">Loading view…</p>
                  </div>
                </div>
              }
            >
              {renderActiveView()}
            </Suspense>
          </div>
        </main>
      </div>

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

      {/* Complete Medical Profile Modal for Students */}
      {showCompleteProfile && currentUser.role === 'STUDENT' && (
        <CompleteProfileModal
          studentId={currentUser.studentId || currentUser.id}
          existingProfile={
            healthStore.getStudentProfile(currentUser.studentId || currentUser.id) || {
              id: `prof_${currentUser.studentId || currentUser.id}`,
              studentId: currentUser.studentId || currentUser.id,
              name: currentUser.name,
              email: currentUser.email,
              department: currentUser.department || 'Computer and Communication Engineering (CCE)',
              year: '1st Year',
              ugOrPg: 'UG',
              accommodation: '',
              phone: '',
              bloodGroup: '',
              gender: 'Male',
              dob: '2006-05-15',
              emergencyContact: { name: '', relation: 'Father', phone: '' },
              medicalCentreContact: '+91-44-2257-0000',
              criticalAllergies: [],
              criticalConditions: [],
              criticalMedications: [],
              heightCm: 0,
              weightKg: 0,
              bmi: 0,
              lastUpdated: new Date().toISOString(),
              profileComplete: false
            }
          }
          onComplete={() => {
            setProfileDismissed(true);
          }}
        />
      )}
    </div>
  );
}

export default App;
