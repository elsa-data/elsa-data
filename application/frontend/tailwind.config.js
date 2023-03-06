module.exports = {
  darkMode: "class",
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/**/*.html",
    //"node_modules/flowbite-react/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {},
  },
  daisyui: {
    themes: false,
  },
  plugins: [
    require("@tailwindcss/typography"),
    // if using daisy then we have to disable both of these
    //require("@tailwindcss/forms"),
    //require("flowbite/plugin"),
    require("daisyui"),
  ],
};
