module.exports = {
  darkMode: "class",
  content: ["./src/**/*.{js,jsx,ts,tsx}", "./public/**/*.html", "./*.html"],
  theme: {
    extend: {
      keyframes: {
        pop: {
          "0%": {
            transform: "scale(.95)",
          },
          "40%": {
            transform: "scale(1.02)",
          },
          "100%": {
            transform: "scale(1)",
          },
        },
      },
      animation: {
        pop: "pop .25s ease-out",
      },
    },
  },
  daisyui: {
    themes: ["light"],
  },
  plugins: [require("@tailwindcss/typography"), require("daisyui")],
};
