/**
 * Liquid Glass Design System - TypeScript Token Exports
 *
 * These tokens mirror the CSS custom properties in globals.css
 * for use in JavaScript/TypeScript (Framer Motion, dynamic styles).
 */

export const glassTokens = {
  colors: {
    bgPrimary: '#0a0a0a',
    bgElevated: '#121212',
    bgCard: 'rgba(26, 26, 26, 0.8)',
    bgCardHover: 'rgba(38, 38, 38, 0.9)',
    accentPrimary: '#FF4757',
    accentPrimaryGlow: 'rgba(255, 71, 87, 0.3)',
    accentSecondary: '#9B59B6',
    accentSecondaryGlow: 'rgba(155, 89, 182, 0.2)',
    accentTertiary: '#00D9FF',
    accentTertiaryGlow: 'rgba(0, 217, 255, 0.15)',
    success: '#2ECC71',
    successGlow: 'rgba(46, 204, 113, 0.25)',
    warning: '#F39C12',
    error: '#E74C3C',
    textPrimary: '#FFFFFF',
    textSecondary: 'rgba(255, 255, 255, 0.7)',
    textTertiary: 'rgba(255, 255, 255, 0.4)',
    glassBorder: 'rgba(255, 255, 255, 0.08)',
    glassBorderActive: 'rgba(255, 255, 255, 0.15)',
    glassInsetHighlight: 'rgba(255, 255, 255, 0.05)',
    glassTint: 'rgba(100, 150, 255, 0.03)',
  },

  blur: {
    sm: '8px',
    md: '20px',
    lg: '40px',
    xl: '60px',
  },

  spring: {
    gentle: { type: 'spring' as const, stiffness: 120, damping: 14 },
    snappy: { type: 'spring' as const, stiffness: 400, damping: 30 },
    bouncy: { type: 'spring' as const, stiffness: 300, damping: 15, mass: 0.5 },
  },

  transition: {
    fast: { duration: 0.15 },
    normal: { duration: 0.3 },
    slow: { duration: 0.5 },
  },

  shadows: {
    sm: '0 4px 16px rgba(0, 0, 0, 0.3)',
    md: '0 8px 32px rgba(0, 0, 0, 0.4)',
    lg: '0 12px 48px rgba(0, 0, 0, 0.5)',
    glow: '0 0 40px rgba(255, 71, 87, 0.3)',
  },
} as const;

/**
 * DPS score thresholds for color coding and celebrations
 */
export const dpsThresholds = {
  viral: 80,      // Triggers celebration animation
  strong: 60,     // Cyan/positive indicator
  moderate: 40,   // Yellow/neutral indicator
  weak: 0,        // Red/needs improvement
} as const;

/**
 * Get the appropriate color for a DPS score
 */
export const getDPSColor = (score: number): string => {
  if (score >= dpsThresholds.viral) return glassTokens.colors.success;
  if (score >= dpsThresholds.strong) return glassTokens.colors.accentTertiary;
  if (score >= dpsThresholds.moderate) return glassTokens.colors.warning;
  return glassTokens.colors.accentPrimary;
};

/**
 * Get the appropriate glow effect for a DPS score
 */
export const getDPSGlow = (score: number): string => {
  if (score >= dpsThresholds.viral) return '0 0 60px rgba(46, 204, 113, 0.4)';
  if (score >= dpsThresholds.strong) return '0 0 40px rgba(0, 217, 255, 0.3)';
  return 'none';
};

/**
 * Get the tier label for a DPS score
 */
export const getDPSTier = (score: number): string => {
  if (score >= dpsThresholds.viral) return 'Viral';
  if (score >= dpsThresholds.strong) return 'Strong';
  if (score >= dpsThresholds.moderate) return 'Moderate';
  return 'Needs Work';
};

/**
 * Confetti colors for celebration animation
 */
export const CONFETTI_COLORS = [
  '#FF4757', // Primary red
  '#2ECC71', // Success green
  '#00D9FF', // Tertiary cyan
  '#9B59B6', // Secondary purple
  '#F39C12', // Warning orange
] as const;
