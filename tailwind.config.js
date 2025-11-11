/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Indian Law-Themed Color Palette
        primary: {
          50: '#fdf4f3',
          100: '#fbe8e6',
          200: '#f6d0cc',
          300: '#efafa8',
          400: '#e5837a',
          500: '#d65d52',
          600: '#c03f33',
          700: '#9f2f24',
          800: '#7a2419',
          900: '#4B1D0F', // Deep Maroon
        },
        secondary: {
          50: '#fef7ed',
          100: '#fdecd4',
          200: '#fad6a8',
          300: '#f7ba71',
          400: '#f39438',
          500: '#E07A1F', // Saffron
          600: '#d15d0f',
          700: '#ad440f',
          800: '#8c3614',
          900: '#722e14',
        },
        accent: {
          50: '#fefce8',
          100: '#fef9c3',
          200: '#fef08a',
          300: '#fde047',
          400: '#facc15',
          500: '#C9A33B', // Gold
          600: '#ca8a04',
          700: '#a16207',
          800: '#854d0e',
          900: '#713f12',
        },
        ivory: {
          50: '#FDFCFA',
          100: '#F9F6F1', // Ivory/Beige Background
          200: '#F5F0E8',
          300: '#EDE6D9',
          400: '#E5DBCA',
          500: '#DDD0BB',
        },
        charcoal: {
          50: '#f6f6f6',
          100: '#e7e7e7',
          200: '#d1d1d1',
          300: '#b0b0b0',
          400: '#888888',
          500: '#6d6d6d',
          600: '#5d5d5d',
          700: '#4f4f4f',
          800: '#454545',
          900: '#2B2B2B', // Charcoal Text
        },
        success: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        warning: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
        error: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Nunito Sans', 'system-ui', 'sans-serif'],
        serif: ['Merriweather', 'Playfair Display', 'Georgia', 'serif'],
        heading: ['Poppins', 'Inter', 'sans-serif'],
        mono: ['Fira Code', 'monospace'],
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(75, 29, 15, 0.07), 0 10px 20px -2px rgba(75, 29, 15, 0.04)',
        'medium': '0 4px 25px -5px rgba(75, 29, 15, 0.1), 0 10px 10px -5px rgba(75, 29, 15, 0.04)',
        'large': '0 10px 40px -10px rgba(75, 29, 15, 0.15), 0 2px 10px -2px rgba(75, 29, 15, 0.05)',
        'gold': '0 4px 20px -2px rgba(201, 163, 59, 0.3), 0 2px 8px -1px rgba(201, 163, 59, 0.2)',
        'maroon': '0 4px 20px -2px rgba(75, 29, 15, 0.3), 0 2px 8px -1px rgba(75, 29, 15, 0.2)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'bounce-soft': 'bounceSoft 0.6s ease-in-out',
        'glow': 'glow 2s ease-in-out infinite',
        'scale-in': 'scaleIn 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        bounceSoft: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
        glow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(201, 163, 59, 0.3)' },
          '50%': { boxShadow: '0 0 30px rgba(201, 163, 59, 0.5)' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      backgroundImage: {
        'gradient-maroon-saffron': 'linear-gradient(120deg, #4B1D0F, #E07A1F)',
        'gradient-gold': 'linear-gradient(135deg, #C9A33B, #E07A1F)',
        'tricolor': 'linear-gradient(to bottom, #FF9933 33.33%, #FFFFFF 33.33%, #FFFFFF 66.66%, #138808 66.66%)',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
}; 