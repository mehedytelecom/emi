import { AppSettings, Installment, NotificationItem } from '../types';
import { formatCurrency, formatDhakaDate, getTodayDhaka, getTomorrowDhaka } from '../utils/dateAndEmiUtils';

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    console.warn('This browser does not support desktop/push notifications.');
    return 'denied';
  }

  const permission = await Notification.requestPermission();
  return permission;
}

export function getNotificationPermissionStatus(): NotificationPermission {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied';
  }
  return Notification.permission;
}

export async function sendLocalPushNotification(title: string, body: string, data?: Record<string, unknown>) {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;

  try {
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.ready;
      if (reg && 'showNotification' in reg) {
        await reg.showNotification(title, {
          body,
          icon: '/pwa-192x192.png',
          badge: '/favicon.ico',
          vibrate: [200, 100, 200],
          data: data || {},
        } as any);
        return;
      }
    }

    // Fallback to standard Notification API
    new Notification(title, {
      body,
      icon: '/pwa-192x192.png',
      badge: '/favicon.ico',
    });
  } catch (err) {
    console.error('Failed to trigger notification:', err);
  }
}

/**
 * Scan active installments against settings and return notifications to dispatch.
 */
export function generateInstallmentAlerts(
  installments: Installment[],
  settings: AppSettings
): {
  dueTodayAlerts: { title: string; body: string; item: Installment }[];
  dueTomorrowAlerts: { title: string; body: string; item: Installment }[];
  overdueAlerts: { title: string; body: string; item: Installment }[];
} {
  const todayDhaka = getTodayDhaka();
  const tomorrowDhaka = getTomorrowDhaka();

  const dueTodayAlerts: { title: string; body: string; item: Installment }[] = [];
  const dueTomorrowAlerts: { title: string; body: string; item: Installment }[] = [];
  const overdueAlerts: { title: string; body: string; item: Installment }[] = [];

  if (!settings.notificationEnabled) {
    return { dueTodayAlerts, dueTomorrowAlerts, overdueAlerts };
  }

  for (const inst of installments) {
    // Only unpaid or partially paid installments generate alerts
    if (inst.status === 'PAID' || inst.remainingAmount <= 0) continue;

    // 1. Due Today
    if (inst.dueDate === todayDhaka && settings.dueTodayNotification) {
      dueTodayAlerts.push({
        title: 'EMI Due Today',
        body: `Customer: ${inst.customerName}\nAmount: ${formatCurrency(inst.remainingAmount)}\nDue Date: ${formatDhakaDate(inst.dueDate, true)}`,
        item: inst,
      });
    }

    // 2. Due Tomorrow (One-day-before)
    if (inst.dueDate === tomorrowDhaka && settings.reminderOneDayBefore) {
      dueTomorrowAlerts.push({
        title: 'EMI Reminder',
        body: `${inst.customerName}'s EMI of ${formatCurrency(inst.remainingAmount)} is due tomorrow (${formatDhakaDate(inst.dueDate)}).`,
        item: inst,
      });
    }

    // 3. Overdue
    if (inst.dueDate < todayDhaka && settings.overdueNotification) {
      const lateDays = inst.lateDays || 1;
      overdueAlerts.push({
        title: 'EMI Overdue',
        body: `${inst.customerName}'s EMI of ${formatCurrency(inst.remainingAmount)} is overdue by ${lateDays} day${lateDays > 1 ? 's' : ''}.`,
        item: inst,
      });
    }
  }

  return { dueTodayAlerts, dueTomorrowAlerts, overdueAlerts };
}
