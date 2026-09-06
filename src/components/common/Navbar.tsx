import React, { useState, useEffect } from 'react';
import {
  HeartPulse,
  Bell,
  Search,
  User as UserIcon,
  ShieldCheck,
  Stethoscope,
  GraduationCap,
  AlertTriangle,
  LogOut,
  Sparkles,
  Sun,
  Moon
} from 'lucide-react';

import { authService } from '../../services/authService';
import { healthStore } from '../../services/healthStore';
import { User, Role } from '../../types';
import { NotificationCentre } from './NotificationCentre';
import { EmergencyModal } from './EmergencyModal';

interface NavbarProps {
  currentTab: string;
  onNavigate: (tab: string) => void;
  onOpenEmergencyModal: () => void;
  darkMode: boolean;
  onToggleDark: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, onNavigate, onOpenEmergencyModal, darkMode, onToggleDark }) => {
  const [currentUser, setCurrentUser] = useState<User>(authService.getCurrentUser());
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [showNotifDrawer, setShowNotifDrawer] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const unsubAuth = authService.subscribe(user => {
      if (user) setCurrentUser(user);
    });
    const unsubStore = healthStore.subscribe(() => {
      const user = authService.getCurrentUser();
      const notifs = healthStore.getNotifications(user.role, user.studentId);
      setUnreadCount(notifs.filter(n => !n.read).length);
    });

    const notifs = healthStore.getNotifications(currentUser.role, currentUser.studentId);
    setUnreadCount(notifs.filter(n => !n.read).length);

    return () => {
      unsubAuth();
      unsubStore();
    };
  }, [currentUser.role, currentUser.studentId]);

  const handleRoleSwitch = (role: Role) => {
    const user = authService.switchRole(role);
    setShowRoleDropdown(false);
    if (role === 'STUDENT') onNavigate('student-dashboard');
    else if (role === 'MEDICAL_STAFF') onNavigate('medical-dashboard');
    else if (role === 'ADMIN') onNavigate('admin-dashboard');
  };

  const getRoleBadge = (role: Role) => {
    switch (role) {
      case 'STUDENT':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
            <GraduationCap className="w-3.5 h-3.5" /> Student Panel
          </span>
        );
      case 'MEDICAL_STAFF':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full bg-teal-100 text-teal-800 border border-teal-200">
            <Stethoscope className="w-3.5 h-3.5" /> Medical Centre EHR
          </span>
        );
      case 'ADMIN':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full bg-indigo-100 text-indigo-900 border border-indigo-200">
            <ShieldCheck className="w-3.5 h-3.5" /> Admin Enterprise
          </span>
        );
      default:
        return null;
    }
  };

  const isDarkAdmin = currentUser.role === 'ADMIN';

  return (
    <>
      <header className="sticky top-0 z-30 border-b backdrop-blur-md bg-white/95 dark:bg-slate-900/95 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 transition-colors">
        <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          
          {/* College Logo & Brand Tagline */}
          <div className="flex items-center gap-3 cursor-pointer select-none" onClick={() => {
            if (currentUser.role === 'STUDENT') onNavigate('student-dashboard');
            else if (currentUser.role === 'MEDICAL_STAFF') onNavigate('medical-dashboard');
            else onNavigate('admin-dashboard');
          }}>
            <div className="flex items-center bg-white/95 dark:bg-white px-2.5 py-1 rounded-xl shadow-xs border border-slate-200/90 dark:border-slate-700">
              <img
                src="/college-logo.webp"
                alt="Sri Eshwar College of Engineering"
                className="h-8 sm:h-9 w-auto object-contain"
              />
            </div>

            <div className="hidden sm:block h-7 w-px bg-slate-200 dark:bg-slate-700" />

            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base sm:text-lg tracking-tight text-emerald-600 dark:text-emerald-400">
                  CampusHealth
                </span>
                {getRoleBadge(currentUser.role)}
              </div>
              <p className="hidden sm:block text-[10px] text-slate-500 dark:text-slate-400 -mt-0.5">
                Integrated Student Health & Clinical Intelligence
              </p>
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2.5">
            
            {/* Quick Emergency Medical Card Trigger */}
            <button
              onClick={onOpenEmergencyModal}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-300 dark:hover:bg-rose-900/50 border border-rose-200 dark:border-rose-800 rounded-xl transition-all shadow-xs"
              title="Quick access to emergency medical card & QR token"
            >
              <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 animate-bounce" />
              <span>Emergency Card</span>
            </button>

            {/* Dark / Light Mode Toggle — Available for all roles */}
            <button
              onClick={onToggleDark}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-all"
              title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {darkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-600" />}
            </button>

            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifDrawer(true)}
                className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-all relative"
                title="Notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center animate-pulse shadow-sm">
                    {unreadCount}
                  </span>
                )}
              </button>
            </div>

            {/* User Avatar Circle — tap to show dropdown, tap anywhere else to close */}
            <div className="relative">
              {/* Invisible full-screen backdrop to close dropdown on outside tap */}
              {showRoleDropdown && (
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowRoleDropdown(false)}
                />
              )}

              {/* Avatar circle — only the letter */}
              <button
                onClick={() => setShowRoleDropdown(!showRoleDropdown)}
                className="w-9 h-9 rounded-full bg-emerald-500 dark:bg-emerald-600 text-white font-extrabold text-sm flex items-center justify-center shadow-md hover:scale-105 active:scale-95 transition-transform focus:outline-none"
                title={currentUser.name}
              >
                {currentUser.name.charAt(0).toUpperCase()}
              </button>

              {/* Dropdown — floats above the backdrop */}
              {showRoleDropdown && (
                <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl py-2 z-50 animate-fade-in text-slate-800 dark:text-slate-100">
                  <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-800">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Active Identity</p>
                    <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">{currentUser.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{currentUser.email}</p>
                  </div>

                  <div className="px-2 py-2 space-y-1.5">
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-[11px] text-slate-500 dark:text-slate-400">
                      Role: <strong className="text-slate-900 dark:text-slate-200 font-semibold">{currentUser.role}</strong>
                    </div>

                    <button
                      onClick={() => {
                        setShowRoleDropdown(false);
                        authService.logout();
                        onNavigate('login');
                      }}
                      className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 rounded-xl transition-all"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Log Out of Workspace</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      </header>

      {/* Notification Drawer */}
      <NotificationCentre
        isOpen={showNotifDrawer}
        onClose={() => setShowNotifDrawer(false)}
        role={currentUser.role}
        studentId={currentUser.studentId}
        onNavigate={onNavigate}
      />
    </>
  );
};
