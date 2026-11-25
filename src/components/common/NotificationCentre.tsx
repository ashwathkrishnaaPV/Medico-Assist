import React, { useEffect, useState } from 'react';
import { X, Bell, Pill, Apple, Activity, CheckCircle2, CheckCheck } from 'lucide-react';
import { healthStore } from '../../services/healthStore';
import { NotificationItem, Role } from '../../types';

interface NotificationCentreProps {
  isOpen: boolean;
  onClose: () => void;
  role: Role;
  studentId?: string;
  onNavigate: (tab: string) => void;
}

export const NotificationCentre: React.FC<NotificationCentreProps> = ({
  isOpen,
  onClose,
  role,
  studentId,
  onNavigate
}) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  useEffect(() => {
    const updateList = () => {
      setNotifications(healthStore.getNotifications(role, studentId));
    };

    updateList();
    const unsub = healthStore.subscribe(updateList);
    return () => unsub();
  }, [role, studentId]);

  if (!isOpen) return null;

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkAllRead = () => {
    healthStore.markAllNotificationsRead(role, studentId);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleNotificationClick = (notif: NotificationItem) => {
    healthStore.markNotificationRead(notif.id);
    setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, read: true } : n));
    if (notif.type === 'prescription') {
      onNavigate(role === 'STUDENT' ? 'student-prescriptions' : 'medical-prescriptions');
    } else if (notif.type === 'nutrition') {
      onNavigate(role === 'STUDENT' ? 'student-nutrition' : 'medical-nutrition');
    } else if (notif.type === 'monitoring') {
      onNavigate(role === 'STUDENT' ? 'student-daily-check' : 'medical-monitoring');
    }
    onClose();
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'prescription':
        return <Pill className="w-4 h-4 text-purple-600" />;
      case 'nutrition':
        return <Apple className="w-4 h-4 text-[#1A3D63]" />;
      case 'monitoring':
        return <Activity className="w-4 h-4 text-rose-600" />;
      default:
        return <Bell className="w-4 h-4 text-[#4A7FA7]" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-xs flex justify-end animate-fade-in font-sans">
      <div className="w-full max-w-md bg-white dark:bg-[#0A1931] h-full shadow-2xl flex flex-col justify-between border-l border-[#B3CFE5]/50 dark:border-[#1A3D63]">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#B3CFE5]/50 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-full bg-[#1A3D63] text-white shadow-sm">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#0A1931] dark:text-slate-100">Notification Centre</h3>
              <p className="text-[11px] text-[#4A7FA7] dark:text-[#B3CFE5]/80 font-medium">
                {unreadCount > 0 ? `${unreadCount} unread update(s)` : 'All updates read'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Read All Button */}
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="px-3.5 py-1.5 rounded-full text-xs font-bold text-[#1A3D63] dark:text-[#B3CFE5] hover:bg-[#B3CFE5]/30 bg-[#F6FAFD] dark:bg-slate-800 border-2 border-[#B3CFE5] transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs hover:scale-[1.02] active:scale-[0.98]"
                title="Mark all notifications as read"
              >
                <CheckCheck className="w-3.5 h-3.5 text-[#1A3D63]" />
                <span>Read all</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-[#4A7FA7] hover:text-[#0A1931] dark:hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {notifications.length === 0 ? (
            <div className="text-center py-16 text-[#4A7FA7]">
              <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-[#B3CFE5]/25 flex items-center justify-center text-[#1A3D63]">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <p className="text-sm font-bold text-[#0A1931] dark:text-white">You are all caught up!</p>
              <p className="text-xs text-[#4A7FA7] mt-0.5">No pending notifications.</p>
            </div>
          ) : (
            notifications.map(n => (
              <div
                key={n.id}
                onClick={() => handleNotificationClick(n)}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                  n.read
                    ? 'bg-[#F6FAFD] dark:bg-slate-800/40 border-[#B3CFE5]/40 dark:border-slate-800 opacity-75'
                    : 'bg-white dark:bg-slate-900 border-2 border-[#B3CFE5] shadow-sm font-medium hover:border-[#1A3D63]'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-[#F6FAFD] dark:bg-slate-800 border border-[#B3CFE5]/60 dark:border-slate-700 shrink-0">
                    {getIcon(n.type)}
                  </div>
                  <div className="flex-1 text-xs">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="font-bold text-[#0A1931] dark:text-slate-200">{n.title}</span>
                      <span className="text-[10px] text-[#4A7FA7]">{n.createdAt}</span>
                    </div>
                    <p className="text-[#4A7FA7] dark:text-slate-300 leading-snug">{n.message}</p>
                  </div>
                  {!n.read && (
                    <span className="w-2 h-2 rounded-full bg-[#1A3D63] shrink-0 mt-1" />
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#B3CFE5]/50 dark:border-slate-800 text-center text-xs text-[#4A7FA7]">
          Click any alert to navigate directly to its health module.
        </div>

      </div>
    </div>
  );
};
