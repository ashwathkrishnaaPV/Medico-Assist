import { Role } from '../types';

export const TAB_TO_PATH: Record<string, string> = {
  // Student routes
  'student-dashboard': '/student/dashboard',
  'student-profile': '/student/profile',
  'student-history': '/student/history',
  'student-prescriptions': '/student/prescriptions',
  'student-bmi': '/student/bmi',
  'student-nutrition': '/student/nutrition',
  'student-daily-check': '/student/daily-check',
  'student-calendar': '/student/calendar',

  // Doctor / Medical routes
  'medical-dashboard': '/doctor/dashboard',
  'medical-directory': '/doctor/directory',
  'medical-new-visit': '/doctor/new-visit',
  'medical-prescriptions': '/doctor/prescriptions',
  'medical-monitoring': '/doctor/monitoring',
  'medical-nutrition': '/doctor/nutrition',
  'medical-calendar': '/doctor/calendar',

  // Admin routes
  'admin-dashboard': '/admin/dashboard',
  'admin-inventory': '/admin/inventory',
  'admin-students': '/admin/students',
  'admin-staff': '/admin/staff',
  'admin-roles': '/admin/roles',
  'admin-research': '/admin/research',
  'admin-audit-logs': '/admin/audit-logs',
  'admin-settings': '/admin/settings',

  // Researcher routes
  'research-dashboard': '/research/dashboard',
  'research-experiments': '/research/experiments',
  'research-cohort': '/research/cohort',

  // Auth
  'login': '/login'
};

export const PATH_TO_TAB: Record<string, string> = {
  // Student
  '/student/dashboard': 'student-dashboard',
  '/student': 'student-dashboard',
  '/student/profile': 'student-profile',
  '/student/history': 'student-history',
  '/student/medical-history': 'student-history',
  '/student/prescriptions': 'student-prescriptions',
  '/student/bmi': 'student-bmi',
  '/student/nutrition': 'student-nutrition',
  '/student/daily-check': 'student-daily-check',
  '/student/calendar': 'student-calendar',

  // Doctor
  '/doctor/dashboard': 'medical-dashboard',
  '/doctor': 'medical-dashboard',
  '/doctor/directory': 'medical-directory',
  '/doctor/new-visit': 'medical-new-visit',
  '/doctor/prescriptions': 'medical-prescriptions',
  '/doctor/monitoring': 'medical-monitoring',
  '/doctor/nutrition': 'medical-nutrition',
  '/doctor/calendar': 'medical-calendar',

  // Medical aliases
  '/medical/dashboard': 'medical-dashboard',
  '/medical': 'medical-dashboard',
  '/medical/directory': 'medical-directory',
  '/medical/new-visit': 'medical-new-visit',
  '/medical/prescriptions': 'medical-prescriptions',
  '/medical/monitoring': 'medical-monitoring',
  '/medical/nutrition': 'medical-nutrition',
  '/medical/calendar': 'medical-calendar',

  // Admin
  '/admin/dashboard': 'admin-dashboard',
  '/admin': 'admin-dashboard',
  '/admin/inventory': 'admin-inventory',
  '/admin/students': 'admin-students',
  '/admin/staff': 'admin-staff',
  '/admin/roles': 'admin-roles',
  '/admin/research': 'admin-research',
  '/admin/audit-logs': 'admin-audit-logs',
  '/admin/settings': 'admin-settings',

  // Researcher
  '/research/dashboard': 'research-dashboard',
  '/research': 'research-dashboard',
  '/research/experiments': 'research-experiments',
  '/research/cohort': 'research-cohort',

  // Auth
  '/login': 'login'
};

export function getDefaultTabForRole(role: Role): string {
  switch (role) {
    case 'STUDENT': return 'student-dashboard';
    case 'MEDICAL_STAFF': return 'medical-dashboard';
    case 'ADMIN': return 'admin-dashboard';
    case 'RESEARCHER': return 'research-dashboard';
    default: return 'student-dashboard';
  }
}

export function resolveTabFromUrl(role: Role, authenticated: boolean): string {
  if (!authenticated) return 'login';
  
  const pathname = (window.location.pathname.replace(/\/+$/, '') || '/').toLowerCase();
  const matchedTab = PATH_TO_TAB[pathname];

  if (matchedTab && matchedTab !== 'login') {
    if (role === 'STUDENT' && matchedTab.startsWith('student-')) return matchedTab;
    if (role === 'MEDICAL_STAFF' && matchedTab.startsWith('medical-')) return matchedTab;
    if (role === 'ADMIN' && matchedTab.startsWith('admin-')) return matchedTab;
    if (role === 'RESEARCHER' && matchedTab.startsWith('research-')) return matchedTab;
  }

  return getDefaultTabForRole(role);
}

export function updateBrowserUrl(tab: string, replace = false): void {
  const targetPath = TAB_TO_PATH[tab] || (tab === 'login' ? '/login' : '/student/dashboard');
  if (window.location.pathname !== targetPath) {
    if (replace) {
      window.history.replaceState({ tab }, '', targetPath);
    } else {
      window.history.pushState({ tab }, '', targetPath);
    }
  }
}

