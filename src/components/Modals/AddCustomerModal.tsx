import React, { useState } from 'react';
import { X, User, Phone, MapPin, CreditCard, FileText, Check } from 'lucide-react';
import { useData } from '../../context/DataContext';

interface AddCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (customerId: string) => void;
}

export const AddCustomerModal: React.FC<AddCustomerModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { addCustomer, customers } = useData();

  // Generate next sequential customId e.g. MT-1001
  const nextIdNumber = 1001 + customers.length;
  const defaultCustomId = `MT-${nextIdNumber}`;

  const [name, setName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [alternativeNumber, setAlternativeNumber] = useState('');
  const [address, setAddress] = useState('');
  const [nidNumber, setNidNumber] = useState('');
  const [guarantorName, setGuarantorName] = useState('');
  const [guarantorMobile, setGuarantorMobile] = useState('');
  const [customId, setCustomId] = useState(defaultCustomId);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter customer name.');
      return;
    }
    if (!mobileNumber.trim()) {
      setError('Please enter primary mobile number.');
      return;
    }
    if (!address.trim()) {
      setError('Please enter customer address.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const newId = await addCustomer({
        customId: customId.trim() || defaultCustomId,
        name: name.trim(),
        mobileNumber: mobileNumber.trim(),
        alternativeNumber: alternativeNumber.trim() || undefined,
        address: address.trim(),
        nidNumber: nidNumber.trim() || undefined,
        guarantorName: guarantorName.trim() || undefined,
        guarantorMobile: guarantorMobile.trim() || undefined,
        notes: notes.trim() || undefined,
        status: 'ACTIVE',
      });

      setName('');
      setMobileNumber('');
      setAlternativeNumber('');
      setAddress('');
      setNidNumber('');
      setGuarantorName('');
      setGuarantorMobile('');
      setNotes('');
      onClose();
      if (onSuccess && newId) onSuccess(newId);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to add customer');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-xs p-2.5 sm:p-4 md:p-6 flex justify-center items-start sm:items-center">
      <div className="relative w-full max-w-lg rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-auto sm:my-6 flex flex-col max-h-[calc(100dvh-1.25rem)] sm:max-h-[88vh]">
        {/* Fixed Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 z-10">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <User className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate">Add New Customer</h3>
              <p className="text-[11px] sm:text-xs text-slate-500 truncate">Record customer contact and identity details</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
          <div className="flex-1 overflow-y-auto overscroll-contain p-3.5 sm:p-6 space-y-3.5 sm:space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-xs font-medium text-red-600 dark:text-red-400">
                {error}
              </div>
            )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Customer Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Md. Rahim Uddin"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Customer ID / Code
              </label>
              <input
                type="text"
                value={customId}
                onChange={(e) => setCustomId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-mono text-slate-900 dark:text-white focus:outline-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Primary Mobile Number *
              </label>
              <input
                type="tel"
                required
                placeholder="017XXXXXXXX"
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Alternative Number (Optional)
              </label>
              <input
                type="tel"
                placeholder="018XXXXXXXX"
                value={alternativeNumber}
                onChange={(e) => setAlternativeNumber(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Customer Address *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. House 14, Road 5, Mirpur, Dhaka"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              NID Number (Optional)
            </label>
            <input
              type="text"
              placeholder="National ID card number"
              value={nidNumber}
              onChange={(e) => setNidNumber(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-emerald-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Guarantor Name (জামিনদারের নাম)
              </label>
              <input
                type="text"
                placeholder="e.g. Md. Rafiqul Islam"
                value={guarantorName}
                onChange={(e) => setGuarantorName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Guarantor Mobile (জামিনদারের মোবাইল)
              </label>
              <input
                type="tel"
                placeholder="018XXXXXXXX"
                value={guarantorMobile}
                onChange={(e) => setGuarantorMobile(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-mono text-slate-900 dark:text-white focus:outline-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Notes & Reference (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="Referred by, shop customer notes, guarantor info..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-emerald-500 resize-none"
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
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 active:scale-95 transition disabled:opacity-60 cursor-pointer"
            >
              {loading ? 'Saving...' : 'Save Customer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
