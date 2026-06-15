import React from 'react';
import { useNetwork } from '../../context/NetworkContext';

const formatLastSynced = (date: Date): string => {
  const minutes = Math.floor((Date.now() - date.getTime()) / 60000);
  if (minutes < 1) return 'just now';
  if (minutes === 1) return '1 minute ago';
  return `${minutes} minutes ago`;
};

const OfflineBanner: React.FC = () => {
  const { isOnline, lastSyncedAt, pendingCount, isSyncing } = useNetwork();

  if (isOnline && !isSyncing) return null;

  if (isOnline) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-blue-500 dark:bg-blue-600 text-white text-sm py-2 px-4 flex items-center justify-center gap-2 shadow-lg">
        <span className="w-2 h-2 rounded-full bg-white opacity-80 animate-pulse shrink-0" />
        <span>
          Syncing {pendingCount} action{pendingCount === 1 ? '' : 's'}...
        </span>
      </div>
    );
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-amber-500 dark:bg-amber-600 text-white text-sm py-2 px-4 flex items-center justify-center gap-2 shadow-lg">
      <span className="w-2 h-2 rounded-full bg-white opacity-80 animate-pulse shrink-0" />
      <span>
        You're offline — showing cached data
        {lastSyncedAt && (
          <span className="opacity-75 ml-1 text-xs">
            · Last synced {formatLastSynced(lastSyncedAt)}
          </span>
        )}
        {pendingCount > 0 && (
          <span className="opacity-75 ml-1 text-xs">
            · {pendingCount} action{pendingCount === 1 ? '' : 's'} waiting to sync
          </span>
        )}
      </span>
    </div>
  );
};

export default OfflineBanner;
