/**
 * MetricCard.tsx
 * ──────────────
 * KPI metric display block — label, big value, sub-text.
 * Mirrors the .metric-card styles from App.css.
 */

import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors } from '../../constants/colors';
import { FontSize, FontWeight } from '../../constants/typography';

interface MetricCardProps {
  label: string;
  value: string | number;
  sub?: string;
  valueStyle?: object;
  style?: ViewStyle;
}

export default function MetricCard({ label, value, sub, valueStyle, style }: MetricCardProps) {
  return (
    <View style={[styles.card, style]}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, valueStyle]}>{value}</Text>
      {sub ? <Text style={styles.sub}>{sub}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 10,
    padding: 14,
    flex: 1,
    marginHorizontal: 4,
  },
  label: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    marginBottom: 5,
    fontWeight: FontWeight.medium,
  },
  value: {
    fontSize: FontSize['2xl'],
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },
  sub: {
    fontSize: FontSize.sm,
    color: Colors.textLight,
    marginTop: 2,
  },
});
