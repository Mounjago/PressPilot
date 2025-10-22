/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}', // Scanne tous les fichiers dans src/ pour générer les classes nécessaires
  ],
  theme: {
    extend: {
      colors: {
        primary: "#000000",    // Noir
        accent: "#0ED894",     // Vert accent
        secondary: "#EBF5DF",  // Vert pâle
        white: "#FFFFFF"
      },
      fontFamily: {
        poppins: ['Poppins', 'sans-serif'],
        goodly: ['GOODLY', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
