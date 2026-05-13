import React, { createContext, useContext, useState, useEffect } from 'react';
import { client } from '../apollo-client';

interface NetworkContextType {
  isOnline: boolean;
  lastSyncedAt: Date | null;
}

const NetworkContext = createContext<NetworkContextType>({
  isOnline: navigator.onLine,
  lastSyncedAt: null,
});

export const NetworkProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(
    navigator.onLine ? new Date() : null
  );

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
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
  }, []);

  return (
    <NetworkContext.Provider value={{ isOnline, lastSyncedAt }}>
      {children}
    </NetworkContext.Provider>
  );
};

export const useNetwork = (): NetworkContextType => useContext(NetworkContext);
