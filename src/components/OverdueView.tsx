import React, { useState } from 'react';
import {
  AlertTriangle,
  Clock,
  Phone,
  CheckCircle2,
  RefreshCw,
  Search,
  Filter,
  DollarSign,
  User,
  ShieldCheck,
  Smartphone,
  Hash,
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { Installment } from '../types';
import { formatCurrency, formatDhakaDate, getTodayDhaka } from '../utils/dateAndEmiUtils';
import { PaymentModal } from './Modals/PaymentModal';

interface OverdueViewProps {
  onSelectCustomer: (customerId: string) => void;
}

export const OverdueView: React.FC<OverdueViewProps> = ({ onSelectCustomer }) => {
  const { installments, emiAccounts, settings, triggerEmiEvaluation } = useData();
  const { isAdmin } = useAuth();

  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'LATE_DAYS_DESC' | 'AMOUNT_DESC'>('LATE_DAYS_DESC');
  const [evaluating, setEvaluating] = useState(false);
  const [selectedInstallmentForPayment, setSelectedInstallmentForPayment] = useState<Installment | null>(null);

  const todayDhaka = getTodayDhaka();

  // Overdue Installments
  const overdueList = installments
    .filter((i) => i.status === 'OVERDUE' && i.remainingAmount > 0)
    .filter((i) => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      const parentEmi = emiAccounts.find((e) => e.emiId === i.emiId);
      return (
        i.customerName.toLowerCase().includes(q) ||
        i.customerMobile.includes(q) ||
        i.installmentId.toLowerCase().includes(q) ||
        (parentEmi && (
          parentEmi.productName.toLowerCase().includes(q) ||
          (parentEmi.imeiNumber && parentEmi.imeiNumber.toLowerCase().includes(q)) ||
          (parentEmi.guarantorName && parentEmi.guarantorName.toLowerCase().includes(q)) ||
          (parentEmi.guarantorMobile && parentEmi.guarantorMobile.includes(q))
        ))
      );
    })
    .sort((a, b) => {
      if (sortBy === 'LATE_DAYS_DESC') {
        return (b.lateDays || 0) - (a.lateDays || 0);
      }
      return b.remainingAmount - a.remainingAmount;
    });

  const totalOverdueAmount = overdueList.reduce((sum, i) => sum + i.remainingAmount, 0);
  const totalFines = overdueList.reduce((sum, i) => sum + (i.fine || 0), 0);
  const totalPostPlan = overdueList.reduce((sum, i) => sum + (i.extraCharge || 0), 0);

  const handleRecalculate = async () => {
    try {
      setEvaluating(true);
      await triggerEmiEvaluation();
    } catch (err) {
      console.error(err);
    } finally {
      setEvaluating(false);
    }
  };

  return (
    <div className="space-y-6 pb-16 lg:pb-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              Overdue Accounts Manager
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Accounts past grace period ({settings.gracePeriodDays} days), late fines, and 2% post-plan charges
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={handleRecalculate}
            disabled={evaluating}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 shadow-xs transition active:scale-95 cursor-pointer disabled:opacity-60"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${evaluating ? 'animate-spin' : ''}`} />
            <span>Recalculate Fines</span>
          </button>
        )}
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-3xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40">
          <span className="text-xs font-bold text-red-700 dark:text-red-400">Total Overdue Amount</span>
          <p className="text-2xl font-black text-red-600 dark:text-red-400 mt-1">
            {formatCurrency(totalOverdueAmount)}
          </p>
          <span className="text-xs text-red-500/80 font-semibold mt-0.5 block">
            {overdueList.length} installment accounts overdue
          </span>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Late Fines Applied</span>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {formatCurrency(totalFines)}
          </p>
          <span className="text-xs text-slate-400 font-medium mt-0.5 block">
            After {settings.gracePeriodDays} days grace period
          </span>
        </div>

        <div className="p-5 rounded-3xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40">
          <span className="text-xs font-bold text-amber-700 dark:text-amber-400">Post-Plan 2% Charges</span>
          <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">
            {formatCurrency(totalPostPlan)}
          </p>
          <span className="text-xs text-amber-500/80 font-semibold mt-0.5 block">
            Monthly charge for expired plans
          </span>
        </div>
      </div>

      {/* Search & Sorting Controls */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search overdue customers by name, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-emerald-500 shadow-xs"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-bold text-slate-500 whitespace-nowrap">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-emerald-500"
          >
            <option value="LATE_DAYS_DESC">Oldest Overdue (Highest Days)</option>
            <option value="AMOUNT_DESC">Highest Amount Due</option>
          </select>
        </div>
      </div>

      {/* Overdue Items List */}
      {overdueList.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-400">
          <CheckCircle2 className="w-12 h-12 mx-auto mb-2 text-emerald-500" />
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">No Overdue Accounts!</h3>
          <p className="text-xs text-slate-500 mt-1">
            All customer installments are fully paid or up to date.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {overdueList.map((inst) => {
            const isPastGrace = inst.lateDays > settings.gracePeriodDays;
            const parentEmi = emiAccounts.find((e) => e.emiId === inst.emiId);

            return (
              <div
                key={inst.installmentId}
                className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-red-200 dark:border-red-950/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => onSelectCustomer(inst.customerId)}
                      className="text-base font-bold text-slate-900 dark:text-white hover:text-red-500 hover:underline cursor-pointer"
                    >
                      {inst.customerName}
                    </button>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400">
                      {inst.lateDays} Days Overdue
                    </span>
                    {isPastGrace ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-400">
                        Grace Expired
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-400">
                        In Grace Period ({settings.gracePeriodDays - inst.lateDays}d left)
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5 mt-1.5 text-xs text-slate-500">
                    <a
                      href={`tel:${inst.customerMobile}`}
                      className="flex items-center gap-1 text-emerald-600 hover:underline font-semibold font-mono"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>{inst.customerMobile}</span>
                    </a>

                    {parentEmi && (
                      <>
                        <span>•</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                          <Smartphone className="w-3.5 h-3.5 text-slate-400" />
                          <span>{parentEmi.productName}</span>
                        </span>
                      </>
                    )}

                    {parentEmi?.imeiNumber && (
                      <span className="font-mono text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700 inline-flex items-center gap-1">
                        <Hash className="w-3 h-3 text-slate-400" />
                        <span>IMEI: {parentEmi.imeiNumber}</span>
                      </span>
                    )}

                    <span>•</span>
                    <span>Inst #{inst.installmentNumber} of {inst.totalInstallments}</span>
                    <span>•</span>
                    <span>Due: {formatDhakaDate(inst.dueDate)}</span>
                  </div>

                  {/* Guarantor Details for debt recovery */}
                  {parentEmi && (parentEmi.guarantorName || parentEmi.guarantorMobile) && (
                    <div className="mt-2 p-2 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40 text-xs flex flex-wrap items-center justify-between gap-2 max-w-lg">
                      <div className="flex items-center gap-1.5 text-amber-900 dark:text-amber-300">
                        <ShieldCheck className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        <span>Guarantor: <strong className="font-bold">{parentEmi.guarantorName || 'Assigned'}</strong></span>
                      </div>
                      {parentEmi.guarantorMobile && (
                        <div className="flex items-center gap-2">
                          <a
                            href={`tel:${parentEmi.guarantorMobile}`}
                            className="font-mono text-emerald-600 dark:text-emerald-400 font-bold hover:underline flex items-center gap-1"
                          >
                            <Phone className="w-3 h-3" />
                            {parentEmi.guarantorMobile}
                          </a>
                          <a
                            href={`tel:${parentEmi.guarantorMobile}`}
                            className="px-2 py-0.5 rounded-md bg-amber-600 text-white text-[10px] font-bold hover:bg-amber-700 cursor-pointer"
                          >
                            Call Guarantor
                          </a>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Fines & Surcharges breakdown */}
                  <div className="flex flex-wrap items-center gap-3 mt-2 text-xs">
                    <span className="text-slate-600 dark:text-slate-400">
                      Base: <strong>{formatCurrency(inst.emiAmount)}</strong>
                    </span>
                    {inst.fine > 0 && (
                      <span className="text-red-500 font-bold">
                        Late Fine: +{formatCurrency(inst.fine)}
                      </span>
                    )}
                    {(inst.extraCharge || 0) > 0 && (
                      <span className="text-amber-600 font-bold">
                        Post-Plan 2%: +{formatCurrency(inst.extraCharge)}
                      </span>
                    )}
                    {inst.paidAmount > 0 && (
                      <span className="text-emerald-500 font-semibold">
                        Already Paid: {formatCurrency(inst.paidAmount)}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end md:self-center">
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block font-semibold">Total Payable</span>
                    <span className="text-lg font-black text-red-600 dark:text-red-400">
                      {formatCurrency(inst.remainingAmount)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <a
                      href={`tel:${inst.customerMobile}`}
                      className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                    >
                      Call
                    </a>
                    <button
                      onClick={() => setSelectedInstallmentForPayment(inst)}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs active:scale-95 transition cursor-pointer"
                    >
                      Mark as Paid
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Payment Modal */}
      <PaymentModal
        isOpen={!!selectedInstallmentForPayment}
        onClose={() => setSelectedInstallmentForPayment(null)}
        installment={selectedInstallmentForPayment}
      />
    </div>
  );
};
