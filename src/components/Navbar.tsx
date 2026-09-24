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
  PlusCircle,
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
  const todayDhaka = getTodayDhaka();

  const handleTabClick = (tab: NavTab) => {
    onSelectTab(tab);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-900/98 backdrop-blur-md border-b border-slate-800 text-slate-100 shadow-md">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Logo & Brand Identity */}
          <div
            className="flex items-center gap-2.5 sm:gap-3 cursor-pointer select-none shrink-0"
            onClick={() => handleTabClick('dashboard')}
          >
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-linear-to-tr from-emerald-500 to-teal-600 flex items-center justify-center font-extrabold text-white text-base sm:text-lg shadow-md shadow-emerald-500/20 ring-1 ring-slate-700">
              ৳
            </div>
            <div className="flex flex-col text-left">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-sm sm:text-base tracking-tight text-white leading-tight">
                  MEHEDI TELECOM
                </span>
                <span className="hidden md:inline-block px-1.5 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider bg-slate-800 text-emerald-400 border border-slate-700">
                  EMI System
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] text-slate-400 leading-tight">
                <span className="text-emerald-400 font-medium">Personal EMI</span>
                <span className="hidden sm:inline text-slate-600">•</span>
                <span className="hidden sm:inline text-slate-400">{formatDhakaDate(todayDhaka)}</span>
              </div>
            </div>
          </div>

          {/* Desktop Nav Links (Hidden on tablet/mobile < 1024px) */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-1.5">
            <button
              onClick={() => handleTabClick('dashboard')}
              className={`px-2.5 xl:px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5 xl:w-4 xl:h-4" />
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => handleTabClick('customers')}
              className={`px-2.5 xl:px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                activeTab === 'customers'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5 xl:w-4 xl:h-4" />
              <span>Customers</span>
            </button>

            <button
              onClick={() => handleTabClick('emi')}
              className={`px-2.5 xl:px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                activeTab === 'emi'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5 xl:w-4 xl:h-4" />
              <span>EMI Plans</span>
            </button>

            <button
              onClick={() => handleTabClick('calendar')}
              className={`px-2.5 xl:px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                activeTab === 'calendar'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Calendar className="w-3.5 h-3.5 xl:w-4 xl:h-4" />
              <span>Calendar</span>
            </button>

            <button
              onClick={() => handleTabClick('overdue')}
              className={`relative px-2.5 xl:px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                activeTab === 'overdue'
                  ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 xl:w-4 xl:h-4 text-red-400" />
              <span>Overdue</span>
              {overdueCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-red-600 text-[10px] font-bold text-white">
                  {overdueCount}
                </span>
              )}
            </button>

            <button
              onClick={() => handleTabClick('reports')}
              className={`px-2.5 xl:px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                activeTab === 'reports'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <FileBarChart className="w-3.5 h-3.5 xl:w-4 xl:h-4" />
              <span>Reports</span>
            </button>

            {isAdmin && (
              <button
                onClick={() => handleTabClick('users')}
                className={`px-2.5 xl:px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                  activeTab === 'users'
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5 xl:w-4 xl:h-4" />
                <span>Users</span>
              </button>
            )}

            <button
              onClick={() => handleTabClick('settings')}
              className={`px-2.5 xl:px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                activeTab === 'settings'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Settings className="w-3.5 h-3.5 xl:w-4 xl:h-4" />
              <span>Settings</span>
            </button>
          </nav>

          {/* Right Action Group */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {/* PWA Install Button on tablet/desktop */}
            <div className="hidden sm:block">
              <PWAInstallButton compact />
            </div>

            {/* Quick Add Button for Admin on Desktop */}
            {isAdmin && (
              <div className="hidden md:flex items-center gap-1.5">
                <button
                  onClick={onOpenAddEmi}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition cursor-pointer active:scale-95"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>+ Create EMI</span>
                </button>
              </div>
            )}

            {/* Notifications Bell */}
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

            {/* User Profile Badge (Desktop) */}
            <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-slate-800">
              <div className="flex items-center gap-2">
                {userProfile?.photoURL ? (
                  <img
                    src={userProfile.photoURL}
                    alt={userProfile.displayName}
                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-slate-700 object-cover"
                  />
                ) : (
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-emerald-700 flex items-center justify-center text-xs font-bold text-white">
                    {userProfile?.displayName?.[0]?.toUpperCase() || 'M'}
                  </div>
                )}
                <div className="hidden xl:flex flex-col text-left">
                  <span className="text-xs font-bold text-slate-200 truncate max-w-[110px]">
                    {userProfile?.displayName || 'Mehedi'}
                  </span>
                  <div className="flex items-center gap-1">
                    {isAdmin ? (
                      <span className="flex items-center gap-0.5 text-[9px] font-bold text-emerald-400">
                        <ShieldCheck className="w-3 h-3" /> ADMIN
                      </span>
                    ) : (
                      <span className="flex items-center gap-0.5 text-[9px] font-bold text-sky-400">
                        <Eye className="w-3 h-3" /> VIEWER
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <button
                onClick={logout}
                className="p-1.5 sm:p-2 rounded-xl text-slate-400 hover:text-red-400 hover:bg-slate-800 transition cursor-pointer"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>

            {/* Mobile menu toggle button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl text-slate-300 hover:bg-slate-800 hover:text-white transition cursor-pointer"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5 text-emerald-400" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu (Slide-out / Accordion for mobile screens) */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-800 bg-slate-900/98 backdrop-blur-xl px-4 py-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
          {/* User Info Header in Mobile Drawer */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              {userProfile?.photoURL ? (
                <img
                  src={userProfile.photoURL}
                  alt={userProfile.displayName}
                  className="w-9 h-9 rounded-full border border-slate-700 object-cover"
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-emerald-700 flex items-center justify-center text-sm font-bold text-white">
                  {userProfile?.displayName?.[0]?.toUpperCase() || 'M'}
                </div>
              )}
              <div className="flex flex-col text-left">
                <span className="text-xs font-bold text-slate-100">{userProfile?.displayName || 'Mehedi Hossain'}</span>
                <span className="text-[10px] font-semibold text-emerald-400">
                  {isAdmin ? 'Owner / Administrator' : 'Viewer'}
                </span>
              </div>
            </div>

            <button
              onClick={logout}
              className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-red-950/50 hover:text-red-400 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>

          {/* Admin Quick Action Buttons for Mobile */}
          {isAdmin && (
            <div className="grid grid-cols-2 gap-2 pb-2">
              <button
                onClick={() => {
                  onOpenAddEmi();
                  setMobileMenuOpen(false);
                }}
                className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>+ Create EMI</span>
              </button>
              <button
                onClick={() => {
                  onOpenAddCustomer();
                  setMobileMenuOpen(false);
                }}
                className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-bold text-xs flex items-center justify-center gap-1.5 border border-slate-700 cursor-pointer"
              >
                <Users className="w-3.5 h-3.5" />
                <span>+ Add Customer</span>
              </button>
            </div>
          )}

          {/* Mobile Full Navigation Grid */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              onClick={() => handleTabClick('dashboard')}
              className={`p-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => handleTabClick('customers')}
              className={`p-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer ${
                activeTab === 'customers'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Customers</span>
            </button>

            <button
              onClick={() => handleTabClick('emi')}
              className={`p-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer ${
                activeTab === 'emi'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <CreditCard className="w-4 h-4" />
              <span>EMI Accounts</span>
            </button>

            <button
              onClick={() => handleTabClick('calendar')}
              className={`p-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer ${
                activeTab === 'calendar'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Calendar</span>
            </button>

            <button
              onClick={() => handleTabClick('overdue')}
              className={`p-2.5 rounded-xl text-xs font-semibold flex items-center justify-between cursor-pointer ${
                activeTab === 'overdue'
                  ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                <span>Overdue</span>
              </div>
              {overdueCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-red-600 text-[10px] font-bold text-white">
                  {overdueCount}
                </span>
              )}
            </button>

            <button
              onClick={() => handleTabClick('reports')}
              className={`p-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer ${
                activeTab === 'reports'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <FileBarChart className="w-4 h-4" />
              <span>Reports</span>
            </button>

            {isAdmin && (
              <button
                onClick={() => handleTabClick('users')}
                className={`p-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer ${
                  activeTab === 'users'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <UserCheck className="w-4 h-4" />
                <span>User Approvals</span>
              </button>
            )}

            <button
              onClick={() => handleTabClick('settings')}
              className={`p-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer ${
                activeTab === 'settings'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

