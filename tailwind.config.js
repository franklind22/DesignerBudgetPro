/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './*.js',
    './projeto base/**/index.html',
    './projeto base/**/*.js'
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#2d8a8a',
          hover: '#247272',
          light: '#e6f3f3',
        },
        danger: '#c91530',
        success: '#218040',
        warning: '#a84d2f',
        status: {
          'em-processo': '#FFA500',
          'aprovado': '#218040',
          'nao-aprovado': '#c91530',
          'alterado': '#a84d2f',
          'concluido': '#2d8a8a',
          'pago': '#1a6b4d',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      animation: {
        'slide-in': 'slideIn 0.3s ease-out',
        'slide-out': 'slideOut 0.3s ease-out',
        'fade-in': 'fadeIn 0.2s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-slow': 'bounce 2s infinite',
      },
    },
  },
  plugins: [],
};
