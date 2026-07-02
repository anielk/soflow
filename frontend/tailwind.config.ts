import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bg: {
          base:    '#09090B',
          surface: '#111113',
          overlay: '#18181B',
          subtle:  '#1C1C1F',
          border:  '#27272A',
          muted:   '#3F3F46',
        },
        text: {
          primary:   '#FAFAFA',
          secondary: '#A1A1AA',
          muted:     '#71717A',
          disabled:  '#52525B',
        },
        violet: {
          50:  '#F5F3FF',
          100: '#EDE9FE',
          200: '#DDD6FE',
          300: '#C4B5FD',
          400: '#A78BFA',
          500: '#8B5CF6',
          600: '#7C3AED',
          700: '#6D28D9',
          800: '#5B21B6',
          900: '#4C1D95',
          950: '#2E1065',
        },
        // Brand tokens — sourced directly from the Leinaflow branding board.
        brand: {
          primary:   '#7C3AED',
          secondary: '#A855F7',
          accent:    '#06B6D4',
        },
        success: {
          DEFAULT: '#22C55E',
          subtle:  'rgba(34, 197, 94, 0.12)',
          text:    '#4ADE80',
        },
        warning: {
          DEFAULT: '#F59E0B',
          subtle:  'rgba(245, 158, 11, 0.12)',
          text:    '#FCD34D',
        },
        danger: {
          DEFAULT: '#EF4444',
          subtle:  'rgba(239, 68, 68, 0.12)',
          text:    '#F87171',
        },
        revenue: {
          subscriptions: '#8B5CF6',
          tips:          '#EC4899',
          ppv:           '#3B82F6',
          messages:      '#10B981',
          streams:       '#F59E0B',
          referrals:     '#6366F1',
        },
      },
      fontFamily: {
        sans: ['var(--font-satoshi)', 'var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #7C3AED 0%, #A855F7 100%)',
        'gradient-accent':  'linear-gradient(135deg, #06B6D4 0%, #3B82F6 100%)',
        'gradient-brand':   'linear-gradient(135deg, #7C3AED 0%, #EC4899 100%)',
      },
      fontSize: {
        '2xs':       ['0.625rem',  { lineHeight: '0.875rem' }],
        'xs':        ['0.75rem',   { lineHeight: '1rem' }],
        'sm':        ['0.875rem',  { lineHeight: '1.25rem' }],
        'base':      ['1rem',      { lineHeight: '1.5rem' }],
        'lg':        ['1.125rem',  { lineHeight: '1.75rem' }],
        'xl':        ['1.25rem',   { lineHeight: '1.75rem' }],
        '2xl':       ['1.5rem',    { lineHeight: '2rem' }],
        '3xl':       ['1.875rem',  { lineHeight: '2.25rem' }],
        '4xl':       ['2.25rem',   { lineHeight: '2.5rem' }],
        'metric':    ['2.5rem',    { lineHeight: '1', letterSpacing: '-0.02em' }],
        'metric-lg': ['3rem',      { lineHeight: '1', letterSpacing: '-0.03em' }],
      },
      borderRadius: {
        'none':    '0',
        'sm':      '4px',
        'DEFAULT': '6px',
        'md':      '8px',
        'lg':      '10px',
        'xl':      '12px',
        '2xl':     '16px',
        'full':    '9999px',
      },
      spacing: {
        'sidebar':          '240px',
        'sidebar-collapsed':'64px',
        'topbar':           '56px',
      },
      boxShadow: {
        'none':         'none',
        'card':         '0 1px 2px 0 rgb(0 0 0 / 0.4)',
        'dropdown':     '0 4px 16px 0 rgb(0 0 0 / 0.6)',
        'modal':        '0 8px 32px 0 rgb(0 0 0 / 0.7)',
        'violet-glow':  '0 0 0 3px rgba(124, 58, 237, 0.25)',
        // Soft, diffuse shadows for premium surfaces — no hard edges, no insets.
        'soft-sm':      '0 2px 8px -2px rgba(0, 0, 0, 0.25)',
        'soft':         '0 8px 24px -6px rgba(0, 0, 0, 0.35)',
        'soft-lg':      '0 16px 40px -8px rgba(0, 0, 0, 0.45)',
        'glow-primary': '0 0 24px -4px rgba(124, 58, 237, 0.35)',
      },
      keyframes: {
        'fade-in': {
          '0%':   { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'skeleton-pulse': {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0.4' },
        },
        'slide-in-left': {
          '0%':   { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        'slide-in-right': {
          '0%':   { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
      },
      animation: {
        'fade-in':        'fade-in 200ms ease-out',
        'skeleton':       'skeleton-pulse 1.5s ease-in-out infinite',
        'slide-in-left':  'slide-in-left 200ms ease-out',
        'slide-in-right': 'slide-in-right 200ms ease-out',
      },
    },
  },
  plugins: [],
};

export default config;
