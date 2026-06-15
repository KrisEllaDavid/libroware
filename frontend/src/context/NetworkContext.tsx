import React, { createContext, useContext, useState, useEffect } from 'react';
import { client } from '../apollo-client';
import { useToast } from './ToastContext';
import { drainQueue } from '../offline/replayQueue';
import { useQueuedMutations } from '../offline/useQueuedMutations';

interface NetworkContextType {
  isOnline: boolean;
  lastSyncedAt: Date | null;
  pendingCount: number;
  isSyncing: boolean;
}

const NetworkContext = createContext<NetworkContextType>({
  isOnline: navigator.onLine,
  lastSyncedAt: null,
  pendingCount: 0,
  isSyncing: false,
});

export const NetworkProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(
    navigator.onLine ? new Date() : null
  );
  const [isSyncing, setIsSyncing] = useState(false);
  const { addToast } = useToast();
  const pendingCount = useQueuedMutations().length;

  useEffect(() => {
    const handleOnline = async () => {
      setIsOnline(true);

      // Replay any mutations queued while offline before refetching, so the
      // refetch below reflects the server state after those actions land.
      setIsSyncing(true);
      try {
        await drainQueue(client, addToast);
      } finally {
        setIsSyncing(false);
      }

      // Refetch all active queries to sync fresh data as soon as connectivity returns.
      // apollo3-cache-persist automatically saves the updated cache after each write.
      client.reFetchObservableQueries()
        .then(() => setLastSyncedAt(new Date()))
        .catch(() => {});
    };

    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [addToast]);

  return (
    <NetworkContext.Provider value={{ isOnline, lastSyncedAt, pendingCount, isSyncing }}>
      {children}
    </NetworkContext.Provider>
  );
};

export const useNetwork = (): NetworkContextType => useContext(NetworkContext);
