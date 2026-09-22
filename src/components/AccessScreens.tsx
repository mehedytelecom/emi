import React, { useState } from 'react';
import { ShieldAlert, Clock, LogOut, RefreshCw, CheckCircle2, ShieldCheck, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { PWAInstallButton } from './PWAInstallButton';

export const LoginScreen: React.FC = () => {
  const { signInWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleLogin = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      await signInWithGoogle();
    } catch (err: unknown) {
      console.error(err);
      setErrorMsg('Failed to sign in with Google. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-linear-to-b from-slate-900 via-slate-950 to-slate-900 text-slate-100">
      {/* Top Bar with PWA install */}
      <header className="absolute top-4 right-4">
        <PWAInstallButton />
      </header>

      <main className="w-full max-w-md p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl backdrop-blur-xl text-center">
        {/* Brand Emblem */}
        <div className="mx-auto w-20 h-20 mb-6 rounded-3xl bg-linear-to-br from-emerald-500 to-teal-700 flex items-center justify-center shadow-lg shadow-emerald-500/20 ring-4 ring-slate-800">
          <span className="text-3xl font-extrabold text-white">৳</span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-1">
          MEHEDI TELECOM
        </h1>
        <p className="text-xs font-bold tracking-widest text-emerald-400 uppercase mb-4">
          Personal EMI Management
        </p>

        <p className="text-sm text-slate-400 mb-8 leading-relaxed">
          Customer installment tracking, automated overdue schedules, late fine calculators, and payment reminders.
        </p>

        {errorMsg && (
          <div className="mb-6 p-3.5 rounded-2xl bg-red-950/60 border border-red-800/80 text-xs font-medium text-red-300 flex items-center gap-2 text-left">
            <ShieldAlert className="w-4 h-4 shrink-0 text-red-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        <button
          id="google-signin-btn"
          onClick={handleLogin}
          disabled={loading}
          className="w-full py-3.5 px-6 rounded-2xl bg-white hover:bg-slate-100 active:scale-[0.98] text-slate-900 font-bold text-sm sm:text-base flex items-center justify-center gap-3 shadow-lg shadow-white/5 transition-all disabled:opacity-60 cursor-pointer"
        >
          {loading ? (
            <RefreshCw className="w-5 h-5 animate-spin text-slate-700" />
          ) : (
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
          )}
          <span>{loading ? 'Signing In...' : 'Sign in with Google'}</span>
        </button>

        <div className="mt-8 pt-6 border-t border-slate-800 text-xs text-slate-500 flex flex-col gap-2">
          <div className="flex items-center justify-center gap-2 text-slate-400">
            <Lock className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-semibold">Private & Restricted Access</span>
          </div>
          <p>
            Only authorized Gmail accounts approved by Mehedi Telecom administrator can access customer and financial records.
          </p>
        </div>
      </main>
    </div>
  );
};

export const AccessPendingScreen: React.FC = () => {
  const { userProfile, refreshProfile, logout } = useAuth();
  const [checking, setChecking] = useState(false);

  const handleRefresh = async () => {
    setChecking(true);
    await refreshProfile();
    setTimeout(() => setChecking(false), 500);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-linear-to-b from-slate-900 via-slate-950 to-slate-900 text-slate-100">
      <div className="w-full max-w-md p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl text-center">
        <div className="mx-auto w-16 h-16 mb-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
          <Clock className="w-8 h-8 animate-pulse" />
        </div>

        <h2 className="text-xl font-bold text-white mb-2">Access Request Pending</h2>
        <div className="p-4 my-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 text-sm text-slate-300 text-left">
          <p className="font-semibold text-white mb-1">Your access request has been submitted.</p>
          <p className="text-xs text-slate-400">Please wait for administrator approval.</p>
          <div className="mt-3 pt-3 border-t border-slate-700/50 flex flex-col gap-1 text-xs">
            <span className="text-slate-400">Registered Email:</span>
            <span className="font-mono text-emerald-400 break-all">{userProfile?.email}</span>
          </div>
        </div>

        <p className="text-xs text-slate-400 mb-6">
          Once the Administrator verifies your Gmail, your access will be activated automatically.
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleRefresh}
            disabled={checking}
            className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-sm transition active:scale-95 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${checking ? 'animate-spin' : ''}`} />
            <span>Check Approval</span>
          </button>
          <button
            onClick={logout}
            className="py-3 px-4 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 font-semibold text-xs flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export const AccessDeniedScreen: React.FC = () => {
  const { userProfile, logout } = useAuth();
  const isRejected = userProfile?.status === 'REJECTED';

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-linear-to-b from-slate-900 via-slate-950 to-slate-900 text-slate-100">
      <div className="w-full max-w-md p-6 sm:p-8 rounded-3xl bg-slate-900 border border-red-900/40 shadow-2xl text-center">
        <div className="mx-auto w-16 h-16 mb-5 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <h2 className="text-xl font-bold text-white mb-2">
          {isRejected ? 'Access Request Rejected' : 'Account Disabled'}
        </h2>
        <p className="text-sm text-slate-300 mb-4 leading-relaxed">
          {isRejected
            ? 'Your request for access has been rejected by the administrator.'
            : 'Your account has been temporarily disabled by the administrator.'}
        </p>

        <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60 text-xs text-slate-400 mb-6 text-left">
          <span className="block font-medium text-slate-300 mb-0.5">Account:</span>
          <span className="font-mono text-red-300 break-all">{userProfile?.email}</span>
        </div>

        <button
          onClick={logout}
          className="w-full py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
};

export const PendingApprovalScreen = AccessPendingScreen;

export const LoadingScreen: React.FC = () => {
  const [showFallback, setShowFallback] = useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => setShowFallback(true), 2500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-slate-950 text-slate-100">
      <div className="w-16 h-16 rounded-3xl bg-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 mb-4 animate-bounce">
        <span className="text-3xl font-extrabold text-white">৳</span>
      </div>
      <h2 className="text-lg font-bold text-white tracking-tight">Mehedi Telecom EMI</h2>
      <p className="text-xs text-slate-400 mt-1 flex items-center gap-2">
        <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-500" />
        <span>Loading secure workspace...</span>
      </p>

      {showFallback && (
        <button
          onClick={() => window.location.reload()}
          className="mt-6 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-2 transition cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Reload If Taking Too Long</span>
        </button>
      )}
    </div>
  );
};
