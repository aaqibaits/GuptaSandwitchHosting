/**
 * App.tsx
 * ───────
 * Root entry point. Auth gate → role-based navigator.
 *
 * Flow (OFFLINE-FIRST):
 *  1. App starts → SQLite DB initialize karo
 *  2. AsyncStorage check karo → saved session hai? → auto-login (no internet needed!)
 *  3. Session nahi? → LoginScreen dikhao
 *  4. Admin login   → AdminTabNavigator  (gold accent, 5 admin tabs)
 *  5. Staff login   → StaffTabNavigator  (green accent, 5 staff tabs)
 *  6. User logs out via TopBar → back to LoginScreen, token cleared
 *  7. Internet wapas aaya → OfflineContext auto-sync karta hai
 */

import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';

import LoginScreen        from './src/screens/auth/LoginScreen';
import AdminTabNavigator  from './src/navigation/AdminTabNavigator';
import StaffTabNavigator  from './src/navigation/StaffTabNavigator';
import { setToken }       from './src/services/api';
import { logout as apiLogout } from './src/services/authApi';
import { initDatabase }   from './src/services/offlineDB';
import { loadAuthSession, clearAuthSession, saveAuthSession } from './src/services/offlineStorage';
import { OfflineProvider } from './src/context/OfflineContext';

export interface AuthUser {
  email: string;
  name: string;
  role: 'Admin' | 'Staff';
  token: string;
  outletName?: string;
  outletId?: number;
  permissions?: { admin: string[]; staff: string[] };
}

export default function App() {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true); // splash screen jaisa

  // ── App start pe run karo ──────────────────────────────────────────────
  useEffect(() => {
    async function bootstrap() {
      try {
        // Step 1: SQLite tables banao (ek baar)
        initDatabase();

        // Step 2: Kya pehle se koi logged-in user hai phone mein?
        const savedUser = await loadAuthSession();
        if (savedUser) {
          // Auto-login! No internet needed.
          setToken(savedUser.token);
          setCurrentUser(savedUser);
          console.log(`🚀 Auto-login: ${savedUser.email} (offline session restored)`);
        }
      } catch (error) {
        console.error('Bootstrap error:', error);
      } finally {
        setIsBootstrapping(false);
      }
    }

    bootstrap();
  }, []);

  // ── Login handler ──────────────────────────────────────────────────────
  const handleLogin = async (user: AuthUser) => {
    setToken(user.token);
    setCurrentUser(user);
    // Phone mein save karo → agle baar offline login ke liye
    await saveAuthSession(user);
  };

  // ── Logout handler ─────────────────────────────────────────────────────
  const handleLogout = async () => {
    try {
      await apiLogout();
    } catch {
      // Ignore server errors on logout — always clear local state
    } finally {
      setToken(null);
      setCurrentUser(null);
      // AsyncStorage se bhi clear karo
      await clearAuthSession();
    }
  };

  // ── Bootstrapping splash (sirf 1-2 seconds) ───────────────────────────
  if (isBootstrapping) {
    return (
      <View style={styles.splash}>
        <ActivityIndicator size="large" color="#C0392B" />
      </View>
    );
  }

  // ── Main App ────────────────────────────────────────────────────────────
  return (
    <OfflineProvider>
      <SafeAreaProvider>
        {!currentUser ? (
          <LoginScreen onLogin={handleLogin} />
        ) : (
          <NavigationContainer>
            {currentUser.role === 'Admin' ? (
              <AdminTabNavigator
                userEmail={currentUser.email}
                userRole={currentUser.role}
                onLogout={handleLogout}
              />
            ) : (
              <StaffTabNavigator
                userEmail={currentUser.email}
                outletName={currentUser.outletName}
                outletId={currentUser.outletId}
                onLogout={handleLogout}
                permissions={currentUser.permissions}
              />
            )}
          </NavigationContainer>
        )}
      </SafeAreaProvider>
    </OfflineProvider>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: '#F5F0E8',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
