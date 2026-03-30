/**
 * TRENDZO BRAND CONFIGURATION
 * 
 * Centralized branding configuration for the Trendzo Viral Prediction Platform
 * This file contains all brand-specific colors, typography, logos, and design elements
 * to ensure consistent brand application across the entire application.
 */

// ===== BRAND COLORS =====
export const trendzoBrand = {
  colors: {
    // Primary Brand Colors
    primary: {
      50: '#f0f4ff',
      100: '#e0e9ff',
      200: '#c7d6fe',
      300: '#a5b8fc',
      400: '#8b94f8',
      500: '#7c6df2',  // Main Trendzo Purple
      600: '#6d4de6',
      700: '#5d3dcb',
      800: '#4c32a4',
      900: '#412d82',
      950: '#281b4f',
    },
    
    // Secondary Brand Colors
    secondary: {
      50: '#eff8ff',
      100: '#dbeafe',
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#3b82f6',  // Trendzo Blue
      600: '#2563eb',
      700: '#1d4ed8',
      800: '#1e40af',
      900: '#1e3a8a',
      950: '#172554',
    },
    
    // Accent Colors
    accent: {
      viral: '#10b981',      // Success/Viral Green
      trending: '#f59e0b',   // Warning/Trending Orange
      flame: '#ef4444',      // Error/Flame Red
      neutral: '#6b7280',    // Neutral Gray
    },
    
    // Gradient Combinations
    gradients: {
      primary: 'from-purple-600 to-blue-600',
      hero: 'from-slate-900 via-purple-900 to-slate-900',
      card: 'from-purple-900/50 to-blue-900/50',
      text: 'from-white via-purple-200 to-blue-200',
      accent: 'from-purple-600 to-pink-600',
    },
    
    // Dark Mode Variants
    dark: {
      background: '#0f0f23',
      surface: '#1a1a2e',
      border: '#16213e',
      text: {
        primary: '#ffffff',
        secondary: '#a1a1aa',
        muted: '#71717a',
      }
    }
  },
  
  // ===== TYPOGRAPHY =====
  typography: {
    fontFamily: {
      primary: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      display: 'Inter, ui-sans-serif, system-ui, sans-serif',
      mono: 'JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
    },
    
    // Brand-specific font weights
    fontWeight: {
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
      extrabold: 800,
    },
    
    // Heading styles
    headings: {
      hero: 'text-5xl md:text-7xl font-bold bg-gradient-to-r from-white via-purple-200 to-blue-200 bg-clip-text text-transparent',
      h1: 'text-4xl md:text-5xl font-bold text-white',
      h2: 'text-3xl md:text-4xl font-bold text-white',
      h3: 'text-2xl md:text-3xl font-semibold text-white',
      h4: 'text-xl md:text-2xl font-semibold text-white',
    }
  },
  
  // ===== LOGO ASSETS =====
  logos: {
    flame: '/images/logos/trendzo-flame-icon.svg',
    full: '/images/logos/trendzo-full-logo.svg',
    text: '/images/logos/trendzo-text-logo.svg',
    main: '/images/logos/trendzo-logo.svg',
  },
  
  // ===== ANIMATIONS =====
  animations: {
    // Brand-specific animations
    float: 'animate-float',
    pulse: 'animate-pulse-slow',
    glow: 'animate-glow',
    breathe: 'animate-breathe',
    shimmer: 'animate-shimmer',
    
    // Interaction animations
    button: 'transition-all duration-300 transform hover:scale-105 active:scale-95',
    card: 'transition-all duration-300 transform hover:scale-[1.02] hover:-translate-y-1',
    link: 'transition-colors duration-200 hover:text-purple-300',
    
    // Page transitions
    fadeIn: 'animate-fadeIn',
    slideIn: 'animate-slideIn',
    scaleIn: 'animate-scaleIn',
  },
  
  // ===== COMPONENT STYLES =====
  components: {
    // Button variants
    buttons: {
      primary: 'inline-flex items-center px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded-full text-white font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl',
      secondary: 'inline-flex items-center px-8 py-4 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full text-white font-semibold transition-all duration-300 border border-white/20 hover:border-white/30',
      ghost: 'inline-flex items-center px-6 py-3 text-white font-medium hover:text-purple-300 transition-colors duration-200',
    },
    
    // Card variants
    cards: {
      glass: 'bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 hover:border-purple-500/50 transition-all duration-300 hover:bg-white/10',
      gradient: 'bg-gradient-to-r from-purple-900/50 to-blue-900/50 backdrop-blur-sm rounded-3xl border border-white/10',
      solid: 'bg-slate-800/90 backdrop-blur-sm rounded-xl border border-slate-700/50',
    },
    
    // Badge variants
    badges: {
      primary: 'px-3 py-1 bg-gradient-to-r from-purple-600 to-blue-600 text-xs font-semibold rounded-full',
      secondary: 'px-2 py-1 text-xs bg-purple-600/30 text-purple-200 rounded-full border border-purple-500/30',
      success: 'px-3 py-1 bg-green-600/20 text-green-400 text-xs font-medium rounded-full border border-green-500/30',
    }
  },
  
  // ===== LAYOUT =====
  layout: {
    // Container max widths
    containers: {
      sm: 'max-w-2xl',
      md: 'max-w-4xl',
      lg: 'max-w-6xl',
      xl: 'max-w-7xl',
      full: 'max-w-full',
    },
    
    // Spacing scale
    spacing: {
      section: 'py-20',
      container: 'px-6',
      grid: 'gap-8',
    },
    
    // Background patterns
    backgrounds: {
      hero: 'min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900',
      section: 'bg-slate-900/50',
      card: 'bg-slate-800/30',
    }
  },
  
  // ===== EFFECTS =====
  effects: {
    // Glassmorphism
    glass: 'backdrop-blur-sm bg-white/5 border border-white/10',
    
    // Glow effects
    glow: {
      purple: 'shadow-lg shadow-purple-500/25',
      blue: 'shadow-lg shadow-blue-500/25',
      multi: 'shadow-xl shadow-purple-500/20',
    },
    
    // Blur effects
    blur: {
      sm: 'backdrop-blur-sm',
      md: 'backdrop-blur-md',
      lg: 'backdrop-blur-lg',
    }
  },
  
  // ===== BRAND MESSAGING =====
  messaging: {
    tagline: 'Predict Viral Content Before You Create',
    description: 'Harness the power of AI to analyze, predict, and optimize your content for maximum viral potential across all platforms.',
    cta: {
      primary: 'Start Creating',
      secondary: 'Watch Demo',
      tertiary: 'Learn More',
    },
    
    // Feature descriptions
    features: {
      prediction: 'AI-powered analysis to predict viral potential with 85%+ accuracy',
      workflow: 'Streamlined process from idea to viral content in minutes',
      templates: 'Curated collection of high-performing viral templates',
      analytics: 'Real-time insights and performance tracking',
      tools: 'Professional suite for content creators and marketers',
      campaigns: 'Orchestrate multi-platform viral campaigns',
    }
  },
  
  // ===== PLATFORM SPECIFIC =====
  platforms: {
    tiktok: {
      color: '#ff0050',
      icon: 'TikTok',
      name: 'TikTok',
    },
    instagram: {
      color: '#e4405f',
      icon: 'Instagram', 
      name: 'Instagram',
    },
    youtube: {
      color: '#ff0000',
      icon: 'YouTube',
      name: 'YouTube',
    },
    twitter: {
      color: '#1da1f2',
      icon: 'Twitter',
      name: 'Twitter/X',
    }
  }
};

// ===== UTILITY FUNCTIONS =====

/**
 * Get brand color by path (e.g., 'primary.500', 'accent.viral')
 */
export function getBrandColor(path: string): string {
  const keys = path.split('.');
  let value: any = trendzoBrand.colors;
  
  for (const key of keys) {
    value = value?.[key];
  }
  
  return value || '#7c6df2'; // Fallback to primary brand color
}

/**
 * Get brand gradient class
 */
export function getBrandGradient(type: keyof typeof trendzoBrand.colors.gradients): string {
  return `bg-gradient-to-r ${trendzoBrand.colors.gradients[type]}`;
}

/**
 * Get component style by type and variant
 */
export function getComponentStyle(component: keyof typeof trendzoBrand.components, variant: string): string {
  const componentStyles = trendzoBrand.components[component] as Record<string, string>;
  return componentStyles[variant] || '';
}

/**
 * Generate brand-consistent shadow
 */
export function getBrandShadow(intensity: 'sm' | 'md' | 'lg' | 'xl' = 'md'): string {
  const shadows = {
    sm: 'shadow-sm shadow-purple-500/10',
    md: 'shadow-md shadow-purple-500/20',
    lg: 'shadow-lg shadow-purple-500/25',
    xl: 'shadow-xl shadow-purple-500/30'
  };
  
  return shadows[intensity];
}

export default trendzoBrand;





















