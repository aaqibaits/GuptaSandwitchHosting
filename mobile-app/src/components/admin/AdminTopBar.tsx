/**
 * AdminTopBar.tsx
 * ───────────────
 * Top header bar — mirrors the web AdminTopbar.
 *
 * Left  : 🥪 brand name · page title
 * Right : role pill · avatar (tappable → profile dropdown)
 *
 * Tapping the avatar opens a small dropdown showing:
 *   - User email
 *   - Role badge
 *   - Logout button
 */

import React, { useState, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Modal, Pressable, Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { FontSize, FontWeight } from '../../constants/typography';

interface AdminTopBarProps {
  title: string;
  userEmail?: string;
  userRole?: string;
  onLogout?: () => void;
}

export default function AdminTopBar({
  title,
  userEmail = 'admin@guptasandwich.com',
  userRole = 'Admin',
  onLogout,
}: AdminTopBarProps) {
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

        {/* Left: brand only */}
        <View style={styles.left}>
          <View style={styles.brandRow}>
            <MaterialCommunityIcons name="food" size={20} color={Colors.gold} style={{ marginRight: 6 }} />
            <Text style={styles.brand}>Gupta Sandwich</Text>
          </View>
        </View>

        {/* Right: role pill + avatar button */}
        <View style={styles.right}>
          <View style={styles.rolePill}>
            <Text style={styles.roleText}>{userRole}</Text>
          </View>

          {/* Avatar — tap to open profile dropdown */}
          <TouchableOpacity
            style={styles.avatar}
            onPress={openDropdown}
            activeOpacity={0.8}
          >
            <Text style={styles.avatarText}>{initial}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Profile dropdown modal ───────────────────────────────────────── */}
      <Modal
        visible={dropdownOpen}
        transparent
        animationType="none"
        onRequestClose={() => closeDropdown()}
      >
        {/* Backdrop — tap outside to close */}
        <Pressable style={styles.backdrop} onPress={() => closeDropdown()} />

        {/* Dropdown card — positioned top-right */}
        <Animated.View
          style={[
            styles.dropdown,
            { top: insets.top + 54, opacity: opacityAnim, transform: [{ scale: scaleAnim }] },
          ]}
        >
          {/* User info header */}
          <View style={styles.dropdownHeader}>
            <View style={styles.dropdownAvatar}>
              <Text style={styles.dropdownAvatarText}>{initial}</Text>
            </View>
            <View style={styles.dropdownUserInfo}>
              <Text style={styles.dropdownEmail} numberOfLines={1}>{userEmail}</Text>
              <View style={styles.dropdownRolePill}>
                <Text style={styles.dropdownRoleText}>{userRole}</Text>
              </View>
            </View>
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Logout button */}
          <TouchableOpacity
            style={styles.logoutRow}
            onPress={handleLogout}
            activeOpacity={0.8}
          >
            <Ionicons name="log-out-outline" size={18} color={Colors.red} />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </Animated.View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  // ── Top bar ────────────────────────────────────────────────────────────────
  bar: {
    backgroundColor: Colors.surface,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
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
    fontSize: FontSize['2xl'],
    color: Colors.text,
    fontWeight: FontWeight.semibold,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rolePill: {
    backgroundColor: Colors.gradientStart,
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
    backgroundColor: Colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: Colors.dark,
  },
  avatarText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.dark,
  },

  // ── Dropdown ───────────────────────────────────────────────────────────────
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
  },
  dropdown: {
    position: 'absolute',
    right: 14,
    width: 230,
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
    backgroundColor: Colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  dropdownAvatarText: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.dark,
  },
  dropdownUserInfo: { flex: 1 },
  dropdownEmail: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.text,
    marginBottom: 4,
  },
  dropdownRolePill: {
    backgroundColor: Colors.gradientStart,
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
    marginHorizontal: 0,
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
