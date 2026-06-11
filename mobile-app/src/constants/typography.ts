/**
 * typography.ts
 * ─────────────
 * Font size and weight scale for the app.
 */

export const FontSize = {
  xs: 10,
  sm: 11,
  base: 13,
  md: 14,
  lg: 16,
  xl: 18,
  '2xl': 22,
  '3xl': 28,
} as const;

export const FontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

export const LineHeight = {
  tight: 18,
  normal: 22,
  relaxed: 26,
} as const;
