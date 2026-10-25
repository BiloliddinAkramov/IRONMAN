import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../../lib/pwa/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-xl bg-amber-500/95 backdrop-blur-md px-3.5 py-2 text-xs font-semibold text-white shadow-xl border border-amber-400/40">
      <WifiOff className="w-3.5 h-3.5 animate-pulse" />
      <span>Oflayn rejim — ma'lumotlar lokal xotirada saqlanadi</span>
    </div>
  );
};
