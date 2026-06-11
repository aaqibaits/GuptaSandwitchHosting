/**
 * AdminTabNavigator.tsx
 * ─────────────────────
 * Bottom tab bar (5 admin tabs) with a custom top header that matches the web AdminTopbar.
 *
 * Top header shows:
 *   Left  → 🥪 Gupta Sandwich  |  <Page title>
 *   Right → Role pill  ·  Avatar  ·  Logout button
 *
 * Bottom tabs: Dashboard · Dishes · Reports · Accounting · Outlets
 * Tab bar: Dark (#1A1208) background, gold active tint
 */

import React from 'react';
import { Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { FontSize, FontWeight } from '../constants/typography';

import DashboardScreen  from '../screens/admin/DashboardScreen';
import DishesScreen     from '../screens/admin/DishesScreen';
import ReportsScreen    from '../screens/admin/ReportsScreen';
import AccountingScreen from '../screens/admin/AccountingScreen';
import OutletsScreen    from '../screens/admin/OutletsScreen';
import AdminTopBar      from '../components/admin/AdminTopBar';
import { AdminTabParamList } from '../types';

const Tab = createBottomTabNavigator<AdminTabParamList>();

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

const TAB_ICONS: Record<string, { active: IoniconName; inactive: IoniconName }> = {
  Dashboard:  { active: 'grid',        inactive: 'grid-outline' },
  Dishes:     { active: 'restaurant',  inactive: 'restaurant-outline' },
  Reports:    { active: 'bar-chart',   inactive: 'bar-chart-outline' },
  Accounting: { active: 'calculator',  inactive: 'calculator-outline' },
  Outlets:    { active: 'storefront',  inactive: 'storefront-outline' },
};

interface AdminTabNavigatorProps {
  userEmail?: string;
  userRole?: string;
  onLogout?: () => void;
}

export default function AdminTabNavigator({
  userEmail,
  userRole,
  onLogout,
}: AdminTabNavigatorProps) {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        // ── Custom top header matching the web AdminTopbar ──────────────
        headerShown: true,
        header: () => (
          <AdminTopBar
            title={route.name}
            userEmail={userEmail}
            userRole={userRole}
            onLogout={onLogout}
          />
        ),

        // ── Bottom tab bar ──────────────────────────────────────────────
        tabBarIcon: ({ focused, color, size }) => {
          const icons = TAB_ICONS[route.name];
          const name = focused ? icons.active : icons.inactive;
          return <Ionicons name={name} size={size} color={color} />;
        },
        tabBarActiveTintColor: Colors.gold,
        tabBarInactiveTintColor: 'rgba(255,255,255,0.4)',
        tabBarStyle: {
          backgroundColor: Colors.dark,
          borderTopWidth: 0,
          height: Platform.OS === 'ios' ? 84 : 64,
          paddingBottom: Platform.OS === 'ios' ? 24 : 10,
          paddingTop: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.25,
          shadowRadius: 12,
          elevation: 16,
        },
        tabBarLabelStyle: {
          fontSize: FontSize.xs,
          fontWeight: FontWeight.semibold,
          marginTop: 2,
        },
      })}
    >
      <Tab.Screen name="Dashboard"  component={DashboardScreen}  />
      <Tab.Screen name="Dishes"     component={DishesScreen}     />
      <Tab.Screen name="Reports"    component={ReportsScreen}    />
      <Tab.Screen name="Accounting" component={AccountingScreen} />
      <Tab.Screen name="Outlets"    component={OutletsScreen}    />
    </Tab.Navigator>
  );
}
