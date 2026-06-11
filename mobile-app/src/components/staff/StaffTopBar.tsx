/**
 * StaffTopBar.tsx
 * ───────────────
 * Top header bar for the Staff Panel.
 * Green accent palette to visually distinguish from the Admin gold bar.
 *
 * Left  : 🥪 brand · page title
 * Right : "Staff" role pill (green) · avatar → dropdown with logout
 */

import React, { useState, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Modal, Pressable, Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { FontSize, FontWeight } from '../../constants/typography';

interface StaffTopBarProps {
  title: string;
  userEmail?: string;
  outletName?: string;
  onLogout?: () => void;
}

const STAFF_GREEN = '#16A34A';
const STAFF_GREEN_LIGHT = '#DCFCE7';

export default function StaffTopBar({
  title,
  userEmail = 'staff@guptasandwich.com',
  outletName,
  onLogout,
}: StaffTopBarProps) {
  const insets = useSafeAreaInsets();
  const initial = userEmail.charAt(0).toUpperCase();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  const openDropdown = () => {
    setDropdownOpen(true);
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, damping: 15 }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 180, useNativeDriver: true }),
    ]).start();
  };

  const closeDropdown = (cb?: () => void) => {
    Animated.parallel([
      Animated.timing(scaleAnim, { toValue: 0.9, duration: 140, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 0, duration: 140, useNativeDriver: true }),
    ]).start(() => {
      setDropdownOpen(false);
      scaleAnim.setValue(0.85);
      cb?.();
    });
  };

  const handleLogout = () => closeDropdown(onLogout);

  return (
    <>
      {/* ── Top bar ─────────────────────────────────────────────────────── */}
      <View style={[styles.bar, { paddingTop: insets.top + 10 }]}>

        {/* Left: brand */}
        <View style={styles.left}>
          <View style={styles.brandRow}>
            <Ionicons name="fast-food" size={14} color={STAFF_GREEN} style={{ marginRight: 5 }} />
            <Text style={styles.brand}>Gupta Sandwich</Text>
          </View>
          <Text style={styles.pageTitle} numberOfLines={1}>{title}</Text>
        </View>

        {/* Right: role pill + avatar */}
        <View style={styles.right}>
          <View style={styles.rolePill}>
            <Text style={styles.roleText}>Staff</Text>
          </View>

          <TouchableOpacity
            style={styles.avatar}
            onPress={openDropdown}
            activeOpacity={0.8}
          >
            <Text style={styles.avatarText}>{initial}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Dropdown modal ───────────────────────────────────────────────── */}
      <Modal
        visible={dropdownOpen}
        transparent
        animationType="none"
        onRequestClose={() => closeDropdown()}
      >
        <Pressable style={styles.backdrop} onPress={() => closeDropdown()} />

        <Animated.View
          style={[
            styles.dropdown,
            { top: insets.top + 54, opacity: opacityAnim, transform: [{ scale: scaleAnim }] },
          ]}
        >
          {/* User info */}
          <View style={styles.dropdownHeader}>
            <View style={styles.dropdownAvatar}>
              <Text style={styles.dropdownAvatarText}>{initial}</Text>
            </View>
            <View style={styles.dropdownUserInfo}>
              <Text style={styles.dropdownEmail} numberOfLines={1}>{userEmail}</Text>
              <View style={styles.dropdownRolePill}>
                <Text style={styles.dropdownRoleText}>Staff</Text>
              </View>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Outlet info row */}
          <View style={styles.outletRow}>
            <MaterialIcons name="store" size={14} color={Colors.textMuted} style={{ marginRight: 2 }} />
            <Text style={styles.outletText}>{outletName ?? 'Outlet'}</Text>
          </View>

          <View style={styles.divider} />

          {/* Logout */}
          <TouchableOpacity
            style={styles.logoutRow}
            onPress={handleLogout}
            activeOpacity={0.8}
          >
            <Ionicons name="log-out-outline" size={16} color={Colors.red} style={{ marginRight: 2 }} />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </Animated.View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 2,
    borderBottomColor: STAFF_GREEN_LIGHT,
    paddingHorizontal: 16,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 3,
  },
  left: { flex: 1, marginRight: 12 },
  brandRow: { flexDirection: 'row', alignItems: 'center' },
  brand: {
    fontSize: FontSize.base,
    color: Colors.textMuted,
    fontWeight: FontWeight.medium,
  },
  pageTitle: {
    fontSize: FontSize.xl,
    color: Colors.text,
    fontWeight: FontWeight.bold,
    marginTop: 1,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rolePill: {
    backgroundColor: STAFF_GREEN,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
  },
  roleText: {
    color: '#fff',
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: STAFF_GREEN_LIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: STAFF_GREEN,
  },
  avatarText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: STAFF_GREEN,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
  },
  dropdown: {
    position: 'absolute',
    right: 14,
    width: 240,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 0.5,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 12,
    overflow: 'hidden',
  },
  dropdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 10,
  },
  dropdownAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: STAFF_GREEN_LIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  dropdownAvatarText: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: STAFF_GREEN,
  },
  dropdownUserInfo: { flex: 1 },
  dropdownEmail: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.text,
    marginBottom: 4,
  },
  dropdownRolePill: {
    backgroundColor: STAFF_GREEN,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  dropdownRoleText: {
    color: '#fff',
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
  },
  divider: {
    height: 0.5,
    backgroundColor: Colors.border,
  },
  outletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
  },
  outletText: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    fontWeight: FontWeight.medium,
  },
  logoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 13,
    gap: 10,
  },
  logoutText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.red,
  },
});
