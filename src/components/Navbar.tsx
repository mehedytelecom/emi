import React, { useState } from 'react';
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Calendar,
  AlertTriangle,
  FileBarChart,
  Bell,
  Settings,
  UserCheck,
  LogOut,
  Menu,
  X,
  ShieldCheck,
  Eye,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { PWAInstallButton } from './PWAInstallButton';
import { formatDhakaDate, getTodayDhaka } from '../utils/dateAndEmiUtils';

export type NavTab =
  | 'dashboard'
  | 'customers'
  | 'emi'
  | 'calendar'
  | 'overdue'
  | 'reports'
  | 'notifications'
  | 'settings'
  | 'users';

interface NavbarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onOpenAddCustomer: () => void;
  onOpenAddEmi: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onSelectTab,
  onOpenAddCustomer,
  onOpenAddEmi,
}) => {
  const { userProfile, isAdmin, logout } = useAuth();
  const { notifications, installments } = useData();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const unreadNotificationsCount = notifications.filter((n) => n.status === 'UNREAD').length;
  const overdueCount = installments.filter((i) => i.status === 'OVERDUE').length;
  const dueTodayCount = installments.filter((i) => i.status === 'DUE TODAY').length;
  const todayDhaka = getTodayDhaka();

  const handleTabClick = (tab: NavTab) => {
    onSelectTab(tab);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 text-slate-100 shadow-md">
      {/* Top Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-18">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => handleTabClick('dashboard')}>
            <div className="w-10 h-10 rounded-xl bg-linear-to-tr from-emerald-500 to-teal-600 flex items-center justify-center font-extrabold text-white text-xl shadow-md shadow-emerald-500/20 ring-2 ring-slate-700">
              ৳
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base sm:text-lg tracking-tight text-white">
                  MEHEDI TELECOM
                </span>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-emerald-400 border border-slate-700">
                  EMI System
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-slate-400">
                <span>Personal EMI</span>
                <span className="text-slate-600">•</span>
                <span className="text-emerald-400 font-medium">{formatDhakaDate(todayDhaka)}</span>
              </div>
            </div>
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden lg:flex items-center gap-1">
            <button
              onClick={() => handleTabClick('dashboard')}
              className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
                activeTab === 'dashboard'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => handleTabClick('customers')}
              className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
                activeTab === 'customers'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Customers</span>
            </button>

            <button
              onClick={() => handleTabClick('emi')}
              className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
                activeTab === 'emi'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <CreditCard className="w-4 h-4" />
              <span>EMI Accounts</span>
            </button>

            <button
              onClick={() => handleTabClick('calendar')}
              className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
                activeTab === 'calendar'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Calendar</span>
            </button>

            <button
              onClick={() => handleTabClick('overdue')}
              className={`relative px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
                activeTab === 'overdue'
                  ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <span>Overdue</span>
              {overdueCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-red-600 text-[10px] font-bold text-white">
                  {overdueCount}
                </span>
              )}
            </button>

            <button
              onClick={() => handleTabClick('reports')}
              className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
                activeTab === 'reports'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <FileBarChart className="w-4 h-4" />
              <span>Reports</span>
            </button>

            {isAdmin && (
              <button
                onClick={() => handleTabClick('users')}
                className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
                  activeTab === 'users'
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <UserCheck className="w-4 h-4" />
                <span>Users</span>
              </button>
            )}

            <button
              onClick={() => handleTabClick('settings')}
              className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
                activeTab === 'settings'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </button>
          </nav>

          {/* Right Action Group */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* PWA Install Button */}
            <PWAInstallButton compact />

            {/* Quick Add Button for Admin */}
            {isAdmin && (
              <div className="hidden sm:flex items-center gap-2">
                <button
                  onClick={onOpenAddEmi}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition cursor-pointer active:scale-95"
                >
                  <span>+ Create EMI</span>
                </button>
              </div>
            )}

            {/* Notifications Button */}
            <button
              onClick={() => handleTabClick('notifications')}
              className="relative p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadNotificationsCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[9px] font-extrabold text-white ring-2 ring-slate-900">
                  {unreadNotificationsCount}
                </span>
              )}
            </button>

            {/* User Badge & Signout */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
              <div className="flex items-center gap-2">
                {userProfile?.photoURL ? (
                  <img
                    src={userProfile.photoURL}
                    alt={userProfile.displayName}
                    className="w-8 h-8 rounded-full border border-slate-700 object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-300">
                    {userProfile?.displayName?.[0]?.toUpperCase() || 'U'}
                  </div>
                )}
                <div className="hidden xl:flex flex-col text-left">
                  <span className="text-xs font-bold text-slate-200 truncate max-w-[120px]">
                    {userProfile?.displayName || 'User'}
                  </span>
                  <div className="flex items-center gap-1">
                    {isAdmin ? (
                      <span className="flex items-center gap-0.5 text-[10px] font-semibold text-emerald-400">
                        <ShieldCheck className="w-3 h-3" /> ADMIN
                      </span>
                    ) : (
                      <span className="flex items-center gap-0.5 text-[10px] font-semibold text-sky-400">
                        <Eye className="w-3 h-3" /> VIEWER
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <button
                onClick={logout}
                className="p-2 rounded-xl text-slate-400 hover:text-red-400 hover:bg-slate-800 transition cursor-pointer"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>

              {/* Mobile menu toggle */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 rounded-xl text-slate-300 hover:bg-slate-800 cursor-pointer"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Navigation (When hamburger menu is opened) */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-800 bg-slate-900/98 backdrop-blur-xl px-4 py-4 space-y-2">
          {/* Quick Action Button for Mobile */}
          {isAdmin && (
            <div className="pb-3 mb-3 border-b border-slate-800">
              <button
                onClick={() => {
                  onOpenAddEmi();
                  setMobileMenuOpen(false);
                }}
                className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
              >
                <span>+ Create EMI</span>
              </button>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleTabClick('dashboard')}
              className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                activeTab === 'dashboard'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-slate-800 text-slate-300'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => handleTabClick('customers')}
              className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                activeTab === 'customers'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-slate-800 text-slate-300'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Customers</span>
            </button>

            <button
              onClick={() => handleTabClick('emi')}
              className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                activeTab === 'emi'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-slate-800 text-slate-300'
              }`}
            >
              <CreditCard className="w-4 h-4" />
              <span>EMI Accounts</span>
            </button>

            <button
              onClick={() => handleTabClick('calendar')}
              className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                activeTab === 'calendar'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-slate-800 text-slate-300'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Calendar</span>
            </button>

            <button
              onClick={() => handleTabClick('overdue')}
              className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                activeTab === 'overdue'
                  ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                  : 'bg-slate-800 text-slate-300'
              }`}
            >
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <span>Overdue ({overdueCount})</span>
            </button>

            <button
              onClick={() => handleTabClick('reports')}
              className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                activeTab === 'reports'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-slate-800 text-slate-300'
              }`}
            >
              <FileBarChart className="w-4 h-4" />
              <span>Reports</span>
            </button>

            {isAdmin && (
              <button
                onClick={() => handleTabClick('users')}
                className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                  activeTab === 'users'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-slate-800 text-slate-300'
                }`}
              >
                <UserCheck className="w-4 h-4" />
                <span>User Approvals</span>
              </button>
            )}

            <button
              onClick={() => handleTabClick('settings')}
              className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                activeTab === 'settings'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-slate-800 text-slate-300'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </button>
          </div>
        </div>
      )}

      {/* Sticky Mobile Bottom Navigation Bar (Requirement 21: Mobile-first navigation) */}
      <nav aria-label="Mobile Navigation" className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-lg border-t border-slate-800 px-2 py-1.5 flex items-center justify-around shadow-2xl">
        <button
          onClick={() => handleTabClick('dashboard')}
          className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl transition ${
            activeTab === 'dashboard' ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[10px]">Dashboard</span>
        </button>

        <button
          onClick={() => handleTabClick('customers')}
          className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl transition ${
            activeTab === 'customers' ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users className="w-5 h-5" />
          <span className="text-[10px]">Customers</span>
        </button>

        <button
          onClick={() => handleTabClick('emi')}
          className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl transition ${
            activeTab === 'emi' ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <CreditCard className="w-5 h-5" />
          <span className="text-[10px]">EMI</span>
        </button>

        <button
          onClick={() => handleTabClick('calendar')}
          className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl transition ${
            activeTab === 'calendar' ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Calendar className="w-5 h-5" />
          <span className="text-[10px]">Calendar</span>
        </button>

        <button
          onClick={() => handleTabClick('overdue')}
          className={`relative flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl transition ${
            activeTab === 'overdue' ? 'text-red-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <AlertTriangle className="w-5 h-5 text-red-400" />
          <span className="text-[10px]">Overdue</span>
          {overdueCount > 0 && (
            <span className="absolute top-0 right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-600 text-[8px] font-bold text-white">
              {overdueCount}
            </span>
          )}
        </button>
      </nav>
    </header>
  );
};
