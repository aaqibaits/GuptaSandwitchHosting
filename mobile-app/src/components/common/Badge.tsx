/**
 * Badge.tsx
 * ─────────
 * Pill-shaped status badge with color variants.
 * Used for status indicators (Active/Inactive, Paid/Pending/Due, role chips).
 */

import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { Colors } from '../../constants/colors';
import { FontSize, FontWeight } from '../../constants/typography';

type BadgeVariant = 'success' | 'danger' | 'warning' | 'info' | 'muted' | 'purple' | 'orange';

const VARIANT_STYLES: Record<BadgeVariant, { bg: string; text: string }> = {
  success: { bg: Colors.greenLight,  text: '#15803D' },
  danger:  { bg: Colors.redLight,    text: '#B91C1C' },
  warning: { bg: Colors.orangeLight, text: '#C2410C' },
  info:    { bg: Colors.blueLight,   text: '#1D4ED8' },
  muted:   { bg: '#F3F4F6',          text: Colors.textMuted },
  purple:  { bg: Colors.purpleLight, text: '#5B21B6' },
  orange:  { bg: Colors.primaryLight, text: Colors.primary },
};

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export default function Badge({ label, variant = 'muted', style, textStyle }: BadgeProps) {
  const { bg, text } = VARIANT_STYLES[variant];
  return (
    <View style={[styles.badge, { backgroundColor: bg }, style]}>
      <Text style={[styles.text, { color: text }, textStyle]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    textTransform: 'capitalize',
  },
});
