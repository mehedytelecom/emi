import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <aside
      aria-label="Network Status"
      className="fixed bottom-20 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 z-50 flex items-center justify-between gap-3 rounded-2xl bg-amber-600 px-4 py-2.5 text-xs font-semibold text-white shadow-xl shadow-amber-900/20 backdrop-blur-md animate-pulse"
    >
      <div className="flex items-center gap-2">
        <WifiOff className="w-4 h-4 text-white shrink-0" />
        <span>Offline Mode — Cached data is being shown. Reconnect to sync.</span>
      </div>
    </aside>
  );
};
