import React, { useState } from 'react';
import {
  CreditCard,
  Plus,
  Search,
  CheckCircle2,
  Calendar,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Clock,
  User,
  ShieldCheck,
  Phone,
  Hash,
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { EmiAccount, Installment } from '../types';
import { formatCurrency, formatDhakaDate } from '../utils/dateAndEmiUtils';
import { PaymentModal } from './Modals/PaymentModal';

interface EmiViewProps {
  onOpenAddEmi: () => void;
  onSelectCustomer: (customerId: string) => void;
}

export const EmiView: React.FC<EmiViewProps> = ({ onOpenAddEmi, onSelectCustomer }) => {
  const { emiAccounts, installments } = useData();
  const { isAdmin } = useAuth();

  const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'COMPLETED'>('ACTIVE');
  const [search, setSearch] = useState('');
  const [expandedEmiId, setExpandedEmiId] = useState<string | null>(null);
  const [selectedInstallmentForPayment, setSelectedInstallmentForPayment] = useState<Installment | null>(null);

  const filteredEmis = emiAccounts
    .filter((e) => {
      if (filter === 'ACTIVE') return e.status !== 'COMPLETED';
      if (filter === 'COMPLETED') return e.status === 'COMPLETED';
      return true;
    })
    .filter((e) => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        (e.productName || '').toLowerCase().includes(q) ||
        (e.customerName || '').toLowerCase().includes(q) ||
        (e.customerMobile || '').includes(q) ||
        (e.imeiNumber && e.imeiNumber.toLowerCase().includes(q)) ||
        (e.guarantorName && e.guarantorName.toLowerCase().includes(q)) ||
        (e.guarantorMobile && e.guarantorMobile.includes(q))
      );
    });

  const toggleExpand = (emiId: string) => {
    setExpandedEmiId(expandedEmiId === emiId ? null : emiId);
  };

  return (
    <div className="space-y-6 pb-16 lg:pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            EMI Accounts & Plans
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            {emiAccounts.length} total customer EMI accounts registered
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={onOpenAddEmi}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create New EMI</span>
          </button>
        )}
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by product, customer, or phone number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-emerald-500 shadow-xs"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setFilter('ACTIVE')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
              filter === 'ACTIVE'
                ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800'
            }`}
          >
            Active ({emiAccounts.filter((e) => e.status !== 'COMPLETED').length})
          </button>
          <button
            onClick={() => setFilter('COMPLETED')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
              filter === 'COMPLETED'
                ? 'bg-emerald-600 text-white'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800'
            }`}
          >
            Completed ({emiAccounts.filter((e) => e.status === 'COMPLETED').length})
          </button>
          <button
            onClick={() => setFilter('ALL')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
              filter === 'ALL'
                ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800'
            }`}
          >
            All ({emiAccounts.length})
          </button>
        </div>
      </div>

      {/* EMI Cards List */}
      {filteredEmis.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-400">
          <CreditCard className="w-10 h-10 mx-auto mb-2 text-slate-300 dark:text-slate-700" />
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">No EMI Accounts Found</h3>
          <p className="text-xs text-slate-500 mt-1">
            Create an EMI account to schedule customer installments.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredEmis.map((emi) => {
            const emiInstallments = installments
              .filter((i) => i.emiId === emi.emiId)
              .sort((a, b) => a.installmentNumber - b.installmentNumber);

            const isExpanded = expandedEmiId === emi.emiId;
            const isCompleted = emi.status === 'COMPLETED';
            const overdueCount = emiInstallments.filter((i) => i.status === 'OVERDUE').length;
            const paidCount = emiInstallments.filter((i) => i.status === 'PAID').length;

            return (
              <div
                key={emi.emiId}
                className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden transition"
              >
                {/* Top Summary Bar */}
                <div className="p-5 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                          {emi.productName}
                        </h3>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            isCompleted
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
                              : 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400'
                          }`}
                        >
                          {emi.status}
                        </span>
                        {overdueCount > 0 && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            <span>{overdueCount} Overdue</span>
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-1">
                        <button
                          onClick={() => onSelectCustomer(emi.customerId)}
                          className="font-bold text-slate-700 dark:text-slate-300 hover:text-emerald-500 hover:underline flex items-center gap-1"
                        >
                          <User className="w-3.5 h-3.5" />
                          <span>{emi.customerName}</span>
                        </button>
                        <span>•</span>
                        <a
                          href={`tel:${emi.customerMobile}`}
                          className="hover:underline flex items-center gap-0.5 text-slate-600 dark:text-slate-300 font-mono"
                        >
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{emi.customerMobile}</span>
                        </a>

                        {emi.imeiNumber && (
                          <>
                            <span>•</span>
                            <span className="inline-flex items-center gap-1 font-mono text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700">
                              <Hash className="w-3 h-3 text-slate-400" />
                              <span>IMEI: {emi.imeiNumber}</span>
                            </span>
                          </>
                        )}

                        {emi.guarantorName && (
                          <>
                            <span>•</span>
                            <span className="inline-flex items-center gap-1 text-[11px] bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded-md border border-amber-200/60 dark:border-amber-900/40">
                              <ShieldCheck className="w-3 h-3 text-amber-500" />
                              <span>Guarantor: <strong className="font-semibold">{emi.guarantorName}</strong></span>
                              {emi.guarantorMobile && (
                                <a
                                  href={`tel:${emi.guarantorMobile}`}
                                  className="font-mono text-emerald-600 dark:text-emerald-400 font-bold hover:underline ml-0.5"
                                >
                                  ({emi.guarantorMobile})
                                </a>
                              )}
                            </span>
                          </>
                        )}

                        <span>•</span>
                        <span>1st Due: {formatDhakaDate(emi.firstDueDate)}</span>
                      </div>
                    </div>

                    {/* Progress Bar & Actions */}
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block font-semibold">Remaining Due</span>
                        <span className="text-base sm:text-lg font-black text-emerald-600 dark:text-emerald-400">
                          {formatCurrency(emi.remainingAmount)}
                        </span>
                      </div>
                      <button
                        onClick={() => toggleExpand(emi.emiId)}
                        className="p-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
                        title={isExpanded ? 'Hide Schedule' : 'Show Schedule'}
                      >
                        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  {/* Financial Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Product Price</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {formatCurrency(emi.productPrice)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Down Payment</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {formatCurrency(emi.downPayment)}
                      </span>
                      {Boolean(emi.interestRate && emi.interestRate > 0) && (
                        <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 block mt-0.5">
                          +{emi.interestRate}% Int ({formatCurrency(emi.interestAmount || 0)})
                        </span>
                      )}
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Monthly Installment</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {formatCurrency(emi.monthlyEmiAmount)} / mo
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Tenure Progress</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {paidCount} of {emi.totalEmiMonths} Months Paid
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Fines & Extra</span>
                      <span className="font-bold text-red-500">
                        {formatCurrency(emi.totalFines + emi.totalPostPlanCharges)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Expanded Installments List (Requirement 7) */}
                {isExpanded && (
                  <div className="p-5 sm:p-6 bg-slate-50 dark:bg-slate-950/70 border-t border-slate-200 dark:border-slate-800 space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                      Installment Breakdown ({emiInstallments.length} Months)
                    </h4>

                    {emiInstallments.map((inst) => {
                      const isInstPaid = inst.status === 'PAID';
                      const isInstOverdue = inst.status === 'OVERDUE';
                      const isInstDueToday = inst.status === 'DUE TODAY';

                      return (
                        <div
                          key={inst.installmentId}
                          className={`p-3 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
                            isInstPaid
                              ? 'bg-white/60 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800/60 opacity-80'
                              : isInstOverdue
                              ? 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900/60'
                              : isInstDueToday
                              ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/60'
                              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span
                              className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                                isInstPaid
                                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
                                  : isInstOverdue
                                  ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400'
                                  : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                              }`}
                            >
                              #{inst.installmentNumber}
                            </span>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-900 dark:text-white">
                                  {formatCurrency(inst.totalPayable)}
                                </span>
                                <span
                                  className={`px-2 py-0.2 rounded-full text-[10px] font-bold ${
                                    isInstPaid
                                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
                                      : isInstOverdue
                                      ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400'
                                      : isInstDueToday
                                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-400'
                                      : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                                  }`}
                                >
                                  {inst.status}
                                </span>
                                {inst.lateDays > 0 && (
                                  <span className="text-[10px] font-semibold text-red-500">
                                    ({inst.lateDays}d late)
                                  </span>
                                )}
                              </div>
                              <span className="text-slate-500 text-[11px] block mt-0.5">
                                Due: {formatDhakaDate(inst.dueDate)}
                                {inst.fine > 0 && ` • +Fine: ${formatCurrency(inst.fine)}`}
                                {(inst.extraCharge || 0) > 0 && ` • +2%: ${formatCurrency(inst.extraCharge)}`}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-end sm:self-center">
                            {!isInstPaid && (
                              <button
                                onClick={() => setSelectedInstallmentForPayment(inst)}
                                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold active:scale-95 transition cursor-pointer"
                              >
                                Mark as Paid
                              </button>
                            )}

                            {isInstPaid && (
                              <div className="flex items-center gap-1 text-emerald-500 font-bold text-xs">
                                <CheckCircle2 className="w-4 h-4" />
                                <span>Paid on {formatDhakaDate(inst.paidAt?.slice(0, 10) || inst.dueDate)}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
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
