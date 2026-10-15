/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/app/**/*.{js,jsx,ts,tsx}", "./src/components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      // Palette taken from the room illustrations.
      colors: {
        ink: "#37474F", // dark gray text
        mist: { DEFAULT: "#E0E0E0", dark: "#C7C7C7" }, // light gray fill
        cream: "#F5EBDD", // window cards
      },
    },
  },
  plugins: [],
};
