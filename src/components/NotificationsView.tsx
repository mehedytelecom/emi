import React, { useState, useEffect } from 'react';
import {
  Bell,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Send,
  Trash2,
  ShieldCheck,
  Smartphone,
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import {
  generateInstallmentAlerts,
  getNotificationPermissionStatus,
  requestNotificationPermission,
  sendLocalPushNotification,
} from '../services/notificationService';
import { formatDhakaDate, getTodayDhaka } from '../utils/dateAndEmiUtils';

interface NotificationsViewProps {
  onSelectCustomer: (customerId: string) => void;
}

export const NotificationsView: React.FC<NotificationsViewProps> = ({ onSelectCustomer }) => {
  const { installments, settings, notifications, clearAllNotifications } = useData();
  const { isAdmin } = useAuth();

  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [testSent, setTestSent] = useState(false);

  useEffect(() => {
    setPermission(getNotificationPermissionStatus());
  }, []);

  const handleRequestPermission = async () => {
    const res = await requestNotificationPermission();
    setPermission(res);
    if (res === 'granted') {
      sendLocalPushNotification(
        'Mehedi Telecom EMI',
        'Push notifications enabled! You will receive upcoming and overdue reminders.'
      );
    }
  };

  const handleSendTestNotification = () => {
    sendLocalPushNotification(
      'Test Reminder: Mehedi Telecom EMI',
      'This is a sample test alert verifying your phone or browser notification setup.'
    );
    setTestSent(true);
    setTimeout(() => setTestSent(false), 3000);
  };

  // Generate live alerts based on active database records
  const alerts = generateInstallmentAlerts(installments, settings);

  return (
    <div className="space-y-6 pb-16 lg:pb-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            Reminders & Push Notifications
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Automated alerts for Due Today, 1-day-before reminders, and overdue installments
          </p>
        </div>

        {isAdmin && notifications.length > 0 && (
          <button
            onClick={clearAllNotifications}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-red-500 text-xs font-semibold cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear History</span>
          </button>
        )}
      </div>

      {/* Permission Status Banner */}
      <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
              permission === 'granted'
                ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400'
                : 'bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400'
            }`}
          >
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              {permission === 'granted'
                ? 'Push Notifications Active'
                : 'Enable Phone & Desktop Reminders'}
            </h3>
            <p className="text-xs text-slate-500">
              {permission === 'granted'
                ? 'You will receive scheduled alerts on this device even when the app is in the background.'
                : 'Allow browser notifications so you never miss an EMI collection or overdue deadline.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {permission !== 'granted' && (
            <button
              onClick={handleRequestPermission}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 active:scale-95 transition cursor-pointer"
            >
              Enable Notifications
            </button>
          )}

          {permission === 'granted' && (
            <button
              onClick={handleSendTestNotification}
              className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{testSent ? 'Sent!' : 'Send Test'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Live Generated Alerts Sections (Requirement 9) */}
      <div className="space-y-6">
        {/* 1. Due Today Section */}
        <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Due Today Alerts ({alerts.dueTodayAlerts.length})
              </h3>
            </div>
            <span className="text-xs text-slate-400">Timezone: Asia/Dhaka</span>
          </div>

          <div className="space-y-3">
            {alerts.dueTodayAlerts.length === 0 ? (
              <p className="text-xs text-slate-400 py-2">No installments due today.</p>
            ) : (
              alerts.dueTodayAlerts.map((alert, idx) => (
                <div
                  key={`due-today-${idx}`}
                  className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 flex items-start justify-between gap-3 text-xs"
                >
                  <div>
                    <span className="font-bold text-amber-800 dark:text-amber-400 block text-sm">
                      {alert.title}
                    </span>
                    <p className="whitespace-pre-line text-slate-700 dark:text-slate-300 mt-1 font-medium leading-relaxed">
                      {alert.body}
                    </p>
                  </div>
                  <button
                    onClick={() => onSelectCustomer(alert.item.customerId)}
                    className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold whitespace-nowrap cursor-pointer"
                  >
                    View Account
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 2. Due Tomorrow (1-Day-Before) Section */}
        <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-sky-500" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                1-Day-Before Reminders ({alerts.dueTomorrowAlerts.length})
              </h3>
            </div>
            <span className="text-xs text-slate-400">Scheduled for Tomorrow</span>
          </div>

          <div className="space-y-3">
            {alerts.dueTomorrowAlerts.length === 0 ? (
              <p className="text-xs text-slate-400 py-2">No installments due tomorrow.</p>
            ) : (
              alerts.dueTomorrowAlerts.map((alert, idx) => (
                <div
                  key={`due-tomorrow-${idx}`}
                  className="p-4 rounded-2xl bg-sky-50/50 dark:bg-sky-950/20 border border-sky-200 dark:border-sky-900/40 flex items-start justify-between gap-3 text-xs"
                >
                  <div>
                    <span className="font-bold text-sky-800 dark:text-sky-400 block text-sm">
                      {alert.title}
                    </span>
                    <p className="whitespace-pre-line text-slate-700 dark:text-slate-300 mt-1 font-medium leading-relaxed">
                      {alert.body}
                    </p>
                  </div>
                  <button
                    onClick={() => onSelectCustomer(alert.item.customerId)}
                    className="px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold whitespace-nowrap cursor-pointer"
                  >
                    View Account
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 3. Overdue Urgent Alerts */}
        <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Overdue Urgent Alerts ({alerts.overdueAlerts.length})
              </h3>
            </div>
            <span className="text-xs text-red-500 font-bold">Action Required</span>
          </div>

          <div className="space-y-3">
            {alerts.overdueAlerts.length === 0 ? (
              <p className="text-xs text-slate-400 py-2">No overdue alerts.</p>
            ) : (
              alerts.overdueAlerts.map((alert, idx) => (
                <div
                  key={`overdue-${idx}`}
                  className="p-4 rounded-2xl bg-red-50/50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 flex items-start justify-between gap-3 text-xs"
                >
                  <div>
                    <span className="font-bold text-red-800 dark:text-red-400 block text-sm">
                      {alert.title}
                    </span>
                    <p className="whitespace-pre-line text-slate-700 dark:text-slate-300 mt-1 font-medium leading-relaxed">
                      {alert.body}
                    </p>
                  </div>
                  <button
                    onClick={() => onSelectCustomer(alert.item.customerId)}
                    className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold whitespace-nowrap cursor-pointer"
                  >
                    View Account
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
