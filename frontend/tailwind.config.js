/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        brand: {
          500: '#2563EB',
          600: '#1D4ED8',
          900: '#1E3A8A',
        },
        ui: {
          bg: '#F1F5F9',
          card: '#FFFFFF',
          text: '#1F2937',
          muted: '#64748B',
        },
        status: {
          success: '#10B981',
          warning: '#F59E0B',
          danger: '#EF4444',
          info: '#38BDF8',
        },
        medical: {
          primary: '#2563EB',
          secondary: '#0EA5E9',
          background: '#F1F5F9',
          sidebar: '#0F172A',
          card: '#FFFFFF',
          border: '#E2E8F0',
          success: '#10B981',
          warning: '#F59E0B',
          danger: '#EF4444',
        },
      },
      boxShadow: {
        card: '0 4px 20px rgba(0,0,0,0.05)',
        soft: '0 10px 30px rgba(15, 23, 42, 0.08)',
      },
      borderRadius: {
        card: '16px',
      },
      backgroundImage: {
        'medical-active': 'linear-gradient(130deg, #2563EB, #0EA5E9)',
      },
    },
  },
  plugins: [],
};
