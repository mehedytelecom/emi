import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, DollarSign, Calendar, AlertCircle } from 'lucide-react';
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
  const { recordPayment } = useData();
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
      setPaymentAmount(installment.remainingAmount);
      setPaymentDate(getTodayDhaka());
      setPaymentMethod('CASH');
      setTransactionId('');
      setNotes('');
      setError(null);
    }
  }, [installment]);

  if (!isOpen || !installment) return null;

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

    if (numericAmount > installment.remainingAmount) {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-6">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Record EMI Payment</h3>
              <p className="text-xs text-slate-500">Collect installment and issue payment receipt</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Installment Summary Card */}
        <div className="p-6 bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">{installment.customerName}</h4>
              <p className="text-xs text-slate-500">{installment.customerMobile}</p>
            </div>
            <div className="text-right">
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                Installment #{installment.installmentNumber} of {installment.totalInstallments}
              </span>
              <p className="text-[11px] text-slate-400 mt-1">Due: {formatDhakaDate(installment.dueDate)}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 border-t border-slate-200 dark:border-slate-800 text-xs">
            <div>
              <span className="text-slate-500 block text-[10px]">Base EMI</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">{formatCurrency(installment.emiAmount)}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">Late Fine</span>
              <span className="font-bold text-red-500">{formatCurrency(installment.fine)}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">Extra Charge</span>
              <span className="font-bold text-amber-500">{formatCurrency(installment.extraCharge || 0)}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">Current Due</span>
              <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
                {formatCurrency(installment.remainingAmount)}
              </span>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-xs font-medium text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          {!isAdmin && (
            <div className="p-3 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 text-xs text-sky-700 dark:text-sky-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>You are in Viewer mode. Only Administrators can record or modify payments.</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold text-slate-900 dark:text-white focus:outline-emerald-500 disabled:opacity-60"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Supports partial payments up to {formatCurrency(installment.remainingAmount)}
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Payment Method *
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                disabled={!isAdmin}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-emerald-500 disabled:opacity-60"
              >
                <option value="CASH">Cash in Shop</option>
                <option value="BKASH">bKash</option>
                <option value="NAGAD">Nagad</option>
                <option value="ROCKET">Rocket</option>
                <option value="BANK">Bank Transfer</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Transaction ID (Optional)
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

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              Cancel
            </button>
            {isAdmin && (
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 active:scale-95 transition disabled:opacity-60 cursor-pointer"
              >
                {loading ? 'Processing...' : 'Confirm Payment'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
