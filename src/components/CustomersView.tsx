import React, { useState, useMemo } from 'react';
import {
  Users,
  Search,
  Plus,
  Phone,
  MapPin,
  CreditCard,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { Customer } from '../types';
import { formatCurrency, formatDhakaDate } from '../utils/dateAndEmiUtils';

interface CustomersViewProps {
  onOpenAddCustomer: () => void;
  onOpenAddEmi: (customerId?: string) => void;
  onSelectCustomer: (customerId: string) => void;
}

export const CustomersView: React.FC<CustomersViewProps> = ({
  onOpenAddCustomer,
  onOpenAddEmi,
  onSelectCustomer,
}) => {
  const { customers, installments } = useData();
  const { isAdmin } = useAuth();

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'ALL' | 'HAS_DUE' | 'OVERDUE'>('ALL');

  // Filter customers
  const filteredCustomers = useMemo(() => {
    return customers
      .filter((c) => c.status !== 'ARCHIVED')
      .filter((c) => {
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        return (
          c.name.toLowerCase().includes(q) ||
          c.mobileNumber.includes(q) ||
          c.customId.toLowerCase().includes(q) ||
          (c.nidNumber && c.nidNumber.includes(q)) ||
          c.address.toLowerCase().includes(q)
        );
      })
      .filter((c) => {
        if (filter === 'HAS_DUE') {
          return c.remainingAmount > 0;
        }
        if (filter === 'OVERDUE') {
          const hasOverdue = installments.some(
            (i) => i.customerId === c.customerId && i.status === 'OVERDUE' && i.remainingAmount > 0
          );
          return hasOverdue;
        }
        return true;
      });
  }, [customers, installments, search, filter]);

  return (
    <div className="space-y-6 pb-16 lg:pb-8">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            Customer Directory
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            {customers.filter((c) => c.status !== 'ARCHIVED').length} registered customers with EMI records
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={onOpenAddCustomer}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Customer</span>
          </button>
        )}
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by name, mobile number, customer ID (e.g. MT-1001)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-emerald-500 shadow-xs"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setFilter('ALL')}
            className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
              filter === 'ALL'
                ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800'
            }`}
          >
            All Customers ({customers.filter((c) => c.status !== 'ARCHIVED').length})
          </button>
          <button
            onClick={() => setFilter('HAS_DUE')}
            className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
              filter === 'HAS_DUE'
                ? 'bg-amber-600 text-white'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800'
            }`}
          >
            Has Balance Due
          </button>
          <button
            onClick={() => setFilter('OVERDUE')}
            className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
              filter === 'OVERDUE'
                ? 'bg-red-600 text-white'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800'
            }`}
          >
            Overdue Only
          </button>
        </div>
      </div>

      {/* Customers List Grid */}
      {filteredCustomers.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-400">
          <Users className="w-10 h-10 mx-auto mb-2 text-slate-300 dark:text-slate-700" />
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">No Customers Found</h3>
          <p className="text-xs text-slate-500 mt-1">
            Try adjusting your search query or add a new customer above.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCustomers.map((customer) => {
            const hasOverdue = installments.some(
              (i) => i.customerId === customer.customerId && i.status === 'OVERDUE' && i.remainingAmount > 0
            );

            return (
              <div
                key={customer.customerId}
                className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition flex flex-col justify-between group"
              >
                <div>
                  {/* Top Row: Name & ID Badge */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3
                        onClick={() => onSelectCustomer(customer.customerId)}
                        className="text-base font-bold text-slate-900 dark:text-white group-hover:text-emerald-500 transition cursor-pointer flex items-center gap-1.5"
                      >
                        <span>{customer.name}</span>
                        {hasOverdue && (
                          <span
                            title="Has Overdue Installments"
                            className="inline-flex items-center text-red-500"
                          >
                            <AlertTriangle className="w-3.5 h-3.5" />
                          </span>
                        )}
                      </h3>
                      <span className="text-[11px] font-mono font-semibold text-slate-500">
                        ID: {customer.customId}
                      </span>
                    </div>

                    <a
                      href={`tel:${customer.mobileNumber}`}
                      className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 transition"
                      title="Call Customer"
                    >
                      <Phone className="w-3.5 h-3.5" />
                    </a>
                  </div>

                  {/* Contact & Address */}
                  <div className="mt-3 space-y-1 text-xs text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="font-semibold text-slate-700 dark:text-slate-300">{customer.mobileNumber}</span>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span className="truncate">{customer.address}</span>
                    </div>
                  </div>

                  {/* Balances Section */}
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-semibold">Total Financed</span>
                      <span className="font-bold text-slate-700 dark:text-slate-300">
                        {formatCurrency(customer.totalEmiAmount)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-semibold">Remaining Due</span>
                      <span
                        className={`font-black ${
                          customer.remainingAmount > 0
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-emerald-600 dark:text-emerald-400'
                        }`}
                      >
                        {formatCurrency(customer.remainingAmount)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  <span className="text-[11px] text-slate-400 font-medium">
                    {customer.activeEmiCount} active EMI{customer.activeEmiCount !== 1 ? 's' : ''}
                  </span>

                  <div className="flex items-center gap-1.5">
                    {isAdmin && (
                      <button
                        onClick={() => onOpenAddEmi(customer.customerId)}
                        className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-[11px] font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                      >
                        + EMI
                      </button>
                    )}
                    <button
                      onClick={() => onSelectCustomer(customer.customerId)}
                      className="px-3 py-1.5 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-[11px] font-bold flex items-center gap-1 transition cursor-pointer hover:opacity-90"
                    >
                      <span>Details</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
