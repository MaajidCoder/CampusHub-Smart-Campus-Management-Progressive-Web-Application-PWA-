/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6', // Indigo Accent
          600: '#7c3aed',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
          950: '#2e1065',
        },
        dark: {
          bg: '#0B0F19',        // Deep Space Dark Blue/Gray
          card: '#161B26',      // Glassmorphic Card Background
          border: '#242F41',    // Subtle Borders
          text: '#F3F4F6',      // Off-White Text
          muted: '#9CA3AF',     // Gray Muted Text
        },
        light: {
          bg: '#F9FAFB',        // Clean White/Gray
          card: '#FFFFFF',      // White Card
          border: '#E5E7EB',    // Light Gray Border
          text: '#111827',      // Dark text
          muted: '#6B7280',     // Gray Muted Text
        }
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'sans-serif'],
      },
      boxShadow: {
        'glass-light': '0 8px 32px 0 rgba(31, 38, 135, 0.07)',
        'glass-dark': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out forwards',
        'slide-up': 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'pulse-glow': 'pulseGlow 2s infinite alternate',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(15px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        pulseGlow: {
          '0%': { boxShadow: '0 0 10px rgba(139, 92, 246, 0.2)' },
          '100%': { boxShadow: '0 0 25px rgba(139, 92, 246, 0.5)' },
        }
      }
    },
  },
  plugins: [],
}
