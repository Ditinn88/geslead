/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        mousse: {
          DEFAULT: '#2E4036',
          dark: '#1A2720',
          deep: '#141E19',
          light: '#3C5246',
          muted: '#526E60',
        },
        argile: {
          DEFAULT: '#CC5833',
          dark: '#AC4525',
          light: '#DE704C',
          soft: '#F8EDE9',
          glow: 'rgba(204, 88, 51, 0.25)',
        },
        creme: {
          DEFAULT: '#F2F0E9',
          pure: '#FAF9F5',
          card: '#E9E6DC',
          dark: '#DDD8CB',
        },
        charbon: {
          DEFAULT: '#1A1A1A',
          deep: '#111111',
          surface: '#222222',
          muted: '#666666',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', '"Outfit"', 'sans-serif'],
        serif: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
      borderRadius: {
        '2xl': '1.5rem',
        '3xl': '2rem',
        '4xl': '2.5rem',
        '5xl': '3rem',
      },
      animation: {
        'pulse-subtle': 'pulseSubtle 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'laser-scan': 'laserScan 3s ease-in-out infinite alternate',
      },
      keyframes: {
        pulseSubtle: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.6', transform: 'scale(0.96)' },
        },
        laserScan: {
          '0%': { transform: 'translateY(0%)' },
          '100%': { transform: 'translateY(100%)' },
        },
      },
    },
  },
  plugins: [],
};
