import React, { useMemo } from 'react';
import {
  FileBarChart,
  Download,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  CreditCard,
  PieChart as PieChartIcon,
  CheckCircle2,
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, formatDhakaDate, getTodayDhaka } from '../utils/dateAndEmiUtils';

export const ReportsView: React.FC = () => {
  const { emiAccounts, installments, payments, customers } = useData();
  const { isAdmin } = useAuth();

  const todayDhaka = getTodayDhaka();
  const currentMonthPrefix = todayDhaka.slice(0, 7); // e.g. "2026-09"

  // 1. Collections
  const todayCollections = payments
    .filter((p) => p.paymentDate === todayDhaka)
    .reduce((sum, p) => sum + p.amount, 0);

  const monthCollections = payments
    .filter((p) => p.paymentDate.startsWith(currentMonthPrefix))
    .reduce((sum, p) => sum + p.amount, 0);

  const totalCollectedAllTime = payments.reduce((sum, p) => sum + p.amount, 0);

  // 2. Balances
  const totalOutstanding = installments
    .filter((i) => i.status !== 'PAID')
    .reduce((sum, i) => sum + i.remainingAmount, 0);

  const totalOverdue = installments
    .filter((i) => i.status === 'OVERDUE' && i.remainingAmount > 0)
    .reduce((sum, i) => sum + i.remainingAmount, 0);

  // 3. Fines & Post-plan charges
  const totalLateFines = installments.reduce((sum, i) => sum + (i.fine || 0), 0);
  const totalPostPlan = installments.reduce((sum, i) => sum + (i.extraCharge || 0), 0);

  // 4. Accounts Breakdown
  const activeEmis = emiAccounts.filter((e) => e.status !== 'COMPLETED').length;
  const completedEmis = emiAccounts.filter((e) => e.status === 'COMPLETED').length;

  // 5. Payment Methods breakdown
  const paymentMethodsBreakdown = useMemo(() => {
    const summary: Record<string, { count: number; total: number }> = {
      CASH: { count: 0, total: 0 },
      BKASH: { count: 0, total: 0 },
      NAGAD: { count: 0, total: 0 },
      ROCKET: { count: 0, total: 0 },
      BANK: { count: 0, total: 0 },
    };

    for (const p of payments) {
      if (!summary[p.paymentMethod]) {
        summary[p.paymentMethod] = { count: 0, total: 0 };
      }
      summary[p.paymentMethod].count += 1;
      summary[p.paymentMethod].total += p.amount;
    }

    return summary;
  }, [payments]);

  // CSV Export
  const handleExportCsv = () => {
    const headers = [
      'Installment ID',
      'Customer Name',
      'Mobile',
      'Installment #',
      'Due Date',
      'EMI Amount',
      'Fine',
      'Extra Charge',
      'Total Payable',
      'Paid Amount',
      'Remaining',
      'Status',
    ];

    const rows = installments.map((i) => [
      i.installmentId,
      `"${i.customerName}"`,
      i.customerMobile,
      i.installmentNumber,
      i.dueDate,
      i.emiAmount,
      i.fine,
      i.extraCharge || 0,
      i.totalPayable,
      i.paidAmount,
      i.remainingAmount,
      i.status,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Mehedi_Telecom_EMI_Report_${todayDhaka}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-16 lg:pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            Reports & Financial Analytics
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Comprehensive business performance, collection tallies, and account audits
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={handleExportCsv}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 shadow-xs transition active:scale-95 cursor-pointer"
          >
            <Download className="w-4 h-4 text-emerald-500" />
            <span>Export CSV Report</span>
          </button>
        )}
      </div>

      {/* Collection Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-3xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40">
          <span className="text-xs font-bold text-emerald-800 dark:text-emerald-400">Today's Collection</span>
          <p className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
            {formatCurrency(todayCollections)}
          </p>
          <span className="text-xs text-emerald-700/80 font-medium mt-0.5 block">
            Dhaka Date: {formatDhakaDate(todayDhaka)}
          </span>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400">This Month's Collection</span>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1">
            {formatCurrency(monthCollections)}
          </p>
          <span className="text-xs text-slate-400 font-medium mt-0.5 block">
            Current Billing Cycle
          </span>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Total Collected All-Time</span>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1">
            {formatCurrency(totalCollectedAllTime)}
          </p>
          <span className="text-xs text-slate-400 font-medium mt-0.5 block">
            {payments.length} verified receipts issued
          </span>
        </div>
      </div>

      {/* Outstanding & Risk Tallies */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Total Outstanding</span>
          <p className="text-xl font-black text-slate-900 dark:text-white mt-1">
            {formatCurrency(totalOutstanding)}
          </p>
        </div>

        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-red-200 dark:border-red-950/60">
          <span className="text-xs font-bold text-red-600 dark:text-red-400">Total Overdue</span>
          <p className="text-xl font-black text-red-600 dark:text-red-400 mt-1">
            {formatCurrency(totalOverdue)}
          </p>
        </div>

        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Late Fines Applied</span>
          <p className="text-xl font-black text-slate-900 dark:text-white mt-1">
            {formatCurrency(totalLateFines)}
          </p>
        </div>

        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400">2% Post-Plan Surcharges</span>
          <p className="text-xl font-black text-amber-600 dark:text-amber-400 mt-1">
            {formatCurrency(totalPostPlan)}
          </p>
        </div>
      </div>

      {/* Payment Channel Breakdown & Account Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Method Breakdown */}
        <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">
            Payment Method Breakdown
          </h3>

          <div className="space-y-3">
            {Object.entries(paymentMethodsBreakdown).map(([method, data]) => {
              const percentage =
                totalCollectedAllTime > 0 ? Math.round((data.total / totalCollectedAllTime) * 100) : 0;

              return (
                <div key={method} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-700 dark:text-slate-300">{method}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 font-normal">{data.count} txns</span>
                      <span className="text-slate-900 dark:text-white">{formatCurrency(data.total)}</span>
                      <span className="text-emerald-500 font-mono text-[11px] w-8 text-right">{percentage}%</span>
                    </div>
                  </div>
                  {/* Bar */}
                  <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Portfolio Status */}
        <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">
              EMI Account Lifecycle
            </h3>
            <div className="grid grid-cols-2 gap-3 mt-4">
              <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/40">
                <span className="text-xs font-bold text-blue-700 dark:text-blue-400 block">Active EMI Plans</span>
                <span className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1 block">
                  {activeEmis}
                </span>
                <span className="text-[11px] text-slate-400">Currently financing</span>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40">
                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 block">Completed Plans</span>
                <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1 block">
                  {completedEmis}
                </span>
                <span className="text-[11px] text-slate-400">100% installments cleared</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 flex items-center justify-between">
            <span>Customer Base: {customers.length} registered</span>
            <span className="font-bold text-emerald-500">Business Timezone: Asia/Dhaka</span>
          </div>
        </div>
      </div>
    </div>
  );
};
