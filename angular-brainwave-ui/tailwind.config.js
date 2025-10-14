/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        'band-delta': '#6B46C1',
        'band-theta': '#3B82F6',
        'band-alpha': '#10B981',
        'band-beta': '#F59E0B',
        'band-gamma': '#EF4444',
      },
      animation: {
        'pulse-slow': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'alert-pulse': 'alertPulse 1s ease-in-out infinite',
      },
      keyframes: {
        alertPulse: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.8', transform: 'scale(1.05)' },
        }
      }
    },
  },
  plugins: [],
}
