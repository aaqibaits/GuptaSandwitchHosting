/**
 * hooks/useNetworkStatus.ts
 * ─────────────────────────
 * Real-time network status tracker using @react-native-community/netinfo.
 *
 * Usage:
 *   const { isOnline, isChecking } = useNetworkStatus();
 *
 * Returns:
 *   isOnline   — true agar internet available hai
 *   isChecking — true sirf pehli baar check karte waqt
 */

import { useState, useEffect } from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

interface NetworkStatus {
  isOnline: boolean;
  isChecking: boolean;
}

export function useNetworkStatus(): NetworkStatus {
  const [isOnline, setIsOnline]     = useState<boolean>(true);
  const [isChecking, setIsChecking] = useState<boolean>(true);

  useEffect(() => {
    // Pehli baar current status check karo
    NetInfo.fetch().then((state: NetInfoState) => {
      setIsOnline(state.isConnected === true && state.isInternetReachable !== false);
      setIsChecking(false);
    });

    // Phir real-time changes sunne ke liye subscribe karo
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      const online = state.isConnected === true && state.isInternetReachable !== false;
      setIsOnline(online);
      setIsChecking(false);
    });

    return () => unsubscribe();
  }, []);

  return { isOnline, isChecking };
}
