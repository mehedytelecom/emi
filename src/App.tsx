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
import { CalendarView } from './components/CalendarView';
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
  Calendar,
  Plus,
} from 'lucide-react';

const MainAppContent: React.FC = () => {
  const { loading, currentUser, isAdmin, isPending, isRejectedOrDisabled } = useAuth();
  const { customers } = useData();

  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
  const [isAddEmiOpen, setIsAddEmiOpen] = useState(false);
  const [selectedCustomerForEmi, setSelectedCustomerForEmi] = useState<string | undefined>(undefined);
  const [selectedCustomerIdForDetail, setSelectedCustomerIdForDetail] = useState<string | null>(null);

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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200 selection:bg-emerald-500 selection:text-white">
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
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-24 lg:pb-8">
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

        {activeTab === 'calendar' && (
          <CalendarView onSelectCustomer={(id) => setSelectedCustomerIdForDetail(id)} />
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

      {/* Mobile-First Bottom Navigation Bar (Visible on mobile/tablet) */}
      <nav
        aria-label="Mobile Navigation"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 px-2 py-1.5 flex items-center justify-around shadow-lg"
      >
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl transition cursor-pointer ${
            activeTab === 'dashboard'
              ? 'text-emerald-600 dark:text-emerald-400 font-bold'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[10px]">Home</span>
        </button>

        <button
          onClick={() => setActiveTab('customers')}
          className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl transition cursor-pointer ${
            activeTab === 'customers'
              ? 'text-emerald-600 dark:text-emerald-400 font-bold'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Users className="w-5 h-5" />
          <span className="text-[10px]">Customers</span>
        </button>

        {/* Quick Add Button Center */}
        {isAdmin && (
          <button
            onClick={() => handleOpenAddEmiWithCustomer(undefined)}
            className="flex flex-col items-center justify-center -mt-5 w-12 h-12 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/30 transition active:scale-95 cursor-pointer"
            title="Create New EMI"
          >
            <Plus className="w-6 h-6" />
          </button>
        )}

        <button
          onClick={() => setActiveTab('emi')}
          className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl transition cursor-pointer ${
            activeTab === 'emi'
              ? 'text-emerald-600 dark:text-emerald-400 font-bold'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <CreditCard className="w-5 h-5" />
          <span className="text-[10px]">EMI</span>
        </button>

        <button
          onClick={() => setActiveTab('overdue')}
          className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl transition cursor-pointer ${
            activeTab === 'overdue'
              ? 'text-red-600 dark:text-red-400 font-bold'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <AlertTriangle className="w-5 h-5" />
          <span className="text-[10px]">Overdue</span>
        </button>

        <button
          onClick={() => setActiveTab('calendar')}
          className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl transition cursor-pointer ${
            activeTab === 'calendar'
              ? 'text-emerald-600 dark:text-emerald-400 font-bold'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Calendar className="w-5 h-5" />
          <span className="text-[10px]">Calendar</span>
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
