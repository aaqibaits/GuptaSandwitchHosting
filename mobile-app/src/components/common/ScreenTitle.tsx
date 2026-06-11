/**
 * ScreenTitle.tsx
 * ───────────────
 * Page title + optional subtitle shown at the top of each screen's content.
 * Replaces the title that was previously in the top nav bar.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../constants/colors';
import { FontSize, FontWeight } from '../../constants/typography';

interface ScreenTitleProps {
  title: string;
  subtitle?: string;
}

export default function ScreenTitle({ title, subtitle }: ScreenTitleProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 14,
  },
  title: {
    fontSize: FontSize['2xl'],
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },
  subtitle: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    marginTop: 2,
  },
});
