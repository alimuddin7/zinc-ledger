/**
 * Dark Mode Design System
 * Based on Slate/Zinc palette for a premium financial app aesthetic.
 */

export const Colors = {
  // Backgrounds
  bg: '#020617',         // Slate 950 — main background
  surface: '#0f172a',    // Slate 900 — card surfaces
  surfaceAlt: '#1e293b', // Slate 800 — elevated surfaces
  border: '#1e293b',     // Slate 800 — subtle borders

  // Accent
  accent: '#38bdf8',     // Sky 400 — primary accent
  accentDim: '#0c4a6e',  // Sky 900 — dimmed accent for backgrounds

  // Semantic
  positive: '#4ade80',   // Green 400
  positiveDim: '#052e16',
  negative: '#f87171',   // Red 400
  negativeDim: '#450a0a',
  warning: '#fbbf24',    // Amber 400
  warningDim: '#451a03',

  // Text
  textPrimary: '#f8fafc',   // Slate 50
  textSecondary: '#94a3b8', // Slate 400
  textMuted: '#64748b',     // Slate 500

  // Misc
  overlay: 'rgba(0, 0, 0, 0.6)',
  white: '#ffffff',
  black: '#000000',
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

export const FontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 18,
  xl: 24,
  xxl: 32,
  display: 40,
} as const;

export const FontFamily = {
  sans: 'System',
  mono: 'SpaceMono',
} as const;
