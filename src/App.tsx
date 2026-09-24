import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider, useData } from './context/DataContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import {
  LoginScreen,
  PendingApprovalScreen,
  AccessDeniedScreen,
  LoadingScreen,
} from './components/AccessScreens';
import { Navbar, NavTab } from './components/Navbar';
import { OfflineIndicator } from './components/OfflineIndicator';
import { DashboardView } from './components/DashboardView';
import { CustomersView } from './components/CustomersView';
import { EmiView } from './components/EmiView';
import { OverdueView } from './components/OverdueView';
import { ReportsView } from './components/ReportsView';
import { NotificationsView } from './components/NotificationsView';
import { SettingsView } from './components/SettingsView';

import { AddCustomerModal } from './components/Modals/AddCustomerModal';
import { AddEmiModal } from './components/Modals/AddEmiModal';
import { CustomerDetailModal } from './components/Modals/CustomerDetailModal';

import {
  LayoutDashboard,
  Users,
  CreditCard,
  AlertTriangle,
  FileBarChart,
  Plus,
} from 'lucide-react';

const MainAppContent: React.FC = () => {
  const { loading, currentUser, isAdmin, isPending, isRejectedOrDisabled } = useAuth();
  const { customers, installments } = useData();

  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
  const [isAddEmiOpen, setIsAddEmiOpen] = useState(false);
  const [selectedCustomerForEmi, setSelectedCustomerForEmi] = useState<string | undefined>(undefined);
  const [selectedCustomerIdForDetail, setSelectedCustomerIdForDetail] = useState<string | null>(null);

  const overdueCount = installments.filter((i) => i.status === 'OVERDUE').length;

  // Auth gate checks
  if (loading) {
    return <LoadingScreen />;
  }

  if (!currentUser) {
    return <LoginScreen />;
  }

  if (isPending) {
    return <PendingApprovalScreen />;
  }

  if (isRejectedOrDisabled) {
    return <AccessDeniedScreen />;
  }

  const selectedCustomer = customers.find((c) => c.customerId === selectedCustomerIdForDetail) || null;

  const handleOpenAddEmiWithCustomer = (customerId?: string) => {
    setSelectedCustomerForEmi(customerId);
    setIsAddEmiOpen(true);
  };

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200 selection:bg-emerald-500 selection:text-white">
      {/* Offline connectivity warning banner */}
      <OfflineIndicator />

      {/* Main Top Navbar */}
      <Navbar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenAddCustomer={() => setIsAddCustomerOpen(true)}
        onOpenAddEmi={() => handleOpenAddEmiWithCustomer(undefined)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-24 lg:pb-8 overflow-x-hidden">
        {activeTab === 'dashboard' && (
          <DashboardView
            onOpenAddCustomer={() => setIsAddCustomerOpen(true)}
            onOpenAddEmi={() => handleOpenAddEmiWithCustomer(undefined)}
            onNavigateTab={setActiveTab}
            onSelectCustomer={(id) => setSelectedCustomerIdForDetail(id)}
          />
        )}

        {activeTab === 'customers' && (
          <CustomersView
            onOpenAddCustomer={() => setIsAddCustomerOpen(true)}
            onOpenAddEmi={handleOpenAddEmiWithCustomer}
            onSelectCustomer={(id) => setSelectedCustomerIdForDetail(id)}
          />
        )}

        {activeTab === 'emi' && (
          <EmiView
            onOpenAddEmi={() => handleOpenAddEmiWithCustomer(undefined)}
            onSelectCustomer={(id) => setSelectedCustomerIdForDetail(id)}
          />
        )}

        {activeTab === 'overdue' && (
          <OverdueView onSelectCustomer={(id) => setSelectedCustomerIdForDetail(id)} />
        )}

        {activeTab === 'reports' && <ReportsView />}

        {activeTab === 'notifications' && (
          <NotificationsView onSelectCustomer={(id) => setSelectedCustomerIdForDetail(id)} />
        )}

        {activeTab === 'settings' && <SettingsView />}
      </main>

      {/* Mobile-First Bottom Navigation Bar (Visible on mobile/tablet < 1024px) */}
      <nav
        aria-label="Mobile Navigation"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/98 backdrop-blur-xl border-t border-slate-800 px-2 pt-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))] flex items-center justify-around shadow-2xl"
      >
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl transition cursor-pointer ${
            activeTab === 'dashboard'
              ? 'text-emerald-400 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[10px]">Dashboard</span>
        </button>

        <button
          onClick={() => setActiveTab('customers')}
          className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl transition cursor-pointer ${
            activeTab === 'customers'
              ? 'text-emerald-400 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users className="w-5 h-5" />
          <span className="text-[10px]">Customers</span>
        </button>

        {/* Quick Add Button Center */}
        {isAdmin && (
          <button
            onClick={() => handleOpenAddEmiWithCustomer(undefined)}
            className="flex flex-col items-center justify-center -mt-5 w-11 h-11 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/40 ring-4 ring-slate-900 transition active:scale-95 cursor-pointer"
            title="Create New EMI"
          >
            <Plus className="w-5 h-5" />
          </button>
        )}

        <button
          onClick={() => setActiveTab('emi')}
          className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl transition cursor-pointer ${
            activeTab === 'emi'
              ? 'text-emerald-400 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <CreditCard className="w-5 h-5" />
          <span className="text-[10px]">EMI</span>
        </button>

        <button
          onClick={() => setActiveTab('overdue')}
          className={`relative flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl transition cursor-pointer ${
            activeTab === 'overdue'
              ? 'text-red-400 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <AlertTriangle className="w-5 h-5" />
          <span className="text-[10px]">Overdue</span>
          {overdueCount > 0 && (
            <span className="absolute -top-1 right-2 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-600 text-[8px] font-extrabold text-white ring-2 ring-slate-900">
              {overdueCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('reports')}
          className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl transition cursor-pointer ${
            activeTab === 'reports'
              ? 'text-emerald-400 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileBarChart className="w-5 h-5" />
          <span className="text-[10px]">Reports</span>
        </button>
      </nav>

      {/* Global Modals */}
      <AddCustomerModal
        isOpen={isAddCustomerOpen}
        onClose={() => setIsAddCustomerOpen(false)}
      />

      <AddEmiModal
        isOpen={isAddEmiOpen}
        onClose={() => {
          setIsAddEmiOpen(false);
          setSelectedCustomerForEmi(undefined);
        }}
        initialCustomerId={selectedCustomerForEmi}
      />

      <CustomerDetailModal
        isOpen={!!selectedCustomerIdForDetail}
        onClose={() => setSelectedCustomerIdForDetail(null)}
        customer={selectedCustomer}
        onOpenAddEmiForCustomer={(customerId) => {
          setSelectedCustomerIdForDetail(null);
          handleOpenAddEmiWithCustomer(customerId);
        }}
      />
    </div>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <DataProvider>
          <MainAppContent />
        </DataProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
