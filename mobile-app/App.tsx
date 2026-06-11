/**
 * App.tsx
 * ───────
 * Root entry point. Auth gate → role-based navigator.
 *
 * Flow:
 *  1. App starts → shows LoginScreen
 *  2. Admin login   → AdminTabNavigator  (gold accent, 5 admin tabs)
 *  3. Staff login   → StaffTabNavigator  (green accent, 5 staff tabs)
 *  4. User logs out via TopBar → back to LoginScreen, token cleared
 */

import React, { useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';

import LoginScreen        from './src/screens/auth/LoginScreen';
import AdminTabNavigator  from './src/navigation/AdminTabNavigator';
import StaffTabNavigator  from './src/navigation/StaffTabNavigator';
import { setToken }       from './src/services/api';
import { logout as apiLogout } from './src/services/authApi';

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

  const handleLogin = (user: AuthUser) => {
    setToken(user.token);
    setCurrentUser(user);
  };

  const handleLogout = async () => {
    try {
      await apiLogout();
    } catch {
      // Ignore server errors on logout — always clear local state
    } finally {
      setToken(null);
      setCurrentUser(null);
    }
  };

  return (
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
  );
}
