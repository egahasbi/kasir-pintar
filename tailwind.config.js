/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Palet warna Café (Warm Roasted Coffee & Creamy Latte)
        emerald: {
          50: '#FBF7F2',   // Foam susu / Cream
          100: '#F5ECE1',  // Steamed milk
          200: '#E7D5C2',  // Latte foam
          300: '#D5B79B',  // Caramel froth
          400: '#B88B67',  // Cappuccino
          500: '#9C6644',  // Roasted bean
          600: '#7F4F24',  // Rich café brown (Primary)
          700: '#683B1E',  // Dark espresso
          800: '#532D15',  // French roast
          900: '#3D1F0C',  // Deep roast
          950: '#261205',  // Black coffee
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

