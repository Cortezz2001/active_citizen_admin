/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: "#006FFD",
        ghostwhite: "#F8F9FE",
        secondary: {
          DEFAULT: "#FFFFFF",
          RED: "#FF6B6B",
        },
        dark: {
          primary: "#0066E6",
          background: "#0F0F0F",
          surface: "#1A1A1A",
          card: "#2A2A2A",
          border: "#3A3A3A",
          text: {
            primary: "#FFFFFF",
            secondary: "#B3B3B3",
            muted: "#666666",
          },
        },
        light: {
          background: "#FFFFFF",
          surface: "#F8F9FE",
          card: "#FFFFFF",
          border: "#E5E5E5",
          text: {
            primary: "#000000",
            secondary: "#666666",
            muted: "#999999",
          },
        },
      },
      fontFamily: {
        mthin: ['Montserrat-Thin', 'sans-serif'],
        mextralight: ['Montserrat-ExtraLight', 'sans-serif'],
        mlight: ['Montserrat-Light', 'sans-serif'],
        mregular: ['Montserrat-Regular', 'sans-serif'],
        mmedium: ['Montserrat-Medium', 'sans-serif'],
        msemibold: ['Montserrat-SemiBold', 'sans-serif'],
        mbold: ['Montserrat-Bold', 'sans-serif'],
        mextrabold: ['Montserrat-ExtraBold', 'sans-serif'],
        mblack: ['Montserrat-Black', 'sans-serif'],
        mitalic: ['Montserrat-Italic', 'sans-serif'],
      },
    },
  },
  plugins: [],
};