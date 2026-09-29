/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fff1f2',
          100: '#ffe4e6',
          200: '#fecdd3',
          300: '#fda4af',
          400: '#fb7185',
          500: '#e11d48',
          600: '#dc2626', // Sizzling Red
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
          glow: '#ff1e42',
        },
        charcoal: {
          950: '#09090b',
          900: '#0f0f14',
          850: '#15151c',
          800: '#1e1e27',
          700: '#2b2b38',
          600: '#3d3d4e',
        },
        amber: {
          glow: '#f59e0b',
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
        display: ['Cabinet Grotesk', 'Plus Jakarta Sans', 'sans-serif'],
      },
      boxShadow: {
        'glow-sm': '0 0 15px -3px rgba(225, 29, 72, 0.3)',
        'glow': '0 0 25px -4px rgba(225, 29, 72, 0.45)',
        'glow-lg': '0 0 40px -2px rgba(225, 29, 72, 0.6)',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.85', transform: 'scale(1.03)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        }
      },
      animation: {
        'pulse-glow': 'pulseGlow 2.5s infinite ease-in-out',
        'float': 'float 3.5s infinite ease-in-out',
      }
    },
  },
  plugins: [],
}
