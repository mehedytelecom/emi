import React, { useState } from 'react';
import {
  Settings,
  Bell,
  Clock,
  Shield,
  Percent,
  CheckCircle2,
  Lock,
  RotateCcw,
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { AppSettings, DEFAULT_SETTINGS } from '../types';

export const SettingsView: React.FC = () => {
  const { settings, updateSettings } = useData();
  const { isAdmin } = useAuth();

  const [formData, setFormData] = useState<AppSettings>(settings);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleChange = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;

    try {
      setSaving(true);
      setErrorMsg(null);
      await updateSettings(formData);
      setSuccessMsg(true);
      setTimeout(() => setSuccessMsg(false), 3000);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  const handleResetDefaults = () => {
    if (!window.confirm('Reset all business rules to default settings?')) return;
    setFormData(DEFAULT_SETTINGS);
  };

  return (
    <div className="space-y-6 pb-16 lg:pb-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            System Settings & Rules
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Configure notification dispatch times, grace periods, late fines, and 2% post-plan rules
          </p>
        </div>

        {!isAdmin && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 text-xs">
            <Lock className="w-3.5 h-3.5" />
            <span>Viewer Mode (Read-Only)</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {errorMsg && (
          <div className="p-3 rounded-2xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-xs font-semibold text-red-600 dark:text-red-400">
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900 text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>Settings saved successfully!</span>
          </div>
        )}

        {/* 1. General Business Rules */}
        <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <Settings className="w-4 h-4 text-emerald-500" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              General Application Info
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Store App Name
              </label>
              <input
                type="text"
                value={formData.appName}
                onChange={(e) => handleChange('appName', e.target.value)}
                disabled={!isAdmin}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white disabled:opacity-60"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Currency Symbol
              </label>
              <input
                type="text"
                value={formData.currency}
                disabled
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/60 text-xs font-bold text-slate-900 dark:text-white"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Fixed to Bangladeshi Taka (৳)</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Timezone
              </label>
              <input
                type="text"
                value={formData.timeZone}
                disabled
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/60 text-xs font-mono text-slate-900 dark:text-white"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Standard Bangladesh local time</span>
            </div>
          </div>
        </div>

        {/* 2. Notification Rules (Requirement 17 & 18) */}
        <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <Bell className="w-4 h-4 text-emerald-500" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Notification & Reminder Preferences
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-white block">
                  Master Notifications
                </span>
                <span className="text-[11px] text-slate-400">Enable or disable all reminders</span>
              </div>
              <input
                type="checkbox"
                checked={formData.notificationEnabled}
                onChange={(e) => handleChange('notificationEnabled', e.target.checked)}
                disabled={!isAdmin}
                className="w-5 h-5 rounded-lg text-emerald-600 focus:ring-emerald-500"
              />
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-white block">
                  1-Day Before Reminder
                </span>
                <span className="text-[11px] text-slate-400">Notify 1 day before due date</span>
              </div>
              <input
                type="checkbox"
                checked={formData.reminderOneDayBefore}
                onChange={(e) => handleChange('reminderOneDayBefore', e.target.checked)}
                disabled={!isAdmin}
                className="w-5 h-5 rounded-lg text-emerald-600 focus:ring-emerald-500"
              />
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-white block">
                  Due Today Alerts
                </span>
                <span className="text-[11px] text-slate-400">Alert on the exact due date</span>
              </div>
              <input
                type="checkbox"
                checked={formData.dueTodayNotification}
                onChange={(e) => handleChange('dueTodayNotification', e.target.checked)}
                disabled={!isAdmin}
                className="w-5 h-5 rounded-lg text-emerald-600 focus:ring-emerald-500"
              />
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-white block">
                  Overdue Alerts
                </span>
                <span className="text-[11px] text-slate-400">Alert when installment passes due date</span>
              </div>
              <input
                type="checkbox"
                checked={formData.overdueNotification}
                onChange={(e) => handleChange('overdueNotification', e.target.checked)}
                disabled={!isAdmin}
                className="w-5 h-5 rounded-lg text-emerald-600 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="w-full sm:w-1/3 pt-2">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Daily Notification Schedule Time
            </label>
            <input
              type="time"
              value={formData.notificationTime}
              onChange={(e) => handleChange('notificationTime', e.target.value)}
              disabled={!isAdmin}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
            />
          </div>
        </div>

        {/* 3. Grace Period & Late Fine Rules (Requirement 10 & 19) */}
        <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <Clock className="w-4 h-4 text-emerald-500" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Grace Period & Late Fine Rules
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Grace Period (Days)
              </label>
              <input
                type="number"
                min="0"
                max="60"
                value={formData.gracePeriodDays}
                onChange={(e) => handleChange('gracePeriodDays', Number(e.target.value))}
                disabled={!isAdmin}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Default 7 days before fine applies</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Late Fine Type
              </label>
              <select
                value={formData.lateFineType}
                onChange={(e) => handleChange('lateFineType', e.target.value as any)}
                disabled={!isAdmin}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
              >
                <option value="FIXED">Fixed Taka Amount (৳)</option>
                <option value="PERCENTAGE">Percentage of Installment (%)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Fine Value ({formData.lateFineType === 'FIXED' ? '৳' : '%'})
              </label>
              <input
                type="number"
                min="0"
                value={formData.lateFineAmount}
                onChange={(e) => handleChange('lateFineAmount', Number(e.target.value))}
                disabled={!isAdmin}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white font-bold"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                {formData.lateFineType === 'FIXED' ? 'e.g. ৳500 per overdue installment' : 'e.g. 5% of monthly amount'}
              </span>
            </div>
          </div>
        </div>

        {/* 4. 2% Post-Plan Surcharge Rules (Requirement 12, 13 & 20) */}
        <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Percent className="w-4 h-4 text-emerald-500" />
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Post-Plan Extra Charge Rule (2% Monthly)
                </h3>
                <p className="text-xs text-slate-500">
                  Applied when full EMI tenure has expired and customer still owes money
                </p>
              </div>
            </div>

            <input
              type="checkbox"
              checked={formData.postPlanChargeEnabled}
              onChange={(e) => handleChange('postPlanChargeEnabled', e.target.checked)}
              disabled={!isAdmin}
              className="w-5 h-5 rounded-lg text-emerald-600 focus:ring-emerald-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Monthly Extra Charge Rate (%)
              </label>
              <input
                type="number"
                min="0"
                step="0.5"
                value={formData.postPlanPercentage}
                onChange={(e) => handleChange('postPlanPercentage', Number(e.target.value))}
                disabled={!isAdmin || !formData.postPlanChargeEnabled}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white font-bold disabled:opacity-50"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Default is 2% per month</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Charge Calculation Method
              </label>
              <select
                value={formData.postPlanCalculationMethod}
                onChange={(e) => handleChange('postPlanCalculationMethod', e.target.value as any)}
                disabled={!isAdmin || !formData.postPlanChargeEnabled}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white disabled:opacity-50"
              >
                <option value="CURRENT_OUTSTANDING">2% of Current Outstanding Balance</option>
                <option value="ORIGINAL_OUTSTANDING">2% of Original Financed Amount</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Frequency
              </label>
              <input
                type="text"
                value="Every 30 Days (Monthly)"
                disabled
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/60 text-xs text-slate-900 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Save & Reset Actions */}
        {isAdmin && (
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={handleResetDefaults}
              className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5 transition cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Defaults</span>
            </button>

            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 active:scale-95 transition disabled:opacity-60 cursor-pointer"
            >
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        )}
      </form>
    </div>
  );
};
