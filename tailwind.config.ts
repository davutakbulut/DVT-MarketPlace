import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/modules/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: "#F8F9FA",
        surface: {
          DEFAULT: "#FFFFFF",
          subtle: "#FAFAFA",
          elevated: "#FFFFFF",
        },
        primary: {
          DEFAULT: "#FF7855",
          hover: "#FF6238",
          active: "#E64E26",
          tint: {
            50: "#FFF5F2",
            100: "#FFEBE6",
            200: "#FFD7CC",
            300: "#FFB399",
            500: "#FF7855",
            700: "#D44A24",
            900: "#4D241A",
          },
        },
        dark: {
          DEFAULT: "#1A0C09",
          tint: {
            700: "#4A3E3D",
            500: "#756866",
            300: "#A39795",
            100: "#D6CECC",
          },
        },
        status: {
          danger: {
            bg: "#FFF1F0",
            border: "#FFA39E",
            text: "#CF1322",
            badge: "#FF4D4F",
          },
          warning: {
            bg: "#FFFBE6",
            border: "#FFE58F",
            text: "#D48806",
            badge: "#FAAD14",
          },
          success: {
            bg: "#F6FFED",
            border: "#B7EB8F",
            text: "#389E0D",
            badge: "#52C41A",
          },
          excellent: {
            bg: "#E6F7FF",
            border: "#91CAFF",
            text: "#096DD9",
            badge: "#1890FF",
          },
        },
        border: {
          DEFAULT: "#EFEFEF",
          subtle: "#F4EFEB",
          strong: "#D6CECC",
        },
      },
      zIndex: {
        "60": "60",
        "70": "70",
        "80": "80",
        "90": "90",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
