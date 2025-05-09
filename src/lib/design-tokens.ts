// Design Tokens for Trendzo
// This file defines the core design elements to ensure consistency across the application
// following minimalist design principles

// Color Palette
// Using a minimal color palette to reduce visual noise
export const colors = {
  // Primary colors
  primary: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    200: '#bae6fd',
    300: '#7dd3fc',
    400: '#38bdf8',
    500: '#0ea5e9', // Main primary color
    600: '#0284c7',
    700: '#0369a1',
    800: '#075985',
    900: '#0c4a6e',
    950: '#082f49',
  },
  
  // Neutral colors for text, backgrounds, etc.
  neutral: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
    950: '#030712',
  },
  
  // Functional colors for feedback
  success: {
    light: '#d1fae5',
    DEFAULT: '#10b981',
    dark: '#065f46',
  },
  
  warning: {
    light: '#fef3c7',
    DEFAULT: '#f59e0b',
    dark: '#92400e',
  },
  
  error: {
    light: '#fee2e2',
    DEFAULT: '#ef4444',
    dark: '#b91c1c',
  },
  
  info: {
    light: '#dbeafe',
    DEFAULT: '#3b82f6',
    dark: '#1e40af',
  },
};

// Spacing
// Using a consistent spacing scale to maintain visual harmony
export const spacing = {
  px: '1px',
  0: '0',
  0.5: '0.125rem', // 2px
  1: '0.25rem',    // 4px
  1.5: '0.375rem', // 6px
  2: '0.5rem',     // 8px
  2.5: '0.625rem', // 10px
  3: '0.75rem',    // 12px
  3.5: '0.875rem', // 14px
  4: '1rem',       // 16px
  5: '1.25rem',    // 20px
  6: '1.5rem',     // 24px
  7: '1.75rem',    // 28px
  8: '2rem',       // 32px
  9: '2.25rem',    // 36px
  10: '2.5rem',    // 40px
  11: '2.75rem',   // 44px
  12: '3rem',      // 48px
  14: '3.5rem',    // 56px
  16: '4rem',      // 64px
  20: '5rem',      // 80px
  24: '6rem',      // 96px
  28: '7rem',      // 112px
  32: '8rem',      // 128px
  36: '9rem',      // 144px
  40: '10rem',     // 160px
  44: '11rem',     // 176px
  48: '12rem',     // 192px
  52: '13rem',     // 208px
  56: '14rem',     // 224px
  60: '15rem',     // 240px
  64: '16rem',     // 256px
  72: '18rem',     // 288px
  80: '20rem',     // 320px
  96: '24rem',     // 384px
};

// Typography
// Clean, readable typography with a minimalist approach
export const typography = {
  fontFamily: {
    sans: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    mono: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
  },
  fontWeight: {
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  fontSize: {
    xs: ['0.75rem', { lineHeight: '1rem' }],
    sm: ['0.875rem', { lineHeight: '1.25rem' }],
    base: ['1rem', { lineHeight: '1.5rem' }],
    lg: ['1.125rem', { lineHeight: '1.75rem' }],
    xl: ['1.25rem', { lineHeight: '1.75rem' }],
    '2xl': ['1.5rem', { lineHeight: '2rem' }],
    '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
    '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
    '5xl': ['3rem', { lineHeight: '1' }],
    '6xl': ['3.75rem', { lineHeight: '1' }],
  },
  letterSpacing: {
    tighter: '-0.05em',
    tight: '-0.025em',
    normal: '0em',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em',
  },
};

// Borders
export const borders = {
  radius: {
    none: '0',
    sm: '0.125rem',
    DEFAULT: '0.25rem',
    md: '0.375rem',
    lg: '0.5rem',
    xl: '0.75rem',
    '2xl': '1rem',
    '3xl': '1.5rem',
    full: '9999px',
  },
  width: {
    0: '0px',
    1: '1px',
    2: '2px',
    4: '4px',
    8: '8px',
  },
};

// Shadows
// Subtle shadows for depth without overwhelming visual noise
export const shadows = {
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  DEFAULT: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
  none: 'none',
};

// Animations
// Subtle animations for interaction feedback
export const animations = {
  transition: {
    DEFAULT: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    fast: 'all 0.1s cubic-bezier(0.4, 0, 0.2, 1)',
    slow: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    responsive: {
      mobile: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
      tablet: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
      desktop: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
    },
    easing: {
      default: 'cubic-bezier(0.4, 0, 0.2, 1)',
      in: 'cubic-bezier(0.4, 0, 1, 1)',
      out: 'cubic-bezier(0, 0, 0.2, 1)',
      inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
      bounce: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)'
    }
  },
  duration: {
    fast: 100,
    DEFAULT: 200,
    medium: 300,
    slow: 500,
    extraSlow: 800
  },
  keyframes: {
    fadeIn: {
      from: { opacity: 0 },
      to: { opacity: 1 },
    },
    fadeOut: {
      from: { opacity: 1 },
      to: { opacity: 0 },
    },
    slideIn: {
      from: { transform: 'translateY(10px)', opacity: 0 },
      to: { transform: 'translateY(0)', opacity: 1 },
    },
    slideOut: {
      from: { transform: 'translateY(0)', opacity: 1 },
      to: { transform: 'translateY(10px)', opacity: 0 },
    },
    slideInLeft: {
      from: { transform: 'translateX(-20px)', opacity: 0 },
      to: { transform: 'translateX(0)', opacity: 1 },
    },
    slideInRight: {
      from: { transform: 'translateX(20px)', opacity: 0 },
      to: { transform: 'translateX(0)', opacity: 1 },
    },
    slideInTop: {
      from: { transform: 'translateY(-20px)', opacity: 0 },
      to: { transform: 'translateY(0)', opacity: 1 },
    },
    slideInBottom: {
      from: { transform: 'translateY(20px)', opacity: 0 },
      to: { transform: 'translateY(0)', opacity: 1 },
    },
    scaleIn: {
      from: { transform: 'scale(0.95)', opacity: 0 },
      to: { transform: 'scale(1)', opacity: 1 },
    },
    scaleOut: {
      from: { transform: 'scale(1)', opacity: 1 },
      to: { transform: 'scale(0.95)', opacity: 0 },
    },
    pulse: {
      '0%, 100%': { opacity: 1 },
      '50%': { opacity: 0.7 },
    },
    spin: {
      from: { transform: 'rotate(0deg)' },
      to: { transform: 'rotate(360deg)' },
    },
    shimmer: {
      '0%': { backgroundPosition: '-200% 0' },
      '100%': { backgroundPosition: '200% 0' },
    },
    bounce: {
      '0%, 100%': { transform: 'translateY(0)' },
      '50%': { transform: 'translateY(-10px)' },
    }
  },
  animation: {
    fadeIn: 'fadeIn 0.2s ease-in-out',
    fadeOut: 'fadeOut 0.2s ease-in-out',
    slideIn: 'slideIn 0.2s ease-out',
    slideOut: 'slideOut 0.2s ease-in',
    slideInLeft: 'slideInLeft 0.3s ease-out',
    slideInRight: 'slideInRight 0.3s ease-out',
    slideInTop: 'slideInTop 0.3s ease-out',
    slideInBottom: 'slideInBottom 0.3s ease-out',
    scaleIn: 'scaleIn 0.3s ease-out',
    scaleOut: 'scaleOut 0.2s ease-in',
    pulse: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
    spin: 'spin 1s linear infinite',
    shimmer: 'shimmer 2s ease-in-out infinite',
    bounce: 'bounce 0.5s ease-in-out infinite'
  },
  // Loading states
  loading: {
    skeleton: 'bg-neutral-200 animate-shimmer bg-gradient-to-r from-neutral-200 via-neutral-100 to-neutral-200 bg-[length:400%_100%]',
    spinner: 'animate-spin',
    pulse: 'animate-pulse',
    bounce: 'animate-bounce',
  },
  // Interactive states
  interactive: {
    button: 'transition-all duration-200 ease-in-out transform hover:scale-[1.03] active:scale-[0.97]',
    card: 'transition-all duration-300 ease-in-out transform hover:scale-[1.01] hover:shadow-md',
    input: 'transition-all duration-200 ease-in-out',
    link: 'transition-all duration-150 ease-in-out hover:underline',
    scale: 'transition-transform duration-200 ease-in-out hover:scale-[1.03] active:scale-[0.98]',
    highlight: 'transition-colors duration-200 ease-in-out hover:bg-neutral-100',
    expandable: 'transition-all duration-300 ease-in-out overflow-hidden',
    fade: 'transition-opacity duration-200 ease-in-out hover:opacity-80',
  },
  // Page transitions
  page: {
    default: 'transition-opacity duration-300 ease-in-out',
    fade: 'animate-fadeIn duration-300',
    slide: 'animate-slideInBottom duration-300',
    scale: 'animate-scaleIn duration-300',
  }
};

// Z-index
export const zIndex = {
  0: '0',
  10: '10',
  20: '20',
  30: '30',
  40: '40',
  50: '50',
  auto: 'auto',
  dropdown: '1000',
  sticky: '1020',
  fixed: '1030',
  modalBackdrop: '1040',
  modal: '1050',
  popover: '1060',
  tooltip: '1070',
};

// Focus styles for accessibility
export const focus = {
  DEFAULT: 'outline-none ring-2 ring-primary-500 ring-offset-2',
  within: 'outline-none ring-2 ring-primary-500 ring-offset-2',
};

// Export all tokens as a single object
export const designTokens = {
  colors,
  spacing,
  typography,
  borders,
  shadows,
  animations,
  zIndex,
  focus,
};

export default designTokens; 