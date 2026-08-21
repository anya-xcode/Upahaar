/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        /**
         * Light premium palette.
         *
         * The ground is a warm ivory rather than white, and `blush` — the
         * workhorse tint behind cards, chips and table rows — is deliberately
         * almost neutral. Colour is spent on the primary, not on surfaces;
         * that restraint is most of what separates "premium" from "playful".
         *
         * The primary is a deep claret rose rather than a bright pink: still
         * warm and unmistakably gifting, but it holds white text at 5.6:1 and
         * doesn't shout.
         */
        cream: '#FFFCF9',
        blush: '#FAF5F2',
        rose: {
          50: '#FCF4F6',
          100: '#F6E7EC',
          200: '#EACBD6',
          300: '#D8A2B6',
          400: '#C07691',
          500: '#A94A6C',
          600: '#8E3958',
          700: '#742D48',
          800: '#572236',
          900: '#3D1726',
        },
        gold: {
          50: '#FBF7EC',
          100: '#F3EAD2',
          200: '#E4D3A0',
          300: '#CFB671',
          400: '#B39546',
          500: '#927733',
          600: '#6F5B27',
        },
        ink: {
          DEFAULT: '#241A20',
          soft: '#4C3F46',
          muted: '#7B6D75',
          faint: '#A99CA3',
        },
        line: '#EDE3DF',
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
        // Shadows are warm-tinted and shallow — a premium surface sits on the
        // page rather than floating above it.
        soft: '0 1px 2px rgba(36,26,32,0.04), 0 6px 18px -12px rgba(36,26,32,0.14)',
        lift: '0 1px 3px rgba(36,26,32,0.05), 0 18px 36px -20px rgba(36,26,32,0.20)',
        glow: '0 8px 22px -10px rgba(169,74,108,0.38)',
        mark: '0 2px 8px -3px rgba(116,45,72,0.45)',
        hairline: 'inset 0 0 0 1px rgba(36,26,32,0.05)',
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
