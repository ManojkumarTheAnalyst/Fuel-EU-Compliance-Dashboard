/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        varuna: {
          navy: {
            950: '#050a12',
            900: '#0a1628',
            850: '#0d1e35',
            800: '#122a45',
            700: '#1a3a5c',
          },
          teal: {
            500: '#2dd4bf',
            400: '#5eead4',
            300: '#99f6e4',
          },
          cyan: {
            500: '#06b6d4',
            400: '#22d3ee',
            300: '#67e8f9',
          },
        },
      },
      fontFamily: {
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'varuna-glow': '0 0 40px -10px rgba(45, 212, 191, 0.35)',
      },
    },
  },
  plugins: [],
};
