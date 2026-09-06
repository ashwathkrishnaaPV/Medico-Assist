import React, { useEffect, useState } from 'react';
import { X, Bell, Pill, Apple, Activity, CheckCircle2 } from 'lucide-react';
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

  const handleNotificationClick = (notif: NotificationItem) => {
    healthStore.markNotificationRead(notif.id);
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
        return <Pill className="w-4 h-4 text-purple-500" />;
      case 'nutrition':
        return <Apple className="w-4 h-4 text-emerald-500" />;
      case 'monitoring':
        return <Activity className="w-4 h-4 text-rose-500" />;
      default:
        return <Bell className="w-4 h-4 text-teal-500" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-xs flex justify-end animate-fade-in">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col justify-between border-l border-slate-200 dark:border-slate-800">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-emerald-600" />
            <h3 className="font-bold text-slate-800 dark:text-slate-100">Notification Centre</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {notifications.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <CheckCircle2 className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm font-medium">You are all caught up!</p>
              <p className="text-xs">No pending notifications.</p>
            </div>
          ) : (
            notifications.map(n => (
              <div
                key={n.id}
                onClick={() => handleNotificationClick(n)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                  n.read
                    ? 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 opacity-75'
                    : 'bg-emerald-50/50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 font-medium'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    {getIcon(n.type)}
                  </div>
                  <div className="flex-1 text-xs">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="font-bold text-slate-800 dark:text-slate-200">{n.title}</span>
                      <span className="text-[10px] text-slate-400">{n.createdAt}</span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 leading-snug">{n.message}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400">
          Click any alert to navigate directly to its health module.
        </div>

      </div>
    </div>
  );
};
