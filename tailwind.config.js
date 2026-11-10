/** @type {import('tailwindcss').Config} */
const cafeColors = {
  50: '#FDF8F3',   // Cream foam
  100: '#F6ECE1',  // Steamed milk latte
  200: '#E9D5C3',  // Caramel froth
  300: '#D8B89E',  // Warm cinnamon
  400: '#BC8E69',  // Cappuccino
  500: '#9F6744',  // Roasted bean
  600: '#7F4F24',  // Rich café brown (Primary)
  700: '#673B1B',  // Dark espresso roast
  800: '#512C14',  // French roast
  900: '#3B1E0C',  // Deep roast
  950: '#261206',  // Black coffee
};

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Palet warna Café (Warm Roasted Coffee & Creamy Latte)
        amber: cafeColors,
        emerald: cafeColors,
        green: cafeColors,
        teal: cafeColors,
        lime: cafeColors,
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};


