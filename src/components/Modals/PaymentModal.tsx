import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, DollarSign, Calendar, AlertCircle, Smartphone, Hash } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { Installment, PaymentMethod } from '../../types';
import { formatCurrency, formatDhakaDate, getTodayDhaka } from '../../utils/dateAndEmiUtils';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  installment: Installment | null;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  installment,
}) => {
  const { recordPayment, emiAccounts } = useData();
  const { isAdmin } = useAuth();

  const [paymentAmount, setPaymentAmount] = useState<number | ''>('');
  const [paymentDate, setPaymentDate] = useState<string>(getTodayDhaka());
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [transactionId, setTransactionId] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (installment) {
      setPaymentAmount(installment.remainingAmount || 0);
      setPaymentDate(getTodayDhaka());
      setPaymentMethod('CASH');
      setTransactionId('');
      setNotes('');
      setError(null);
    }
  }, [installment]);

  if (!isOpen || !installment) return null;

  const parentEmi = emiAccounts.find((e) => e.emiId === installment.emiId);

  const handleQuickAmount = (amt: number) => {
    setPaymentAmount(Math.min(amt, installment.remainingAmount || 0));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      setError('Only Admin can record payments.');
      return;
    }

    const numericAmount = Number(paymentAmount);
    if (!numericAmount || numericAmount <= 0) {
      setError('Please enter a valid payment amount greater than 0.');
      return;
    }

    if (numericAmount > (installment.remainingAmount || 0)) {
      setError(`Payment amount cannot exceed remaining due (${formatCurrency(installment.remainingAmount)}).`);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await recordPayment({
        installmentId: installment.installmentId,
        amount: numericAmount,
        paymentMethod,
        paymentDate,
        transactionId: transactionId.trim() || undefined,
        notes: notes.trim() || undefined,
      });

      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to record payment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] overflow-y-auto bg-black/75 backdrop-blur-xs p-2.5 sm:p-4 md:p-6 flex justify-center items-start sm:items-center">
      {/* Modal Container */}
      <div className="relative w-full max-w-lg rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-auto sm:my-6 flex flex-col max-h-[calc(100dvh-1.25rem)] sm:max-h-[88vh]">
        {/* Fixed Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 z-10">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate">Record EMI Payment</h3>
              <p className="text-[11px] sm:text-xs text-slate-500 truncate">Collect installment and issue receipt</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
          <div className="flex-1 overflow-y-auto overscroll-contain p-3.5 sm:p-6 space-y-3.5 sm:space-y-4">
            {/* Installment Summary Card */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">{installment.customerName}</h4>
                  <p className="text-xs text-slate-500">{installment.customerMobile}</p>
                </div>
                <div className="text-right">
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    Inst #{installment.installmentNumber} of {installment.totalInstallments}
                  </span>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Due: <strong className="text-slate-800 dark:text-slate-200">{formatDhakaDate(installment.dueDate)}</strong>
                  </p>
                </div>
              </div>

              {/* Device / IMEI Info */}
              {parentEmi && (
                <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    <Smartphone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{parentEmi.productName}</span>
                  </span>
                  {parentEmi.imeiNumber && (
                    <span className="font-mono text-[10px] bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-1.5 py-0.5 rounded">
                      IMEI: {parentEmi.imeiNumber}
                    </span>
                  )}
                </div>
              )}

              {/* Financial Calculation Breakdown */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-200 dark:border-slate-800 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px]">Base EMI</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{formatCurrency(installment.emiAmount)}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Late Fine</span>
                  <span className="font-bold text-red-500">{formatCurrency(installment.fine)}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">2% Extra</span>
                  <span className="font-bold text-amber-500">{formatCurrency(installment.extraCharge || 0)}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Total Due</span>
                  <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(installment.remainingAmount)}
                  </span>
                </div>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-xs font-semibold text-red-600 dark:text-red-400">
                {error}
              </div>
            )}

            {!isAdmin && (
              <div className="p-3 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 text-xs text-sky-700 dark:text-sky-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>You are in Viewer mode. Only Administrators can record payments.</span>
              </div>
            )}

            {/* Quick Amount Suggestion Chips */}
            {isAdmin && (
              <div>
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1.5">
                  Quick Amount Selection
                </span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleQuickAmount(installment.remainingAmount)}
                    className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 hover:bg-emerald-200 transition cursor-pointer"
                  >
                    Full Due ({formatCurrency(installment.remainingAmount)})
                  </button>
                  {installment.emiAmount < installment.remainingAmount && (
                    <button
                      type="button"
                      onClick={() => handleQuickAmount(installment.emiAmount)}
                      className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 transition cursor-pointer"
                    >
                      Base Only ({formatCurrency(installment.emiAmount)})
                    </button>
                  )}
                  {Math.round(installment.remainingAmount / 2) > 0 && (
                    <button
                      type="button"
                      onClick={() => handleQuickAmount(Math.round(installment.remainingAmount / 2))}
                      className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 transition cursor-pointer"
                    >
                      50% ({formatCurrency(Math.round(installment.remainingAmount / 2))})
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Payment Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Payment Amount (৳) *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  max={installment.remainingAmount}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value === '' ? '' : Number(e.target.value))}
                  disabled={!isAdmin}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-black text-slate-900 dark:text-white focus:outline-emerald-500 disabled:opacity-60"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Max payable: {formatCurrency(installment.remainingAmount)}
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Payment Date (Dhaka) *
                </label>
                <input
                  type="date"
                  required
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  disabled={!isAdmin}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-emerald-500 disabled:opacity-60"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Payment Method *
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  disabled={!isAdmin}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-emerald-500 disabled:opacity-60 font-medium"
                >
                  <option value="CASH">Cash in Shop (নগদ)</option>
                  <option value="BKASH">bKash (বিকাশ)</option>
                  <option value="NAGAD">Nagad (নগদ)</option>
                  <option value="ROCKET">Rocket (রকেট)</option>
                  <option value="BANK">Bank Transfer (ব্যাংক)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Transaction ID / Reference
                </label>
                <input
                  type="text"
                  placeholder="e.g. 9JA73BK..."
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  disabled={!isAdmin}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-mono text-slate-900 dark:text-white focus:outline-emerald-500 disabled:opacity-60"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Payment Remarks / Notes (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Paid in full at counter"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                disabled={!isAdmin}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-emerald-500 disabled:opacity-60"
              />
            </div>
          </div>

          {/* Sticky Footer */}
          <div className="px-5 sm:px-6 py-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/80 shrink-0 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              Cancel
            </button>
            {isAdmin && (
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 active:scale-95 transition disabled:opacity-60 cursor-pointer flex items-center gap-1.5"
              >
                {loading ? 'Processing...' : `Confirm ৳${paymentAmount || 0}`}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
