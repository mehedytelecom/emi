import React, { useState, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Phone,
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { Installment } from '../types';
import {
  formatCurrency,
  formatDhakaDate,
  getTodayDhaka,
} from '../utils/dateAndEmiUtils';
import { PaymentModal } from './Modals/PaymentModal';

interface CalendarViewProps {
  onSelectCustomer: (customerId: string) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ onSelectCustomer }) => {
  const { installments } = useData();
  const todayDhaka = getTodayDhaka();

  // Selected Year & Month (Dhaka local)
  const [currentYear, setCurrentYear] = useState<number>(() => {
    return Number(todayDhaka.split('-')[0]) || new Date().getFullYear();
  });
  const [currentMonth, setCurrentMonth] = useState<number>(() => {
    return Number(todayDhaka.split('-')[1]) || new Date().getMonth() + 1;
  });

  const [selectedDate, setSelectedDate] = useState<string>(todayDhaka);
  const [selectedInstallmentForPayment, setSelectedInstallmentForPayment] = useState<Installment | null>(null);

  // Navigate months
  const handlePrevMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  // Month metadata
  const monthName = new Intl.DateTimeFormat('en-US', { month: 'long' }).format(
    new Date(currentYear, currentMonth - 1, 1)
  );

  // Total days in current month
  const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
  // Day of week of 1st day (0 = Sunday)
  const firstDayOfWeek = new Date(currentYear, currentMonth - 1, 1).getDay();

  // Map of installments by YYYY-MM-DD
  const installmentsByDate = useMemo(() => {
    const map = new Map<string, Installment[]>();
    for (const inst of installments) {
      const existing = map.get(inst.dueDate) || [];
      existing.push(inst);
      map.set(inst.dueDate, existing);
    }
    return map;
  }, [installments]);

  // Installments for the selected date
  const selectedDateInstallments = installmentsByDate.get(selectedDate) || [];

  return (
    <div className="space-y-6 pb-16 lg:pb-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            EMI Due Calendar
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Installment schedules mapped to Bangladesh local dates ({formatDhakaDate(todayDhaka, true)})
          </p>
        </div>

        {/* Month Navigation */}
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevMonth}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-bold text-slate-900 dark:text-white px-3 min-w-[140px] text-center">
            {monthName} {currentYear}
          </span>
          <button
            onClick={handleNextMonth}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Grid (2 Cols) */}
        <div className="lg:col-span-2 p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-1 text-center mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
              <span key={d} className="text-[11px] font-bold text-slate-400 py-1">
                {d}
              </span>
            ))}
          </div>

          {/* Day Grid */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {/* Empty slots for month start offset */}
            {Array.from({ length: firstDayOfWeek }).map((_, idx) => (
              <div key={`empty-${idx}`} className="h-16 sm:h-20 rounded-2xl bg-slate-50/50 dark:bg-slate-950/20" />
            ))}

            {/* Days of Month */}
            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const day = idx + 1;
              const dateStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const dayInstallments = installmentsByDate.get(dateStr) || [];
              const isToday = dateStr === todayDhaka;
              const isSelected = dateStr === selectedDate;

              const hasOverdue = dayInstallments.some((i) => i.status === 'OVERDUE' && i.remainingAmount > 0);
              const hasDueToday = dayInstallments.some((i) => i.status === 'DUE TODAY' && i.remainingAmount > 0);
              const hasPaid = dayInstallments.some((i) => i.status === 'PAID');
              const hasUpcoming = dayInstallments.some((i) => i.status === 'UPCOMING');

              return (
                <div
                  key={dateStr}
                  onClick={() => setSelectedDate(dateStr)}
                  className={`h-16 sm:h-20 p-1.5 sm:p-2 rounded-2xl border transition cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'ring-2 ring-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/40 border-emerald-500'
                      : isToday
                      ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800'
                      : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center ${
                        isToday
                          ? 'bg-amber-500 text-slate-950'
                          : isSelected
                          ? 'bg-emerald-600 text-white'
                          : 'text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      {day}
                    </span>

                    {dayInstallments.length > 0 && (
                      <span className="text-[10px] font-mono font-bold text-slate-400">
                        {dayInstallments.length}
                      </span>
                    )}
                  </div>

                  {/* Indicators */}
                  <div className="flex flex-wrap gap-1 mt-1">
                    {hasOverdue && <span className="w-2 h-2 rounded-full bg-red-500" title="Overdue" />}
                    {hasDueToday && <span className="w-2 h-2 rounded-full bg-amber-500" title="Due Today" />}
                    {hasUpcoming && <span className="w-2 h-2 rounded-full bg-sky-400" title="Upcoming" />}
                    {hasPaid && <span className="w-2 h-2 rounded-full bg-emerald-500" title="Paid" />}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-4 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
              <span>Overdue</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span>Due Today</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-400" />
              <span>Upcoming</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span>Paid</span>
            </div>
          </div>
        </div>

        {/* Selected Date Details Panel (1 Col) */}
        <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-500">
                Selected Schedule
              </span>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {formatDhakaDate(selectedDate, true)}
              </h3>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              {selectedDateInstallments.length} Due
            </span>
          </div>

          <div className="mt-4 space-y-3 flex-1 overflow-y-auto max-h-[500px] pr-1">
            {selectedDateInstallments.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                No installment payments scheduled for this date.
              </div>
            ) : (
              selectedDateInstallments.map((inst) => {
                const isPaid = inst.status === 'PAID';
                return (
                  <div
                    key={inst.installmentId}
                    className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-2"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <button
                          onClick={() => onSelectCustomer(inst.customerId)}
                          className="font-bold text-sm text-slate-900 dark:text-white hover:text-emerald-500 text-left cursor-pointer"
                        >
                          {inst.customerName}
                        </button>
                        <a
                          href={`tel:${inst.customerMobile}`}
                          className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline block"
                        >
                          {inst.customerMobile}
                        </a>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isPaid
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
                            : inst.status === 'OVERDUE'
                            ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-400'
                        }`}
                      >
                        {inst.status}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-200 dark:border-slate-700/60">
                      <div>
                        <span className="text-[10px] text-slate-400 block">Payable</span>
                        <span className="font-extrabold text-slate-900 dark:text-white">
                          {formatCurrency(inst.totalPayable)}
                        </span>
                      </div>

                      {!isPaid ? (
                        <button
                          onClick={() => setSelectedInstallmentForPayment(inst)}
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold active:scale-95 transition cursor-pointer"
                        >
                          Mark Paid
                        </button>
                      ) : (
                        <div className="flex items-center gap-1 text-emerald-500 font-bold text-xs">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Paid</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
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
