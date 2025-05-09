/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
          950: '#082f49',
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
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
        portfolio: {
          orange: {
            DEFAULT: "#f97316",
            50: "rgb(249 115 22 / 0.05)",
            100: "rgb(249 115 22 / 0.1)",
            200: "rgb(249 115 22 / 0.2)",
            300: "rgb(249 115 22 / 0.3)",
            400: "rgb(249 115 22 / 0.4)",
            500: "rgb(249 115 22 / 0.5)",
            600: "rgb(249 115 22 / 0.6)",
            700: "rgb(249 115 22 / 0.7)",
            800: "rgb(249 115 22 / 0.8)",
            900: "rgb(249 115 22 / 0.9)",
          },
          rose: {
            DEFAULT: "#e11d48",
            50: "rgb(225 29 72 / 0.05)",
            100: "rgb(225 29 72 / 0.1)",
            200: "rgb(225 29 72 / 0.2)",
            300: "rgb(225 29 72 / 0.3)",
            400: "rgb(225 29 72 / 0.4)",
            500: "rgb(225 29 72 / 0.5)",
            600: "rgb(225 29 72 / 0.6)",
            700: "rgb(225 29 72 / 0.7)",
            800: "rgb(225 29 72 / 0.8)",
            900: "rgb(225 29 72 / 0.9)",
          },
          green: {
            DEFAULT: "#22c55e",
            50: "rgb(34 197 94 / 0.05)",
            100: "rgb(34 197 94 / 0.1)",
            200: "rgb(34 197 94 / 0.2)",
            300: "rgb(34 197 94 / 0.3)",
            400: "rgb(34 197 94 / 0.4)",
            500: "rgb(34 197 94 / 0.5)",
          },
          gray: {
            900: "#111827",
            800: "#1f2937",
            700: "#374151",
            600: "#4b5563",
            500: "#6b7280",
            400: "#9ca3af",
            300: "#d1d5db",
          },
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        none: '0',
        DEFAULT: '0.25rem',
        xl: '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
        full: '9999px',
      },
      keyframes: {
        "accordion-down": {
          from: { height: 0 },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: 0 },
        },
        "collapsible-down": {
          from: { height: 0 },
          to: { height: "var(--radix-collapsible-content-height)" },
        },
        "collapsible-up": {
          from: { height: "var(--radix-collapsible-content-height)" },
          to: { height: 0 },
        },
        "pulse-once": {
          "0%, 100%": { opacity: 1 },
          "50%": { opacity: 0.8 },
        },
        "fadeIn": {
          from: { opacity: 0 },
          to: { opacity: 1 },
        },
        "fadeOut": {
          from: { opacity: 1 },
          to: { opacity: 0 },
        },
        "slideIn": {
          from: { transform: 'translateY(10px)', opacity: 0 },
          to: { transform: 'translateY(0)', opacity: 1 },
        },
        "slideOut": {
          from: { transform: 'translateY(0)', opacity: 1 },
          to: { transform: 'translateY(10px)', opacity: 0 },
        },
        "slideInLeft": {
          from: { transform: 'translateX(-20px)', opacity: 0 },
          to: { transform: 'translateX(0)', opacity: 1 },
        },
        "slideInRight": {
          from: { transform: 'translateX(20px)', opacity: 0 },
          to: { transform: 'translateX(0)', opacity: 1 },
        },
        "slideInTop": {
          from: { transform: 'translateY(-20px)', opacity: 0 },
          to: { transform: 'translateY(0)', opacity: 1 },
        },
        "slideInBottom": {
          from: { transform: 'translateY(20px)', opacity: 0 },
          to: { transform: 'translateY(0)', opacity: 1 },
        },
        "scaleIn": {
          from: { transform: 'scale(0.95)', opacity: 0 },
          to: { transform: 'scale(1)', opacity: 1 },
        },
        "scaleOut": {
          from: { transform: 'scale(1)', opacity: 1 },
          to: { transform: 'scale(0.95)', opacity: 0 },
        },
        "pulse": {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.7 },
        },
        "spin": {
          from: { transform: 'rotate(0deg)' },
          to: { transform: 'rotate(360deg)' },
        },
        "shimmer": {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        "bounce": {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        }
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "collapsible-down": "collapsible-down 0.2s ease-out",
        "collapsible-up": "collapsible-up 0.2s ease-out",
        "pulse-once": "pulse-once 1s ease-in-out 1",
        "fadeIn": "fadeIn 0.2s ease-in-out",
        "fadeOut": "fadeOut 0.2s ease-in-out",
        "slideIn": "slideIn 0.2s ease-out",
        "slideOut": "slideOut 0.2s ease-in",
        "slideInLeft": "slideInLeft 0.3s ease-out",
        "slideInRight": "slideInRight 0.3s ease-out",
        "slideInTop": "slideInTop 0.3s ease-out",
        "slideInBottom": "slideInBottom 0.3s ease-out",
        "scaleIn": "scaleIn 0.3s ease-out",
        "scaleOut": "scaleOut 0.2s ease-in",
        "pulse": "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "spin": "spin 1s linear infinite",
        "shimmer": "shimmer 2s ease-in-out infinite",
        "bounce": "bounce 0.5s ease-in-out infinite"
      },
      backgroundImage: {
        'portfolio-gradient': 'linear-gradient(to right, rgba(16, 185, 129, 0.1), rgba(236, 72, 153, 0.2))',
        'button-gradient': 'linear-gradient(to right, rgb(249, 115, 22), rgb(225, 29, 72))',
      },
      transitionTimingFunction: {
        'in-expo': 'cubic-bezier(0.95, 0.05, 0.795, 0.035)',
        'out-expo': 'cubic-bezier(0.19, 1, 0.22, 1)',
        'default': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'in': 'cubic-bezier(0.4, 0, 1, 1)',
        'out': 'cubic-bezier(0, 0, 0.2, 1)',
        'in-out': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'bounce': 'cubic-bezier(0.175, 0.885, 0.32, 1.275)'
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} 