/**
 * components/common/OfflineBanner.tsx
 * ────────────────────────────────────
 * Ek chhota banner jo screen ke top pe dikhta hai jab:
 *   - Offline ho → Red banner "🔴 Offline — X orders pending sync"
 *   - Syncing ho → Blue banner "🔄 Syncing X orders..."
 *   - Online aaya → Green flash "✅ Back online! Orders synced"
 *
 * Usage:
 *   <OfflineBanner />
 *   (Kisi bhi screen mein lagao — automatically hide/show hoga)
 */

import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, Animated, TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useOffline } from '../../context/OfflineContext';

export default function OfflineBanner() {
  const { isOnline, isChecking, pendingCount, lastSyncLabel, syncNow } = useOffline();

  const slideAnim = useRef(new Animated.Value(-60)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  // Offline hone pe banner slide in karo, online hone pe slide out
  const shouldShow = !isChecking && (!isOnline || pendingCount > 0);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: shouldShow ? 0 : -60,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: shouldShow ? 1 : 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, [shouldShow, slideAnim, opacityAnim]);

  if (isChecking) return null;

  // Colors based on state
  const isOfflineMode = !isOnline;
  const bannerBg    = isOfflineMode ? '#B91C1C' : '#1D4ED8'; // red ya blue
  const bannerIcon  = isOfflineMode ? 'cloud-offline-outline' : 'sync-outline';
  const bannerText  = isOfflineMode
    ? pendingCount > 0
      ? `Offline Mode — ${pendingCount} order${pendingCount > 1 ? 's' : ''} pending sync`
      : 'Offline Mode — No internet'
    : `${pendingCount} order${pendingCount > 1 ? 's' : ''} pending sync`;

  if (!shouldShow) return null;

  return (
    <Animated.View
      style={[
        styles.banner,
        { backgroundColor: bannerBg, transform: [{ translateY: slideAnim }], opacity: opacityAnim },
      ]}
    >
      <View style={styles.left}>
        <Ionicons
          name={bannerIcon as any}
          size={14}
          color="#fff"
          style={styles.icon}
        />
        <Text style={styles.text} numberOfLines={1}>
          {bannerText}
        </Text>
      </View>

      {/* Agar online hai aur pending orders hain to sync button dikhao */}
      {isOnline && pendingCount > 0 && (
        <TouchableOpacity onPress={syncNow} style={styles.syncBtn} activeOpacity={0.8}>
          <Text style={styles.syncBtnText}>Sync Now</Text>
        </TouchableOpacity>
      )}

      {/* Last sync info */}
      {isOfflineMode && (
        <Text style={styles.syncTime}>{lastSyncLabel}</Text>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 7,
    width: '100%',
    zIndex: 999,
  },
  left: {
    flexDirection: 'row',
    alignItems:    'center',
    flex: 1,
  },
  icon: {
    marginRight: 6,
  },
  text: {
    color:      '#fff',
    fontSize:   12,
    fontWeight: '600',
    flex: 1,
  },
  syncBtn: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    marginLeft: 8,
  },
  syncBtnText: {
    color:      '#fff',
    fontSize:   11,
    fontWeight: '700',
  },
  syncTime: {
    color:    'rgba(255,255,255,0.75)',
    fontSize: 10,
    marginLeft: 6,
  },
});
