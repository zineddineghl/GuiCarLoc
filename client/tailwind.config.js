/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Couleurs du drapeau et thème sombre
        gnRed: '#CE1126',
        gnYellow: '#FCD116',
        gnGreen: '#009460',
        luxuryBlack: '#07090f',
        luxuryDark: '#0d1018',
        mutedGray: '#8892a4',
      },
      fontFamily: {
        // Ajoute Playfair Display pour les titres (Luxe)
        display: ['Playfair Display', 'serif'],
        sans: ['Jost', 'sans-serif'],
      },
    },
  },
  plugins: [],
};