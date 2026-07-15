/**
 * context/OfflineContext.tsx
 * ──────────────────────────
 * App-wide offline state provider.
 * Wrap App.tsx mein lagao — har screen ko isOnline, pendingCount milega.
 *
 * Provides:
 *   isOnline        — kya internet available hai
 *   isChecking      — pehli baar check ho raha hai
 *   pendingCount    — kitne orders sync hone baaki hain
 *   lastSyncLabel   — "2 mins ago" ya "Never synced"
 *   syncNow()       — manually sync trigger karo
 *   refreshPending() — pending count update karo
 */

import React, {
  createContext, useContext, useState, useEffect,
  useCallback, ReactNode,
} from 'react';
import NetInfo from '@react-native-community/netinfo';
import { getPendingOrdersCount } from '../services/offlineDB';
import { runSync } from '../services/syncEngine';
import { getLastSyncLabel, getSavedToken } from '../services/offlineStorage';

// ── Context Shape ─────────────────────────────────────────────────────────────

interface OfflineContextValue {
  isOnline:        boolean;
  isChecking:      boolean;
  pendingCount:    number;
  lastSyncLabel:   string;
  syncNow:         () => Promise<void>;
  refreshPending:  () => void;
}

// ── Context Create ─────────────────────────────────────────────────────────────

const OfflineContext = createContext<OfflineContextValue>({
  isOnline:       true,
  isChecking:     true,
  pendingCount:   0,
  lastSyncLabel:  'Never synced',
  syncNow:        async () => {},
  refreshPending: () => {},
});

export function useOffline(): OfflineContextValue {
  return useContext(OfflineContext);
}

// ── Provider ──────────────────────────────────────────────────────────────────

export function OfflineProvider({ children }: { children: ReactNode }) {
  const [isOnline,      setIsOnline]      = useState<boolean>(true);
  const [isChecking,    setIsChecking]    = useState<boolean>(true);
  const [pendingCount,  setPendingCount]  = useState<number>(0);
  const [lastSyncLabel, setLastSyncLabel] = useState<string>('Never synced');

  // Pending count refresh karo
  const refreshPending = useCallback(() => {
    const count = getPendingOrdersCount();
    setPendingCount(count);
  }, []);

  // Sync label refresh karo
  const refreshSyncLabel = useCallback(async () => {
    const label = await getLastSyncLabel();
    setLastSyncLabel(label);
  }, []);

  // Manual sync trigger
  const syncNow = useCallback(async () => {
    if (!isOnline) return;
    const token = await getSavedToken();
    await runSync(token);
    refreshPending();
    await refreshSyncLabel();
  }, [isOnline, refreshPending, refreshSyncLabel]);

  // Network status listen karo
  useEffect(() => {
    // Pehli baar check karo
    NetInfo.fetch().then(state => {
      const online = state.isConnected === true && state.isInternetReachable !== false;
      setIsOnline(online);
      setIsChecking(false);
    });

    // Real-time changes
    const unsubscribe = NetInfo.addEventListener(async state => {
      const online = state.isConnected === true && state.isInternetReachable !== false;
      const wasOffline = !isOnline;

      setIsOnline(online);
      setIsChecking(false);

      // Internet wapas aaya! → Auto sync karo
      if (online && wasOffline) {
        console.log('🌐 Network restored — starting auto sync...');
        const token = await getSavedToken();
        const result = await runSync(token);
        if (result.synced > 0) {
          console.log(`✅ Auto sync complete: ${result.synced} orders synced`);
        }
        refreshPending();
        await refreshSyncLabel();
      }
    });

    return () => unsubscribe();
  }, [isOnline, refreshPending, refreshSyncLabel]);

  // App start pe initial values set karo
  useEffect(() => {
    refreshPending();
    refreshSyncLabel();
  }, [refreshPending, refreshSyncLabel]);

  // Har 30 second pe pending count refresh karo
  useEffect(() => {
    const interval = setInterval(() => {
      refreshPending();
      refreshSyncLabel();
    }, 30_000);
    return () => clearInterval(interval);
  }, [refreshPending, refreshSyncLabel]);

  return (
    <OfflineContext.Provider value={{
      isOnline,
      isChecking,
      pendingCount,
      lastSyncLabel,
      syncNow,
      refreshPending,
    }}>
      {children}
    </OfflineContext.Provider>
  );
}
