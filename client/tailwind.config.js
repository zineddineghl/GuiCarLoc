/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Le fond noir profond premium
        luxuryBlack: '#050505',
        // Le gris très foncé pour les cartes
        luxuryDark: '#121212',
        // Les couleurs de la Guinée 🇬🇳
        gnRed: '#CE1126',
        gnYellow: '#FCD116',
        gnGreen: '#009460',
      },
      fontFamily: {
        // Pour les gros titres élégants (optionnel mais recommandé)
        display: ['"Playfair Display"', 'Georgia', 'serif'], 
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}