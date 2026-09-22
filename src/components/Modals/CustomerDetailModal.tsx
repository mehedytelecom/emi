import React, { useState } from 'react';
import {
  X,
  Phone,
  MapPin,
  CreditCard,
  Calendar,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  Clock,
  History,
  Trash2,
  Edit2,
  Plus,
  ShieldCheck,
  Smartphone,
  Hash,
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { Customer, Installment } from '../../types';
import { formatCurrency, formatDhakaDate } from '../../utils/dateAndEmiUtils';
import { PaymentModal } from './PaymentModal';

interface CustomerDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
  onOpenAddEmiForCustomer: (customerId: string) => void;
}

export const CustomerDetailModal: React.FC<CustomerDetailModalProps> = ({
  isOpen,
  onClose,
  customer,
  onOpenAddEmiForCustomer,
}) => {
  const { emiAccounts, installments, payments, deleteCustomer, updateCustomer, updateInstallmentDueDate } =
    useData();
  const { isAdmin } = useAuth();

  const [activeTab, setActiveTab] = useState<'schedule' | 'emis' | 'payments'>('schedule');
  const [selectedInstallmentForPayment, setSelectedInstallmentForPayment] = useState<Installment | null>(null);
  const [editingDueDateId, setEditingDueDateId] = useState<string | null>(null);
  const [newDueDate, setNewDueDate] = useState<string>('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Edit fields
  const [editName, setEditName] = useState('');
  const [editMobile, setEditMobile] = useState('');
  const [editAlt, setEditAlt] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editNid, setEditNid] = useState('');
  const [editGuarantorName, setEditGuarantorName] = useState('');
  const [editGuarantorMobile, setEditGuarantorMobile] = useState('');
  const [editNotes, setEditNotes] = useState('');

  if (!isOpen || !customer) return null;

  const customerEmis = emiAccounts.filter((e) => e.customerId === customer.customerId);
  const customerInstallments = installments
    .filter((i) => i.customerId === customer.customerId)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  const customerPayments = payments.filter((p) => p.customerId === customer.customerId);

  const totalOverdueCount = customerInstallments.filter((i) => i.status === 'OVERDUE').length;
  const totalPaidCount = customerInstallments.filter((i) => i.status === 'PAID').length;
  const totalUpcomingCount = customerInstallments.filter((i) => i.status === 'UPCOMING' || i.status === 'DUE TODAY').length;

  const startEdit = () => {
    setEditName(customer.name);
    setEditMobile(customer.mobileNumber);
    setEditAlt(customer.alternativeNumber || '');
    setEditAddress(customer.address);
    setEditNid(customer.nidNumber || '');
    setEditGuarantorName(customer.guarantorName || '');
    setEditGuarantorMobile(customer.guarantorMobile || '');
    setEditNotes(customer.notes || '');
    setIsEditing(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateCustomer(customer.customerId, {
        name: editName.trim(),
        mobileNumber: editMobile.trim(),
        alternativeNumber: editAlt.trim() || undefined,
        address: editAddress.trim(),
        nidNumber: editNid.trim() || undefined,
        guarantorName: editGuarantorName.trim() || undefined,
        guarantorMobile: editGuarantorMobile.trim() || undefined,
        notes: editNotes.trim() || undefined,
      });
      setIsEditing(false);
    } catch (err) {
      console.error('Failed to update customer:', err);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to archive customer "${customer.name}"? Active data will be archived.`)) {
      return;
    }
    try {
      setIsDeleting(true);
      await deleteCustomer(customer.customerId);
      onClose();
    } catch (err) {
      console.error('Failed to archive customer:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSaveDueDate = async (installmentId: string) => {
    if (!newDueDate) return;
    try {
      await updateInstallmentDueDate(installmentId, newDueDate);
      setEditingDueDateId(null);
      setNewDueDate('');
    } catch (err) {
      console.error('Failed to update due date:', err);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-xs p-2.5 sm:p-4 md:p-6 flex justify-center items-start sm:items-center">
        <div className="relative w-full max-w-4xl rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-auto sm:my-6 flex flex-col max-h-[calc(100dvh-1.25rem)] sm:max-h-[88vh]">
          {/* Header */}
          <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/70 shrink-0">
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold text-base sm:text-lg shadow-xs shrink-0">
                {customer.name[0]?.toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white truncate max-w-[180px] sm:max-w-xs">{customer.name}</h2>
                  <span className="px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-800 text-[11px] sm:text-xs font-mono font-semibold text-slate-700 dark:text-slate-300 shrink-0">
                    {customer.customId}
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs text-slate-500 truncate">
                  Added on {formatDhakaDate(customer.createdAt.slice(0, 10))}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              {isAdmin && !isEditing && (
                <button
                  onClick={startEdit}
                  className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition cursor-pointer"
                  title="Edit Customer Details"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={onClose}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-5 sm:space-y-6">
            {/* Edit Mode Form */}
            {isEditing ? (
              <form onSubmit={handleSaveEdit} className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">Edit Customer Information</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Name</label>
                    <input
                      type="text"
                      required
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Primary Mobile</label>
                    <input
                      type="text"
                      required
                      value={editMobile}
                      onChange={(e) => setEditMobile(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Alternative Mobile</label>
                    <input
                      type="text"
                      value={editAlt}
                      onChange={(e) => setEditAlt(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">NID Number</label>
                    <input
                      type="text"
                      value={editNid}
                      onChange={(e) => setEditNid(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Guarantor Name (জামিনদার)</label>
                    <input
                      type="text"
                      placeholder="e.g. Md. Rafiqul Islam"
                      value={editGuarantorName}
                      onChange={(e) => setEditGuarantorName(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Guarantor Mobile (মোবাইল)</label>
                    <input
                      type="tel"
                      placeholder="018XXXXXXXX"
                      value={editGuarantorMobile}
                      onChange={(e) => setEditGuarantorMobile(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Address</label>
                  <input
                    type="text"
                    required
                    value={editAddress}
                    onChange={(e) => setEditAddress(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Notes</label>
                  <input
                    type="text"
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-3 py-1.5 rounded-lg border text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            ) : (
              /* Contact Cards & Quick Dial */
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                  <span className="text-[11px] font-semibold text-slate-400 block mb-1">Customer Phone</span>
                  <div className="flex items-center justify-between">
                    <a
                      href={`tel:${customer.mobileNumber}`}
                      className="text-sm font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1.5"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      {customer.mobileNumber}
                    </a>
                    <a
                      href={`tel:${customer.mobileNumber}`}
                      className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-500 text-xs font-bold hover:bg-emerald-500/20"
                    >
                      Call
                    </a>
                  </div>
                  {customer.alternativeNumber && (
                    <div className="mt-2 text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                      <span className="text-[10px] text-slate-400">Alt:</span>
                      <a href={`tel:${customer.alternativeNumber}`} className="hover:underline font-medium">
                        {customer.alternativeNumber}
                      </a>
                    </div>
                  )}
                </div>

                <div className="p-3.5 sm:p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40">
                  <span className="text-[11px] font-bold text-amber-800 dark:text-amber-400 block mb-1">
                    Guarantor (জামিনদার)
                  </span>
                  {customer.guarantorName || customer.guarantorMobile ? (
                    <div>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        {customer.guarantorName || 'Guarantor'}
                      </p>
                      {customer.guarantorMobile ? (
                        <div className="flex items-center justify-between mt-1">
                          <a
                            href={`tel:${customer.guarantorMobile}`}
                            className="text-xs font-mono font-bold text-amber-700 dark:text-amber-400 hover:underline flex items-center gap-1"
                          >
                            <Phone className="w-3 h-3" />
                            {customer.guarantorMobile}
                          </a>
                          <a
                            href={`tel:${customer.guarantorMobile}`}
                            className="px-2 py-0.5 rounded-md bg-amber-600 text-white text-[10px] font-bold hover:bg-amber-700"
                          >
                            Call
                          </a>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400">No phone recorded</span>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">No guarantor info recorded.</p>
                  )}
                </div>

                <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 sm:col-span-2 md:col-span-1">
                  <span className="text-[11px] font-semibold text-slate-400 block mb-1">Customer Address</span>
                  <p className="text-xs font-medium text-slate-800 dark:text-slate-200 flex items-start gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span>{customer.address}</span>
                  </p>
                  {customer.nidNumber && (
                    <p className="mt-1 text-[11px] text-slate-500">
                      NID: <span className="font-mono">{customer.nidNumber}</span>
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Financial Overview Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
              <div className="p-3 sm:p-4 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80">
                <span className="text-[10px] sm:text-[11px] font-semibold text-slate-500 dark:text-slate-400">Total Financed</span>
                <p className="text-base sm:text-lg font-black text-slate-900 dark:text-white mt-0.5 sm:mt-1">
                  {formatCurrency(customer.totalEmiAmount)}
                </p>
              </div>

              <div className="p-3 sm:p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40">
                <span className="text-[10px] sm:text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">Total Paid</span>
                <p className="text-base sm:text-lg font-black text-emerald-600 dark:text-emerald-400 mt-0.5 sm:mt-1">
                  {formatCurrency(customer.paidAmount)}
                </p>
              </div>

              <div className="p-3 sm:p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/40">
                <span className="text-[10px] sm:text-[11px] font-semibold text-amber-700 dark:text-amber-400">Remaining Due</span>
                <p className="text-base sm:text-lg font-black text-amber-600 dark:text-amber-400 mt-0.5 sm:mt-1">
                  {formatCurrency(customer.remainingAmount)}
                </p>
              </div>

              <div className="p-3 sm:p-4 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80">
                <span className="text-[10px] sm:text-[11px] font-semibold text-slate-500 dark:text-slate-400">Installments Stat</span>
                <div className="flex items-center gap-1.5 mt-0.5 sm:mt-1 text-[11px] sm:text-xs font-bold flex-wrap">
                  <span className="text-emerald-500">{totalPaidCount} Paid</span>
                  <span>•</span>
                  <span className="text-red-500">{totalOverdueCount} Overdue</span>
                </div>
              </div>
            </div>

            {/* Tabs for Details with responsive horizontal scrolling */}
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-slate-200 dark:border-slate-800 pb-2">
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 w-full sm:w-auto">
                  <button
                    onClick={() => setActiveTab('schedule')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                      activeTab === 'schedule'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800/60'
                    }`}
                  >
                    Schedule ({customerInstallments.length})
                  </button>
                  <button
                    onClick={() => setActiveTab('emis')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                      activeTab === 'emis'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800/60'
                    }`}
                  >
                    EMI Plans ({customerEmis.length})
                  </button>
                  <button
                    onClick={() => setActiveTab('payments')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                      activeTab === 'payments'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800/60'
                    }`}
                  >
                    Payments ({customerPayments.length})
                  </button>
                </div>

                {isAdmin && (
                  <button
                    onClick={() => onOpenAddEmiForCustomer(customer.customerId)}
                    className="self-start sm:self-center flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold cursor-pointer shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>New EMI Plan</span>
                  </button>
                )}
              </div>

              {/* Tab 1: Installment Schedule */}
              {activeTab === 'schedule' && (
                <div className="mt-4 space-y-2">
                  {customerInstallments.length === 0 ? (
                    <div className="text-center py-8 text-slate-400 text-sm">
                      No installments scheduled yet. Create an EMI account above.
                    </div>
                  ) : (
                    customerInstallments.map((inst) => {
                      const isPaid = inst.status === 'PAID';
                      const isOverdue = inst.status === 'OVERDUE';
                      const isDueToday = inst.status === 'DUE TODAY';

                      return (
                        <div
                          key={inst.installmentId}
                          className={`p-3.5 rounded-2xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                            isPaid
                              ? 'bg-slate-50/50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800/80 opacity-80'
                              : isOverdue
                              ? 'bg-red-50/40 dark:bg-red-950/20 border-red-200 dark:border-red-900/50'
                              : isDueToday
                              ? 'bg-amber-50/50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/50'
                              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span
                              className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold ${
                                isPaid
                                  ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400'
                                  : isOverdue
                                  ? 'bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                              }`}
                            >
                              #{inst.installmentNumber}
                            </span>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-bold text-slate-900 dark:text-white">
                                  {formatCurrency(inst.totalPayable)}
                                </span>
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    isPaid
                                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
                                      : isOverdue
                                      ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400'
                                      : isDueToday
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

                              <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                                <span>Due: {formatDhakaDate(inst.dueDate)}</span>
                                {inst.fine > 0 && <span className="text-red-500 font-semibold">+Fine: {formatCurrency(inst.fine)}</span>}
                                {(inst.extraCharge || 0) > 0 && (
                                  <span className="text-amber-500 font-semibold">+2% Charge: {formatCurrency(inst.extraCharge)}</span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-end sm:self-center">
                            {/* Date changer for Admin */}
                            {isAdmin && editingDueDateId === inst.installmentId ? (
                              <div className="flex items-center gap-1">
                                <input
                                  type="date"
                                  value={newDueDate || inst.dueDate}
                                  onChange={(e) => setNewDueDate(e.target.value)}
                                  className="px-2 py-1 rounded-lg border text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                />
                                <button
                                  onClick={() => handleSaveDueDate(inst.installmentId)}
                                  className="px-2 py-1 rounded-lg bg-emerald-600 text-white text-xs font-bold cursor-pointer"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={() => setEditingDueDateId(null)}
                                  className="px-2 py-1 rounded-lg bg-slate-200 dark:bg-slate-700 text-xs cursor-pointer"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : isAdmin && !isPaid ? (
                              <button
                                onClick={() => {
                                  setEditingDueDateId(inst.installmentId);
                                  setNewDueDate(inst.dueDate);
                                }}
                                className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-[11px] font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                              >
                                Edit Date
                              </button>
                            ) : null}

                            {!isPaid && (
                              <button
                                onClick={() => setSelectedInstallmentForPayment(inst)}
                                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs active:scale-95 transition cursor-pointer"
                              >
                                Mark as Paid
                              </button>
                            )}

                            {isPaid && (
                              <div className="flex items-center gap-1 text-emerald-500 text-xs font-bold">
                                <CheckCircle2 className="w-4 h-4" />
                                <span>Paid</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {/* Tab 2: EMI Accounts */}
              {activeTab === 'emis' && (
                <div className="mt-4 space-y-3">
                  {customerEmis.length === 0 ? (
                    <div className="text-center py-8 text-slate-400 text-sm">No EMI accounts found.</div>
                  ) : (
                    customerEmis.map((emi) => (
                      <div
                        key={emi.emiId}
                        className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <CreditCard className="w-4 h-4 text-emerald-500" />
                            <div>
                              <h4 className="text-sm font-bold text-slate-900 dark:text-white">{emi.productName}</h4>
                              {emi.imeiNumber && (
                                <span className="inline-flex items-center gap-1 text-[11px] font-mono text-slate-500 dark:text-slate-400 mt-0.5">
                                  <Hash className="w-3 h-3 text-slate-400" />
                                  IMEI: <span className="font-semibold text-slate-700 dark:text-slate-200">{emi.imeiNumber}</span>
                                </span>
                              )}
                            </div>
                          </div>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                              emi.status === 'COMPLETED'
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
                                : 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400'
                            }`}
                          >
                            {emi.status}
                          </span>
                        </div>

                        {(emi.guarantorName || emi.guarantorMobile) && (
                          <div className="mb-2 p-2 rounded-xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-900/30 text-xs flex items-center justify-between">
                            <div className="flex items-center gap-1.5 text-amber-800 dark:text-amber-400">
                              <ShieldCheck className="w-3.5 h-3.5" />
                              <span>Guarantor: <strong className="font-bold">{emi.guarantorName || 'Assigned'}</strong></span>
                            </div>
                            {emi.guarantorMobile && (
                              <a
                                href={`tel:${emi.guarantorMobile}`}
                                className="font-mono text-emerald-600 dark:text-emerald-400 font-bold hover:underline flex items-center gap-1 text-[11px]"
                              >
                                <Phone className="w-3 h-3" />
                                {emi.guarantorMobile}
                              </a>
                            )}
                          </div>
                        )}

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs pt-2 border-t border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-300">
                          <div>
                            <span className="text-[10px] text-slate-400 block">Total Price</span>
                            <span className="font-bold">{formatCurrency(emi.productPrice)}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block">Down Payment</span>
                            <span className="font-bold">{formatCurrency(emi.downPayment)}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block">Monthly EMI</span>
                            <span className="font-bold">{formatCurrency(emi.monthlyEmiAmount)} ({emi.totalEmiMonths} mos)</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block">Financed Left</span>
                            <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
                              {formatCurrency(emi.remainingAmount)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Tab 3: Payment History */}
              {activeTab === 'payments' && (
                <div className="mt-4 space-y-2">
                  {customerPayments.length === 0 ? (
                    <div className="text-center py-8 text-slate-400 text-sm">No payment records found.</div>
                  ) : (
                    customerPayments.map((pay) => (
                      <div
                        key={pay.paymentId}
                        className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 flex items-center justify-center font-bold">
                            ৳
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 dark:text-white block text-sm">
                              {formatCurrency(pay.amount)}
                            </span>
                            <span className="text-slate-400 text-[11px]">
                              Paid on {formatDhakaDate(pay.paymentDate)} via {pay.paymentMethod}
                            </span>
                            {pay.transactionId && (
                              <span className="text-slate-500 font-mono text-[10px] block">
                                Trx: {pay.transactionId}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="text-right text-slate-400 text-[11px]">
                          <span>Inst #{pay.installmentNumber}</span>
                          {pay.notes && <p className="italic text-slate-500">{pay.notes}</p>}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Archive / Delete Customer (Admin only) */}
            {isAdmin && (
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <span className="text-xs text-slate-400">Customer Management</span>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="px-3 py-1.5 rounded-xl border border-red-300 dark:border-red-900/60 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Archive Customer</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Embedded Payment Modal if marked paid from customer screen */}
      <PaymentModal
        isOpen={!!selectedInstallmentForPayment}
        onClose={() => setSelectedInstallmentForPayment(null)}
        installment={selectedInstallmentForPayment}
      />
    </>
  );
};
