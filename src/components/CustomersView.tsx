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
  Smartphone,
  Hash,
  X,
  ArrowUpDown,
  SlidersHorizontal,
  Clock,
  Check,
  User,
  ShieldCheck,
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

interface CustomersViewProps {
  onOpenAddCustomer: () => void;
  onOpenAddEmi: (customerId?: string) => void;
  onSelectCustomer: (customerId: string) => void;
}

type FilterOption = 'ALL' | 'ACTIVE_EMI' | 'DUE_TODAY' | 'OVERDUE' | 'HAS_DUE' | 'ZERO_DUE';
type SortOption = 'DEFAULT' | 'NAME_ASC' | 'NAME_DESC' | 'DUE_DESC' | 'TOTAL_DESC';

export const CustomersView: React.FC<CustomersViewProps> = ({
  onOpenAddCustomer,
  onOpenAddEmi,
  onSelectCustomer,
}) => {
  const { customers, emiAccounts, installments } = useData();
  const { isAdmin } = useAuth();

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterOption>('ALL');
  const [sortBy, setSortBy] = useState<SortOption>('DEFAULT');
  const [selectedInstallmentForPayment, setSelectedInstallmentForPayment] = useState<Installment | null>(null);

  const todayDhaka = getTodayDhaka();

  // Pre-calculate customer helper information including IMEI matching and installment progress
  const enrichedCustomers = useMemo(() => {
    const activeCustomers = customers.filter((c) => c.status !== 'ARCHIVED');

    return activeCustomers.map((customer) => {
      // Gather all EMI accounts for this customer
      const customerEmis = (customer.emiAccounts || []).length > 0
        ? customer.emiAccounts!
        : emiAccounts.filter((e) => e.customerId === customer.customerId);

      // Gather all installments for this customer
      const customerInsts = (customer.installments || []).length > 0
        ? customer.installments!
        : installments.filter((i) => i.customerId === customer.customerId);

      // Primary active EMI or latest
      const primaryActiveEmi =
        customerEmis.find((e) => e.status === 'ACTIVE') ||
        customerEmis[0] ||
        null;

      // Extract all IMEI numbers
      const allImeis = customerEmis
        .map((e) => e.imeiNumber?.trim())
        .filter((imei): imei is string => Boolean(imei && imei.length > 0));

      // Extract all product names
      const allProducts = customerEmis
        .map((e) => e.productName?.trim())
        .filter((p): p is string => Boolean(p && p.length > 0));

      // Check installments status
      const totalCount = customerInsts.length || (primaryActiveEmi ? primaryActiveEmi.totalEmiMonths : 0);
      const paidCount = customerInsts.filter((i) => i.status === 'PAID').length;
      const completionPercentage = totalCount > 0 ? Math.round((paidCount / totalCount) * 100) : 0;

      const hasOverdue = customerInsts.some(
        (i) => i.status === 'OVERDUE' && (i.remainingAmount || 0) > 0
      );
      const hasDueToday = customerInsts.some(
        (i) => i.dueDate === todayDhaka && i.status !== 'PAID' && (i.remainingAmount || 0) > 0
      );

      // Next pending installment for quick payment
      const nextPendingInstallment = customerInsts
        .filter((i) => i.status !== 'PAID' && (i.remainingAmount || 0) > 0)
        .sort((a, b) => (a.installmentNumber || 0) - (b.installmentNumber || 0))[0] || null;

      return {
        ...customer,
        customerEmis,
        customerInsts,
        primaryActiveEmi,
        allImeis,
        allProducts,
        totalCount,
        paidCount,
        completionPercentage,
        hasOverdue,
        hasDueToday,
        nextPendingInstallment,
      };
    });
  }, [customers, emiAccounts, installments, todayDhaka]);

  // Robust Search & Filter & Sort Pipeline
  const filteredAndSortedCustomers = useMemo(() => {
    const q = search.trim().toLowerCase();

    return enrichedCustomers
      .filter((c) => {
        // Multi-field robust search
        if (q) {
          const matchName = (c.name || '').toLowerCase().includes(q);
          const matchMobile = (c.mobileNumber || '').includes(q);
          const matchAlt = (c.alternativeNumber || '').includes(q);
          const matchCustomId = (c.customId || '').toLowerCase().includes(q);
          const matchNid = (c.nidNumber || '').includes(q);
          const matchAddress = (c.address || '').toLowerCase().includes(q);
          const matchGuarantorName = (c.guarantorName || '').toLowerCase().includes(q);
          const matchGuarantorMobile = (c.guarantorMobile || '').includes(q);

          // IMEI Search (Searches all EMI accounts of this customer)
          const matchImei = c.allImeis.some((imei) => imei.toLowerCase().includes(q));

          // Product / Phone model search
          const matchProduct = c.allProducts.some((p) => p.toLowerCase().includes(q));

          if (
            !matchName &&
            !matchMobile &&
            !matchAlt &&
            !matchCustomId &&
            !matchImei &&
            !matchProduct &&
            !matchNid &&
            !matchAddress &&
            !matchGuarantorName &&
            !matchGuarantorMobile
          ) {
            return false;
          }
        }

        // Tab Filter
        if (filter === 'ACTIVE_EMI') {
          return c.customerEmis.some((e) => e.status === 'ACTIVE') || c.activeEmiCount > 0;
        }
        if (filter === 'DUE_TODAY') {
          return c.hasDueToday;
        }
        if (filter === 'OVERDUE') {
          return c.hasOverdue;
        }
        if (filter === 'HAS_DUE') {
          return (c.remainingAmount || 0) > 0;
        }
        if (filter === 'ZERO_DUE') {
          return (c.remainingAmount || 0) === 0;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'NAME_ASC') {
          return (a.name || '').localeCompare(b.name || '');
        }
        if (sortBy === 'NAME_DESC') {
          return (b.name || '').localeCompare(a.name || '');
        }
        if (sortBy === 'DUE_DESC') {
          return (b.remainingAmount || 0) - (a.remainingAmount || 0);
        }
        if (sortBy === 'TOTAL_DESC') {
          return (b.totalEmiAmount || 0) - (a.totalEmiAmount || 0);
        }
        // Default: most recently created/updated
        return (b.createdAt || '').localeCompare(a.createdAt || '');
      });
  }, [enrichedCustomers, search, filter, sortBy]);

  // Overall KPI counts
  const totalCustomerCount = enrichedCustomers.length;
  const activeEmiCount = enrichedCustomers.filter((c) => c.activeEmiCount > 0 || c.customerEmis.some((e) => e.status === 'ACTIVE')).length;
  const dueTodayCount = enrichedCustomers.filter((c) => c.hasDueToday).length;
  const overdueCount = enrichedCustomers.filter((c) => c.hasOverdue).length;
  const hasDueCount = enrichedCustomers.filter((c) => (c.remainingAmount || 0) > 0).length;

  const totalFilteredDue = useMemo(() => {
    return filteredAndSortedCustomers.reduce((sum, c) => sum + (c.remainingAmount || 0), 0);
  }, [filteredAndSortedCustomers]);

  return (
    <div className="space-y-5 pb-16 lg:pb-8">
      {/* Top Header & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <span>Customer Directory</span>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300">
              {totalCustomerCount} Clients
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Search clients by Name, Mobile, IMEI Number, Product model, or Customer ID.
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={onOpenAddCustomer}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition active:scale-95 cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Customer</span>
          </button>
        )}
      </div>

      {/* ROBUST SEARCH & FILTER BAR */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3.5">
        {/* Main Search Input */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search by name, mobile (017..), IMEI (86..), product (Redmi..), or ID (MT-1001)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/70 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-emerald-500 focus:bg-white dark:focus:bg-slate-900 transition shadow-inner"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-2.5 p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Sort By Dropdown */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-1.5 px-3 py-2 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/70 text-xs text-slate-700 dark:text-slate-300">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="bg-transparent text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-hidden cursor-pointer"
              >
                <option value="DEFAULT" className="dark:bg-slate-900">Sort: Recently Added</option>
                <option value="NAME_ASC" className="dark:bg-slate-900">Name: A to Z</option>
                <option value="NAME_DESC" className="dark:bg-slate-900">Name: Z to A</option>
                <option value="DUE_DESC" className="dark:bg-slate-900">Remaining Due: High to Low</option>
                <option value="TOTAL_DESC" className="dark:bg-slate-900">Total Financed: High to Low</option>
              </select>
            </div>
          </div>
        </div>

        {/* Filter Pills / Status Badges */}
        <div className="flex items-center justify-between gap-2 flex-wrap pt-1 border-t border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 w-full sm:w-auto">
            <button
              onClick={() => setFilter('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                filter === 'ALL'
                  ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              All Clients ({totalCustomerCount})
            </button>
            <button
              onClick={() => setFilter('ACTIVE_EMI')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                filter === 'ACTIVE_EMI'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              Active Plans ({activeEmiCount})
            </button>
            <button
              onClick={() => setFilter('DUE_TODAY')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                filter === 'DUE_TODAY'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              Due Today ({dueTodayCount})
            </button>
            <button
              onClick={() => setFilter('OVERDUE')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                filter === 'OVERDUE'
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              Overdue ({overdueCount})
            </button>
            <button
              onClick={() => setFilter('HAS_DUE')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                filter === 'HAS_DUE'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              Has Due ({hasDueCount})
            </button>
            <button
              onClick={() => setFilter('ZERO_DUE')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                filter === 'ZERO_DUE'
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              Paid Off ({totalCustomerCount - hasDueCount})
            </button>
          </div>

          {/* Result Count & Reset Button */}
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>
              Showing <strong className="text-slate-900 dark:text-white">{filteredAndSortedCustomers.length}</strong> of {totalCustomerCount}
            </span>
            {(search || filter !== 'ALL' || sortBy !== 'DEFAULT') && (
              <button
                onClick={() => {
                  setSearch('');
                  setFilter('ALL');
                  setSortBy('DEFAULT');
                }}
                className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline cursor-pointer ml-1"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* CUSTOMERS LIST GRID */}
      {filteredAndSortedCustomers.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-400 shadow-xs">
          <Users className="w-12 h-12 mx-auto mb-3 text-slate-300 dark:text-slate-700" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">No Customers Found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {search
              ? `No client matched "${search}". Try searching with a different name, phone, or IMEI.`
              : 'No customers match the selected filter.'}
          </p>
          {(search || filter !== 'ALL') && (
            <button
              onClick={() => {
                setSearch('');
                setFilter('ALL');
              }}
              className="mt-4 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
            >
              Clear Search & Filter
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAndSortedCustomers.map((customer) => {
            const {
              customerId,
              name,
              customId,
              mobileNumber,
              alternativeNumber,
              address,
              totalEmiAmount,
              paidAmount,
              remainingAmount,
              activeEmiCount,
              primaryActiveEmi,
              allImeis,
              totalCount,
              paidCount,
              completionPercentage,
              hasOverdue,
              hasDueToday,
              nextPendingInstallment,
            } = customer;

            // Check if search matched an IMEI
            const q = search.trim().toLowerCase();
            const isImeiMatch = q && allImeis.some((imei) => imei.toLowerCase().includes(q));

            return (
              <div
                key={customerId}
                className={`p-5 rounded-3xl border shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between group ${
                  hasOverdue
                    ? 'bg-red-50/20 dark:bg-red-950/10 border-red-200 dark:border-red-900/40 hover:border-red-400'
                    : hasDueToday
                    ? 'bg-amber-50/20 dark:bg-amber-950/10 border-amber-200 dark:border-amber-900/40 hover:border-amber-400'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-emerald-500/60'
                }`}
              >
                <div>
                  {/* Top Row: Name, ID & Status Badge */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <button
                          onClick={() => onSelectCustomer(customerId)}
                          className="text-base font-bold text-slate-900 dark:text-white group-hover:text-emerald-500 transition cursor-pointer truncate text-left"
                        >
                          {name}
                        </button>
                        <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          {customId}
                        </span>
                      </div>

                      {/* Contact numbers */}
                      <div className="flex items-center gap-2 mt-1 text-xs">
                        <a
                          href={`tel:${mobileNumber}`}
                          className="text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 font-semibold"
                        >
                          <Phone className="w-3 h-3" />
                          <span>{mobileNumber}</span>
                        </a>
                        {alternativeNumber && (
                          <span className="text-[11px] text-slate-400 font-mono">
                            / {alternativeNumber}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className="shrink-0">
                      {hasOverdue ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/30">
                          OVERDUE
                        </span>
                      ) : hasDueToday ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                          DUE TODAY
                        </span>
                      ) : remainingAmount === 0 ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-teal-500/20 text-teal-600 dark:text-teal-400 border border-teal-500/30">
                          PAID OFF
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          ACTIVE
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Address */}
                  {address && (
                    <div className="mt-2.5 flex items-start gap-1.5 text-xs text-slate-500">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span className="truncate">{address}</span>
                    </div>
                  )}

                  {/* Device & IMEI Number Info Card */}
                  {primaryActiveEmi && (
                    <div
                      className={`mt-3 p-2.5 rounded-2xl border text-xs ${
                        isImeiMatch
                          ? 'bg-amber-100/60 dark:bg-amber-950/40 border-amber-400 dark:border-amber-700'
                          : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1 truncate">
                          <Smartphone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{primaryActiveEmi.productName}</span>
                        </span>
                        <span className="font-extrabold text-emerald-600 dark:text-emerald-400 shrink-0">
                          {formatCurrency(primaryActiveEmi.totalFinancedAmount || primaryActiveEmi.productPrice)}
                        </span>
                      </div>

                      {/* IMEI number display */}
                      {primaryActiveEmi.imeiNumber ? (
                        <div className="mt-1 flex items-center justify-between text-[11px]">
                          <span className="text-slate-500 flex items-center gap-1 font-mono">
                            <Hash className="w-3 h-3 text-slate-400" />
                            <strong className="text-slate-700 dark:text-slate-300">
                              {primaryActiveEmi.imeiNumber}
                            </strong>
                          </span>
                          {isImeiMatch && (
                            <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-200 dark:bg-amber-900/60 px-1.5 py-0.2 rounded">
                              IMEI Match
                            </span>
                          )}
                        </div>
                      ) : allImeis.length > 0 ? (
                        <div className="mt-1 text-[11px] font-mono text-slate-500">
                          IMEI: {allImeis.join(', ')}
                        </div>
                      ) : null}
                    </div>
                  )}

                  {/* Installment Progress Mini-Bar */}
                  {totalCount > 0 && (
                    <div className="mt-3 space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-600 dark:text-slate-400">
                          Installments: <strong className="text-emerald-600 dark:text-emerald-400">{paidCount}</strong>/{totalCount} Paid
                        </span>
                        <span className="text-[11px] font-bold text-slate-500">{completionPercentage}%</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            completionPercentage === 100
                              ? 'bg-emerald-500'
                              : hasOverdue
                              ? 'bg-linear-to-r from-emerald-500 via-amber-500 to-red-500'
                              : 'bg-emerald-500'
                          }`}
                          style={{ width: `${completionPercentage}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Financial Balances */}
                  <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">Total Financed</span>
                      <span className="font-bold text-slate-700 dark:text-slate-300">
                        {formatCurrency(totalEmiAmount)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">Remaining Due</span>
                      <span
                        className={`font-black ${
                          remainingAmount > 0
                            ? hasOverdue
                              ? 'text-red-600 dark:text-red-400'
                              : 'text-amber-600 dark:text-amber-400'
                            : 'text-emerald-600 dark:text-emerald-400'
                        }`}
                      >
                        {formatCurrency(remainingAmount)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bottom Card Actions */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  <span className="text-[11px] text-slate-400 font-medium">
                    {activeEmiCount} active EMI{activeEmiCount !== 1 ? 's' : ''}
                  </span>

                  <div className="flex items-center gap-1.5">
                    {isAdmin && (
                      <button
                        onClick={() => onOpenAddEmi(customerId)}
                        className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-[11px] font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                        title="Create New EMI for this customer"
                      >
                        + EMI
                      </button>
                    )}

                    {isAdmin && nextPendingInstallment && nextPendingInstallment.status !== 'PAID' && (
                      <button
                        onClick={() => setSelectedInstallmentForPayment(nextPendingInstallment)}
                        className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold shadow-xs active:scale-95 transition cursor-pointer"
                        title="Pay next due installment"
                      >
                        Pay Due
                      </button>
                    )}

                    <button
                      onClick={() => onSelectCustomer(customerId)}
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

      {/* Payment Modal if triggered from Pay Due button */}
      <PaymentModal
        isOpen={!!selectedInstallmentForPayment}
        onClose={() => setSelectedInstallmentForPayment(null)}
        installment={selectedInstallmentForPayment}
      />
    </div>
  );
};
