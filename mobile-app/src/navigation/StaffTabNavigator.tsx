/**
 * StaffTabNavigator.tsx
 * ─────────────────────
 * Bottom tab bar for the Staff Panel.
 * Dynamically renders only the tabs the logged-in staff user is
 * permitted to access (based on their role's screen permissions).
 *
 * Permission keys (from backend):
 *   pos         → POS tab
 *   kot         → KOT tab
 *   live-orders → LiveOrders tab
 *   reports     → Reports tab
 *
 * If no permissions are supplied (e.g. old accounts), all tabs are shown
 * as a safe fallback.
 *
 * Theme: green active tint, deep-navy tab bar.
 * Wraps all screens with StaffOrderProvider for shared KOT state.
 */

import React from 'react';
import { Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { FontWeight } from '../constants/typography';

import PosScreen        from '../screens/staff/PosScreen';
import KotScreen        from '../screens/staff/KotScreen';
import LiveOrdersScreen from '../screens/staff/LiveOrdersScreen';
import ReportsScreen    from '../screens/staff/ReportsScreen';
import StaffMenuScreen  from '../screens/staff/StaffMenuScreen';
import StaffTopBar      from '../components/staff/StaffTopBar';
import { StaffOrderProvider } from '../context/StaffOrderContext';
import { StaffTabParamList } from '../types';

const Tab = createBottomTabNavigator<StaffTabParamList>();
type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

// ── Tab definitions with backend permission key mapping ────────────────────
type TabDef = {
  name: keyof StaffTabParamList;
  permissionKey: string;          // matches backend permissions.staff[] value
  active: IoniconName;
  inactive: IoniconName;
  label: string;
  component: React.ComponentType<any>;
};

const ALL_TABS: TabDef[] = [
  { name: 'POS',        permissionKey: 'pos',         active: 'cart',       inactive: 'cart-outline',       label: 'POS',     component: PosScreen        },
  { name: 'KOT',        permissionKey: 'kot',         active: 'restaurant', inactive: 'restaurant-outline', label: 'KOT',     component: KotScreen        },
  { name: 'LiveOrders', permissionKey: 'live-orders', active: 'flash',      inactive: 'flash-outline',      label: 'Live',    component: LiveOrdersScreen },
  { name: 'Reports',    permissionKey: 'reports',     active: 'bar-chart',  inactive: 'bar-chart-outline',  label: 'Reports', component: ReportsScreen    },
  { name: 'Menu',       permissionKey: 'menu',        active: 'grid',       inactive: 'grid-outline',       label: 'Menu',    component: StaffMenuScreen  },
];

const STAFF_GREEN = '#22C55E';

interface Props {
  userEmail?: string;
  outletName?: string;
  outletId?: number;
  onLogout?: () => void;
  permissions?: { admin: string[]; staff: string[] };
}

export default function StaffTabNavigator({ userEmail, outletName, outletId, onLogout, permissions }: Props) {
  // Filter tabs based on backend permissions.
  // If permissions.staff has entries, only show allowed tabs.
  // If permissions are missing or empty, fall back to showing ALL tabs.
  const staffPerms = permissions?.staff ?? [];

  const visibleTabs = staffPerms.length > 0
    ? ALL_TABS.filter(tab => staffPerms.includes(tab.permissionKey))
    : ALL_TABS;

  // Safety: if somehow all tabs are filtered out, show all (avoid blank screen)
  const tabs = visibleTabs.length > 0 ? visibleTabs : ALL_TABS;


  return (
    <StaffOrderProvider outletId={outletId}>
      <Tab.Navigator
        screenOptions={({ route }) => {
          const cfg = tabs.find(t => t.name === route.name)
            ?? { active: 'ellipse' as IoniconName, inactive: 'ellipse-outline' as IoniconName, label: route.name };
          return {
            // Header
            headerShown: true,
            header: () => (
              <StaffTopBar title={cfg.label} userEmail={userEmail} outletName={outletName} onLogout={onLogout} />
            ),

            // Icon
            tabBarIcon: ({ focused, color, size }) => (
              <Ionicons name={focused ? cfg.active : cfg.inactive} size={size} color={color} />
            ),
            tabBarLabel: cfg.label,

            // Style
            tabBarActiveTintColor: STAFF_GREEN,
            tabBarInactiveTintColor: 'rgba(255,255,255,0.45)',
            tabBarStyle: {
              backgroundColor: '#0F172A',
              borderTopWidth: 0,
              height: Platform.OS === 'ios' ? 84 : 62,
              paddingBottom: Platform.OS === 'ios' ? 24 : 8,
              paddingTop: 6,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: -4 },
              shadowOpacity: 0.3,
              shadowRadius: 12,
              elevation: 16,
            },
            tabBarLabelStyle: {
              fontSize: 10,
              fontWeight: FontWeight.bold,
              marginTop: 1,
            },
          };
        }}
      >
        {tabs.map(tab => (
          <Tab.Screen
            key={tab.name}
            name={tab.name}
            component={tab.component}
          />
        ))}
      </Tab.Navigator>
    </StaffOrderProvider>
  );
}

