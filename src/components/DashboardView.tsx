import React, { useState, useMemo } from 'react';
import {
  DollarSign,
  Users,
  AlertTriangle,
  CreditCard,
  Clock,
  Phone,
  CheckCircle2,
  Calendar,
  ArrowRight,
  TrendingUp,
  Search,
  Smartphone,
  Hash,
  Filter,
  ChevronRight,
  User,
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { Customer, EmiAccount, Installment } from '../types';
import {
  diffDaysInDhaka,
  formatCurrency,
  formatDhakaDate,
  getTodayDhaka,
} from '../utils/dateAndEmiUtils';
import { PaymentModal } from './Modals/PaymentModal';

interface DashboardViewProps {
  onOpenAddCustomer: () => void;
  onOpenAddEmi: () => void;
  onNavigateTab: (tab: any) => void;
  onSelectCustomer: (customerId: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onOpenAddCustomer,
  onOpenAddEmi,
  onNavigateTab,
  onSelectCustomer,
}) => {
  const { customers, emiAccounts, installments, payments } = useData();
  const { isAdmin } = useAuth();

  const [selectedInstallmentForPayment, setSelectedInstallmentForPayment] = useState<Installment | null>(null);
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [quickLookupQuery, setQuickLookupQuery] = useState('');
  const [customerEmiFilter, setCustomerEmiFilter] = useState<'ALL_ACTIVE' | 'DUE_TODAY' | 'OVERDUE' | 'ALL'>('ALL_ACTIVE');

  const todayDhaka = getTodayDhaka();

  // Metrics calculation
  const dueTodayInstallments = useMemo(() => {
    return installments.filter(
      (i) => i.dueDate === todayDhaka && i.status !== 'PAID' && (i.remainingAmount || 0) > 0
    );
  }, [installments, todayDhaka]);

  const dueTodayTotal = useMemo(() => {
    return dueTodayInstallments.reduce((sum, i) => sum + (i.remainingAmount || 0), 0);
  }, [dueTodayInstallments]);

  // Today's collections
  const todayPayments = useMemo(() => {
    return payments.filter((p) => p.paymentDate === todayDhaka);
  }, [payments, todayDhaka]);

  const todayCollectedTotal = useMemo(() => {
    return todayPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
  }, [todayPayments]);

  // Overdue
  const overdueInstallments = useMemo(() => {
    return installments
      .filter((i) => i.status === 'OVERDUE' && (i.remainingAmount || 0) > 0)
      .sort((a, b) => (b.lateDays || 0) - (a.lateDays || 0));
  }, [installments]);

  const overdueTotal = useMemo(() => {
    return overdueInstallments.reduce((sum, i) => sum + (i.remainingAmount || 0), 0);
  }, [overdueInstallments]);

  // Total Outstanding
  const activeEmis = useMemo(() => {
    return emiAccounts.filter((e) => e.status !== 'COMPLETED');
  }, [emiAccounts]);

  const totalOutstandingBalance = useMemo(() => {
    return installments
      .filter((i) => i.status !== 'PAID')
      .reduce((sum, i) => sum + (i.remainingAmount || 0), 0);
  }, [installments]);

  // Next 7 days upcoming
  const upcomingNext7Days = useMemo(() => {
    return installments.filter((i) => {
      if (i.status === 'PAID') return false;
      const daysUntil = diffDaysInDhaka(i.dueDate, todayDhaka);
      return daysUntil > 0 && daysUntil <= 7;
    });
  }, [installments, todayDhaka]);

  // Customer Active EMI Summary Cards Data
  const customerEmiSummaries = useMemo(() => {
    const list: Array<{
      customer: Customer;
      activeEmi: EmiAccount | null;
      allEmis: EmiAccount[];
      totalInstallments: number;
      paidInstallments: number;
      remainingInstallments: number;
      completionPercentage: number;
      nextDueInstallment: Installment | null;
      isOverdue: boolean;
      isDueToday: boolean;
    }> = [];

    const activeCustomers = customers.filter((c) => c.status !== 'ARCHIVED');

    for (const customer of activeCustomers) {
      const customerEmis = (customer.emiAccounts || []).filter((e) => Boolean(e));
      const customerInsts = (customer.installments || []).filter((i) => Boolean(i));

      // Find primary active EMI (or latest EMI)
      const primaryActiveEmi =
        customerEmis.find((e) => e.status === 'ACTIVE') ||
        customerEmis[0] ||
        null;

      if (!primaryActiveEmi && customerEmis.length === 0) {
        continue;
      }

      const relevantInsts = primaryActiveEmi
        ? customerInsts.filter((i) => i.emiId === primaryActiveEmi.emiId)
        : customerInsts;

      const totalCount = relevantInsts.length || (primaryActiveEmi ? primaryActiveEmi.totalEmiMonths : 0);
      const paidCount = relevantInsts.filter((i) => i.status === 'PAID').length;
      const remainingCount = Math.max(0, totalCount - paidCount);
      const completionPct = totalCount > 0 ? Math.round((paidCount / totalCount) * 100) : 0;

      // Find next unpaid installment
      const unpaidSorted = relevantInsts
        .filter((i) => i.status !== 'PAID' && (i.remainingAmount || 0) > 0)
        .sort((a, b) => (a.installmentNumber || 0) - (b.installmentNumber || 0));

      const nextDue = unpaidSorted[0] || null;
      const hasOverdue = relevantInsts.some((i) => i.status === 'OVERDUE' && (i.remainingAmount || 0) > 0);
      const hasDueToday = relevantInsts.some((i) => i.dueDate === todayDhaka && i.status !== 'PAID');

      list.push({
        customer,
        activeEmi: primaryActiveEmi,
        allEmis: customerEmis,
        totalInstallments: totalCount,
        paidInstallments: paidCount,
        remainingInstallments: remainingCount,
        completionPercentage: completionPct,
        nextDueInstallment: nextDue,
        isOverdue: hasOverdue,
        isDueToday: hasDueToday,
      });
    }

    return list;
  }, [customers, todayDhaka]);

  // Filtered customer EMI summaries for the active list
  const filteredCustomerSummaries = useMemo(() => {
    const q = customerSearchQuery.trim().toLowerCase();
    return customerEmiSummaries.filter((item) => {
      // Search filter
      if (q) {
        const matchesName = (item.customer.name || '').toLowerCase().includes(q);
        const matchesMobile = (item.customer.mobileNumber || '').includes(q);
        const matchesCustomId = (item.customer.customId || '').toLowerCase().includes(q);
        const matchesProduct = (item.activeEmi?.productName || '').toLowerCase().includes(q);
        const matchesImei = (item.activeEmi?.imeiNumber || '').toLowerCase().includes(q);
        if (!matchesName && !matchesMobile && !matchesCustomId && !matchesProduct && !matchesImei) {
          return false;
        }
      }

      // Tab filter
      if (customerEmiFilter === 'DUE_TODAY') {
        return item.isDueToday;
      }
      if (customerEmiFilter === 'OVERDUE') {
        return item.isOverdue;
      }
      if (customerEmiFilter === 'ALL_ACTIVE') {
        return item.activeEmi && item.activeEmi.status === 'ACTIVE';
      }

      return true;
    });
  }, [customerEmiSummaries, customerSearchQuery, customerEmiFilter]);

  return (
    <div className="space-y-6 pb-16 lg:pb-8">
      {/* Top Banner / Welcome */}
      <div className="p-6 rounded-3xl bg-linear-to-br from-slate-900 via-slate-800 to-slate-950 text-white shadow-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-extrabold uppercase tracking-widest text-emerald-400">
            Mehedi Telecom • Personal EMI
          </span>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight mt-1">
            EMI Overview & Daily Reminders
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
            Live Dhaka date: <strong className="text-emerald-400">{formatDhakaDate(todayDhaka, true)}</strong>.
            Track installment collections, overdue accounts, and customer balances.
          </p>
        </div>

        {isAdmin && (
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={onOpenAddEmi}
              className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-black shadow-md shadow-emerald-500/20 transition cursor-pointer active:scale-95"
            >
              + Create EMI
            </button>
          </div>
        )}
      </div>

      {/* Primary KPI Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Today's Due */}
        <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Due Today</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white block">
              {formatCurrency(dueTodayTotal)}
            </span>
            <span className="text-xs text-amber-600 dark:text-amber-400 font-semibold mt-0.5 block">
              {dueTodayInstallments.length} installment{dueTodayInstallments.length !== 1 ? 's' : ''} to collect
            </span>
          </div>
        </div>

        {/* Card 2: Today's Collection */}
        <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Collected Today</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 block">
              {formatCurrency(todayCollectedTotal)}
            </span>
            <span className="text-xs text-slate-500 font-medium mt-0.5 block">
              {todayPayments.length} payment{todayPayments.length !== 1 ? 's' : ''} recorded
            </span>
          </div>
        </div>

        {/* Card 3: Total Overdue */}
        <div
          onClick={() => onNavigateTab('overdue')}
          className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-red-200 dark:border-red-950/80 shadow-xs cursor-pointer hover:border-red-400 transition"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-red-600 dark:text-red-400">Total Overdue</span>
            <div className="w-8 h-8 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-xl sm:text-2xl font-black text-red-600 dark:text-red-400 block">
              {formatCurrency(overdueTotal)}
            </span>
            <span className="text-xs text-slate-500 font-medium mt-0.5 flex items-center gap-1">
              <span>{overdueInstallments.length} accounts overdue</span>
              <ArrowRight className="w-3 h-3 text-red-500" />
            </span>
          </div>
        </div>

        {/* Card 4: Total Outstanding */}
        <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Total Outstanding</span>
            <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white block">
              {formatCurrency(totalOutstandingBalance)}
            </span>
            <span className="text-xs text-slate-500 font-medium mt-0.5 block">
              {activeEmis.length} active customer plan{activeEmis.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </div>

      {/* Customer Active EMI Plans & Installment Progress (Clean & Uncluttered) */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-emerald-500" />
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Active EMI Plans & Installment Progress
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Installment progress (Paid vs. Total) for active customer plans
            </p>
          </div>

          {/* Search & Filter Controls */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-full sm:w-56">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Filter by name, mobile, device..."
                value={customerSearchQuery}
                onChange={(e) => setCustomerSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-emerald-500"
              />
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setCustomerEmiFilter('ALL_ACTIVE')}
                className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition cursor-pointer ${
                  customerEmiFilter === 'ALL_ACTIVE'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                Active ({customerEmiSummaries.filter((s) => s.activeEmi?.status === 'ACTIVE').length})
              </button>
              <button
                onClick={() => setCustomerEmiFilter('DUE_TODAY')}
                className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition cursor-pointer ${
                  customerEmiFilter === 'DUE_TODAY'
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                Due Today ({customerEmiSummaries.filter((s) => s.isDueToday).length})
              </button>
              <button
                onClick={() => setCustomerEmiFilter('OVERDUE')}
                className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition cursor-pointer ${
                  customerEmiFilter === 'OVERDUE'
                    ? 'bg-red-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                Overdue ({customerEmiSummaries.filter((s) => s.isOverdue).length})
              </button>
            </div>
          </div>
        </div>

        {/* Clean, Non-Cluttered List / Table */}
        {filteredCustomerSummaries.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs">
            No active customer EMI plans match the filter.
          </div>
        ) : (
          <div className="mt-3 divide-y divide-slate-100 dark:divide-slate-800/80">
            {filteredCustomerSummaries.map((item) => {
              const {
                customer,
                activeEmi,
                totalInstallments,
                paidInstallments,
                completionPercentage,
                nextDueInstallment,
                isOverdue,
                isDueToday,
              } = item;

              return (
                <div
                  key={customer.customerId}
                  className="py-3.5 px-2 -mx-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3.5 group"
                >
                  {/* Customer & Device Column */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        onClick={() => onSelectCustomer(customer.customerId)}
                        className="font-bold text-sm text-slate-900 dark:text-white hover:text-emerald-600 dark:hover:text-emerald-400 cursor-pointer text-left truncate"
                      >
                        {customer.name}
                      </button>
                      {customer.customId && (
                        <span className="font-mono text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                          {customer.customId}
                        </span>
                      )}
                      {isOverdue ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
                          Overdue
                        </span>
                      ) : isDueToday ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                          Due Today
                        </span>
                      ) : null}
                    </div>

                    <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 flex-wrap">
                      <a
                        href={`tel:${customer.mobileNumber}`}
                        className="hover:text-emerald-600 dark:hover:text-emerald-400 font-medium"
                      >
                        {customer.mobileNumber}
                      </a>
                      {activeEmi && (
                        <>
                          <span>•</span>
                          <span className="text-slate-700 dark:text-slate-300 font-medium flex items-center gap-1">
                            <Smartphone className="w-3 h-3 text-slate-400" />
                            {activeEmi.productName}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Installment Progress Bar & Counter */}
                  <div className="w-full md:w-56 shrink-0">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-slate-600 dark:text-slate-300 font-medium">
                        <strong className="text-emerald-600 dark:text-emerald-400">{paidInstallments}</strong> of {totalInstallments} Paid
                      </span>
                      <span className="text-[11px] font-bold text-slate-500">{completionPercentage}%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-emerald-500 transition-all duration-300"
                        style={{ width: `${completionPercentage}%` }}
                      />
                    </div>
                  </div>

                  {/* Balance & Next Due Info */}
                  <div className="flex items-center justify-between md:justify-end gap-5 text-right shrink-0">
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">Remaining Due</span>
                      <span className="text-xs font-black text-slate-900 dark:text-white block">
                        {formatCurrency(customer.remainingAmount)}
                      </span>
                    </div>

                    {nextDueInstallment && (
                      <div className="text-left md:text-right min-w-[90px]">
                        <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">
                          Next (#{nextDueInstallment.installmentNumber})
                        </span>
                        <span
                          className={`text-xs font-bold ${
                            isOverdue
                              ? 'text-red-600 dark:text-red-400'
                              : isDueToday
                              ? 'text-amber-600 dark:text-amber-400'
                              : 'text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {formatDhakaDate(nextDueInstallment.dueDate)}
                        </span>
                      </div>
                    )}

                    {/* Action Button */}
                    <button
                      onClick={() => onSelectCustomer(customer.customerId)}
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-emerald-50 hover:border-emerald-300 dark:hover:bg-emerald-950/30 text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition cursor-pointer"
                      title="View Customer Details"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Main Content Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Today's Due & Critical Overdue */}
        <div className="lg:col-span-2 space-y-6">
          {/* Section 1: Today's Due Installments */}
          <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Today's Due EMI ({dueTodayInstallments.length})
                </h2>
              </div>
              <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
                Total: {formatCurrency(dueTodayTotal)}
              </span>
            </div>

            <div className="mt-4 space-y-3">
              {dueTodayInstallments.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  No installments due today ({formatDhakaDate(todayDhaka)}).
                </div>
              ) : (
                dueTodayInstallments.map((inst) => {
                  const parentEmi = emiAccounts.find((e) => e.emiId === inst.emiId);
                  return (
                    <div
                      key={inst.installmentId}
                      className="p-4 rounded-2xl bg-amber-50/40 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <button
                            onClick={() => onSelectCustomer(inst.customerId)}
                            className="text-sm font-bold text-slate-900 dark:text-white hover:text-emerald-500 hover:underline text-left cursor-pointer"
                          >
                            {inst.customerName}
                          </button>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-600 dark:text-amber-400">
                            Inst #{inst.installmentNumber} of {inst.totalInstallments}
                          </span>
                          {parentEmi && (
                            <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1">
                              <Smartphone className="w-3 h-3 text-slate-400" />
                              <span>{parentEmi.productName}</span>
                            </span>
                          )}
                          {parentEmi?.imeiNumber && (
                            <span className="font-mono text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                              IMEI: {parentEmi.imeiNumber}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                          <a
                            href={`tel:${inst.customerMobile}`}
                            className="flex items-center gap-1 text-emerald-600 hover:underline font-medium"
                          >
                            <Phone className="w-3 h-3" />
                            <span>{inst.customerMobile}</span>
                          </a>
                          <span>•</span>
                          <span className="font-extrabold text-slate-800 dark:text-slate-200">
                            Due: {formatCurrency(inst.remainingAmount)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <a
                          href={`tel:${inst.customerMobile}`}
                          className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                        >
                          Call
                        </a>
                        <button
                          onClick={() => setSelectedInstallmentForPayment(inst)}
                          className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs active:scale-95 transition cursor-pointer"
                        >
                          Mark Paid
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Section 2: Overdue Installments Preview */}
          <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Overdue Accounts ({overdueInstallments.length})
                </h2>
              </div>
              <button
                onClick={() => onNavigateTab('overdue')}
                className="text-xs font-bold text-red-500 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>View All</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {overdueInstallments.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  All customer accounts are up to date. No overdue payments!
                </div>
              ) : (
                overdueInstallments.slice(0, 5).map((inst) => {
                  const parentEmi = emiAccounts.find((e) => e.emiId === inst.emiId);
                  return (
                    <div
                      key={inst.installmentId}
                      className="p-4 rounded-2xl bg-red-50/40 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <button
                            onClick={() => onSelectCustomer(inst.customerId)}
                            className="text-sm font-bold text-slate-900 dark:text-white hover:text-red-500 hover:underline text-left cursor-pointer"
                          >
                            {inst.customerName}
                          </button>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/20 text-red-600 dark:text-red-400">
                            {inst.lateDays} days late
                          </span>
                          {parentEmi && (
                            <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1">
                              <Smartphone className="w-3 h-3 text-slate-400" />
                              <span>{parentEmi.productName}</span>
                            </span>
                          )}
                          {parentEmi?.imeiNumber && (
                            <span className="font-mono text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                              IMEI: {parentEmi.imeiNumber}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                          <span>Due Date: {formatDhakaDate(inst.dueDate)}</span>
                          {(inst.fine || 0) > 0 && <span className="text-red-500 font-bold">+Fine: {formatCurrency(inst.fine)}</span>}
                          {(inst.extraCharge || 0) > 0 && (
                            <span className="text-amber-600 font-bold">+2%: {formatCurrency(inst.extraCharge)}</span>
                          )}
                          <span>•</span>
                          <span className="font-extrabold text-red-600 dark:text-red-400">
                            Total Due: {formatCurrency(inst.remainingAmount)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <a
                          href={`tel:${inst.customerMobile}`}
                          className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                        >
                          Call
                        </a>
                        <button
                          onClick={() => setSelectedInstallmentForPayment(inst)}
                          className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs active:scale-95 transition cursor-pointer"
                        >
                          Mark Paid
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right 1 Column: Quick Action Shortcuts & Upcoming Next 7 Days */}
        <div className="space-y-6">
          {/* Upcoming Next 7 Days */}
          <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-500" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Upcoming in 7 Days</h3>
              </div>
              <span className="text-xs text-slate-500">{upcomingNext7Days.length} due</span>
            </div>

            <div className="mt-3 space-y-2.5 max-h-96 overflow-y-auto pr-1">
              {upcomingNext7Days.length === 0 ? (
                <div className="py-6 text-center text-slate-400 text-xs">
                  No payments scheduled in the next 7 days.
                </div>
              ) : (
                upcomingNext7Days.map((inst) => {
                  const daysLeft = diffDaysInDhaka(inst.dueDate, todayDhaka);
                  return (
                    <div
                      key={inst.installmentId}
                      className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs"
                    >
                      <div>
                        <button
                          onClick={() => onSelectCustomer(inst.customerId)}
                          className="font-bold text-slate-900 dark:text-white hover:text-emerald-500 text-left block cursor-pointer"
                        >
                          {inst.customerName}
                        </button>
                        <span className="text-[11px] text-slate-500">
                          {formatDhakaDate(inst.dueDate)} ({daysLeft === 1 ? 'Tomorrow' : `in ${daysLeft} days`})
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="font-extrabold text-emerald-600 dark:text-emerald-400 block">
                          {formatCurrency(inst.remainingAmount)}
                        </span>
                        <span className="text-[10px] text-slate-400">Inst #{inst.installmentNumber}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Quick Customer Directory Lookup */}
          <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2">Customer Quick Lookup</h3>
            <div className="relative mb-3">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search by customer or phone..."
                value={quickLookupQuery}
                onChange={(e) => setQuickLookupQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-emerald-500"
              />
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {customers
                .filter((c) => c.status !== 'ARCHIVED')
                .filter(
                  (c) =>
                    !quickLookupQuery ||
                    (c.name || '').toLowerCase().includes(quickLookupQuery.toLowerCase()) ||
                    (c.mobileNumber || '').includes(quickLookupQuery) ||
                    (c.customId || '').toLowerCase().includes(quickLookupQuery.toLowerCase())
                )
                .slice(0, 5)
                .map((c) => (
                  <div
                    key={c.customerId}
                    onClick={() => onSelectCustomer(c.customerId)}
                    className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 flex items-center justify-between cursor-pointer transition text-xs"
                  >
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white block">{c.name}</span>
                      <span className="text-[11px] text-slate-500">{c.mobileNumber}</span>
                    </div>
                    <span className="font-mono text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(c.remainingAmount)}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={!!selectedInstallmentForPayment}
        onClose={() => setSelectedInstallmentForPayment(null)}
        installment={selectedInstallmentForPayment}
      />
    </div>
  );
};
