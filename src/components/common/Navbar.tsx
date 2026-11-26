import React, { useState, useEffect } from 'react';
import {
  Bell,
  ShieldCheck,
  Stethoscope,
  GraduationCap,
  LogOut,
  Sun,
  Moon
} from 'lucide-react';

import { authService } from '../../services/authService';
import { healthStore } from '../../services/healthStore';
import { User, Role } from '../../types';
import { NotificationCentre } from './NotificationCentre';

interface NavbarProps {
  currentTab?: string;
  onNavigate: (tab: string) => void;
  darkMode: boolean;
  onToggleDark: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab: _currentTab, onNavigate, darkMode, onToggleDark }) => {
  const [currentUser, setCurrentUser] = useState<User>(() => {
    const u = authService.getCurrentUser();
    if (u.email === 'jenkins@sece.ac.in') {
      const updated = { ...u, email: 'nivetha@sece.ac.in', name: 'Dr. Nivetha M.B.B.S' };
      authService.setUser(updated);
      return updated;
    }
    return u;
  });
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [showNotifDrawer, setShowNotifDrawer] = useState(false);
  const [unreadCount, setUnreadCount] = useState(() => {
    const u = authService.getCurrentUser();
    return healthStore.getNotifications(u.role, u.studentId).filter(n => !n.read).length;
  });

  useEffect(() => {
    const unsubAuth = authService.subscribe(user => {
      if (user) {
        if (user.email === 'jenkins@sece.ac.in') {
          user.email = 'nivetha@sece.ac.in';
        }
        setCurrentUser(user);
      }
    });
    const unsubStore = healthStore.subscribe(() => {
      const user = authService.getCurrentUser();
      const notifs = healthStore.getNotifications(user.role, user.studentId);
      setUnreadCount(notifs.filter(n => !n.read).length);
    });

    return () => {
      unsubAuth();
      unsubStore();
    };
  }, []);

  const handleOpenNotifDrawer = () => {
    setShowNotifDrawer(true);
    healthStore.markAllNotificationsRead(currentUser.role, currentUser.studentId);
    setUnreadCount(0);
  };

  const getRoleBadge = (role: Role) => {
    switch (role) {
      case 'STUDENT':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full bg-[#B3CFE5]/30 text-[#1A3D63] border border-[#B3CFE5]">
            <GraduationCap className="w-3.5 h-3.5" /> Student Panel
          </span>
        );
      case 'MEDICAL_STAFF':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full bg-[#1A3D63]/10 text-[#0A1931] border border-[#1A3D63]/30">
            <Stethoscope className="w-3.5 h-3.5" /> Medical Centre EHR
          </span>
        );
      case 'ADMIN':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full bg-[#0A1931] text-[#F6FAFD] border border-[#1A3D63]">
            <ShieldCheck className="w-3.5 h-3.5 text-[#B3CFE5]" /> Admin Enterprise
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <header className="sticky top-0 z-30 border-b backdrop-blur-md bg-white border-[#B3CFE5]/60 text-slate-800 shadow-xs transition-colors">
        <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 h-18 sm:h-20 flex items-center justify-between gap-4">
          
          {/* College Logo & Brand Tagline (No shape, blends seamlessly with white background) */}
          <div className="flex items-center gap-4 cursor-pointer select-none py-1" onClick={() => {
            if (currentUser.role === 'STUDENT') onNavigate('student-dashboard');
            else if (currentUser.role === 'MEDICAL_STAFF') onNavigate('medical-dashboard');
            else onNavigate('admin-dashboard');
          }}>
            <img
              src="/college-logo.png"
              alt="Sri Eshwar College of Engineering"
              className="h-12 sm:h-14 md:h-16 w-auto object-contain"
            />

            <div className="hidden sm:block h-10 w-px bg-[#B3CFE5]" />

            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg sm:text-xl tracking-tight text-[#1A3D63]">
                  CampusHealth
                </span>
                {getRoleBadge(currentUser.role)}
              </div>
              <p className="hidden sm:block text-[11px] text-[#4A7FA7] font-medium -mt-0.5">
                Integrated Student Health & Clinical Intelligence · Sri Eshwar
              </p>
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2.5">

            {/* Dark / Light Mode Toggle — Available for all roles */}
            <button
              onClick={onToggleDark}
              className="p-2.5 rounded-full border-2 border-[#B3CFE5]/60 dark:border-slate-800 hover:bg-[#B3CFE5]/20 dark:hover:bg-slate-800 text-[#1A3D63] dark:text-[#B3CFE5] transition-all cursor-pointer"
              title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-[#1A3D63]" />}
            </button>

            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={handleOpenNotifDrawer}
                className="p-2.5 rounded-full border-2 border-[#B3CFE5]/60 dark:border-slate-800 hover:bg-[#B3CFE5]/20 dark:hover:bg-slate-800 text-[#1A3D63] dark:text-[#B3CFE5] transition-all relative cursor-pointer"
                title="Notifications"
              >
                <Bell className="w-4 h-4" />
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
                className="w-9 h-9 rounded-full bg-[#1A3D63] hover:bg-[#0A1931] text-white font-extrabold text-sm flex items-center justify-center shadow-md hover:scale-105 active:scale-95 transition-transform focus:outline-none"
                title={currentUser.name}
              >
                {(currentUser?.name || 'User').charAt(0).toUpperCase()}
              </button>

              {/* Dropdown — floats above the backdrop */}
              {showRoleDropdown && (
                <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl py-2 z-50 animate-fade-in text-slate-800 dark:text-slate-100">
                  <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-800">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Active Identity</p>
                    <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                      {currentUser.role === 'MEDICAL_STAFF' && (currentUser.name === 'Dr. Sarah Jenkins' || !currentUser.name || currentUser.name === 'Campus Physician')
                        ? 'Dr. Nivetha M.B.B.S'
                        : currentUser.name}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {currentUser.email === 'jenkins@sece.ac.in' ? 'nivetha@sece.ac.in' : currentUser.email}
                    </p>
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
