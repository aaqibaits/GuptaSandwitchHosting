/**
 * services/offlineStorage.ts
 * ──────────────────────────
 * AsyncStorage wrapper for persisting:
 *   - Auth session (user + token) → auto-login without internet
 *   - KOT counter → unique KOT numbers offline mein bhi
 *   - Menu cache timestamp → last sync time track karna
 *   - Last sync info → UI mein "Last synced X mins ago" dikhana
 *
 * Usage:
 *   await saveAuthSession(user)      → login ke baad call karo
 *   await loadAuthSession()          → app start pe call karo
 *   await clearAuthSession()         → logout ke waqt call karo
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthUser } from '../../App';

// ── Storage Keys ─────────────────────────────────────────────────────────────
const KEYS = {
  AUTH_USER:        '@gupta_auth_user',
  AUTH_TOKEN:       '@gupta_auth_token',
  KOT_COUNTER:      '@gupta_kot_counter',
  MENU_TIMESTAMP:   '@gupta_menu_timestamp',
  LAST_SYNC_TIME:   '@gupta_last_sync_time',
  PENDING_SYNC_COUNT: '@gupta_pending_sync_count',
} as const;

// ── Auth Session ─────────────────────────────────────────────────────────────

/**
 * Login success ke baad user ka poora data AsyncStorage mein save karo.
 * Is se aage offline bhi auto-login ho sakta hai.
 */
export async function saveAuthSession(user: AuthUser): Promise<void> {
  try {
    await AsyncStorage.multiSet([
      [KEYS.AUTH_USER,  JSON.stringify(user)],
      [KEYS.AUTH_TOKEN, user.token],
    ]);
    console.log('✅ Auth session saved for offline use');
  } catch (error) {
    console.error('❌ Failed to save auth session:', error);
  }
}

/**
 * App start hone pe check karo koi saved session hai kya.
 * Returns null if no session found (first time install).
 */
export async function loadAuthSession(): Promise<AuthUser | null> {
  try {
    const userJson = await AsyncStorage.getItem(KEYS.AUTH_USER);
    if (!userJson) return null;

    const user: AuthUser = JSON.parse(userJson);
    console.log(`✅ Offline session loaded: ${user.email} (${user.role})`);
    return user;
  } catch (error) {
    console.error('❌ Failed to load auth session:', error);
    return null;
  }
}

/**
 * Logout ke waqt AsyncStorage se session clear karo.
 */
export async function clearAuthSession(): Promise<void> {
  try {
    await AsyncStorage.multiRemove([
      KEYS.AUTH_USER,
      KEYS.AUTH_TOKEN,
    ]);
    console.log('✅ Auth session cleared');
  } catch (error) {
    console.error('❌ Failed to clear auth session:', error);
  }
}

/**
 * Saved token lo (API calls ke liye).
 */
export async function getSavedToken(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(KEYS.AUTH_TOKEN);
  } catch {
    return null;
  }
}

// ── KOT Counter ──────────────────────────────────────────────────────────────

/**
 * Offline KOT number generate karo (unique, persistent across app restarts).
 * Returns: 'K001', 'K002', ... format
 */
export async function getNextKotNumber(): Promise<string> {
  try {
    const stored = await AsyncStorage.getItem(KEYS.KOT_COUNTER);
    const current = stored ? parseInt(stored, 10) : 0;
    const next = current + 1;

    await AsyncStorage.setItem(KEYS.KOT_COUNTER, String(next));
    return `K${String(next).padStart(3, '0')}`;
  } catch (error) {
    console.error('❌ Failed to get KOT counter:', error);
    // Fallback: timestamp-based KOT
    return `K${Date.now().toString().slice(-6)}`;
  }
}

/**
 * KOT counter reset karo (optional, admin use ke liye).
 */
export async function resetKotCounter(): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS.KOT_COUNTER, '0');
  } catch (error) {
    console.error('❌ Failed to reset KOT counter:', error);
  }
}

// ── Menu Cache Timestamp ──────────────────────────────────────────────────────

/**
 * Menu cache hone ka time save karo.
 */
export async function saveMenuTimestamp(): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS.MENU_TIMESTAMP, new Date().toISOString());
  } catch (error) {
    console.error('❌ Failed to save menu timestamp:', error);
  }
}

/**
 * Menu kitne time pehle cache hua tha.
 * Returns null if never cached.
 */
export async function getMenuTimestamp(): Promise<Date | null> {
  try {
    const ts = await AsyncStorage.getItem(KEYS.MENU_TIMESTAMP);
    return ts ? new Date(ts) : null;
  } catch {
    return null;
  }
}

// ── Sync Info ─────────────────────────────────────────────────────────────────

/**
 * Last successful sync time save karo.
 */
export async function saveLastSyncTime(): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS.LAST_SYNC_TIME, new Date().toISOString());
  } catch (error) {
    console.error('❌ Failed to save sync time:', error);
  }
}

/**
 * Last sync time lo for UI display.
 */
export async function getLastSyncTime(): Promise<Date | null> {
  try {
    const ts = await AsyncStorage.getItem(KEYS.LAST_SYNC_TIME);
    return ts ? new Date(ts) : null;
  } catch {
    return null;
  }
}

/**
 * Human-readable last sync string, jaise "2 mins ago" ya "Never".
 */
export async function getLastSyncLabel(): Promise<string> {
  const lastSync = await getLastSyncTime();
  if (!lastSync) return 'Never synced';

  const diffMs = Date.now() - lastSync.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);

  if (diffMins < 1)   return 'Just now';
  if (diffMins < 60)  return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return 'Over a day ago';
}
