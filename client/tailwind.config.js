/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Light premium gifting palette — warm cream ground, rose primary,
        // muted gold accent, deep plum ink.
        cream: '#FFFBF8',
        blush: '#FFF4F6',
        rose: {
          50: '#FFF1F5',
          100: '#FFE3EA',
          200: '#FFC9D7',
          300: '#FBA0B8',
          400: '#F16E92',
          500: '#DE4A75',
          600: '#C42F5C',
          700: '#A32149',
          800: '#7D1839',
          900: '#5C0F28',
        },
        gold: {
          50: '#FDF8EC',
          100: '#F8EDD1',
          200: '#EFD79B',
          300: '#E2BE66',
          400: '#CFA23C',
          500: '#B4862A',
          600: '#8F6820',
        },
        ink: {
          DEFAULT: '#2E1B2B',
          soft: '#5C4A57',
          muted: '#8A7A85',
          faint: '#B5A8B0',
        },
        line: '#F2E6EA',
      },
      fontFamily: {
        display: ['Fraunces', 'Georgia', 'serif'],
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        xl2: '1.25rem',
        '4xl': '2rem',
      },
      boxShadow: {
        soft: '0 1px 2px rgba(46,27,43,0.04), 0 8px 24px -12px rgba(46,27,43,0.12)',
        lift: '0 2px 4px rgba(46,27,43,0.04), 0 18px 40px -18px rgba(46,27,43,0.22)',
        glow: '0 10px 40px -12px rgba(222,74,117,0.35)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-500px 0' },
          '100%': { backgroundPosition: '500px 0' },
        },
        'pulse-ring': {
          '0%': { transform: 'scale(0.9)', opacity: '0.7' },
          '70%': { transform: 'scale(1.6)', opacity: '0' },
          '100%': { opacity: '0' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.5s cubic-bezier(0.16,1,0.3,1) both',
        'fade-in': 'fade-in 0.4s ease both',
        shimmer: 'shimmer 1.6s linear infinite',
        'pulse-ring': 'pulse-ring 1.8s cubic-bezier(0.24,0,0.38,1) infinite',
      },
    },
  },
  plugins: [],
};
