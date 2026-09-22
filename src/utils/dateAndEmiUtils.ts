import { AppSettings, EmiAccount, Installment } from '../types';

/**
 * Returns current date string (YYYY-MM-DD) in Asia/Dhaka timezone.
 */
export function getTodayDhaka(): string {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Dhaka',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(new Date()); // Outputs YYYY-MM-DD
}

/**
 * Returns tomorrow date string (YYYY-MM-DD) in Asia/Dhaka timezone.
 */
export function getTomorrowDhaka(): string {
  const now = new Date();
  // Advance by 24h
  now.setHours(now.getHours() + 24);
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Dhaka',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(now);
}

/**
 * Formats a YYYY-MM-DD date string into human-readable format.
 * E.g., "17 Sep 2026" or "17 September 2026"
 */
export function formatDhakaDate(dateStr?: string | null, full = false): string {
  if (!dateStr || typeof dateStr !== 'string') return '-';
  const parts = dateStr.split('-').map(Number);
  if (parts.length < 3 || isNaN(parts[0]) || isNaN(parts[1]) || isNaN(parts[2])) return dateStr;
  const [y, m, d] = parts;

  try {
    const date = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
    return new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Dhaka',
      day: 'numeric',
      month: full ? 'long' : 'short',
      year: 'numeric',
    }).format(date);
  } catch {
    return dateStr;
  }
}

/**
 * Calculate difference in whole calendar days between two YYYY-MM-DD dates (d1 - d2).
 * Positive means d1 is later than d2.
 */
export function diffDaysInDhaka(d1?: string | null, d2?: string | null): number {
  if (!d1 || !d2 || typeof d1 !== 'string' || typeof d2 !== 'string') return 0;
  const parts1 = d1.split('-').map(Number);
  const parts2 = d2.split('-').map(Number);
  if (parts1.length < 3 || parts2.length < 3 || isNaN(parts1[0]) || isNaN(parts2[0])) return 0;
  const [y1, m1, day1] = parts1;
  const [y2, m2, day2] = parts2;
  const utc1 = Date.UTC(y1, m1 - 1, day1);
  const utc2 = Date.UTC(y2, m2 - 1, day2);
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.floor((utc1 - utc2) / msPerDay);
}

/**
 * Add N calendar months to a YYYY-MM-DD date, properly handling month ends (e.g. Jan 31 -> Feb 28).
 */
export function addMonthsToDate(dateStr?: string | null, monthsToAdd = 0): string {
  if (!dateStr || typeof dateStr !== 'string') return getTodayDhaka();
  const parts = dateStr.split('-').map(Number);
  if (parts.length < 3 || isNaN(parts[0])) return dateStr;
  const [year, month, day] = parts;
  let targetYear = year;
  let targetMonth = month - 1 + monthsToAdd; // 0-indexed month

  targetYear += Math.floor(targetMonth / 12);
  targetMonth = ((targetMonth % 12) + 12) % 12;

  // Find max days in target month
  const maxDays = new Date(Date.UTC(targetYear, targetMonth + 1, 0)).getUTCDate();
  const targetDay = Math.min(day || 1, maxDays);

  const yStr = String(targetYear).padStart(4, '0');
  const mStr = String(targetMonth + 1).padStart(2, '0');
  const dStr = String(targetDay).padStart(2, '0');
  return `${yStr}-${mStr}-${dStr}`;
}

/**
 * Format currency in Bangladeshi Taka (৳).
 */
export function formatCurrency(amount: number | undefined | null, symbol = '৳'): string {
  if (amount === undefined || amount === null || isNaN(Number(amount))) return `${symbol}0`;
  const formatted = new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 0,
  }).format(Math.round(Number(amount)));
  return `${symbol}${formatted}`;
}

/**
 * Automatically generate complete installment schedule for an EMI Account.
 */
export function generateInstallmentSchedule(params: {
  emiId: string;
  customerId: string;
  customerName: string;
  customerMobile: string;
  totalMonths: number;
  monthlyAmount: number;
  firstDueDate: string;
  remainingFinancedAmount: number;
}): Installment[] {
  const {
    emiId,
    customerId,
    customerName,
    customerMobile,
    totalMonths,
    monthlyAmount,
    firstDueDate,
    remainingFinancedAmount,
  } = params;

  const installments: Installment[] = [];
  const todayDhaka = getTodayDhaka();

  // Distribute any remainder cents or odd taka to the last installment if necessary
  const expectedTotal = monthlyAmount * totalMonths;
  const difference = remainingFinancedAmount - expectedTotal;

  for (let i = 1; i <= totalMonths; i++) {
    const installmentId = `${emiId}-inst-${i}`;
    const dueDate = addMonthsToDate(firstDueDate, i - 1);
    
    // Base amount for this installment
    let emiAmount = monthlyAmount;
    if (i === totalMonths && difference !== 0) {
      emiAmount += difference;
    }

    // Initial status based on due date
    let status: Installment['status'] = 'UPCOMING';
    let lateDays = 0;

    if (dueDate === todayDhaka) {
      status = 'DUE TODAY';
    } else if (dueDate < todayDhaka) {
      status = 'OVERDUE';
      lateDays = Math.max(0, diffDaysInDhaka(todayDhaka, dueDate));
    }

    installments.push({
      installmentId,
      emiId,
      customerId,
      customerName,
      customerMobile,
      installmentNumber: i,
      totalInstallments: totalMonths,
      dueDate,
      emiAmount,
      paidAmount: 0,
      remainingAmount: emiAmount,
      status,
      lateDays,
      fine: 0,
      extraCharge: 0,
      totalPayable: emiAmount,
      updatedAt: new Date().toISOString(),
    });
  }

  return installments;
}

/**
 * Recalculate late status, grace period fine, and post-plan 2% charges for an EMI account & its installments.
 * Returns updated installment array and charge updates if any.
 */
export function evaluateEmiInstallments(
  installments: Installment[],
  settings: AppSettings,
  emiAccount: EmiAccount
): {
  updatedInstallments: Installment[];
  newFinesAdded: number;
  newPostPlanChargesAdded: number;
  newLastChargedMonth: number;
  hasChanges: boolean;
} {
  const todayDhaka = getTodayDhaka();
  let hasChanges = false;
  let newFinesAdded = 0;
  let newPostPlanChargesAdded = 0;

  // 1. Process Installments
  const updatedInstallments = installments.map((inst) => {
    let changed = false;
    let currentStatus = inst.status;
    let lateDays = inst.lateDays;
    let fine = inst.fine;
    let fineAppliedAt = inst.fineAppliedAt;

    // If fully paid, no further fines apply
    if (inst.paidAmount >= inst.totalPayable && inst.totalPayable > 0) {
      if (inst.status !== 'PAID') {
        currentStatus = 'PAID';
        changed = true;
      }
      return changed
        ? { ...inst, status: currentStatus, remainingAmount: 0, updatedAt: new Date().toISOString() }
        : inst;
    }

    // Status evaluation based on current date
    if (inst.dueDate === todayDhaka) {
      if (inst.paidAmount > 0) {
        if (currentStatus !== 'PARTIALLY PAID') {
          currentStatus = 'PARTIALLY PAID';
          changed = true;
        }
      } else {
        if (currentStatus !== 'DUE TODAY') {
          currentStatus = 'DUE TODAY';
          changed = true;
        }
      }
      if (lateDays !== 0) {
        lateDays = 0;
        changed = true;
      }
    } else if (inst.dueDate < todayDhaka) {
      const calculatedLate = Math.max(0, diffDaysInDhaka(todayDhaka, inst.dueDate));
      if (calculatedLate !== lateDays) {
        lateDays = calculatedLate;
        changed = true;
      }

      if (currentStatus !== 'OVERDUE' && currentStatus !== 'PARTIALLY PAID') {
        currentStatus = 'OVERDUE';
        changed = true;
      }

      // Check Grace Period & Late Fine
      // After gracePeriodDays (e.g. > 7 days), apply configured late fine if not already applied
      if (lateDays > settings.gracePeriodDays && fine === 0) {
        let fineToAdd = 0;
        if (settings.lateFineType === 'FIXED') {
          fineToAdd = settings.lateFineAmount;
        } else {
          fineToAdd = Math.round((inst.emiAmount * settings.lateFineAmount) / 100);
        }
        fine = fineToAdd;
        fineAppliedAt = new Date().toISOString();
        newFinesAdded += fineToAdd;
        changed = true;
      }
    } else {
      // Future date
      if (currentStatus !== 'UPCOMING') {
        currentStatus = 'UPCOMING';
        changed = true;
      }
      if (lateDays !== 0) {
        lateDays = 0;
        changed = true;
      }
    }

    const totalPayable = inst.emiAmount + fine + (inst.extraCharge || 0);
    const remainingAmount = Math.max(0, totalPayable - inst.paidAmount);

    if (totalPayable !== inst.totalPayable || remainingAmount !== inst.remainingAmount) {
      changed = true;
    }

    if (changed) {
      hasChanges = true;
      return {
        ...inst,
        status: currentStatus,
        lateDays,
        fine,
        fineAppliedAt,
        totalPayable,
        remainingAmount,
        updatedAt: new Date().toISOString(),
      };
    }

    return inst;
  });

  // 2. Evaluate Post-Plan Long-Overdue 2% Charge (Requirement 12 & 13)
  // Check if original plan duration has expired and customer still has an unpaid outstanding balance
  let currentLastChargedMonth = emiAccount.lastChargedMonth || 0;
  if (settings.postPlanChargeEnabled && updatedInstallments.length > 0) {
    // Sort to find the final installment due date
    const sorted = [...updatedInstallments].sort((a, b) => a.installmentNumber - b.installmentNumber);
    const finalInstallment = sorted[sorted.length - 1];

    if (finalInstallment && finalInstallment.dueDate < todayDhaka) {
      // Total unpaid outstanding across all installments
      const currentOutstanding = updatedInstallments.reduce((sum, item) => sum + item.remainingAmount, 0);

      if (currentOutstanding > 0) {
        // Calculate how many months past the final due date have elapsed
        const daysPastFinal = diffDaysInDhaka(todayDhaka, finalInstallment.dueDate);
        const monthsPastFinal = Math.floor(daysPastFinal / 30); // Monthly frequency

        if (monthsPastFinal > currentLastChargedMonth) {
          const monthsToCharge = monthsPastFinal - currentLastChargedMonth;
          // Calculate monthly rate
          const base =
            settings.postPlanCalculationMethod === 'CURRENT_OUTSTANDING'
              ? currentOutstanding
              : emiAccount.remainingAmount; // original financed amount
          
          const singleMonthCharge = Math.round(base * (settings.postPlanPercentage / 100));
          const totalNewCharge = singleMonthCharge * monthsToCharge;

          if (totalNewCharge > 0) {
            newPostPlanChargesAdded = totalNewCharge;
            currentLastChargedMonth = monthsPastFinal;
            hasChanges = true;

            // Apply the extra charge to the final installment so it reflects in total payable
            const targetIndex = updatedInstallments.findIndex(
              (i) => i.installmentId === finalInstallment.installmentId
            );
            if (targetIndex !== -1) {
              const target = updatedInstallments[targetIndex];
              const updatedExtra = (target.extraCharge || 0) + totalNewCharge;
              const updatedTotalPayable = target.emiAmount + target.fine + updatedExtra;
              const updatedRemaining = Math.max(0, updatedTotalPayable - target.paidAmount);

              updatedInstallments[targetIndex] = {
                ...target,
                extraCharge: updatedExtra,
                totalPayable: updatedTotalPayable,
                remainingAmount: updatedRemaining,
                postPlanChargeAppliedAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              };
            }
          }
        }
      }
    }
  }

  return {
    updatedInstallments,
    newFinesAdded,
    newPostPlanChargesAdded,
    newLastChargedMonth: currentLastChargedMonth,
    hasChanges,
  };
}
