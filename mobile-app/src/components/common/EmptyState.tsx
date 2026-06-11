/**
 * EmptyState.tsx
 * ──────────────
 * Empty list placeholder with Ionicons icon and message.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { FontSize } from '../../constants/typography';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

interface EmptyStateProps {
  // Legacy emoji prop — still accepted but ignored (icon rendered instead)
  emoji?: string;
  message?: string;
  sub?: string;
  // Preferred: pass an Ionicons name
  icon?: IoniconName;
  title?: string;
  subtitle?: string;
  iconColor?: string;
}

// Map old emoji strings → Ionicons names for backwards-compat callers that
// pass emoji="⏳", emoji="🍽️" etc.
const EMOJI_TO_ICON: Record<string, IoniconName> = {
  '⏳': 'time-outline',
  '🍽️': 'restaurant-outline',
  '📭': 'mail-open-outline',
  '👥': 'people-outline',
  '📱': 'phone-portrait-outline',
};

export default function EmptyState({
  emoji,
  message,
  sub,
  icon,
  title,
  subtitle,
  iconColor,
}: EmptyStateProps) {
  const displayTitle = title ?? message ?? '';
  const displaySub = subtitle ?? sub;

  // Resolve which icon to show
  const resolvedIcon: IoniconName =
    icon ??
    (emoji ? (EMOJI_TO_ICON[emoji] ?? 'ellipse-outline') : 'ellipse-outline');

  const resolvedColor = iconColor ?? Colors.textLight;

  return (
    <View style={styles.container}>
      <Ionicons name={resolvedIcon} size={52} color={resolvedColor} style={styles.icon} />
      <Text style={styles.message}>{displayTitle}</Text>
      {displaySub && <Text style={styles.sub}>{displaySub}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  icon: { marginBottom: 14 },
  message: {
    fontSize: FontSize.md,
    color: Colors.textMuted,
    textAlign: 'center',
    fontWeight: '600',
  },
  sub: {
    fontSize: FontSize.sm,
    color: Colors.textLight,
    textAlign: 'center',
    marginTop: 6,
  },
});
