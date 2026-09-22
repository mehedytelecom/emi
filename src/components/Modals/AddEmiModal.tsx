import React, { useState, useEffect } from 'react';
import {
  X,
  CreditCard,
  Calendar,
  User,
  Phone,
  ShieldCheck,
  Smartphone,
  Hash,
  MapPin,
  FileText,
  Percent,
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import {
  addMonthsToDate,
  formatCurrency,
  formatDhakaDate,
  getTodayDhaka,
} from '../../utils/dateAndEmiUtils';

interface AddEmiModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCustomerId?: string;
}

export const AddEmiModal: React.FC<AddEmiModalProps> = ({
  isOpen,
  onClose,
  initialCustomerId,
}) => {
  const { customers, createEmiAccount } = useData();

  // Customer fields
  const [customerName, setCustomerName] = useState('');
  const [customerMobile, setCustomerMobile] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');

  // Guarantor fields
  const [guarantorName, setGuarantorName] = useState('');
  const [guarantorMobile, setGuarantorMobile] = useState('');

  // Product & EMI fields
  const [productName, setProductName] = useState('');
  const [imeiNumber, setImeiNumber] = useState('');
  const [productPrice, setProductPrice] = useState<number | ''>('');
  const [downPayment, setDownPayment] = useState<number | ''>(0);
  const [interestRate, setInterestRate] = useState<number | ''>(0);
  const [totalEmiMonths, setTotalEmiMonths] = useState<number>(6);
  const [monthlyEmiAmount, setMonthlyEmiAmount] = useState<number | ''>('');
  const [firstDueDate, setFirstDueDate] = useState<string>(() => addMonthsToDate(getTodayDhaka(), 1));
  const [notes, setNotes] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // When modal is opened, ensure default 1st due date is set to 1 month later
  useEffect(() => {
    if (isOpen) {
      setFirstDueDate(addMonthsToDate(getTodayDhaka(), 1));
    }
  }, [isOpen]);

  // If opened with an initial customer, prefill their details
  useEffect(() => {
    if (initialCustomerId) {
      const cust = customers.find((c) => c.customerId === initialCustomerId);
      if (cust) {
        setCustomerName(cust.name);
        setCustomerMobile(cust.mobileNumber);
        setCustomerAddress(cust.address || '');
        if (cust.guarantorName) setGuarantorName(cust.guarantorName);
        if (cust.guarantorMobile) setGuarantorMobile(cust.guarantorMobile);
      }
    }
  }, [initialCustomerId, customers]);

  // Financial calculations
  const numericPrice = Number(productPrice) || 0;
  const numericDown = Number(downPayment) || 0;
  const principalAfterDown = Math.max(0, numericPrice - numericDown);
  const numericInterestRate = Number(interestRate) || 0;
  // Interest calculated on remaining principal after down payment
  const interestAmount = Math.round(principalAfterDown * (numericInterestRate / 100));
  // Total loan/financed amount = (Price - Down Payment) + Interest
  const totalFinanced = principalAfterDown + interestAmount;

  // Auto-calculate monthly installment whenever price, down payment, interest rate, or tenure changes
  useEffect(() => {
    if (totalEmiMonths > 0 && totalFinanced > 0) {
      const calculated = Math.round(totalFinanced / totalEmiMonths);
      setMonthlyEmiAmount(calculated);
    } else if (totalFinanced === 0) {
      setMonthlyEmiAmount(0);
    }
  }, [totalFinanced, totalEmiMonths]);

  if (!isOpen) return null;

  // Calculate live preview schedule
  const previewInstallments = [];
  const numericMonthly = Number(monthlyEmiAmount) || 0;
  if (totalEmiMonths > 0 && numericMonthly > 0 && firstDueDate) {
    const expectedTotal = numericMonthly * totalEmiMonths;
    const diff = totalFinanced - expectedTotal;

    for (let i = 1; i <= Math.min(totalEmiMonths, 24); i++) {
      const dueDate = addMonthsToDate(firstDueDate, i - 1);
      let amt = numericMonthly;
      if (i === totalEmiMonths && diff !== 0) {
        amt += diff;
      }
      previewInstallments.push({
        num: i,
        date: dueDate,
        amount: amt,
      });
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerName.trim()) {
      setError('Please enter customer name (গ্রাহকের নাম).');
      return;
    }
    if (!customerMobile.trim()) {
      setError('Please enter customer mobile number (গ্রাহকের মোবাইল নাম্বার).');
      return;
    }
    if (!productName.trim()) {
      setError('Please enter device / product name (পণ্যের নাম).');
      return;
    }
    if (numericPrice <= 0) {
      setError('Total product price must be greater than 0.');
      return;
    }
    if (numericDown < 0) {
      setError('Down payment cannot be negative.');
      return;
    }
    if (numericDown >= numericPrice) {
      setError('Down payment must be less than product price for EMI financing.');
      return;
    }
    if (numericInterestRate < 0) {
      setError('Interest percentage cannot be negative.');
      return;
    }
    if (totalEmiMonths <= 0) {
      setError('EMI duration must be at least 1 month.');
      return;
    }
    if (numericMonthly <= 0) {
      setError('Monthly EMI amount must be greater than 0.');
      return;
    }
    if (!firstDueDate) {
      setError('Please select the 1st due date.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await createEmiAccount({
        customerId: initialCustomerId,
        customerName: customerName.trim(),
        customerMobile: customerMobile.trim(),
        customerAddress: customerAddress.trim() || undefined,
        guarantorName: guarantorName.trim() || undefined,
        guarantorMobile: guarantorMobile.trim() || undefined,
        imeiNumber: imeiNumber.trim() || undefined,
        productName: productName.trim(),
        productPrice: numericPrice,
        downPayment: numericDown,
        interestRate: numericInterestRate,
        interestAmount,
        totalEmiMonths,
        monthlyEmiAmount: numericMonthly,
        firstDueDate,
        paymentFrequency: 'MONTHLY',
        notes: notes.trim() || undefined,
      });

      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create EMI account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-2xl rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-auto flex flex-col max-h-[90vh]">
        {/* Header (Fixed) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/70 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Create New EMI Account</h3>
              <p className="text-xs text-slate-500">Customer details, device IMEI, guarantor, interest & installments</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Form Container */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
          {/* Scrollable Form Content */}
          <div className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1">
            {error && (
              <div className="p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-xs font-semibold text-red-600 dark:text-red-400">
                {error}
              </div>
            )}

          {/* Section 1: Customer Details */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-3.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider pb-1 border-b border-slate-200 dark:border-slate-700/80">
              <User className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Customer Information (গ্রাহকের তথ্য)</span>
            </div>

            {/* Customer Name & Mobile */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Customer Name (গ্রাহকের নাম) *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Md. Karim Uddin"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white focus:outline-emerald-500 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Customer Mobile Number (মোবাইল নাম্বার) *
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="tel"
                    required
                    placeholder="017XXXXXXXX"
                    value={customerMobile}
                    onChange={(e) => setCustomerMobile(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white focus:outline-emerald-500 font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Customer Address */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Customer Address (গ্রাহকের ঠিকানা)
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="e.g. Mirpur-10, Dhaka"
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white focus:outline-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Guarantor Details */}
          <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/40 space-y-3.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900 dark:text-amber-400 uppercase tracking-wider pb-1 border-b border-amber-200/60 dark:border-amber-900/40">
              <ShieldCheck className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>Guarantor Information (জামিনদারের তথ্য)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Guarantor Name (জামিনদারের নাম)
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-amber-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    placeholder="e.g. Md. Rafiqul Islam (Guarantor)"
                    value={guarantorName}
                    onChange={(e) => setGuarantorName(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white focus:outline-emerald-500 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Guarantor Mobile Number (জামিনদারের মোবাইল)
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-amber-500 absolute left-3 top-3" />
                  <input
                    type="tel"
                    placeholder="018XXXXXXXX"
                    value={guarantorMobile}
                    onChange={(e) => setGuarantorMobile(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white focus:outline-emerald-500 font-mono"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Product & IMEI */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-3.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider pb-1 border-b border-slate-200 dark:border-slate-700/80">
              <Smartphone className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Product & IMEI Details (পণ্য ও আইএমইআই)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Product / Device Name *
                </label>
                <div className="relative">
                  <Smartphone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Vivo V30 5G (8/256GB)"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white focus:outline-emerald-500 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  IMEI Number (আইএমইআই নাম্বার)
                </label>
                <div className="relative">
                  <Hash className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    placeholder="e.g. 863920194857361"
                    value={imeiNumber}
                    onChange={(e) => setImeiNumber(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-mono text-slate-900 dark:text-white focus:outline-emerald-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Pricing, Interest & EMI Terms */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-3.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider pb-1 border-b border-slate-200 dark:border-slate-700/80">
              <CreditCard className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Financing & EMI Terms (ইএমআই ও কিস্তির হিসাব)</span>
            </div>

            {/* Price, Down Payment, Interest Rate */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Total Product Price (৳) *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  placeholder="e.g. 40000"
                  value={productPrice}
                  onChange={(e) => setProductPrice(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-bold text-slate-900 dark:text-white focus:outline-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Down Payment Received (৳)
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={downPayment}
                  onChange={(e) => setDownPayment(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-bold text-slate-900 dark:text-white focus:outline-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Interest Rate (% ইন্টারেস্ট শতকরা)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    placeholder="0"
                    value={interestRate}
                    onChange={(e) => setInterestRate(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full pl-3.5 pr-8 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-bold text-slate-900 dark:text-white focus:outline-emerald-500"
                  />
                  <Percent className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-3.5 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Live Calculation Cards */}
            <div className="grid grid-cols-3 gap-2 p-3 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/60 text-center">
              <div>
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block uppercase">
                  Principal (ডাউন পেমেন্টের পর বাকি)
                </span>
                <span className="text-sm sm:text-base font-extrabold text-slate-800 dark:text-slate-200">
                  {formatCurrency(principalAfterDown)}
                </span>
              </div>
              <div className="border-x border-emerald-200 dark:border-emerald-800/60 px-1">
                <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 block uppercase">
                  + Interest ({interestRate || 0}%)
                </span>
                <span className="text-sm sm:text-base font-extrabold text-amber-600 dark:text-amber-400">
                  {formatCurrency(interestAmount)}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 block uppercase">
                  Total Repayable (মোট ঋণ)
                </span>
                <span className="text-sm sm:text-base font-black text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(totalFinanced)}
                </span>
              </div>
            </div>

            {/* Tenure & Monthly Amount & Due Date */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Total EMI Months *
                </label>
                <select
                  value={totalEmiMonths}
                  onChange={(e) => setTotalEmiMonths(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white focus:outline-emerald-500 font-semibold"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 15, 18, 24].map((m) => (
                    <option key={m} value={m}>
                      {m} Month{m > 1 ? 's' : ''} ({m} মাস)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Monthly EMI (৳) *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={monthlyEmiAmount}
                  onChange={(e) => setMonthlyEmiAmount(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-black text-emerald-600 dark:text-emerald-400 focus:outline-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  1st Due Date (Dhaka) *
                </label>
                <input
                  type="date"
                  required
                  value={firstDueDate}
                  onChange={(e) => setFirstDueDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white focus:outline-emerald-500 font-medium"
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Extra Notes & Remarks (Optional)
              </label>
              <div className="relative">
                <FileText className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="e.g. Device color Black, Bill voucher #8839"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white focus:outline-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Section 5: Live Installment Preview */}
          {previewInstallments.length > 0 && (
            <div className="pt-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-emerald-500" />
                  Installment Schedule Breakdown ({previewInstallments.length} Months):
                </span>
                <span className="text-[11px] text-slate-500">Auto-calculated schedule</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-36 overflow-y-auto p-1.5 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-200 dark:border-slate-800">
                {previewInstallments.map((inst) => (
                  <div
                    key={inst.num}
                    className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs flex flex-col justify-between shadow-2xs"
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-slate-600 dark:text-slate-400">Inst #{inst.num}</span>
                      <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(inst.amount)}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 font-mono">
                      {formatDhakaDate(inst.date)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          </div>

          {/* Fixed Footer with Cancel and Submit */}
          <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/80 flex items-center justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 active:scale-95 transition disabled:opacity-60 cursor-pointer"
            >
              {loading ? 'Creating EMI...' : 'Create EMI Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
