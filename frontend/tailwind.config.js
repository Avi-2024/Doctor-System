/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  safelist: ['rounded-input', 'rounded-btn', 'rounded-card'],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: { '2xl': '1600px' },
    },
    extend: {
      fontFamily: {
        sans: ['Inter', 'SF Pro Display', 'system-ui', 'sans-serif'],
        display: ['Inter', 'SF Pro Display', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'hero': ['48px', { lineHeight: '1.1', letterSpacing: '-0.02em', fontWeight: '700' }],
        'page': ['32px', { lineHeight: '1.2', letterSpacing: '-0.015em', fontWeight: '600' }],
        'section': ['24px', { lineHeight: '1.3', letterSpacing: '-0.01em', fontWeight: '600' }],
        'card': ['18px', { lineHeight: '1.4', fontWeight: '600' }],
      },
      colors: {
        bg: {
          main: '#F4F7FB',
          surface: '#FFFFFF',
          sidebar: '#081120',
          'sidebar-elevated': '#0F172A',
        },
        ink: {
          primary: '#0F172A',
          secondary: '#64748B',
          muted: '#94A3B8',
        },
        brand: {
          50: '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          400: '#60A5FA',
          500: '#3B82F6',
          600: '#2563EB',
          700: '#1D4ED8',
          900: '#1E3A8A',
        },
        cyan: {
          500: '#06B6D4',
        },
        success: { DEFAULT: '#10B981', soft: 'rgba(16,185,129,0.12)' },
        warning: { DEFAULT: '#F59E0B', soft: 'rgba(245,158,11,0.12)' },
        danger:  { DEFAULT: '#EF4444', soft: 'rgba(239,68,68,0.12)' },
        border: {
          soft: 'rgba(148,163,184,0.18)',
          DEFAULT: 'rgba(148,163,184,0.24)',
        },
        // Legacy alias — keep existing .jsx files working during migration
        medical: {
          primary: '#2563EB',
          secondary: '#0EA5E9',
          background: '#F4F7FB',
          sidebar: '#081120',
          card: '#FFFFFF',
          border: '#E2E8F0',
          success: '#10B981',
          warning: '#F59E0B',
          danger: '#EF4444',
        },
      },
      spacing: {
        '4.5': '1.125rem',
      },
      borderRadius: {
        sm: '8px',
        md: '12px',
        lg: '16px',
        xl: '20px',
        '2xl': '24px',
        '3xl': '28px',
        card: '24px',
        btn: '14px',
        input: '16px',
        sidebar: '22px',
        modal: '28px',
      },
      boxShadow: {
        soft: '0 10px 30px rgba(15,23,42,0.06), 0 2px 8px rgba(15,23,42,0.04)',
        elevated: '0 20px 50px rgba(15,23,42,0.10), 0 4px 12px rgba(15,23,42,0.05)',
        glow: '0 8px 24px rgba(37,99,235,0.25)',
        'glow-cyan': '0 8px 24px rgba(6,182,212,0.20)',
        sidebar: '0 24px 48px rgba(8,17,32,0.45)',
        // Legacy alias
        card: '0 4px 20px rgba(0,0,0,0.05)',
      },
      backgroundImage: {
        'ambient-light':
          'radial-gradient(circle at top left, rgba(37,99,235,0.08), transparent 30%), radial-gradient(circle at bottom right, rgba(6,182,212,0.06), transparent 25%)',
        'sidebar-active':
          'linear-gradient(90deg, rgba(37,99,235,0.22), rgba(59,130,246,0.08))',
        'brand-gradient': 'linear-gradient(135deg, #2563EB, #3B82F6)',
        // Legacy
        'medical-active': 'linear-gradient(130deg, #2563EB, #0EA5E9)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        'shimmer': 'shimmer 2s linear infinite',
        'pulse-soft': 'pulse-soft 2.5s ease-in-out infinite',
      },
      transitionTimingFunction: {
        premium: 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
