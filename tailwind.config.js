/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#FAFAF9",
        ink: "#1C1917",
        line: "#E7E5E4",
        accent: {
          DEFAULT: "#EA580C", // orange-600, carried over from the original site
          soft: "#FFF1E7",
        },
        teal: {
          DEFAULT: "#0F766E",
          soft: "#EBFAF8",
        },
      },
      fontFamily: {
        display: ["\"Space Grotesk\"", "sans-serif"],
        body: ["Inter", "sans-serif"],
      },
      maxWidth: {
        content: "72rem",
      },
    },
  },
  plugins: [],
};
