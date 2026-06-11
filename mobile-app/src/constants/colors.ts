/**
 * colors.ts
 * ─────────
 * Central design token file. All color values used in the app live here.
 * Mirrors the CSS custom properties in the web admin panel (App.css).
 */

export const Colors = {
  // ── Brand ──────────────────────────────────────────────────────────────
  primary: '#E8590C',       // Orange — main brand accent
  primaryLight: '#FFF0E8',  // Light orange tint
  primaryMid: '#F58540',    // Mid orange

  gold: '#F5C842',          // CTA / active tab highlight
  dark: '#1A1208',          // Rich dark — tab bar bg, primary buttons

  // ── Backgrounds ────────────────────────────────────────────────────────
  bg: '#F5F4F0',            // App-level screen background
  surface: '#FFFFFF',       // Cards, modals, inputs
  surfaceAlt: '#EEEEE9',    // Metric card background

  // ── Borders & Dividers ─────────────────────────────────────────────────
  border: '#E5E3DC',
  borderLight: '#E5E5E3',

  // ── Text ───────────────────────────────────────────────────────────────
  text: '#1A1A1A',
  textMuted: '#6B7280',
  textLight: '#AAAAAA',
  textOnDark: '#FFFFFF',

  // ── Status ─────────────────────────────────────────────────────────────
  green: '#22C55E',
  greenLight: '#DCFCE7',
  red: '#E53935',
  redLight: '#FEE2E2',
  blue: '#2563EB',
  blueLight: '#DBEAFE',
  purple: '#7C3AED',
  purpleLight: '#EDE9FE',
  orange: '#F97316',
  orangeLight: '#FFEDD5',

  // ── Sidebar / Tab bar gradient ─────────────────────────────────────────
  gradientStart: '#667EEA',
  gradientEnd: '#764BA2',

  // ── Transparent ────────────────────────────────────────────────────────
  transparent: 'transparent',
  overlay: 'rgba(0,0,0,0.5)',
} as const;

export type ColorKey = keyof typeof Colors;
